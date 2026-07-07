// 설정용 팝업
import { Modal, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import {
  POPUP_BUTTON_HEIGHT,
  POPUP_CONTAINER_HEIGHT,
  POPUP_CONTAINER_WIDTH,
  POPUP_MAIN_HEIGHT,
} from "../../design/token/constantsTokens";
import { Typography } from "../../design/Typography";
import { Radius } from "../../design/Radius";
import HighlightText from "../HighlightText";
import { Spacing } from "../../design/Spacing";

export default function PopupOneButton({
  onRequestClose, // 모달을 닫는 함수
  onPress,
  visible = false,
  mainText,
  bottomText,
  highlightMap,
  style,
}) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={visible ? onRequestClose : undefined}
      style={style}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* 팝업 메인 부분 */}
          <View style={styles.mainContainer}>
            <HighlightText
              message={mainText}
              highlightMap={highlightMap}
              style={[styles.mainTextStyle]}
            />
          </View>
          {/* 팝업 버튼 부분 */}
          <TouchableOpacity onPress={onPress} style={styles.buttonStyle}>
            <Text style={styles.buttonText}>{bottomText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalBackground: {
    // 색상 조정
    backgroundColor: ColorTokens.ModalBackground, // 반투명 검정 배경
    // 위치 조정
    justifyContent: "center",
    alignItems: "center",
    // 레이아웃 속성
    flex: 1,
  },
  modalContainer: {
    // 색상 조정
    backgroundColor: ColorTokens.InnerBox2,
    // 레이아웃 속성
    width: POPUP_CONTAINER_WIDTH,
    height: POPUP_CONTAINER_HEIGHT,
    borderRadius: Radius.sm,
  },
  mainContainer: {
    // 위치 조정
    paddingTop: POPUP_MAIN_HEIGHT / 2, // 메인 글자 위치 수정
    alignItems: "center", // 가로 중앙에 정렬
    // 레이아웃 속성
    height: POPUP_MAIN_HEIGHT,
  },
  mainTextStyle: {
    // 위치 조정
    textAlign: "center",
    // 색상 조정
    color: ColorTokens.Point2,
    // 폰트 조정
    ...Typography.boldMedium,
    marginTop: Platform.select({ ios: Spacing[0], android: Spacing[3] }),
  },
  buttonStyle: {
    // 위치 조정
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
    // 레이아웃 속성
    height: POPUP_BUTTON_HEIGHT,
  },
  buttonText: {
    // 색상 조정
    color: ColorTokens.Point,
    // 폰트 조정
    ...Typography.boldMedium,
  },
});
