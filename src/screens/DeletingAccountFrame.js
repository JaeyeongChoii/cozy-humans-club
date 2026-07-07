// 설정
// 계정삭제 화면의 틀을 제공
import React, { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
// 컴포넌트
import IntroDeletingAccount from "../components/Setting/SettingAccount/DeletingAccount/IntroDeletingAccount.js";
import CheckDeleteReason from "../components/Setting/SettingAccount/DeletingAccount/CheckDeleteReason.js";
import WritingDetailReason from "../components/Setting/SettingAccount/DeletingAccount/WritingDetailReason.js";
import DeletingOfTermsAndConditions from "../components/Setting/SettingAccount/DeletingAccount/DeletingOfTermsAndConditions.js";
import OutroDeletingAccount from "../components/Setting/SettingAccount/DeletingAccount/OutroDeletingAccount.js";
import { ColorTokens } from "../design/token/ColorTokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/BaseURL";

// 단계 순서 정의
const deletingSteps = [
    "IntroDeletingAccount",
    "CheckDeleteReason",
    "WritingDetailReason",
    "DeletingOfTermsAndConditions",
    "OutroDeletingAccount",
];

const deleteReasonStepIndex = deletingSteps.indexOf("CheckDeleteReason");

const stepComponents = {
    IntroDeletingAccount,
    CheckDeleteReason,
    WritingDetailReason,
    DeletingOfTermsAndConditions,
    OutroDeletingAccount,
};

const DeletingAccountFrame = () => {
    const navigation = useNavigation();
    const route = useRoute();
    // 추가: BASE_URL, AsyncStorage import 필요 (상단에 이미 없으면 추가해야 함, 여기서는 파일 상단에 추가한다고 가정하고 로직만 작성)
    // 실제로는 파일 상단에 import문을 추가해줘야 함. 이 도구는 단일 블록 교체이므로 imports도 포함해서 교체하거나 별도 요청 필요.
    // 여기서는 handleNextStep과 handlePreviousStep 사이 혹은 컴포넌트 내부에 함수를 추가.

    const initialStepIndex = route.params?.screenName
        ? deletingSteps.indexOf(route.params.screenName)
        : 0;
    const [currentStepIndex, setCurrentStepIndex] = useState(
        initialStepIndex >= 0 ? initialStepIndex : 0
    );

    // 각 하위 컴포넌트가 자신의 유효성 상태를 전달
    const CurrentSettingComponent =
        stepComponents[deletingSteps[currentStepIndex]];

    const resetToSplash = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Splash" }],
            })
        );
    };

    // 이전 화면으로 돌아가는 함수
    const handlePreviousStep = () => {
        if (currentStepIndex > deleteReasonStepIndex) {
            setCurrentStepIndex(deleteReasonStepIndex);
        } else if (currentStepIndex === deleteReasonStepIndex) {
            navigation.goBack();
        } else if (currentStepIndex > 0) {
            setCurrentStepIndex(deleteReasonStepIndex);
        } else {
            navigation.goBack();
        }
    };

    // 계정 삭제 API 호출 및 처리
    // API 명세: DELETE /oauth/account
    // req.header.authorization: Bearer jwt
    // res: { success: bool }
    const handleDeleteAccount = async () => {
        try {
            // <RULE[p-test.md]> 프로젝트 전체가 id_token 사용 (postApi.js 패턴과 일치)
            const idToken = await AsyncStorage.getItem("id_token");
            console.log("[DeletingAccount] 계정 삭제 시작. 토큰 존재:", !!idToken);

            if (!idToken) {
                console.error("[DeletingAccount] id_token이 없습니다. 로그인 상태를 확인해 주세요.");
                alert("로그인 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
                resetToSplash();
                return;
            }

            const url = `${BASE_URL}/oauth/account`;
            console.log(`[DeletingAccount] DELETE 요청: ${url}`);

            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            console.log(`[DeletingAccount] 응답 상태: ${response.status}`);

            // <RULE[p-test.md]> response.ok 체크 추가 (네트워크/서버 에러 시 크래시 방지)
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[DeletingAccount] 서버 에러 (${response.status}):`, errorText);
                // 백엔드 측 문제일 가능성이 높으므로 프론트에서 억지로 수정하지 않음
                alert(`계정 삭제에 실패했습니다. (${response.status})`);
                return;
            }

            const data = await response.json();
            console.log("[DeletingAccount] 응답 데이터:", JSON.stringify(data));

            if (data.success) {
                console.log("[DeletingAccount] 계정 삭제 성공. 토큰 정리 시작.");
                // 모든 인증 관련 토큰 삭제
                await AsyncStorage.removeItem("id_token");
                await AsyncStorage.removeItem("access_token");
                await AsyncStorage.removeItem("refresh_token");
                await AsyncStorage.removeItem("id_token_google");
                await AsyncStorage.removeItem("id_token_apple");
                await AsyncStorage.removeItem("id_token_discord");
                await AsyncStorage.removeItem("auth_provider");
                await AsyncStorage.removeItem("user_id");
                console.log("[DeletingAccount] 토큰 정리 완료. Splash로 이동.");

                // 스플래시로 이동
                resetToSplash();
            } else {
                // <RULE[p-test.md]> 백엔드가 success: false를 반환한 경우
                console.error("[DeletingAccount] 서버가 삭제 실패 응답:", data);
                alert("계정 삭제에 실패했습니다. 다시 시도해주세요.");
            }

        } catch (error) {
            console.error("[DeletingAccount] 계정 삭제 중 예외 발생:", error);
            // <RULE[p-test.md]> 오류 원인 분석
            if (error.message?.includes("Network request failed")) {
                console.warn("[DeletingAccount] 네트워크 연결 상태를 확인해 주세요.");
                alert("네트워크 연결을 확인해 주세요.");
            } else {
                alert("오류가 발생했습니다. 다시 시도해주세요.");
            }
        }
    };

    // 다음 화면으로 진행하는 함수
    const handleNextStep = () => {
        if (currentStepIndex < deletingSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // 마지막 단계: 계정 삭제 실행
            handleDeleteAccount();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            {/* 내용 영역 - 각 단계 컴포넌트가 UI(Header, Content, Footer)를 모두 포함 */}
            <View style={styles.conponentContainer}>
                {CurrentSettingComponent ? (
                    <CurrentSettingComponent
                        navigation={navigation}
                        onNextStep={handleNextStep}
                        onPreviousStep={handlePreviousStep}
                    />
                ) : (
                    <Text style={styles.errorText}>
                        선택된 설정 화면을 찾을 수 없습니다.
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
};

export default DeletingAccountFrame;

const styles = StyleSheet.create({
    container: {
        // 색상 조정
        backgroundColor: ColorTokens.Background2,
        // 레이아웃 속성
        flex: 1,
    },
    conponentContainer: {
        // 레이아웃 속성
        flex: 1,
        alignSelf: "stretch",
    },
    errorText: {
        // 색상 조정
        color: ColorTokens.Typography,
        // 폰트 조정
        fontSize: 18,
        // 위치 조정
        textAlign: "center",
        marginTop: 50,
    },
});
