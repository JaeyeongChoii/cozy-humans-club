// 뒤로가기
import React from "react";
import { ColorTokens } from "../../design/token/ColorTokens";
import { Image, TouchableOpacity } from "react-native";
import { heightScale, SCREEN_HEIGHT } from "../../utils/scale";

const MIN_TOUCH_SIZE = 44;
const ICON_SIZE = 22;
const COLOR = ColorTokens.Typography;
const DISABLED_COLOR = ColorTokens.Unselected;

export default function BackButton({
  onPress,
  size = ICON_SIZE,
  color = COLOR,
  disabled = false, // 활성화
  style,
  accessibilityLabel = "뒤로가기",
}) {
  const extra = Math.max(MIN_TOUCH_SIZE - size, 0) / 2;
  const hitSlop = { top: extra, bottom: extra, left: extra, right: extra };

   return (
    <>
      {!disabled && (
        <TouchableOpacity
          onPress={onPress}
          hitSlop={hitSlop} // 최소 터치 영역 보장
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessible // 해당 컴포넌트를 하나의 접근성 항목으로 취급 여부 설정
          style={[
            {
              // 위치 고정
              position: "absolute",
              marginTop: heightScale(112),
              marginLeft: 15,
              // 터치 우선권 부여
              zIndex: 999,
            },
            style,
          ]}
        >
          <Image
            source={require("../../../assets/button/LeftDirection.png")}
            style={{
              width: 10,
              height: 20
            }}
          />
        </TouchableOpacity>
      )}
    </>
  );

}
