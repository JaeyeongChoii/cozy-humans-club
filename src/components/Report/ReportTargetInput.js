import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";

import { ColorTokens } from "../../design/token/ColorTokens";
import {
  CATBOX_SETTING_HEIGHT,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../design/token/constantsTokens";
import { Radius } from "../../design/Radius";
import { Spacing } from "../../design/Spacing";
import { Typography } from "../../design/Typography";
import { heightScale } from "../../utils/scale";
import CatMessageBox from "../CatMessageBox";
import UserSearchResultList from "../UserSearchResultList";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ReportTargetInput = ({
  targetId,
  onChangeTargetId,
  onSelectTargetId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const blurTimerRef = useRef(null);

  const animationConfig = {
    duration: 300,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  };

  const normalizeUserId = (value) => String(value || "").replace(/^@/, "").trim();

  const handleFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    LayoutAnimation.configureNext(animationConfig);
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      LayoutAnimation.configureNext(animationConfig);
      setIsFocused(false);
      blurTimerRef.current = null;
    }, 0);
  };

  const handleChangeText = (text) => {
    onChangeTargetId(text.replace(/^@/, ""));
  };

  const handleSelectUser = (user) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }

    LayoutAnimation.configureNext(animationConfig);
    const cleanId = normalizeUserId(user.usercode);
    if (onSelectTargetId) {
      onSelectTargetId(cleanId);
    } else {
      onChangeTargetId(cleanId);
    }
    setIsFocused(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {!isFocused && (
        <CatMessageBox
          message={"신고하고 싶은 계정을 알려줄래?"}
          style={{
            top: CATBOX_SETTING_HEIGHT,
          }}
        />
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <Text style={styles.prefix}>@</Text>
        <TextInput
          style={styles.input}
          value={targetId}
          onChangeText={handleChangeText}
          placeholderTextColor={ColorTokens.Unselected}
          maxLength={50}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      {isFocused && (
        <View style={styles.listContainer}>
          <UserSearchResultList
            keyword={targetId}
            onSelectUser={handleSelectUser}
            selectOnPressIn={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    width: TEXT_INPUT_WIDTH,
    height: TEXT_INPUT_HEIGHT,
    backgroundColor: ColorTokens.InnerBox2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[3],
    marginHorizontal: Spacing[5],
    borderRadius: Radius.sm,
    marginTop: TEXT_INPUT_TOP,
  },
  inputContainerFocused: {
    marginTop: heightScale(231),
    marginBottom: Spacing[2],
  },
  prefix: {
    ...Typography.paraMedium,
    color: ColorTokens.Point,
    includeFontPadding: true,
    lineHeight: undefined,
  },
  input: {
    flex: 1,
    height: TEXT_INPUT_HEIGHT,
    color: ColorTokens.Point,
    ...Typography.paraMedium,
    paddingVertical: 0,
    paddingLeft: 0,
    margin: 0,
    textAlignVertical: "center",
    includeFontPadding: true,
    lineHeight: undefined,
  },
  listContainer: {
    width: TEXT_INPUT_WIDTH,
    maxHeight: 248,
    borderRadius: Radius.lg,
    backgroundColor: ColorTokens.InnerBox2,
    paddingLeft: Spacing[2],
    marginHorizontal: Spacing[5],
  },
});

export default ReportTargetInput;
