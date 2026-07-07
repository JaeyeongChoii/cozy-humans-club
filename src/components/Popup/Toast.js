import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Modal } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import { Typography } from "../../design/Typography";
import { Radius } from "../../design/Radius";
import HighlightText from "../HighlightText";

const Toast = ({
  visible,
  pointMessage,
  message,
  duration = 1500,
  highlightWords,
  onDismiss,
  withOverlay = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // visible이 변경될 때마다 애니메이션 실행
  useEffect(() => {
    if (visible) {
      // Fade In
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // 일정 시간 후 Fade Out (auto-hide)
        if (duration > 0) {
          setTimeout(() => {
            handleDismiss();
          }, duration);
        }
      });
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none" // 내부 애니메이션 사용
      onRequestClose={handleDismiss} // 안드로이드 백버튼 대응
    >
      {/* 바깥쪽 가장 큰 뷰 (오버레이와 컨텐츠를 감쌈) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents={withOverlay ? "auto" : "box-none"}>
        {/* 오버레이 배경 */}
        {withOverlay && (
          <Animated.View
            style={[
              styles.overlayBackground,
              { opacity: fadeAnim }
            ]}
          />
        )}

        {/* 실제 토스트 메시지 컨테이너 */}
        <View style={styles.container} pointerEvents="box-none">
          <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
            {/* pointMessage만 있는경우, 글씨를 커보이게 */}
            {/* message도 있는경우, 둘다 글씨를 작고, 사이에 마진 추가 */}
            {pointMessage && (
              <HighlightText
                message={pointMessage}
                highlightMap={highlightWords}
                style={[
                  styles.toastText,
                  {
                    marginBottom: message ? 20 : 0,
                    ...Typography.boldMedium,
                  },
                ]}
              />
            )}
            {message && (
              <HighlightText
                message={message}
                highlightMap={highlightWords}
                style={styles.pointToastText}
              />
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center", // 다시 중앙 정렬로 복구
    alignItems: "center",
    zIndex: 9999,
    elevation: 100, // Android
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ColorTokens.ModalBackground,
  },
  toastContainer: {
    backgroundColor: ColorTokens.InnerBox2,

    width: 300,
    height: 150,

    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
    // 그림자 등 추가 가능
  },
  toastText: {
    ...Typography.boldMedium,
    color: ColorTokens.Typography,
    textAlign: "center",
  },
  pointToastText: {
    ...Typography.boldMedium,
    color: ColorTokens.Point,
    textAlign: "center",
  },
});

export default Toast;
