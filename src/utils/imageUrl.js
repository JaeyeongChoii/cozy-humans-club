// 우리 서버 이미지 URL에 리사이즈 쿼리(?w=)를 붙이는 헬퍼.
//
// 백엔드가 /files/ 이미지 서빙에 ?w=(200|400|800) 파라미터를 지원하면, 화면별로 작은 이미지를
// 받아 디코딩 부담을 줄인다. (외부 서비스 없이 우리 서버에서 처리)
// 백엔드 미적용 상태에서는 ?w=가 무시되어 원본이 오므로 그대로 둬도 안전하다.
//
// 백엔드가 끝나면 IMAGE_RESIZE_ENABLED는 true 유지. 문제가 생기면 false로 즉시 원복 가능.

export const IMAGE_RESIZE_ENABLED = true;

// 우리 이미지 서버 호스트(이 호스트의 원격 이미지에만 ?w=를 붙인다)
const OUR_IMAGE_HOST = "jamdeeptalk.com";

// 백엔드가 허용하는 width 값(이 외 값은 서버가 거부하므로 클라이언트도 이 3개만 사용)
export const ALLOWED_WIDTHS = [200, 400, 800];

/**
 * 이미지 URL에 ?w= 를 붙인다.
 * - require()(number)/로컬/비원격(http 아님) → 그대로
 * - 우리 서버(OUR_IMAGE_HOST) 이미지가 아니면 → 그대로
 * - 이미 w= 가 있으면 → 그대로
 */
export function withWidth(uri, w) {
  if (!IMAGE_RESIZE_ENABLED || !w) return uri;
  if (typeof uri !== "string") return uri;
  if (!/^https?:\/\//.test(uri)) return uri;
  if (!uri.includes(OUR_IMAGE_HOST)) return uri;
  if (/[?&]w=/.test(uri)) return uri;
  const sep = uri.includes("?") ? "&" : "?";
  return `${uri}${sep}w=${w}`;
}

/**
 * CachedImage의 source(객체/문자열/number)를 받아 ?w= 가 적용된 source를 돌려준다.
 */
export function sourceWithWidth(source, w) {
  if (!IMAGE_RESIZE_ENABLED || !w || !source) return source;
  if (typeof source === "string") return withWidth(source, w);
  if (typeof source === "object" && typeof source.uri === "string") {
    return { ...source, uri: withWidth(source.uri, w) };
  }
  return source; // number(require) 등은 그대로
}
