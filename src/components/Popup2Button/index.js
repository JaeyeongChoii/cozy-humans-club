// 설정용 팝업
import { Modal, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";

import {
  POPUP_BUTTON_HEIGHT,
  POPUP_CONTAINER_HEIGHT,
  POPUP_CONTAINER_WIDTH,
  POPUP_MAIN_HEIGHT,
} from "../../design/token/constantsTokens";
import HighlightText from "../HighlightText";
import { Typography } from "../../design/Typography";
import { Radius } from "../../design/Radius";
import { heightScale } from "../../utils/scale";

export default function ({
  onRequestClose,
  leftOnPress,
  rightOnPress,
  visible,
  mainText,
  secondMainText = "",  // 텍스트와 일정 간격을 둔 텍스트
  leftText,
  rightText,
  style,
  highlightMap,
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
          <View style={[
            styles.mainContainer,
            { paddingTop: secondMainText === ""
              ?
              heightScale(88)
              :
              0}
          ]}>

            {
              secondMainText === ""
                ?
                // 두번째 텍스트가 없는 경우
                highlightMap ? (
                  <HighlightText
                    message={mainText}
                    highlightMap={highlightMap}
                    style={[styles.mainTextStyle]}
                  />
                ) : (
                  <Text style={styles.mainText2Style}>
                    {mainText}
                  </Text>
                )
                :
                // 두번째 텍스트가 있는 경우
                <>
                  <HighlightText
                    message={mainText}
                    highlightMap={highlightMap}
                    style={[
                      styles.mainTextStyle,
                      styles.mainTextAt40,
                    ]}
                  />
                  <HighlightText
                    message={secondMainText}
                    highlightMap={highlightMap}
                    style={[
                      styles.mainText2Style,
                      styles.secondMainTextAt55,
                    ]}
                  />
                </>
            }

          </View>
          {/* 팝업 버튼 부분 */}
          <View style={styles.buttonContainer}>
            {/* 좌측 */}
            <TouchableOpacity onPress={leftOnPress} style={styles.leftButton}>
              <Text style={styles.leftTextStyle}>
                {leftText}
              </Text>
            </TouchableOpacity>
            {/* 우측 */}
            <TouchableOpacity onPress={rightOnPress} style={styles.rightButton}>
              <Text style={styles.rightTextStyle}>
                {rightText}
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: "center", // 가로축을 중앙에 정렬
    // 레이아웃 속성
    height: POPUP_MAIN_HEIGHT,
    position: "relative",
  },
  mainTextStyle: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    textAlign: "center",
    ...Typography.boldMedium,
  },
  mainText2Style: {
    // 색상 조정
    color: ColorTokens.Point2,
    // 폰트 조정
    textAlign: "center",
    ...Typography.boldMedium,
  },
  mainTextAt40: {
    position: "absolute",
    top: POPUP_CONTAINER_HEIGHT * 0.36 - 9,
    width: "100%",
  },
  secondMainTextAt55: {
    position: "absolute",
    top: POPUP_CONTAINER_HEIGHT * 0.55 - 9,
    width: "100%",
  },
  buttonContainer: {
    // 위치 조정
    flexDirection: "row",
    // 레이아웃 속성
    height: POPUP_BUTTON_HEIGHT,
  },
  leftButton: {
    // 위치 조정
    flex: 1, // leftButton과 rightButton의 가로 길이를 1 : 1 로 나눠 가짐
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
  },
  leftTextStyle: {
    // 색상 조정
    color: ColorTokens.Unselected,
    ...Typography.boldMedium,
  },
  rightButton: {
    // 위치 조정
    flex: 1, // leftButton과 rightButton의 가로 길이를 1 : 1 로 나눠 가짐
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
  },
  rightTextStyle: {
    // 색상 조정
    color: ColorTokens.Point,
    ...Typography.boldMedium,
  },
});
