import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";

import {
  POPUP_BUTTON_HEIGHT,
  POPUP_CONTAINER_HEIGHT,
  POPUP_CONTAINER_WIDTH,
} from "../../design/token/constantsTokens";
import HighlightText from "../HighlightText";
import { Typography } from "../../design/Typography";
import { Radius } from "../../design/Radius";
import { Spacing } from "../../design/Spacing";
import { widthScale } from "../../utils/scale";

export default function PopupPasswordButton({
  onRequestClose,
  leftOnPress,
  rightOnPress,
  visible,
  mainText,
  leftText,
  rightText,
  style,
  highlightMap,
  correctPassword, // 올바른 암호
}) {
  const [password, setPassword] = useState("");
  const [wrongState, setWrongState] = useState(false); // 비밀번호 틀렸을때 상태 저장

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (wrongState) {
      setWrongState(false);
    }
  };

  const handleRightPress = () => {
    if (password === correctPassword) {
      rightOnPress();
      setPassword(""); // 성공 시 초기화
      setWrongState(false); // 상태 초기화
    } else {
      setWrongState(true);
    }
  };

  const handleLeftPress = () => {
    setPassword(""); // 취소 시 초기화
    setWrongState(false); // 상태 초기화
    leftOnPress();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={visible ? onRequestClose : undefined}
      style={style}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackground}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              {/* 팝업 메인 부분 */}
              <View style={styles.mainContainer}>
                {highlightMap ? (
                  <HighlightText
                    message={mainText}
                    highlightMap={highlightMap}
                    style={styles.mainTextStyle}
                  />
                ) : (
                  <Text style={styles.mainTextStyle}>{mainText}</Text>
                )}

                {/* 텍스트 입력 부분 */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    onChangeText={handlePasswordChange}
                    value={password}
                    placeholder="입력"
                    placeholderTextColor={ColorTokens.Unselected}
                    // 자동 대문자 방지
                    autoCapitalize="none"
                    // 자동 수정 방지
                    autoCorrect={false}
                    spellCheck={false}
                  />
                  <View
                    style={[
                      styles.inputUnderline,
                      {
                        backgroundColor: wrongState
                          ? ColorTokens.Warning
                          : ColorTokens.Unselected,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 팝업 버튼 부분 */}
              <View style={styles.buttonContainer}>
                {/* 좌측 */}
                <TouchableOpacity
                  onPress={handleLeftPress}
                  style={styles.leftButton}
                >
                  <Text style={styles.leftTextStyle}>{leftText}</Text>
                </TouchableOpacity>
                {/* 우측 */}
                <TouchableOpacity
                  onPress={handleRightPress}
                  style={styles.rightButton}
                >
                  <Text
                    style={[
                      Typography.boldMedium,
                      // 패스워드가 없을경우 버튼 색을 비활성화
                      password === ""
                        ? {
                            color: ColorTokens.Unselected,
                          }
                        : styles.rightTextStyle,
                    ]}
                  >
                    {rightText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: ColorTokens.ModalBackground,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  modalContainer: {
    backgroundColor: ColorTokens.InnerBox2,
    width: POPUP_CONTAINER_WIDTH,
    height: POPUP_CONTAINER_HEIGHT,
    borderRadius: Radius.sm,
  },
  mainContainer: {
    paddingTop: Spacing[10], // 텍스트와 인풋 공간 확보를 위해 조정
    alignItems: "center",
    flex: 1,
  },
  mainTextStyle: {
    color: ColorTokens.Point2, // 주어진 이미지에 맞게 색상 변경
    ...Typography.boldMedium,
    textAlign: "center",
    marginBottom: Platform.select({ ios: Spacing[7], android: Spacing[6] }), // 텍스트와 인풋 간격
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  textInput: {
    width: widthScale(216),
    height: 30, // 타이핑 시 높이 변화 및 흔들림 방지를 위한 고정 높이
    paddingVertical: 0, // 기본 패딩 제거
    marginVertical: 0,
    ...Typography.paraMedium,
    lineHeight: undefined, // paraMedium의 lineHeight 설정을 덮어씌움
    textAlignVertical: "center", // Android에서의 텍스트 수직 중앙 정렬
    color: ColorTokens.Typography,
  },
  inputUnderline: {
    width: widthScale(216),
    height: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    height: POPUP_BUTTON_HEIGHT,
  },
  leftButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leftTextStyle: {
    color: ColorTokens.Unselected,
    ...Typography.boldMedium,
  },
  rightButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rightTextStyle: {
    color: ColorTokens.Point,
  },
});
