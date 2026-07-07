// expo-image 기반 공용 이미지 컴포넌트.
//
// RN 기본 <Image>는 iOS에서 디코딩된 이미지 캐시가 없어(NSURLCache만 의존) 스크롤 시
// 재요청/재디코딩이 잦아 느리다. expo-image는 iOS(SDWebImage)/안드로이드(Glide)에서
// 메모리+디스크 캐시를 제공하므로 프로필/인용카드/게시물 미디어처럼 반복 노출되는
// 원격 이미지의 로딩 체감을 크게 개선한다.
//
// 기존 <Image source={...} style={...} resizeMode="cover" /> 호출부를 거의 그대로
// 옮길 수 있도록 resizeMode를 expo-image의 contentFit으로 매핑한다.
import React from "react";
import { Image as ExpoImage } from "expo-image";
import { sourceWithWidth } from "../../utils/imageUrl";

// RN resizeMode -> expo-image contentFit 매핑
const RESIZE_MODE_TO_CONTENT_FIT = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
  center: "none",
  repeat: "repeat",
};

/**
 * @param {Object} props
 * @param {*} props.source - require(...) 결과 / { uri } / url 문자열 / null
 * @param {Object|Array} props.style
 * @param {string} [props.resizeMode] - RN 호환용. contentFit이 없을 때만 사용
 * @param {string} [props.contentFit] - expo-image 네이티브 prop (우선)
 * @param {number|Object} [props.transition=0] - 페이드 전환(ms). 기본 0 (RN fadeDuration=0과 동일 체감)
 * @param {string} [props.cachePolicy="memory-disk"]
 * @param {*} [props.placeholder] - 로딩 전 표시할 블러해시/이미지
 */
const CachedImage = ({
  source,
  style,
  resizeMode,
  contentFit,
  transition = 0,
  cachePolicy = "memory-disk",
  placeholder,
  // resizeWidth(px)가 주어지면 우리 서버 이미지 URL에 ?w= 를 붙여 줄인 버전을 받는다.
  // (로컬 require/타서버 이미지는 그대로) 백엔드 미적용 시 ?w=는 무시되어 원본이 온다.
  resizeWidth,
  // RN 전용 prop은 expo-image에 전달하지 않도록 흡수(무시)한다.
  resizeMethod,
  fadeDuration,
  ...rest
}) => {
  const resolvedContentFit =
    contentFit || RESIZE_MODE_TO_CONTENT_FIT[resizeMode] || "cover";

  const resolvedSource = resizeWidth ? sourceWithWidth(source, resizeWidth) : source;

  return (
    <ExpoImage
      source={resolvedSource}
      style={style}
      contentFit={resolvedContentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      placeholder={placeholder}
      {...rest}
    />
  );
};

export default CachedImage;
