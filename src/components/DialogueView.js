// 컴포넌트
// 고양이가 나와 설명하는 화면
import React from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  Text,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { SCREEN_WIDTH, SCREEN_HEIGHT, widthScale } from "../utils/scale";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";

const DialogueView = ({ text, onPress, imageAddress, isSmall = false }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={1}
      >
        <Image source={imageAddress} style={styles.image} />
        <View style={styles.dialogueContainer}>
          <ImageBackground
            source={
              isSmall
                ? require("../../assets/image/diologueSmall.png")
                : require("../../assets/image/diologue.png")
            }
            style={[
              styles.dialogueBox,
              {
                minHeight: isSmall ? 82 : 105, // 최소 높이 설정
              },
            ]}
            resizeMode="stretch"
          >
            <Text style={styles.text}>{text}</Text>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorTokens.Background2,
  },
  touchable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dialogueContainer: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dialogueBox: {
    width: widthScale(352), // 좌우 여백 고려
    padding: 20,
    justifyContent: "center",
  },
  text: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    textAlign: "left",
  },
});

export default DialogueView;
