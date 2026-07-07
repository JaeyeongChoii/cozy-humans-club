// 온보딩
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Image, StyleSheet, TouchableWithoutFeedback, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 컴포넌트 및 데이터 임포트
import IntroDialogue from "../components/Intro/IntroDialogue";
import { TutorialText } from "../components/Tutorial/TutorialText";
import { TutorialImageSet } from "../components/Tutorial/TutorialImageSet";
import HighlightText from "../components/HighlightText";

// 사용자 정의 변수
import { ColorTokens } from "../design/token/ColorTokens";
import { SCREEN_HEIGHT, SCREEN_WIDTH, widthScale } from "../utils/scale";
import { BASE_URL } from "../constants/BaseURL";
import Popup2Button from "../components/Popup2Button/index";
import { Typography } from "../design/Typography";
import { checkIsSmallDialogue } from "../utils/dialogueUtils";

const backgroundImagesByStep = [
  TutorialImageSet.CatAndDesk,
  TutorialImageSet.CatAndDesk,
  TutorialImageSet.IntoDoor1,
  TutorialImageSet.IntoDoor2,
  TutorialImageSet.IntoDoor3,
  TutorialImageSet.IntoDoor3,
];

const TutorialPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { signUpData } = route.params || {}; // OnboardingScreen에서 전달받은 데이터

  // 현재 튜토리얼 단계 (1 ~ 6)
  const [currentStep, setCurrentStep] = useState(1);

  // 계정 삭제 대기 모달 및 데이터 (2026-04-24)
  const [isDelPendingPopupVisible, setIsDelPendingPopupVisible] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingDeleteDate, setPendingDeleteDate] = useState(null); // 추가

  // [NEW] 페이지 진입 시 자동으로 회원가입/로그인 프로세스 실행 (2026-04-25)
  useEffect(() => {
    console.log("[TutorialPage] Page entered, auto-executing handleLogInPress.");
    handleLogInPress();
  }, []);

  // 현재 단계에 맞는 배경 이미지 가져오기
  const currentBackgroundIndex = Math.min(
    Math.max(currentStep - 1, 0),
    backgroundImagesByStep.length - 1,
  );

  // 배경 터치 시 다음 단계로 이동
  const handlePress = () => {
    console.log(`[TutorialPage] Current Step: ${currentStep}`);
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log("[TutorialPage] Tutorial completed. Navigating to Main/Home.");
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: "Home",
              params: { showTutorial: true },
            },
          },
        ],
      });
    }
  };

  // 현재 단계의 텍스트 데이터 찾기
  const currentScene = TutorialText.find((item) => item.id === currentStep);
  const dialogueText = currentScene?.text;

  // \n이 포함되지 않은 짧은 텍스트는 작은 말풍선 이미지 사용 (공통 유틸 함수 사용)
  const isSmallDialogue = checkIsSmallDialogue(dialogueText);

  const handleLogInPress = async () => {
    try {
      console.log("Starting Sign-Up Process...");

      // 1. 토큰 가져오기
      const accessToken = await AsyncStorage.getItem("access_token");
      const idToken = await AsyncStorage.getItem("id_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("Tokens Retrieved Values:", {
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
      });

      // 백엔드 사양에 따라 access_token이 id_token과 동일하거나 없을 수 있음
      const effectiveToken = idToken || accessToken;

      if (!effectiveToken) {
        console.error("No valid tokens found. Redirecting to login/splash.");
        return;
      }

      // 2. 데이터 조합
      // API 명세에 따른 필드 매핑
      const payload = {
        jwt_token: idToken || accessToken, // id_token -> jwt_token
        access_token: accessToken || idToken,
        refresh_token: refreshToken || null,
        email: signUpData.email,
        nickname: signUpData.nickname,
        user_id: signUpData.id,
      };

      console.log(
        "Registration Payload Prepared:",
        JSON.stringify(payload, null, 2),
      );

      // 3. 회원가입 API 호출
      // 엔드포인트: /oauth/signup (PUT)
      const signupUrl = `${BASE_URL}/oauth/signup`;
      const signupOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      console.log(
        `${signupUrl} request :`,
        JSON.stringify(signupOptions, null, 2),
      );

      const response = await fetch(signupUrl, signupOptions);

      console.log(`${signupUrl} response :`, response.status);

      const responseData = await response.json();
      console.log(
        `${signupUrl} response body :`,
        JSON.stringify(responseData, null, 2),
      );

      if (response.ok && Boolean(responseData.success)) {
        console.log(
          "[TutorialPage] Sign-up successful. Saving signup response tokens and skipping /oauth/login.",
        );
        const signupJwtToken =
          responseData.jwt_token || responseData.token || responseData.id_token;
        const signupAccessToken = responseData.access_token || signupJwtToken;
        const signupRefreshToken = responseData.refresh_token || refreshToken;

        if (signupJwtToken) {
          await AsyncStorage.setItem("id_token", signupJwtToken);
        }
        if (signupAccessToken) {
          await AsyncStorage.setItem("access_token", signupAccessToken);
        }
        if (signupRefreshToken) {
          await AsyncStorage.setItem("refresh_token", signupRefreshToken);
        }
        if (responseData.email || signUpData?.email) {
          await AsyncStorage.setItem("email", responseData.email || signUpData.email);
        }
        if (responseData.nickname || signUpData?.nickname) {
          await AsyncStorage.setItem("nickname", responseData.nickname || signUpData.nickname);
        }
        if (responseData.user_id || signUpData?.id) {
          await AsyncStorage.setItem("user_id", responseData.user_id || signUpData.id);
        }
        return;
        /*

        // 회원가입 성공 후 받은 토큰을 사용하여 로그인 API 호출
        // 2026-02-04: User requested to use the token from signup response
        // Server response key is 'token', not 'id_token' based on logs
        const signupIdToken = responseData.token || responseData.id_token;

        // 2026-04-25 BUG FIX: /oauth/login은 백엔드 앱 토큰이 아닌 '원본 OAuth ID 토큰'을 받아야 합니다.
        // 회원가입 응답에서 준 토큰(signupIdToken)은 내부 JWT이므로, 이를 /login에 보내면 백엔드가 외부 검증 중 504 에러를 낼 수 있음.
        const targetToken = idToken || accessToken || signupIdToken;

        try {
          const loginUrl = `${BASE_URL}/oauth/login`;
          const loginOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${targetToken}`,
            },
          };

          console.log(`${loginUrl} request :`, JSON.stringify(loginOptions, null, 2));

          const startTime = Date.now();
          const loginResponse = await fetch(loginUrl, loginOptions);
          const duration = Date.now() - startTime;

          console.log(`${loginUrl} response status: ${loginResponse.status} (Duration: ${duration}ms)`);

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log(
              `${loginUrl} response body :`,
              JSON.stringify(loginData, null, 2),
            );

            // 로그인 후 받은 최종 토큰 저장
            if (loginData.access_token)
              await AsyncStorage.setItem(
                "access_token",
                loginData.access_token,
              );
            if (loginData.id_token)
              await AsyncStorage.setItem("id_token", loginData.id_token);
            if (loginData.refresh_token)
              await AsyncStorage.setItem(
                "refresh_token",
                loginData.refresh_token,
              );

            console.log("Navigating to Main.");
            // [ADD] 계정 삭제 예약 여부 체크 (2026-04-24)
            if (loginData.willdelete === 1) {
              setPendingToken(loginData.id_token || targetToken);
              // 여러 가능한 필드명 체크 (deletetime 추가)
              setPendingDeleteDate(loginData.deletetime || loginData.delete_date || loginData.willdelete_at || loginData.delete_at || null);
              setIsDelPendingPopupVisible(true);
            } else {
              console.log("[TutorialPage] Login successful. Staying on TutorialPage to show intro.");
            }
          } else {
            console.error("Login after Signup Failed Status:", loginResponse.status);
            
            // [DEBUG] 실패 시 응답 바디 확인 (504 등 에러 원인 파악용)
            try {
              const errorText = await loginResponse.text();
              console.error("Login after Signup Failed Response Body:", errorText);
            } catch (e) {
              console.error("Failed to read error response body:", e);
            }

            alert(
              `가입은 완료되었으나 로그인 처리에 실패했습니다. (상태코드: ${loginResponse.status})\n앱을 재시작해보고 계속될 경우 백엔드 점검이 필요합니다.`,
            );
          }
        } catch (e) {
          console.error("Login API Network Error:", e);
          alert("로그인 요청 중 네트워크 오류가 발생했습니다.");
        }
        */
      } else {
        console.error("Sign-Up Failed:", responseData);
        // 에러 처리 (예: Toast 메시지)
        alert(`가입 실패: ${responseData.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Sign-Up Error:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  // [NEW] 계정 삭제 취소 (복구) 처리 (2026-04-24)
  const handleCancelDeletion = async () => {
    try {
      const url = `${BASE_URL}/oauth/cancel_delete`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pendingToken}`,
        },
      };

      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("계정이 성공적으로 복구되었습니다!");
          setIsDelPendingPopupVisible(false);
          navigation.navigate("Main");
        } else {
          alert("계정 복구에 실패했습니다.");
        }
      } else {
        alert("계정 복구 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("[Tutorial] handleCancelDeletion Error:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // [NEW] 삭제 대기 중 로그아웃 선택 (2026-04-24)
  const handleDeleteLogout = async () => {
    await AsyncStorage.multiRemove([
      "id_token", "access_token", "refresh_token", "auth_provider",
      "id_token_google", "id_token_apple", "id_token_discord"
    ]);
    setIsDelPendingPopupVisible(false);
    navigation.navigate("Splash");
  };

  // [NEW] 날짜 포맷팅 함수 (2025.05.30 (금) 형식)
  const formatDeletionDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; 
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekDay = weekdays[date.getDay()];
      return `${year}.${month}.${day} (${weekDay})`;
    } catch (e) {
      return dateStr;
    }
  };


  return (
    <SafeAreaView style={styles.background} edges={[]}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.container}>
          {/* 배경 이미지 */}
          {backgroundImagesByStep.map((source, index) => (
            <Image
              key={`tutorial-background-${index}`}
              source={source}
              style={[
                styles.backgroundImage,
                { opacity: index === currentBackgroundIndex ? 1 : 0 },
              ]}
              resizeMode="cover"
              fadeDuration={0}
              pointerEvents="none"
            />
          ))}
          {/* 텍스트 대화창 (text가 있을 때만 표시) */}
          <IntroDialogue text={dialogueText} isSmall={isSmallDialogue} />
        </View>
      </TouchableWithoutFeedback>

      {/* 계정 삭제 대기 안내 모달 (2026-04-24) */}
      <Popup2Button
        onRequestClose={() => setIsDelPendingPopupVisible(false)}
        visible={isDelPendingPopupVisible}
        leftOnPress={handleDeleteLogout}
        rightOnPress={handleCancelDeletion}
        mainText={"계정을 아직 복구할 수 있어!"}
        secondMainText={pendingDeleteDate ? `${formatDeletionDate(pendingDeleteDate)}에 해당 계정은 삭제됩니다.` : "조만간 해당 계정은 삭제됩니다."}
        leftText={"뒤로가기"}
        rightText={"복구하기"}
        highlightMap={{
          "계정을 아직 복구할 수 있어!": {
            color: ColorTokens.PureWhite,
          },
        }}
      />
    </SafeAreaView>
  );
};

export default TutorialPage;

const styles = StyleSheet.create({
  background: {
    backgroundColor: ColorTokens.PureBlack,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
