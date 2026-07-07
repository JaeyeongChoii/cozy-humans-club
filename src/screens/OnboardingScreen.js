// 온보딩
// 온보딩용 컴포넌트가 오는 스크린, 화면 중앙에 컴포넌트들이 들어감
import { useState, useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

//컴포넌트
import ShowClubRule from "../components/Onboarding/ShowClubRule";
import CheckList from "../components/Onboarding/CheckList";
import BirthDate from "../components/Onboarding/BirthDate";
import SetNickname from "../components/Onboarding/SetNickname";
import SetId from "../components/Onboarding/SetId";
import SetEmail from "../components/Onboarding/SetEmail";
import CheckNumberInOnboarding from "../components/Onboarding/CheckNumberInOnboarding";

// 사용자 선언 변수
import { ColorTokens } from "../design/token/ColorTokens";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../utils/scale";
import ScreenLayout from "../components/ScreenLayout";

// 온보딩 단계 순서 정의
const onboardingSteps = [
  "ShowClubRule",
  "CheckList",
  "BirthDate",
  "SetNickname",
  "SetId",
  "SetEmail",
  "CheckNumberInOnboarding",
];

// 단계 이름에 따른 컴포넌트 매핑
const stepComponents = {
  ShowClubRule,
  CheckList,
  BirthDate,
  SetNickname,
  SetId,
  SetEmail,
  CheckNumberInOnboarding,
};

// nextBar에서 쓰이는 문구들
const stepMessages = {
  ShowClubRule: "다음으로",
  CheckList: "확인했어요",
  BirthDate: "저는 이 날 태어났어요",
  SetNickname: "나를 이렇게 불러줘",
  SetId: "이게 내 아이디야",
  SetEmail: "확인하기",
  CheckNumberInOnboarding: "확인하기",
};

import { BASE_URL } from "../constants/BaseURL";

const OnboardingScreen = () => {
  const navigation = useNavigation(); // navigation 객체 가져오기
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 현재 온보딩 단계 인덱스 상태 관리
  const [activating, setActivating] = useState(false); //버튼 활성화 상태 관리
  // 기본값으로 항상 true를 반환하는 함수를 주어 초기 에러 방지
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [currentStepValidator, setCurrentStepValidator] = useState(
    () => () => true
  );

  // 서버로부터 받은 인증번호 저장
  const [authNum, setAuthNum] = useState("");

  // 모든 단계의 데이터를 수집하는 상태
  const [signUpData, setSignUpData] = useState({
    nickname: "",
    id: "",
    email: "",
    birth: { year: 2025, month: 1, day: 1 },
  });

  // 하위 컴포넌트에서 데이터 변경 시 호출
  const handleDataChange = useCallback((key, value) => {
    setSignUpData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 현재 단계에 해당하는 컴포넌트 가져오기
  const currentStep = onboardingSteps[currentStepIndex];
  const CurrentStepComponent =
    stepComponents[currentStep];
  const isClubRuleStep = currentStep === "ShowClubRule";

  useEffect(() => {
    setIsOverlayVisible(false);
  }, [currentStep]);

  // useCallback을 사용하여 함수가 불필요하게 재생성되는 것을 방지
  const handleValidateFromChild = useCallback((validatorFunc) => {
    setCurrentStepValidator(() => validatorFunc);
  }, []);

  // 다음으로 넘어가는 함수
  const handleNextStep = async () => {
    const isFinallyValid = await currentStepValidator(); // 저장된 함수 호출

    if (isFinallyValid) {
      // SetEmail 단계에서 다음으로 넘어갈 때, 인증 비번 호출
      if (onboardingSteps[currentStepIndex] === "SetEmail") {
        try {
          const url = `${BASE_URL}/oauth/mail_check`;
          const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mail_addr: signUpData.email }),
          };

          // console.log(`${url} request :`, JSON.stringify(options, null, 2));

          const response = await fetch(url, options);

          console.log(`${url} response :`, response.status);

          const data = await response.json();
          console.log(`${url} response body :`, JSON.stringify(data, null, 2));

          if (data.authnum) {
            setAuthNum(data.authnum);
            // 성공하면 다음 단계(인증번호 입력)로 진행
            setCurrentStepIndex(prev => prev + 1);
            setActivating(false);
          } else {
            setActivating(false);
          }
        } catch (error) {
          console.error("Email API Error:", error);
          alert("서버 통신 중 오류가 발생했습니다.");
          return; // 진행 중단
        }
      }
      else if (currentStepIndex < onboardingSteps.length - 1) {
        // 다음 단계로 인덱스 증가
        setCurrentStepIndex(currentStepIndex + 1);
        // activating 초기화
        setActivating(false);
      } else {
        // 마지막 단계 완료 시, TutorialPage로 넘어감 (데이터 전달)
        navigation.navigate("TutorialPage", { signUpData });
      }
    }
  };

  // '뒤로가기' 버튼 클릭 시 호출될 함수
  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      // 이전 단계로 인덱스 감소
      setCurrentStepIndex(currentStepIndex - 1);
      setActivating(false);
    } else {
      // 첫 번째 단계에서 뒤로가기 시, 이전 Stack 화면 (Splash)으로 이동
      navigation.goBack();
    }
  };

  return (
    <ScreenLayout
      onBack={handlePreviousStep}
      hideBackButton={currentStepIndex < 1}
      showNextBar={!isClubRuleStep && !isOverlayVisible}
      nextBarActiveColor={ColorTokens.Point2}
      nextBarProps={{
        onPress: handleNextStep,
        disabled: !activating,
        message: stepMessages[currentStep],
      }}
      contentMode="fullScreen"
      contentStyle={styles.conponentContainer}
      dismissKeyboardOnPress={!isClubRuleStep && !isOverlayVisible}
    >
      <>
        {CurrentStepComponent && ( // CurrentStepComponent가 정의되었는지 확인 후 렌더링
          <CurrentStepComponent
            onOverlayVisibilityChange={setIsOverlayVisible}
            navigation={navigation} // 필요하다면 navigation prop도 전달
            onActivationChange={setActivating} // 자식 컴포넌트가 activating 상태 변경가능
            onValidate={handleValidateFromChild}
            onDataChange={handleDataChange} // 데이터 변경 핸들러 전달
            serverAuthNum={authNum} // 서버에서 받은 인증번호 전달
            signUpData={signUpData} // 전체 데이터 전달 (닉네임 등 참조용)
            embeddedNextBar={
              isClubRuleStep
                ? {
                  onPress: handleNextStep,
                  activeColor: ColorTokens.Point2,
                  disabled: !activating,
                  message: stepMessages[currentStep],
                }
                : undefined
            }
          />
        )}
      </>
    </ScreenLayout>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  conponentContainer: {
    // 위치 조정
    position: "absolute", // 컴포넌트들의 시작 패딩은 각자 정함
    // 레이아웃 속성
    width: SCREEN_WIDTH, // 전 범위를 감싸도록 확대
    height: SCREEN_HEIGHT, // 전 범위를 감싸도록 확대
  },
});
