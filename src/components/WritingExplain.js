// 컴포넌트
// 제목과 텍스트 입력을 받는 범용 컴포넌트
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { heightScale } from "../utils/scale";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";
import { Radius } from "../design/Radius";
import CatMessageBox from "./CatMessageBox";
import {
  CATBOX_SETTING_HEIGHT,
  TEXT_INPUT_WIDTH,
} from "../design/token/constantsTokens";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WritingExplain = ({
  text,
  onChangeText,
  title,
  highlightWords,
  placeholder = "",
  maxLength = 2000,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(true);
  };

  const handleBlur = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      {title && !isFocused && (
        <CatMessageBox
          message={title}
          highlightWords={highlightWords}
          style={{
            top: CATBOX_SETTING_HEIGHT,
          }}
        />
      )}
      <View
        style={[
          styles.inputSection,
          isFocused ? styles.inputSectionFocused : styles.inputSectionIdle,
        ]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ColorTokens.Unselected}
          // 자동 대문자 방지
          autoCapitalize="none"
          // 자동 수정 방지
          autoCorrect={false}
          spellCheck={false}
          multiline={true}
          textAlignVertical="top"
          maxLength={maxLength}
          scrollEnabled={true}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <Text style={styles.counterText}>
          {text.length}/{maxLength}
        </Text>
      </View>
    </View>
  );
};

export default WritingExplain;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputSection: {
    alignItems: "center",
    width: "100%",
  },
  inputSectionIdle: {
    marginTop: heightScale(342),
  },
  inputSectionFocused: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing[3],
  },
  input: {
    width: TEXT_INPUT_WIDTH,
    height: 250,
    backgroundColor: ColorTokens.InnerBox2,
    color: ColorTokens.Typography,
    ...Typography.paraMedium,

    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  counterText: {
    color: ColorTokens.Unselected,
    ...Typography.paraSmall,
    textAlign: "right", // 오른쪽 정렬
    marginTop: 5,
    width: TEXT_INPUT_WIDTH,
  },
});
