// 온보딩에서 다음 화면으로 넘어가는 버튼
import { ImageBackground, TouchableOpacity, Text } from "react-native";

// 이미지
import nextBarImage from "./next_bar.png";
import {
  NEXT_BAR_WIDTH,
  NEXT_BAR_HEIGHT,
  NEXT_BAR_TOP,
} from "../../design/token/constantsTokens";
import { ColorTokens } from "../../design/token/ColorTokens";
import { StyleSheet } from "react-native";
import { Typography } from "../../design/Typography";

/*
style={{
          top: undefined,
          bottom: 40,
          alignSelf: "center",
        }}
          로 위치 조정
*/

export default function NextBar({
  onPress,
  activeColor,
  disabled = false, // 기본 활성화
  style,
  message,
}) {
  return (
    <TouchableOpacity
      onPress={!disabled ? onPress : undefined} // 비활성화 일때 클릭 불가
      disabled={disabled}
      style={[styles.nextBarTouchable, style]}
    >
      <ImageBackground
        source={nextBarImage}
        resizeMode="contain"
        style={styles.nextBarStyle}
        imageStyle={{
          tintColor: !disabled ? activeColor : ColorTokens.Unselected,
        }}
      >
        <Text style={styles.nextBarText}>{message}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nextBarTouchable: {
    // 위치 조정
    position: "absolute",
    top: NEXT_BAR_TOP,
  },
  nextBarStyle: {
    // 위치 조정
    justifyContent: "center", //글씨를 중양에 정렬
    alignItems: "center",
    // 레이아웃 속성
    width: NEXT_BAR_WIDTH,
    height: NEXT_BAR_HEIGHT,
  },
  nextBarText: {
    // 폰트 조정
    ...Typography.boldMedium,
  },
});
