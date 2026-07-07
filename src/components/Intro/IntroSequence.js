import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Text, ActivityIndicator, Image, ImageBackground } from 'react-native';
import IntroDialogue from './IntroDialogue';
import { ColorTokens } from '../../design/token/ColorTokens';
import { fetchIntroScriptFromGoogleSheet } from '../../utils/googleSheetsUtils';
import { SCREEN_WIDTH } from '../../utils/scale';
import { Typography } from '../../design/Typography';
import { checkIsSmallDialogue } from '../../utils/dialogueUtils';

const IntroSequence = ({ onComplete }) => {
    const [scriptData, setScriptData] = useState([]);
    const [loading, setLoading] = useState(true);
    // 현재 보여줄 스크립트의 키 (시작은 onboard_1)
    const [currentKey, setCurrentKey] = useState("onboard_1");
    // 선택지 처리를 위한 상태
    const [selectionOptions, setSelectionOptions] = useState([]);

    // 컴포넌트 마운트 시 스크립트 데이터 로드
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const loadScript = async () => {
            try {
                const data = await fetchIntroScriptFromGoogleSheet(signal);
                if (!signal.aborted) {
                    if (data && data.length > 0) {
                        console.log("[IntroSequence] Loaded script data. Total rows:", data.length);
                        setScriptData(data);
                    } else {
                        console.warn("[IntroSequence] Failed to load intro script or empty.");
                    }
                    setLoading(false);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Script load error:", error);
                    if (!signal.aborted) setLoading(false);
                }
            }
        };

        loadScript();

        // 컴포넌트 언마운트 시 요청 취소
        return () => controller.abort();
    }, []);

    // 스크립트 데이터가 로드된 후에만 currentScene 계산
    const currentScene = scriptData.find(item => item.Key === currentKey);

    useEffect(() => {
        if (!loading && scriptData.length > 0 && !currentScene && !selectionOptions.length) {
            // 키가 없는데 로딩도 끝났고 선택지도 없다면 -> 종료일 가능성이나 에러
            // console.log("No scene found for key:", currentKey);
        }
    }, [currentKey, currentScene, selectionOptions, loading, scriptData]);

    const handlePress = () => {
        // 로딩 중이거나 선택지가 나와있는 상태라면 배경 터치로 넘어가지 않음
        if (loading || selectionOptions.length > 0) return;

        // 시트 상에서 루프가 발생하거나 누락된 보정 구간 (8번은 특수하게 9번대 선택지를 강제 검색)
        if (currentKey === 'onboard_8') {
            const options = scriptData.filter(item => item.Key.startsWith('onboard_9'));
            if (options.length > 0) {
                setSelectionOptions(options);
                return;
            }
        }

        const stepNumMatch = currentKey.match(/^onboard_(\d+)$/);
        if (stepNumMatch) {
            const stepNum = parseInt(stepNumMatch[1], 10);
            // 4~19단계는 다음 단계로 수동 전이, 20단계는 인트로 종료
            if ((stepNum >= 4 && stepNum <= 19) || (stepNum >= 9 && stepNum <= 19)) {
                const nextStep = stepNum + 1;
                setCurrentKey(`onboard_${nextStep}`);
                return;
            } else if (stepNum === 20) {
                onComplete?.();
                return;
            }
        }

        if (!currentScene) {
            console.warn("[IntroSequence] handlePress: currentScene is null for key:", currentKey, ". Completing intro to prevent hang.");
            onComplete?.();
            return;
        }

        const nextSuffix = (currentScene.NextLineKey || '').toString().trim();

        if (!nextSuffix) {
            // 다음 키가 없으면 인트로 종료
            onComplete?.();
            return;
        }

        let nextFullKey = nextSuffix;
        if (!nextFullKey.startsWith('onboard_')) {
            nextFullKey = `onboard_${nextSuffix}`;
        }

        // 다음 키가 1개인지, 여러 개(선택지)인지 확인
        // 정확히 일치하는 키가 있는지 확인
        const nextSceneExact = scriptData.find(item => item.Key === nextFullKey);

        if (nextSceneExact) {
            // 정확히 일치하는 다음 장면이 있으면 이동
            setCurrentKey(nextFullKey);
        } else {
            // 일치하는 키가 없으면, 선택지인지 확인 (예: 'onboard_8' -> 'onboard_8a', 'onboard_8b')
            // 해당 키로 시작하는 모든 항목 검색
            const options = scriptData.filter(item => item.Key.startsWith(nextFullKey));

            if (options.length > 0) {
                // 선택지 모드로 전환
                setSelectionOptions(options);
            } else {
                // 정말로 없는 키라면 종료
                console.warn("[IntroSequence] Next key not found in script data:", nextFullKey, ". Completing intro.");
                onComplete?.();
            }
        }
    };

    const handleOptionSelect = (option) => {
        setSelectionOptions([]); // 선택지 모드 해제
        let nextFullKey = (option.NextLineKey || '').toString().trim();
        if (nextFullKey && !nextFullKey.startsWith('onboard_')) {
            nextFullKey = `onboard_${nextFullKey}`;
        }
        
        // 9a, 9b 어떤 것을 선택하든 9번 단계(빈화면)를 건너뛰고 10번으로 직행
        if (nextFullKey === 'onboard_9' || nextFullKey === 'onboard_9a' || nextFullKey === 'onboard_9b') {
            console.log("[IntroSequence] Option selected. Forcing transition to onboard_10");
            setCurrentKey('onboard_10');
            return;
        }

        console.log("[IntroSequence] Option selected. Transitioning to:", nextFullKey);
        setCurrentKey(nextFullKey); // 선택한 항목의 다음 키로 이동
    };

    const getBackgroundImage = () => {
        if (!currentKey) return require('../../../assets/image/dialogueImage1.png');

        const stepNumber = parseInt(currentKey.replace('onboard_', ''), 10);

        if (isNaN(stepNumber)) return require('../../../assets/image/dialogueImage1.png');

        if (stepNumber === 1) {
            return require('../../../assets/image/dialogueImage0.png');
        } else if (stepNumber >= 2 && stepNumber <= 4) {
            return require('../../../assets/image/dialogueImage1.png');
        } else if (stepNumber === 5) {
            return require('../../../assets/image/dialogueImage2.png');
        } else if (stepNumber === 6) {
            return require('../../../assets/image/dialogueImage3.png');
        } else {
            return require('../../../assets/image/dialogueImage4.png');
        }
    };

    if (loading) {
        return (
			<View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={ColorTokens.Point} />
            </View>
        );
    }

    // 중간 단계나 데이터가 없는 수동 변환 구간일 때는 텍스트 없음
    const dialogueText = ((currentKey === 'onboard_5' || currentKey === 'onboard_6') && !currentScene) 
        ? null 
        : currentScene?.Text;

    // \n이 포함되지 않은 짧은 텍스트는 작은 말풍선 이미지 사용 (공통 유틸 함수 사용)
    const isSmallDialogue = checkIsSmallDialogue(dialogueText);

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.container}>
                {/* 배경 이미지 */}
                <Image
                    source={getBackgroundImage()}
                    style={styles.backgroundImage}
                    resizeMode="contain"
                    fadeDuration={0}
                    pointerEvents="none"
                />

                {/* 선택지 화면일 경우 */}
                {selectionOptions.length > 0 ? (
                    <View style={styles.selectionContainer}>
                        {selectionOptions.map((option) => (
                            <TouchableOpacity
                                key={option.Key}
                                onPress={() => handleOptionSelect(option)}
                                activeOpacity={0.8}
                            >
                                <ImageBackground
                                    source={require("../../../assets/image/diologueSmall.png")}
                                    style={styles.selectionButtonBackground}
                                    resizeMode="stretch"
                                >
                                    <Text style={styles.selectionText}>{option.Text}</Text>
                                </ImageBackground>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    // 일반 대화 화면일 경우
                    <IntroDialogue text={dialogueText} isSmall={isSmallDialogue} />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorTokens.PureBlack, // 빈 공간은 PureBlack
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        // 이미지가 화면 비율에 맞게 줄어들거나 커지면서 전체가 다 보이도록 함 (비율 유지)
        // 가로가 꽉 차고 세로가 남으면 중앙 정렬 + 검은 배경
        // 세로가 꽉 차고 가로가 남으면 중앙 정렬 + 검은 배경
        resizeMode: 'contain',
    },
    selectionContainer: {
        position: 'absolute',
        top: '70%', // 화면 높이의 70%
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    selectionButtonBackground: {
        width: SCREEN_WIDTH - 40, // IntroDialogue와 동일한 너비
        height: 66,
        paddingVertical: 15,
        justifyContent: 'center',
        padding: 20,
        marginBottom: 20, // 버튼 간 간격 20px
    },
    selectionText: {
        color: ColorTokens.Typography,
        ...Typography.paraMedium,
        textAlign: 'left', // 텍스트 좌측 정렬
    }
});

export default IntroSequence;
