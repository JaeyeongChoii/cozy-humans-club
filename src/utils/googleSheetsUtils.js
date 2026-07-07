import AsyncStorage from '@react-native-async-storage/async-storage';

// 캐시 키 및 만료 시간 (24시간)
const CACHE_KEY = 'INTRO_SCRIPT_CACHE';
// 캐시 만료 시간: 5분 (300,000ms) - 개발 및 빠른 반영을 위해 24시간에서 대폭 단축
const CACHE_TTL = 5 * 60 * 1000;

// 메모리 캐시 (앱 실행 중 유지)
let memoryCache = null;

// (선택) 동시 호출 중복 방지: 캐시 미스 시 동일 요청을 공유
let inFlightPromise = null;

/**
 * 구글 스프레드시트에서 인트로 스크립트를 가져오는 함수
 * - 메모리 캐시 → 디스크 캐시 → 네트워크 순
 * - 타임아웃 + 외부 AbortSignal 취소 지원
 * - 네트워크 실패/타임아웃 시 Stale 캐시 반환
 */
export const fetchIntroScriptFromGoogleSheet = async (externalSignal, timeout = 10000) => {
  // 1) 메모리 캐시 확인
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    console.log("[GoogleSheets] Returning memory cached data (hit). Age:", Math.round((Date.now() - memoryCache.timestamp)/1000), "s");
    return memoryCache.data;
  }

  // 2) 디스크 캐시 확인
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (parsedCache?.timestamp && Date.now() - parsedCache.timestamp < CACHE_TTL) {
        console.log("[GoogleSheets] Returning Disk cached data (AsyncStorage hit). Age:", Math.round((Date.now() - parsedCache.timestamp)/1000), "s");
        memoryCache = parsedCache;
        return parsedCache.data;
      }
      console.log("[GoogleSheets] Disk cache exists but expired.");
    } else {
      console.log("[GoogleSheets] No disk cache found.");
    }
  } catch (e) {
    console.warn('AsyncStorage read error:', e);
  }

  // 3) 캐시 미스 + 이미 진행 중인 네트워크 요청이 있으면 공유
  if (inFlightPromise) {
    return inFlightPromise;
  }

  // 4) 네트워크 요청 설정
  const SHEET_ID = '1Wza-9aoHJSaAkLjvK_9jnz_70-EhLnadGqZfQ8BDP3s';
  const GID = '0';
  // cache-busting을 위해 타임스탬프 파라미터(t) 추가
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&t=${Date.now()}`;
  
  console.log("[GoogleSheets] Fetching new data from URL:", url);

  const controller = new AbortController();
  let didTimeout = false;

  // 외부 취소 신호 -> 내부 controller로 전달 (리스너 누수 방지 위해 핸들러 변수화)
  let onExternalAbort;
  if (externalSignal) {
    // 이미 abort된 신호면 즉시 취소
    if (externalSignal.aborted) {
      controller.abort();
      // 이 경우 아래 fetch가 바로 AbortError로 떨어질 수 있으니 그대로 진행해도 되고,
      // 곧바로 throw 처리해도 됩니다. 여기선 일관성을 위해 그대로 진행합니다.
    } else {
      onExternalAbort = () => controller.abort();
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  // 타임아웃: reason을 전달하지 않고 플래그로만 구분 (RN 호환성)
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeout);

  // 실제 네트워크 작업을 inFlightPromise로 묶어 동시 호출을 dedupe
  inFlightPromise = (async () => {
    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      // HTML 응답 감지(권한/로그인 페이지 등): CSV 파싱으로 조용히 빈 배열 되는 문제 방지
      // - 완벽 판별은 아니지만 실전에서 효과 큼
      const looksLikeHtml = /^\s*</.test(text) && /<html|<!doctype/i.test(text);
      if (looksLikeHtml) {
        throw new Error('Received HTML instead of CSV (likely permission/login page).');
      }

      const data = parseCSV(text);

      // 데이터가 유효하면 캐시 저장
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[GoogleSheets] Successfully fetched and parsed ${data.length} rows.`);
        const cacheEntry = { timestamp: Date.now(), data };
        memoryCache = cacheEntry;

        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
        } catch (e) {
          console.warn('AsyncStorage write error:', e);
        }
      } else {
        console.warn("[GoogleSheets] Fetched data is empty or invalid format.");
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Abort 분기: 타임아웃 vs 외부 취소
      const isAbort = error?.name === 'AbortError';
      const isExternalAbort = !!externalSignal?.aborted;

      if (isAbort && isExternalAbort && !didTimeout) {
        // 사용자/상위 로직의 취소(언마운트 등)는 그대로 전파하는 게 일반적으로 맞음
        throw error;
      }

      if (didTimeout) {
        console.warn(`Intro script request timed out after ${timeout}ms`);
      } else if (isAbort) {
        // 타임아웃도 아니고 외부 abort도 아닌 abort는 환경별 케이스가 있어 warn 정도
        console.warn('Intro script request aborted.');
      } else {
        console.error('Error fetching intro script:', error);
      }

      // 실패 시 Stale 캐시 폴백
      if (memoryCache?.data) return memoryCache.data;

      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data) return parsed.data;
        }
      } catch {
        // ignore
      }

      return [];
    } finally {
      // 정리: 타임아웃/리스너/inFlightPromise 해제
      clearTimeout(timeoutId);
      if (externalSignal && onExternalAbort) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

// CSV 텍스트를 파싱하는 함수 (주의: 멀티라인 필드/정교한 CSV 규칙은 미지원)
const parseCSV = (csvText) => {
  // 줄 단위로 분리 (CRLF 또는 LF 처리)
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length === 0) return [];

  // 헤더 행 찾기 ('Key'로 시작하는 행을 헤더로 간주) + BOM 처리
  let headerIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const first = (cols[0] || '').replace(/^\uFEFF/, ''); // BOM 제거
    if (first === 'Key') {
      headerIndex = i;
      break;
    }
  }

  // 헤더 파싱
  const headers = parseLine(lines[headerIndex]).map(h => (h || '').replace(/^\uFEFF/, '').trim());
  const data = [];

  // 데이터 행 파싱 (헤더 다음 행부터 시작)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const currentLine = parseLine(lines[i]);

    // 컬럼 수 mismatch는 조용히 버리지 않고, 보수적으로 보정(부족분은 빈값)
    if (currentLine.length !== headers.length) {
      // 너무 noisy하면 주석 처리 가능
      // console.warn(`CSV column mismatch at line ${i}: expected ${headers.length}, got ${currentLine.length}`);
    }

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let value = (currentLine[j] ?? '').toString().trim();
      // '\n' 문자열을 실제 줄바꿈으로 변환
      value = value.replace(/\\n/g, '\n');
      obj[headers[j]] = value;
    }

    // 완전 빈 행은 스킵(선택)
    const hasAny = Object.values(obj).some(v => v !== '');
    if (hasAny) data.push(obj);
  }

  return data;
};

// 따옴표를 고려한 간단한 CSV 라인 파서 (주의: "" 이스케이프 완전 대응 아님)
const parseLine = (line) => {
  const result = [];
  let startValueIndex = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // NOTE: 표준 CSV의 ""(이스케이프)를 완전 처리하려면 여기 로직을 더 정교하게 해야 함
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      let value = line.substring(startValueIndex, i);

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
        value = value.replace(/""/g, '"');
      }

      result.push(value);
      startValueIndex = i + 1;
    }
  }

  let lastValue = line.substring(startValueIndex);
  if (lastValue.startsWith('"') && lastValue.endsWith('"')) {
    lastValue = lastValue.substring(1, lastValue.length - 1);
    lastValue = lastValue.replace(/""/g, '"');
  }
  result.push(lastValue);

  return result;
};

/**
 * (선택) 캐시 초기화 유틸
 */
export const clearIntroScriptCache = async () => {
  memoryCache = null;
  inFlightPromise = null;
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('AsyncStorage remove error:', e);
  }
};
