// 신고하기 절차 완료후 유저 차단/뮤트 제안
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import HighlightText from "../HighlightText";
import { heightScale, SCREEN_WIDTH, widthScale } from "../../utils/scale";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import CatMessageBox from "../CatMessageBox";
import { CATBOX_SETTING_HEIGHT } from "../../design/token/constantsTokens";

const ACTION_BUTTONS = [
  { id: "mute", text: "뮤트하기" },
  { id: "block", text: "차단하기" },
  { id: "ok", text: "괜찮아!" },
];

const ReportAccepted = ({
  selectedAction = null,
  onSelectAction = () => { },
}) => {
  return (
    <View style={styles.container}>
      <CatMessageBox
        message={"무슨 말인지 알겠어."}
        style={{
          top: CATBOX_SETTING_HEIGHT
        }}
      />

      <View style={{
        marginHorizontal: Spacing[5],
        marginTop: heightScale(310),
      }}>
        <Text style={styles.textStyle}>
          방금 운영팀에게 이 제보를 바로 전달할께.{"\n"}
          나와 운영팀이 너의 제보를 바탕으로 빠르게 문제를 해결할꺼야.
        </Text>
        <HighlightText
          message="혹시 추가적으로 해당 유저를 차단/뮤트해줄까?"
          highlightMap={{
            "차단/뮤트": {
              color: ColorTokens.Point,
            },
          }}
          style={[styles.textStyle, { marginTop: Spacing[8] }]}
        />

        <View style={styles.buttonContainer}>
          {ACTION_BUTTONS.map((action) => {
            const isSelected = selectedAction === action.id;
            return (
              <TouchableOpacity
                key={action.id}
                onPress={() => onSelectAction(action.id)}
                style={styles.buttonWrapper}
              >
                <ImageBackground
                  source={
                    isSelected
                      ? require("../../../tokenImage/rectangleButton_active.png")
                      : require("../../../tokenImage/rectangleButton.png")
                  }
                  style={styles.button}
                  resizeMode="stretch"
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isSelected && { color: ColorTokens.Point },
                    ]}
                  >
                    {action.text}
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tltle: {
    color: ColorTokens.Point,
    ...Typography.boldLarge,
    paddingBottom: Spacing[8],
  },
  textStyle: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.paraMedium,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  buttonContainer: {
    position: "absolute",
    top: heightScale(160),
    marginHorizontal: Spacing[2],
  },
  buttonWrapper: {
    marginBottom: Spacing[2],
  },
  button: {
    width: widthScale(348),
    height: 40,
    justifyContent: "center", // 세로 중앙 정렬
    paddingLeft: Spacing[4], // 왼쪽 패딩
  },
  buttonText: {
    color: ColorTokens.Unselected,
    ...Typography.boldMedium,
    textAlign: "left", // 텍스트 좌측 정렬 명시
  },
});

export default ReportAccepted;
