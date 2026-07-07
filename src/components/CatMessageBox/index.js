import { View, Image, StyleSheet, Platform } from "react-native";

import catContainerSmImage from "../../../assets/image/TutorialImageSm.png";
import catContainerSmNoImage from "../../../assets/image/TutorialImageSmBad.png";
import catContainerLgImage from "../../../assets/image/TutorialImageLg.png";
import catContainerLgNoImage from "../../../assets/image/TutorialImageSmBad.png";

import { widthScale, heightScale, SCREEN_WIDTH } from "../../utils/scale";
import { ColorTokens } from "../../design/token/ColorTokens";
import HighlightText from "../HighlightText";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";

const catContainerSmHeight = heightScale(143);
const catMessageAreaTop = heightScale(61);
const catParagraphSpacing = heightScale(18);
const catContainerLgHeight = heightScale(166);

const catBackgroundImages = [
  {
    key: "small-valid",
    source: catContainerSmImage,
    isSmall: true,
    isInvalid: false,
  },
  {
    key: "small-invalid",
    source: catContainerSmNoImage,
    isSmall: true,
    isInvalid: true,
  },
  {
    key: "large-valid",
    source: catContainerLgImage,
    isSmall: false,
    isInvalid: false,
  },
  {
    key: "large-invalid",
    source: catContainerLgNoImage,
    isSmall: false,
    isInvalid: true,
  },
];

export default function CatMessageBox({
  message,
  highlightWords,
  invaild = false,
  style,
}) {
  const getSmallImage = typeof message === "string" && !message.includes("\n");
  const messageParagraphs = typeof message === "string"
    ? message.split("\n\n")
    : [message];

  if (message != null && typeof message !== "string") {
    console.warn("CatMessageBox: 'message' prop should be a string, but received:", typeof message, message);
  }

  return (
    <View style={[styles.catMessagesContainer, style]}>
      <View
        style={[
          styles.catContainerStyle,
          { height: getSmallImage ? catContainerSmHeight : catContainerLgHeight },
        ]}
      >
        {catBackgroundImages.map((backgroundImage) => {
          const isActive =
            backgroundImage.isSmall === getSmallImage &&
            backgroundImage.isInvalid === invaild;

          return (
            <Image
              key={backgroundImage.key}
              source={backgroundImage.source}
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.catBackgroundImage,
                isActive ? styles.activeBackgroundImage : styles.inactiveBackgroundImage,
              ]}
            />
          );
        })}

        <View style={styles.messageCenterContainer}>
          {messageParagraphs.map((paragraph, index) => (
            <View key={`${index}-${paragraph}`}>
              <HighlightText
                message={paragraph}
                highlightMap={highlightWords}
                style={styles.catMessagesStyle}
              />
              {index < messageParagraphs.length - 1 ? (
                <View style={styles.paragraphGap} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  catMessagesContainer: {
    position: "absolute",
    top: heightScale(129),
    width: SCREEN_WIDTH,
  },
  catContainerStyle: {
    justifyContent: "center",
    width: "100%",
  },
  catBackgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  activeBackgroundImage: {
    opacity: 1,
  },
  inactiveBackgroundImage: {
    opacity: 0,
  },
  messageCenterContainer: {
    position: "absolute",
    top: catMessageAreaTop,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
  },
  paragraphGap: {
    height: catParagraphSpacing,
  },
  catMessagesStyle: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    transform: [
      {
        translateX: 16 +
          Platform.select({ ios: Spacing[5] + 8, android: Spacing[5] + 8 }),
      },
      { translateY: 0 },
    ],
    maxWidth: widthScale(300),
  },
});
