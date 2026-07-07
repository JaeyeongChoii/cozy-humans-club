import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { Spacing } from "../design/Spacing";

const COLLAPSED_STATUS_LINES = 1;
const MIN_EXPANDABLE_LINES = 2;

const ProfileStatusMessage = ({ message, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const trimmedMessage = message?.trim() ?? "";
  const paragraphLineCount = trimmedMessage.split(/\r\n|\r|\n/).length;
  const shouldShowMore =
    lineCount >= MIN_EXPANDABLE_LINES ||
    paragraphLineCount >= MIN_EXPANDABLE_LINES ||
    trimmedMessage.length > 24;

  useEffect(() => {
    setIsExpanded(false);
    setLineCount(0);
  }, [trimmedMessage]);

  if (!trimmedMessage) {
    return null;
  }

  return (
    <View style={{ position: "relative" }}>
      <Text
        style={style}
        numberOfLines={isExpanded ? undefined : COLLAPSED_STATUS_LINES}
        ellipsizeMode="clip"
        onTextLayout={(e) => {
          const newCount = e.nativeEvent.lines.length;
          if (newCount >= MIN_EXPANDABLE_LINES && lineCount !== newCount) {
            setLineCount(newCount);
          }
        }}
      >
        {trimmedMessage}
      </Text>

      {!isExpanded && shouldShowMore && (
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          onPress={() => setIsExpanded(true)}
          style={styles.moreButton}
        >
          <Text style={[style, styles.moreText]} numberOfLines={1}>
            ... <Text style={styles.moreLabelText}>더보기</Text>
          </Text>
        </TouchableOpacity>
      )}

      <Text
        pointerEvents="none"
        style={[style, styles.hiddenText]}
        onTextLayout={(e) => {
          const newCount = e.nativeEvent.lines.length;
          if (lineCount !== newCount) {
            setLineCount(newCount);
          }
        }}
      >
        {trimmedMessage}
      </Text>
    </View>
  );
};

const styles = {
  moreButton: {
    alignSelf: "flex-start",
    zIndex: 1,
  },
  moreText: {
    marginTop: Spacing[1],
  },
  moreLabelText: {
    color: ColorTokens.Point,
  },
  hiddenText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
};

export default ProfileStatusMessage;
