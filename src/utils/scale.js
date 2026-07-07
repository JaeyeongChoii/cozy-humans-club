import { Dimensions, PixelRatio } from "react-native";

// 피그마 샘플의 기본 길이
const FIGMA_BASE = {
  WIDTH: 393,
  HEIGHT: 852,
};

// 사용자 화면의 기본 길이
const DEVICE = Dimensions.get("window");
export const SCREEN_WIDTH = DEVICE.width;
export const SCREEN_HEIGHT = DEVICE.height;

// 비율을 반올림 시키는 함수
export function roundToNearestPixel(size) {
  return PixelRatio.roundToNearestPixel(size);
}

// 비율 조정 함수들
export function widthScale(size) {
  const scaled = (SCREEN_WIDTH / FIGMA_BASE.WIDTH) * size;
  return roundToNearestPixel(scaled);
}
export function heightScale(size) {
  const scaled = (SCREEN_HEIGHT / FIGMA_BASE.HEIGHT) * size;
  return roundToNearestPixel(scaled);
}