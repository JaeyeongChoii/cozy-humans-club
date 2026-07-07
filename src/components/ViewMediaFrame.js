import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Modal,
    Image,
    Animated,
    PanResponder,
    TouchableWithoutFeedback,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import Tokens from "../../Tokens";
import { MIN_TOUCHABLE_LENGTH } from "../design/token/constantsTokens";
import NextBar from "./NextBar";
import Toast from "./Popup/Toast";

const ViewMediaFrame = ({
    visible,
    onClose,
    children,
    onSave, // 실제 저장 로직 함수
    blockSave = false, // 저장 차단 여부
    meatballVisible = true // 미트볼 메뉴 표시 여부
}) => {
    const [savedMode, setSavedMode] = useState(false); // 저장하기 모드 활성화 변수
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [dismissCallback, setDismissCallback] = useState(null);
    const pan = useRef(new Animated.ValueXY()).current;

    // 모달이 열릴 때 위치 및 상태 초기화
    useEffect(() => {
        if (visible) {
            pan.setValue({ x: 0, y: 0 });
            setSavedMode(false);
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderMove: Animated.event(
                [null, { dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 1.5) {
                    Animated.timing(pan, {
                        toValue: { x: 0, y: 1000 },
                        duration: 200,
                        useNativeDriver: false,
                    }).start(handleClose);
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    const handleClose = () => {
        setSavedMode(false);
        onClose();
    };

    const showToast = (message, callback) => {
        if (toastVisible) return;
        setToastMessage(message);
        if (callback) setDismissCallback(() => callback);
        setToastVisible(true);
    };

    const handleMeatballPress = () => {
        if (blockSave) {
            showToast("이 미디어는 저장이 블락되어있어!");
        } else {
            setSavedMode(true);
        }
    };

    const handleSavePress = async () => {
        if (onSave) {
            try {
                await onSave();
                // 저장 후에는 '저장하기' 오버레이만 닫고, 사진 세부 화면(모달)은 그대로 유지한다.
                // (이전에는 토스트 종료 콜백으로 handleClose를 넘겨 모달이 닫히면서 홈으로 빠져나갔다.)
                setSavedMode(false);
                showToast("저장을 완료했어!");
            } catch (error) {
                console.log("저장 오류:", error);
                // 에러 토스트는 onSave 내부에서 처리하거나 여기서 처리
            }
        }
    };

    // 자식 컴포넌트(ViewImage/ViewVideo)에서 토스트를 띄우고 싶을 때를 위해 함수 노출이 필요할 수 있음
    // 일단은 props로 전달하진 않고, 기본적인 저장 완료 토스트만 여기서 처리.

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateY: pan.y }] }
                ]}
                {...panResponder.panHandlers}
            >
                {/* 상단 버튼 영역 */}
                <View style={styles.toolContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Image
                            source={require("../../tokenImage/deleteButton.png")}
                            style={styles.closeIcon}
                        />
                    </TouchableOpacity>

                    {meatballVisible && (
                        <TouchableOpacity
                            style={styles.meatballButton}
                            onPress={handleMeatballPress}
                        >
                            <Image
                                source={require("../../tokenImage/meatball.png")}
                                style={Tokens.meatball}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 미디어 콘텐츠 주입 */}
                {children}

                {/* 토스트 메시지 */}
                <Toast
                    visible={toastVisible}
                    pointMessage={toastMessage} // message 대신 pointMessage로 전달
                    withOverlay={true}
                    onDismiss={() => {
                        setToastVisible(false);
                        if (dismissCallback) {
                            dismissCallback();
                            setDismissCallback(null);
                        }
                    }}
                />

                {/* 저장하기 오버레이 */}
                {savedMode && (
                    <View style={styles.overlayContainer}>
                        <TouchableWithoutFeedback onPress={() => setSavedMode(false)}>
                            <View style={styles.overlayBackground} />
                        </TouchableWithoutFeedback>

                        <View style={styles.nextBarWrapper}>
                            <NextBar
                                onPress={handleSavePress}
                                activeColor={ColorTokens.Point}
                                message={"저장하기"}
                                style={styles.savedBar}
                            />
                        </View>
                    </View>
                )}
            </Animated.View>
        </Modal>
    );
};

export default ViewMediaFrame;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black", // 검정 배경 강제 (#000000)
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    toolContainer: {
        position: "absolute",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center", // 세로 중앙 정렬 추가
        top: 80,
        width: "100%",
        height: 60,
        zIndex: 10,
    },
    closeButton: {
        marginHorizontal: 20,
        justifyContent: "center",
    },
    meatballButton: {
        marginHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        width: MIN_TOUCHABLE_LENGTH,
        height: MIN_TOUCHABLE_LENGTH,
    },
    closeIcon: {
        // 기존 ✕ 텍스트(fontSize 24)와 동일한 크기로 맞춤. 원본 비율(77x73) 유지.
        width: 24,
        height: 23,
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    overlayBackground: {
        backgroundColor: ColorTokens.ModalBackground,
        ...StyleSheet.absoluteFillObject,
    },
    savedBar: {
        alignSelf: "center",
        position: 'relative', // 기본 절대 위치 무시
        top: 0, // 기본 top 무시
    },
    nextBarWrapper: {
        position: "absolute",
        bottom: 80, // 50 -> 80으로 조정
        width: "100%",
        alignItems: "center",
    },
});
