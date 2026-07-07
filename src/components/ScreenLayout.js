// 컴포넌트
// 뒤로가기, 중앙에 컴포넌트 위치, NextBar
import React from 'react';
import {
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorTokens } from '../design/token/ColorTokens';
import { SCREEN_WIDTH, SCREEN_HEIGHT, heightScale } from '../utils/scale';
import BackButton from "./BackButton";
import NextBar from "./NextBar";
import { Spacing } from '../design/Spacing';

const ScreenLayout = ({
    onBack,
    children,
    hideBackButton,
    nextBarProps,
    showNextBar = true,
    contentStyle,
    containerStyle,
    keyboardResponsiveContent = false,
    contentMode = "absolute",
    nextBarStyle,
    nextBarActiveColor = ColorTokens.Point,
    dismissKeyboardOnPress = true,
}) => {
    const getContentContainerStyle = () => {
        if (keyboardResponsiveContent) {
            return styles.keyboardResponsiveComponentContainer;
        }

        if (contentMode === "flex") {
            return styles.flexComponentContainer;
        }

        if (contentMode === "fullScreen") {
            return styles.fullScreenComponentContainer;
        }

        return styles.componentContainer;
    };

    const content = (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.layoutContainer}>
                <View
                    style={[
                        getContentContainerStyle(),
                        contentStyle
                    ]}
                >
                    {children}
                </View>
            </View>
        </KeyboardAvoidingView>
    );

    return (
        <SafeAreaView style={[styles.container, containerStyle]} edges={[]}>
            {!hideBackButton && onBack && <BackButton onPress={onBack} />}
            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                disabled={!dismissKeyboardOnPress}
            >
                {content}
            </TouchableWithoutFeedback>

            {showNextBar && (
                <View style={styles.nextBarContainer}>
                    <NextBar
                        activeColor={nextBarActiveColor}
                        {...nextBarProps}
                        style={[styles.nextBar, nextBarStyle]}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorTokens.Background2,
    },
    layoutContainer: {
        flex: 1,
    },
    componentContainer: {
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        top: -heightScale(47), // 미정의 문제로 ReportAccepted에 추가 마진을 적용함
    },
    fullScreenComponentContainer: {
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        top: 0,
    },
    flexComponentContainer: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    keyboardResponsiveComponentContainer: {
        flex: 1,
        width: SCREEN_WIDTH,
        top: -heightScale(47),
    },
    nextBarContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Platform.select({ android: Spacing[0], default: Spacing[0] }),
        alignItems: "center",
    },
    nextBar: {
        position: "relative",
        top:  Platform.select({ ios: -heightScale(98), android: -heightScale(48 + 98) }),
    },
});

export default ScreenLayout;
