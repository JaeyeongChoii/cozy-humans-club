// 온보딩
// 첫 로그인 화면, 회원가입 부분, 
import { Text, View, TouchableOpacity, Image, StyleSheet, Platform, Modal, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
// 사용자 선언 변수
import { ColorTokens } from "../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH } from "../utils/scale";
// 외부이미지
import Popup2Button from "../components/Popup2Button";
import PopupOneButton from "../components/PopupOneButton";
import { useState, useEffect, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HighlightText from "../components/HighlightText";
import { BASE_URL } from "../constants/BaseURL";
import { WebView } from "react-native-webview";
import AppleLoginWebView from "../components/AppleLoginWebView"; // [NEW] AppleLoginWebView import
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";
import { Radius } from "../design/Radius";

// 디스코드때 사용하는 그라데이션 색상
const DISCORD_HEADER_GRADIENT_STOPS = [
  "#2E2F34",
  "#2F3035",
  "#313237",
  "#34353A",
  "#36373C",
  "#393A3F",
  "#383B40",
  "#3B3E45",
  "#3D4047",
];

// 웹 브라우저 세션이 끝나면 결과 처리를 위해 필요 (Android 등)
WebBrowser.maybeCompleteAuthSession();

const maskToken = (token) => {
  if (!token) return "";
  return token.length > 12 ? `${token.slice(0, 12)}...` : `${token}...`;
};

const parseResponseBody = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const summarizeBody = (body) => {
  if (typeof body !== "string") return body;
  return body.length > 1000 ? `${body.slice(0, 1000)}... [truncated]` : body;
};

const Splash = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { passwordEntered } = route.params || {}; // 비밀 번호를 입력하고 입장한 경우

  useEffect(() => {
    if (passwordEntered) {
      console.log("[Splash] passwordEntered param received:", passwordEntered);
    }
  }, [passwordEntered]);

  const [isNewUserPopupVisible, setIsNewUserPopupVisible] = useState(false); // 새 유저 가입 권유 모달
  const [remainInfo, setRemainInfo] = useState({ cur_member: 0, max_member: 0 });

  // Discord Login 모달, 앱에서 웹사이트에 방문함
  const [isDiscordModalVisible, setIsDiscordModalVisible] = useState(false);
  const [processingDiscordLogin, setProcessingDiscordLogin] = useState(false); // 2026-02-03: 중복 처리 방지 플래그

  // Apple Login 모달 (WebView)
  const [isAppleLoginVisible, setIsAppleLoginVisible] = useState(false);
  const [isLoginButtonLocked, setIsLoginButtonLocked] = useState(false);
  const loginButtonLockedRef = useRef(false);

  // 계정 삭제 대기 모달 및 데이터 (2026-04-24)
  const [isDelPendingPopupVisible, setIsDelPendingPopupVisible] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingDeleteDate, setPendingDeleteDate] = useState(null); // 삭제 예정일 저장
  const [isRestoreSuccessPopupVisible, setIsRestoreSuccessPopupVisible] = useState(false); // [NEW] 복구 성공 팝업 상태

  const lockLoginButtons = () => {
    if (loginButtonLockedRef.current) return false;
    loginButtonLockedRef.current = true;
    setIsLoginButtonLocked(true);
    return true;
  };

  const unlockLoginButtons = () => {
    loginButtonLockedRef.current = false;
    setIsLoginButtonLocked(false);
  };

  // 컴포넌트 마운트 시 남은 자리 정보 가져오기 및 자동 로그인 체크
  useEffect(() => {
    // [DEBUG] 2026-02-03: 모든 토큰 삭제 요청 반영
    // const clearAllTokens = async () => {
    //   console.log("Removing all tokens...");
    //   try {
    //     await AsyncStorage.multiRemove([
    //       "id_token",
    //       "access_token",
    //       "refresh_token",
    //       "auth_provider",
    //       "id_token_google",
    //       "id_token_apple",
    //       "id_token_discord"
    //     ]);
    //     console.log("All tokens removed successfully.");
    //   } catch (e) {
    //     console.error("Failed to remove tokens:", e);
    //   }
    // };
    // clearAllTokens();

    fetchRemainPeople();
    // checkAutoLogin(); // 2026-02-02: 자동 로그인을 일단 비활성화하여 사용자가 로그인 수단을 선택할 수 있게 함

    // OAuth 로그인 이후 앱이 딥링크로 다시 열릴 때를 감지
    // (구글 로그인 완료 → handleDeepLink에서 code/token 처리)
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => subscription.remove();
  }, []);

  // Splash 진입 시, 서버 기준 정원 초과 여부 판단용 정보
  const fetchRemainPeople = async () => {
    try {
      const url = `${BASE_URL}/oauth/remain_people`;
      const options = {
        method: "GET",
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);  // await: 올때 까지 기다리기 fetch: api호출

      const responseText = await response.text();
      const data = parseResponseBody(responseText); // { cur_member:int, max_member:int }

      console.log(
        `${url} response :`,
        JSON.stringify(
          {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
            body: summarizeBody(data),
          },
          null,
          2,
        ),
      );

      if (response.ok && data && typeof data === "object") {
        setRemainInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch remain people:", error);
    }
  };

  // 기기에 토큰이 유효할 때(로그아웃이 안했을때) 자동 로그인
  const checkAutoLogin = async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token"); // AsyncStorage : 앱 내부의 영구 저장 값
      if (!idToken) return; // 저장된 토큰이 없으면 로그인 화면 유지

      // console.log("Checking Auto Login with token:", idToken);

      const url = `${BASE_URL}/oauth/login`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      };

      // console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      // console.log(`${url} response :`, response.status);

      if (response.ok) {
        const data = await response.json();

        // 새 토큰이 내려오면 갱신
        if (data.access_token) await AsyncStorage.setItem("access_token", data.access_token);
        if (data.id_token) await AsyncStorage.setItem("id_token", data.id_token);
        if (data.refresh_token) await AsyncStorage.setItem("refresh_token", data.refresh_token);

        // 2026-02-02: 회원 여부 추가 체크 (is_member 확인)
        const checkResult = await checkMemberStatus(data.id_token || idToken);

        // [ADD] 계정 삭제 예약 여부 체크 (2026-04-24)
        if (data.hasOwnProperty('willdelete')) {
          console.log(`[Splash] willdelete Status: ${data.willdelete}`);
          console.log("[Splash] Full Response Data:", JSON.stringify(data, null, 2));
        }
        if (data.willdelete === 1) {
          setPendingToken(data.id_token || idToken);
          // 여러 가능한 필드명 체크 (deletetime 추가)
          setPendingDeleteDate(data.deletetime || data.delete_date || data.willdelete_at || data.delete_at || null);
          setIsDelPendingPopupVisible(true);
          return;
        }

        if (checkResult && checkResult.is_member) {
          console.log("Registered member detected. Navigating to Main.");
          if (checkResult.jwt) {
            await AsyncStorage.setItem("access_token", checkResult.jwt);
            await AsyncStorage.setItem("id_token", checkResult.jwt);
          }
          navigation.navigate("Main");
        } else {
          console.log("Authenticated but not a member. Showing signup popup.");
          setIsNewUserPopupVisible(true);
        }
      } else {
        console.log("Auto Login Failed. Clearing tokens.");
        // 토큰이 만료되었거나 유효하지 않음 -> 로그아웃 처리함
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("id_token");
        await AsyncStorage.removeItem("refresh_token");
      }
    } catch (error) {
      console.error("Auto Login Error:", error);
    }
  };


  // 토큰 저장 전용 함수
  const saveTokens = async (accessToken, idToken, refreshToken, provider = null) => {
    try {
      // console.log("Saving Tokens:", { accessToken, idToken, refreshToken, provider });

      // 백엔드 사양에 따라 access_token이 누락될 수 있음. 
      // 앱 내의 다른 API 호출 호환성을 위해 idToken을 accessToken으로 대체 사용함.
      const effectiveAccessToken = accessToken || idToken;

      if (effectiveAccessToken) {
        await AsyncStorage.setItem("access_token", effectiveAccessToken);
      }

      // 1. 현재 활성 세션 토큰 저장 (기존 로직 유지)
      if (idToken) {
        await AsyncStorage.setItem("id_token", idToken);
      }

      // 2. Provider별 토큰 분리 저장 (2026-02-03)
      // 사용자가 여러 Provider의 토큰을 보유할 수 있게 함.
      if (provider && idToken) {
        await AsyncStorage.setItem(`id_token_${provider}`, idToken);
        await AsyncStorage.setItem("auth_provider", provider); // 마지막 로그인 Provider 기록
      }

      if (refreshToken) {
        await AsyncStorage.setItem("refresh_token", refreshToken);
      } else if (refreshToken === null || refreshToken === undefined) {
        // 명시적으로 없거나 undefined인 경우 기존 토큰 삭제
        await AsyncStorage.removeItem("refresh_token");
      }
    } catch (error) {
      console.error("Token storage error:", error);
    }
  };

  /**
   * 2026-02-02: 회원 여부 체크 API 호출
   * results: { is_member: boolean, jwt: string (if is_member) }
   */
  const checkMemberStatus = async (jwt) => {
    try {
      const url = `${BASE_URL}/oauth/member_check`;
      const options = {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${jwt || ""}`,
        },
      };

      console.log(
        `${url} request :`,
        JSON.stringify(
          {
            method: options.method,
            headers: {
              Authorization: `Bearer ${maskToken(jwt)}`,
            },
            hasToken: Boolean(jwt),
          },
          null,
          2,
        ),
      );

      const response = await fetch(url, options);

      const responseText = await response.text();
      const data = parseResponseBody(responseText);

      console.log(
        `${url} response :`,
        JSON.stringify(
          {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
            body: summarizeBody(data),
          },
          null,
          2,
        ),
      );

      if (response.ok) {
        return data; // { is_member: boolean, jwt?: string }
      }
      return { is_member: false };
    } catch (error) {
      console.error("Member Check API Error:", error);
      return { is_member: false };
    }
  };

  // 백엔드 토큰 검증 및 네비게이션 함수 (공통 사용)
  // 로그아웃후 재로그인한 경우도 처리함
  const verifyBackendToken = async (idToken, preCheckedMemberInfo = null) => {
    try {
      // console.log("Verifying token and checking member status directly...");

      // 2026-02-02: /oauth/login 호출 제거 후 바로 member_check 수행
      // preCheckedMemberInfo가 있으면 그것을 사용, 없으면 새로 호출
      const memberInfo = preCheckedMemberInfo || await checkMemberStatus(idToken);

      if (memberInfo && memberInfo.is_member) {
        // console.log("Member confirmed. Proceeding to Login for Session Token.");

        // member_check에서 받은 jwt가 있다면 그것을 사용, 없다면 기존 idToken 사용
        // 하지만 /oauth/login은 OAuth Token을 받아 세션을 발급하는 곳이므로,
        // member_check가 발급한 JWT(앱토큰)를 보내면 백엔드가 OAuth Provider에게 검증 시도하다가 504 등 에러 날 수 있음.
        // 따라서 Login 시에는 무조건 원본 idToken을 사용하도록 변경함. (2026-02-03)
        const targetToken = idToken;

        try {
          // 요청 정보 로깅
          const loginUrl = `${BASE_URL}/oauth/login`;
          const loginHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${targetToken}`,
          };
          console.log(
            `${loginUrl} request :`,
            JSON.stringify(
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${maskToken(targetToken)}`,
                },
                body: null,
                hasToken: Boolean(targetToken),
              },
              null,
              2,
            ),
          );

          const loginResponse = await fetch(loginUrl, {
            method: "POST",
            headers: loginHeaders,
          });

          const loginResponseText = await loginResponse.text();
          const loginData = parseResponseBody(loginResponseText);

          console.log(
            `${loginUrl} response :`,
            JSON.stringify(
              {
                status: loginResponse.status,
                ok: loginResponse.ok,
                contentType: loginResponse.headers.get("content-type"),
                body: summarizeBody(loginData),
              },
              null,
              2,
            ),
          );

          if (loginResponse.ok) {
            // 로그인 후 받은 최종 토큰 저장 및 갱신
            // 주의: 여기서 provider를 null로 넘기면 id_token_provider는 갱신되지 않고 
            // id_token(활성세션)만 업데이트됨. 이는 의도된 동작 (앱 세션 토큰 분리).
            await saveTokens(loginData.access_token, loginData.id_token, loginData.refresh_token);

            // [ADD] 계정 삭제 예약 여부 체크 (2026-04-24)
            if (loginData.hasOwnProperty('willdelete')) {
              console.log(`[Splash] willdelete Status: ${loginData.willdelete}`);
              console.log("[Splash] Full Response Data (TokenVerification):", JSON.stringify(loginData, null, 2));
            }
            if (loginData.willdelete === 1) {
              setPendingToken(loginData.id_token || idToken);
              // 여러 가능한 필드명 체크 (deletetime 추가)
              setPendingDeleteDate(loginData.deletetime || loginData.delete_date || loginData.willdelete_at || loginData.delete_at || null);
              setIsDelPendingPopupVisible(true);
            } else {
              navigation.navigate("Main");
            }
          } else {
            console.error("Login after Member Check Failed:", loginResponse.status);
            unlockLoginButtons();

            if (loginResponse.status === 504) {
              alert("서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
            } else {
              alert("로그인 세션 갱신 실패. 앱을 재실행해주세요.");
            }
          }
        } catch (e) {
          console.error("Login API Error:", e);
          unlockLoginButtons();
          alert("로그인 중 네트워크 오류가 발생했습니다.");
        }
      } else {
        // console.log("Not a member or invalid token. Keeping tokens for signup and showing popup.");
        // 토큰을 삭제하면 회원가입(TutorialPage)에서 사용할 수 없으므로 삭제하지 않음
        // await AsyncStorage.removeItem("access_token");
        // await AsyncStorage.removeItem("id_token");
        // await AsyncStorage.removeItem("refresh_token");

        setIsNewUserPopupVisible(true);
        unlockLoginButtons();
      }
    } catch (error) {
      console.error("Verification error:", error);
      setIsNewUserPopupVisible(true);
      unlockLoginButtons();
    }
  };

  // 앱으로 다시 돌아왔을때 무엇을 받았는지 판별함
  // explicitProvider: handleLogInPress 등에서 호출 시 명시적으로 provider 전달
  const handleDeepLink = ({ url }, explicitProvider = null) => {
    const { queryParams } = Linking.parse(url);   // ? 뒤에 붙은 값들을 분석해 JSON으로 저장

    // 1. 코드를 직접 받는 경우 (앱에서 서버로 토큰 요청 필요)
    if (queryParams?.code) {
      // 디스코드 로그인
      if (queryParams.state === "discord") {
        handleDiscordCallback(queryParams.code);
      }
      // 애플 로그인
      else if (queryParams.state === "apple") {
        handleAppleCallback(queryParams.code);
      }
      else {
        // 구글 로그인인 경우 (state가 없거나 google일 수 있음)
        handleCallback(queryParams.code);
      }
    }
    // 2. 서버가 이미 토큰으로 교환해서 직접 던져준 경우
    else if (queryParams?.id_token) {
      // provider 정보가 queryParams에 없으면 유추하기 힘듬.
      // 리다이렉트 URL에 provider가 없더라도, 호출처(handleLogInPress)에서 
      // 알고 있는 provider(explicitProvider)를 우선 사용함.
      const provider = explicitProvider || queryParams.provider || null;

      // console.log(`DeepLink Token Handling: Provider set to '${provider}'`);

      saveTokens(queryParams.access_token, queryParams.id_token, queryParams.refresh_token, provider)
        .then(() => verifyBackendToken(queryParams.id_token))
        .catch((error) => {
          console.error("DeepLink token handling error:", error);
          unlockLoginButtons();
        });
    }
  };

  // 구글 로그인 콜백
  // 코드를 쓸 수 있는 토큰으로 바꿔줌
  const handleCallback = async (code) => {
    try {
      const url = `${BASE_URL}/oauth/callback/google`;
      const options = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      };

      // console.log("request :", JSON.stringify({ url, ...options }, null, 2));

      const response = await fetch(url, options);

      // console.log("response :", response.status, "google callback");

      const data = await response.json(); // { access_token: string, id_token: string, }

      // console.log("response body :", JSON.stringify(data, null, 2));

      if (data.access_token) {
        // 구글 로그인 성공 -> 토큰 저장 후 검증 시도
        await saveTokens(data.access_token, data.id_token, data.refresh_token, "google");
        await verifyBackendToken(data.id_token);
      } else {
        unlockLoginButtons();
      }
    } catch (error) {
      /*서버 4xx/5xx일 때 사용자에게 보여줄 메시지 분기 필요 */
      console.error("Callback error:", error);
      unlockLoginButtons();
    }
  };

  // 애플 로그인 콜백
  const handleAppleCallback = async (code) => {
    try {
      const url = `${BASE_URL}/oauth/callback/apple`;
      const options = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      };

      // console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      // console.log(`${url} response :`, response.status);

      const data = await response.json();

      // console.log(`${url} response body :`, JSON.stringify(data, null, 2));

      if (data.access_token) {
        // 애플 로그인 성공
        await saveTokens(data.access_token, data.id_token, data.refresh_token, "apple");
        await verifyBackendToken(data.id_token);
      } else {
        unlockLoginButtons();
      }
    } catch (error) {
      console.error("Apple Callback error:", error);
      unlockLoginButtons();
    }
  };

  const handleDiscordCallback = async (code) => {
    // Legacy Logic 
  };



  // [NEW] 계정 삭제 취소 (복구) 처리 (2026-04-24)
  const handleCancelDeletion = async () => {
    try {
      const url = `${BASE_URL}/oauth/cancel_delete`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pendingToken}`,
        },
      };

      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log("[Splash] Account restoration successful");
          setIsDelPendingPopupVisible(false);
          setIsRestoreSuccessPopupVisible(true);
        } else {
          console.error("[Splash] Restoration failed:", data.message || "Unknown error");
          alert("계정 복구에 실패했습니다.");
        }
      } else {
        console.error("[Splash] Restoration API error status:", response.status);
        alert("계정 복구 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("[Splash] handleCancelDeletion Error:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // [NEW] 삭제 대기 중 로그아웃 선택 (2026-04-24)
  const handleDeleteLogout = async () => {
    await AsyncStorage.multiRemove([
      "id_token", "access_token", "refresh_token", "auth_provider",
      "id_token_google", "id_token_apple", "id_token_discord"
    ]);
    setIsDelPendingPopupVisible(false);
    unlockLoginButtons();
  };

  // [NEW] 날짜 포맷팅 함수 (2025.05.30 (금) 형식)
  const formatDeletionDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekDay = weekdays[date.getDay()];

      return `${year}.${month}.${day} (${weekDay})`;
    } catch (e) {
      return dateStr;
    }
  };

  // WebView에서 메시지 수신 (로그인 후 토큰 파싱)
  const handleWebViewMessage = async (event) => {
    try {
      if (processingDiscordLogin) return; // 이미 처리 중이면 무시

      const message = JSON.parse(event.nativeEvent.data);
      // console.log("WebView Message:", message);

      if (message.token || message.access_token) {
        setProcessingDiscordLogin(true); // 처리 시작
        setIsDiscordModalVisible(false); // 모달 닫기

        const idToken = message.token || message.id_token; // token or id_token
        const accessToken = message.access_token || message.token; // access_token

        // 1. 토큰 저장
        await saveTokens(accessToken, idToken, null, "discord");

        // 2. 토큰 유효성 검증
        await verifyBackendToken(idToken);

        // 처리가 끝나면 false로 돌려야 하나, 
        // 성공 시 어차피 네비게이션 이동 하므로 상관없음.
        // 실패 시에는 다시 로그인 시도를 위해 false로 돌려야 할 수도 있음.
        setTimeout(() => setProcessingDiscordLogin(false), 3000);
      } else if (message.success === 0 || message.err) {
        // 에러 발생 시 모달 닫기
        console.warn("Discord Login Error:", message.err);
        setIsDiscordModalVisible(false);
        unlockLoginButtons();
        // 필요시 토스트나 알람 띄우기
      }
    } catch (error) {
      // JSON 파싱 에러는 무시
    }
  };

  // 2026-02-02: 로그인 버튼 클릭 시 저장된 토큰이 있으면 먼저 시도하는 함수
  // targetProvider: "google" | "discord" | "apple"
  const attemptSmartLogin = async (targetProvider, onFailure) => {
    try {
      // 2026-02-03: Provider별 분리된 토큰을 우선 조회
      // 예: id_token_google, id_token_discord
      const storedToken = await AsyncStorage.getItem(`id_token_${targetProvider}`);

      let targetToken = storedToken;

      if (!targetToken) {
        // Fallback: 기존 로직 체크
        // 주의: Fallback 시 id_token(활성세션)을 사용하여 member_check를 시도할 수 있지만,
        // provider 토큰이 명시적으로 따로 관리되길 원하므로, 
        // 여기서는 fallback을 사용하지 않거나, 사용하더라도 로그만 찍고 넘어갈 수 있음.
        // 하지만 사용자가 '로그인 되어있는 상태'라고 느낄 수 있으므로 일단 유지하되,
        // 로그를 통해 구분이 가능하게 함.
        const idToken = await AsyncStorage.getItem("id_token");
        const storedProvider = await AsyncStorage.getItem("auth_provider");
        if (idToken && storedProvider === targetProvider) {
          targetToken = idToken;
        }
      }

      if (targetToken) {
        // console.log(`Smart Login [${targetProvider}]: Found token. Source: ${storedToken ? "Specific" : "Fallback"}`);
        // console.log(`Smart Login [${targetProvider}]: Token snippet: ${targetToken.substring(0, 10)}...`);

        // 바로 member_check -> login 시도
        const memberInfo = await checkMemberStatus(targetToken);
        if (memberInfo && memberInfo.is_member) {
          // console.log(`Smart Login [${targetProvider}]: Member confirmed. Proceeding.`);
          await verifyBackendToken(targetToken, memberInfo);
          return;
        } else {
          // console.log(`Smart Login [${targetProvider}]: Not a member or invalid token. Proceeding to normal login.`);
          if (onFailure) onFailure();
        }
      } else {
        // 해당 provider 토큰 없음 -> 원래 로그인 루틴 실행
        // console.log(`Smart Login [${targetProvider}]: No token found. Source: ${storedToken ? "Specific" : "Fallback (None)"}`);
        if (onFailure) onFailure();
      }
    } catch (e) {
      console.error("Smart Login Error:", e);
      if (onFailure) onFailure();
    }
  };

  const handleLogInPress = async () => {
    if (!lockLoginButtons()) return;
    let shouldUnlock = true;

    await attemptSmartLogin("google", async () => {
      try {
        // 1. 인원수 체크
        const response = await fetch(`${BASE_URL}/oauth/remain_people`);
        const { cur_member, max_member } = await response.json();

        if (cur_member < max_member) {
          // 2. 자리가 있으면 구글 로그인 페이지로 이동
          const redirectUrl = Linking.createURL("oauth-callback");

          const authUrl = `${BASE_URL}/oauth/google?redirect_uri=${encodeURIComponent(redirectUrl)}`;

          // openAuthSessionAsync는 앱으로 돌아오면 result를 반환합니다.
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

          if (result.type === "success" && result.url) {
            // 2026-02-03: 명시적으로 'google' provider 전달
            shouldUnlock = false;
            handleDeepLink({ url: result.url }, "google");
          }
        } else {
          // 3. 자리가 없으면 다음 오픈날짜 안내 화면으로 이동
          navigation.navigate("OverLimit");
        }
      } catch (error) {
        console.error("Login press error:", error);
      }
    });

    if (shouldUnlock) unlockLoginButtons();
  };

  const handleAppleLoginPress = async () => {
    if (!lockLoginButtons()) return;
    let shouldUnlock = true;
    // 2026-02-05: WebView 컴포넌트 사용 방식으로 변경 (Splash.js 통합)
    await attemptSmartLogin("apple", async () => {
      // 스마트 로그인 실패 시 웹뷰 모달 오픈
      shouldUnlock = false;
      setIsAppleLoginVisible(true);
    });

    if (shouldUnlock) unlockLoginButtons();

    /* Legacy DeepLink Code
    await attemptSmartLogin("apple", async () => {
      try {
        // 인원수 체크
        const response = await fetch(`${BASE_URL}/oauth/remain_people`);
        const { cur_member, max_member } = await response.json();

        if (cur_member < max_member) {
          const redirectUrl = Linking.createURL("oauth-callback");
          // state=apple 추가하여 callback에서 구분
          const authUrl = `${BASE_URL}/oauth/apple?redirect_uri=${encodeURIComponent(redirectUrl)}&state=apple`;

          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

          if (result.type === "success" && result.url) {
            // 2026-02-03: 명시적으로 'apple' provider 전달
            handleDeepLink({ url: result.url }, "apple");
          }
        } else {
          navigation.navigate("OverLimit");
        }
      } catch (error) {
        console.error("Apple Login press error:", error);
      }
    });
    */
  };

  // [NEW] Apple Login Success Handler
  const handleAppleLoginSuccess = async (accessToken, refreshToken, idToken) => {
    console.log("[Splash] Apple Login Success. Verifying with Backend...");
    // idToken으로 백엔드 검증 (checkMemberStatus -> login)
    await verifyBackendToken(idToken);
  };

  const handleDiscordLoginPress = async () => {
    if (!lockLoginButtons()) return;
    let shouldUnlock = true;

    await attemptSmartLogin("discord", () => {
      shouldUnlock = false;
      setProcessingDiscordLogin(false); // 초기화
      setIsDiscordModalVisible(true);
    });

    if (shouldUnlock) unlockLoginButtons();
  };

  return (
    <SafeAreaView style={styles.background}>
      {/* 로고 */}
      <Image
        style={styles.logo}
        source={require("../../tokenImage/titleBanner.png")}
      />
      {/* 부제 */}
      <Text style={[Typography.boldMedium, styles.miniLogo]}>
        안전하고 아늑한 이야기 소굴
      </Text>
      {passwordEntered ?
        // 비밀번호 입력후 입장한 경우
        <Text style={styles.userEnteredText}>
          {"비밀 초대 암호 소지자구나...\n\n클럽에 온걸 환영해!"}
        </Text>
        :
        // 입장 관련 텍스트
        <Text style={styles.userAcceptedText}>
          현재 입장문이 열려있어!
        </Text>

      }

      {/* 인원수 표시, 서버 데이터 반영
      <HighlightText
        message={`남은 자리 ${remainInfo.max_member - remainInfo.cur_member}/${remainInfo.max_member}`}
        highlightMap={{
          [`${remainInfo.max_member - remainInfo.cur_member}`]: {
            color: ColorTokens.Point,
          }
        }}
        style={styles.leftText}
      /> */}

      {/*로그인*/}
      <View style={styles.loginContainer}>
        {/* iOS일 때만 Apple 로그인 버튼 표시 */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity onPress={handleAppleLoginPress} disabled={isLoginButtonLocked}>
            <Image
              source={require("../../assets/button/loginBar_IOS.png")}
              style={[styles.loginBar, isLoginButtonLocked && styles.loginBarDisabled]}
            />
          </TouchableOpacity>
        )}

        {/* Google 로그인 버튼 */}
        <TouchableOpacity onPress={handleLogInPress} disabled={isLoginButtonLocked}>
          <Image
            source={require("../../assets/button/loginBar_Google.png")}
            style={[styles.loginBar, Platform.OS === 'ios' && { marginTop: 15 }, isLoginButtonLocked && styles.loginBarDisabled]}
          />
        </TouchableOpacity>

        {/* Discord 로그인 버튼 */}
        <TouchableOpacity onPress={handleDiscordLoginPress} disabled={isLoginButtonLocked}>
          <Image
            source={require("../../assets/button/loginBar_Discord.png")}
            style={[styles.loginBar, { marginTop: 15 }, isLoginButtonLocked && styles.loginBarDisabled]}
          />
        </TouchableOpacity>
      </View>

      {/* 계정 삭제 대기 안내 모달 (2026-04-24) */}
      <Popup2Button
        onRequestClose={() => {
          setIsDelPendingPopupVisible(false);
          unlockLoginButtons();
        }}
        visible={isDelPendingPopupVisible}
        leftOnPress={handleDeleteLogout}
        rightOnPress={handleCancelDeletion}
        mainText={"계정을 아직 복구할 수 있어!"}
        secondMainText={pendingDeleteDate ? `${formatDeletionDate(pendingDeleteDate)}에 해당 계정은 삭제됩니다.` : "조만간 해당 계정은 삭제됩니다."}
        leftText={"뒤로가기"}
        rightText={"복구하기"}
        highlightMap={{
          "계정을 아직 복구할 수 있어!": {
            color: ColorTokens.Point2,
          },
          [
            pendingDeleteDate
              ? `${formatDeletionDate(pendingDeleteDate)}에 해당 계정은 삭제됩니다.`
              : "조만간 해당 계정은 삭제됩니다."
          ]: {
            color: ColorTokens.Typography,
          },
        }}
      />
      {/* 계정 복구 성공 안내 모달 */}
      <PopupOneButton
        visible={isRestoreSuccessPopupVisible}
        onRequestClose={() => setIsRestoreSuccessPopupVisible(false)}
        onPress={() => {
          setIsRestoreSuccessPopupVisible(false);
          navigation.navigate("Main");
        }}
        mainText={"다시 클럽에 돌아온걸 환영해!"}
        bottomText={"확인하기"}
      />
      {/* 계정 생성 권유 모달 (로그인 후 가입 안 된 유저일 때) */}
      <Popup2Button
        onRequestClose={() => setIsNewUserPopupVisible(false)}
        visible={isNewUserPopupVisible}
        leftOnPress={() => setIsNewUserPopupVisible(false)}
        rightOnPress={() => {
          setIsNewUserPopupVisible(false);
          navigation.navigate("Dialogue"); // 최초 가입 다이얼로그(IntroSequence)로 이동
        }}
        mainText={"현재 클럽에 가입되지 않은 계정이야."}
        secondMainText={"바로 클럽에 가입할래?"}
        leftText={"취소하기"}
        rightText={"가입하기"}
      />

      {/* Discord Login WebView Modal */}
      <Modal
        visible={isDiscordModalVisible}
        onRequestClose={() => {
          setIsDiscordModalVisible(false);
          unlockLoginButtons();
        }}
        presentationStyle="pageSheet"
        animationType="slide"
      >
        <SafeAreaView style={styles.discordModalContainer} edges={[]}>
          <LinearGradient
            colors={DISCORD_HEADER_GRADIENT_STOPS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {/* 뒤로 가기 버튼 */}
            <TouchableOpacity
              onPress={() => {
                setIsDiscordModalVisible(false);
                unlockLoginButtons();
              }}
              style={styles.closeButton}
            >
              <Image
                source={require("../../tokenImage/CircleDeleteButton.png")}
                style={{
                  width: 25,
                  height: 25,
                }}
              />
            </TouchableOpacity>
            <View style={styles.emptyView} />
          </LinearGradient>
          <WebView
            source={{ uri: "https://discord.com/oauth2/authorize?client_id=1457586264743088199&response_type=code&redirect_uri=https%3A%2F%2Fjamdeeptalk.com%2Foauth%2Fcallback%2Fdiscord&scope=identify+email" }}
            onMessage={handleWebViewMessage}
            startInLoadingState
            style={styles.discordWebView}
            renderLoading={() => (
              <LinearGradient
                colors={DISCORD_HEADER_GRADIENT_STOPS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.discordWebViewLoading}
              >
                <ActivityIndicator color={ColorTokens.Typography} />
              </LinearGradient>
            )}
            injectedJavaScript={`
              (function() {
                function checkJson() {
                  try {
                    var bodyText = document.body.innerText;
                    if (!bodyText) return;
                    
                    // JSON 형태로 시작하고 끝나는지 간단 확인 (최적화)
                    var trimmed = bodyText.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                      var json = JSON.parse(bodyText);
                      
                      // 토큰이나 에러가 있으면 화면 숨기고 앱으로 전송
                      if (json.token || json.access_token || json.success === 0 || json.err) {
                        document.body.style.display = 'none'; // 즉시 숨김
                        window.ReactNativeWebView.postMessage(JSON.stringify(json));
                      }
                    }
                  } catch (e) {
                    // ignore
                  }
                }
                
                // 1. 진입 즉시 실행
                checkJson();
                
                // 2. 주기적으로 실행 (간격 단축 1000ms -> 300ms)
                setInterval(checkJson, 300);
              })();
            `}
          />
        </SafeAreaView>
      </Modal>

      {/* [NEW] Apple Login WebView Modal */}
      <AppleLoginWebView
        visible={isAppleLoginVisible}
        onClose={() => {
          setIsAppleLoginVisible(false);
          unlockLoginButtons();
        }}
        onSuccess={handleAppleLoginSuccess}
      />

    </SafeAreaView>
  );
};

export default Splash;

const styles = StyleSheet.create({
  background: {
    // 색상 조정
    backgroundColor: ColorTokens.Background2,
    // 위치 조정
    flex: 1,
    alignItems: "center", //태그를 세로축 중앙에 정렬
  },
  logo: {
    width: 230,
    height: 80,
    // 위치 조정
    marginTop: heightScale(200),
  },
  miniLogo: {
    // 색상 조정
    color: ColorTokens.SplashSubTitleColor,
    // 폰트 조정
    textAlign: "center", // 글씨를 중앙에 정렬
  },
  userEnteredText: {
    // 색상 조정
    color: ColorTokens.Point2,
    // 위치 조정
    marginTop: Spacing[6],
    ...Typography.headingMedium,
    textAlign: "center",
  },
  userAcceptedText: {
    // 색상 조정
    color: ColorTokens.Point2,
    // 위치 조정
    marginTop: Spacing[6],
    ...Typography.headingMedium,
  },
  loginContainer: {
    // 위치 조정
    position: "absolute",
    marginTop: heightScale(560),
    marginBottom: 50, // 하단 여백 추가
  },
  loginBar: {
    // 레이아웃 속성
    width: SCREEN_WIDTH - 40,
    height: 55,
    borderRadius: 10,
  },
  loginBarDisabled: {
    opacity: 0.55,
  },
  discordModalContainer: {
    flex: 1,
    backgroundColor: ColorTokens.DiscordRSection,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: "hidden",
  },
  discordWebView: {
    flex: 1,
    backgroundColor: ColorTokens.DiscordRSection,
  },
  discordWebViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    height: Platform.OS === "android" ? 90 : 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,

    overflow: "hidden",
  },
  headerTitle: {
    color: ColorTokens.PureBlack,
    ...Typography.boldLarge,
    textAlign: "center",
  },
  closeButton: {
    width: 44,
    height: 44,
    marginTop: Platform.OS === "android" ? 50 : 0,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonStyle: {
    borderRadius: Radius.round,
    backgroundColor: ColorTokens.Typography,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    // iOS 그림자 설정
    shadowColor: ColorTokens.PureBlack,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  closeText: {
    color: ColorTokens.PureBlack,
    fontSize: 24,
    fontWeight: "300",
  },
  emptyView: {
    width: 44,
  },
});
