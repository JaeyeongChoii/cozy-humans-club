// 바텀시트
// 카테고리 후보가 나오고, 하나를 선택하는 방식
import React from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorTokens } from "../../design/token/ColorTokens";
import { THEME } from "../../design/token/constantsTokens";
import NextBar from "../NextBar";
import { SCREEN_WIDTH } from "../../utils/scale";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import { Radius } from "../../design/Radius";

export default function SetTheme({
  isVisible,
  onClose,
  selectedTheme,
  setTheme,
  translateY, // Animated.Value 넘겨받음,
  textGroup,
  themeModalHeight,
}) {

  // 테마 그룹 처리 로직
  const getThemes = () => {
    if (textGroup) {
      if (Array.isArray(textGroup)) return textGroup;
      if (typeof textGroup === 'string') return textGroup.split(',').map(s => s.trim());
    }
    return [];
  };

  const themeOptions = getThemes();

  // 안드로이드 edge-to-edge 환경에서 시트가 시스템 내비게이션(탭) 바에 가려져
  // 확인 버튼이 잘리는 문제 보정용 하단 인셋. iOS는 0으로 두어 기존 동작 유지.
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;

  // 내부 선택 상태 관리
  const [tempSelected, setTempSelected] = React.useState(selectedTheme);

  // 모달이 열릴 때(selectedTheme prop변경 시) 내부 상태 동기화
  React.useEffect(() => {
    setTempSelected(selectedTheme);
  }, [selectedTheme]);

  const handleConfirm = () => {
    setTheme(tempSelected);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* 배경 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* 모달 박스 */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalBox,
                { transform: [{ translateY }] }, // 애니메이션 적용
                // 안드로이드는 탭바 높이(androidBottomInset)만큼 시트를 더 키워
                // 콘텐츠(확인 버튼)가 탭바 위로 올라오게 한다. 늘어난 높이는 탭바
                // 영역에 가려지므로 닫힘 애니메이션 시 잔상도 보이지 않는다.
                { height: themeModalHeight + androidBottomInset },
              ]}
            >
              {themeOptions.map((option, index) => {
                const isSelected = tempSelected === option;
                // "진지" 선택 시에는 노란색 대신 보라색(테두리/글씨)으로 표시
                const isJinSelected = isSelected && option === THEME.JIN;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setTempSelected(option)}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={
                        isJinSelected
                          ? require("../../../tokenImage/activeCandidatesBoxJin.png")
                          : isSelected
                          ? require("../../../tokenImage/activeCandidatesBox.png")
                          : require("../../../tokenImage/candidatesBox.png")
                      }
                      resizeMode="contain"
                      style={styles.themeButton}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isJinSelected
                            ? { color: ColorTokens.Purple }
                            : isSelected
                            ? { color: ColorTokens.Point }
                            : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}

              {/* 확인 버튼 (NextBar 활용) */}
              <NextBar
                onPress={handleConfirm}
                activeColor={ColorTokens.Point}
                message={"확인"}
                style={{
                  top: themeModalHeight - 80, // NextBar 위치 조정
                }}
              />
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: ColorTokens.ModalBackground,
  },
  modalBox: {
    width: SCREEN_WIDTH,
    backgroundColor: ColorTokens.InnerBox,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 40,
    alignItems: "center",
  },
  themeButton: {
    width: 348,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 25,
    marginTop: Spacing[3],
  },
  buttonText: {
    ...Typography.boldMedium,
    color: ColorTokens.Unselected,

  },
});
