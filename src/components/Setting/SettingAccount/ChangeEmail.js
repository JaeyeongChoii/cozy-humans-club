// 설정
// 이메일 변경하기
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// 사용자 정의 변수
import { heightScale } from "../../../utils/scale";
import ScreenLayout from "../../ScreenLayout";
import {
  DEFAULT_OUTLINE_COLOR,
  EMAIL_MAX_LENGTH,
  NEXT_BAR_TOP,
  RED_OUTLINE_COLOR,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../../design/token/constantsTokens";
import { ColorTokens } from "../../../design/token/ColorTokens";
import { BASE_URL } from "../../../constants/BaseURL";
import { Spacing } from "../../../design/Spacing";
import { Typography } from "../../../design/Typography";
import { Radius } from "../../../design/Radius";
import CatMessageBox from "../../CatMessageBox";

const defaultMessage = "변경할 이메일을 압력해줘."
const noCondition = "지구에서 사용하는 이메일 양식과 다른데...";
const usedEmail = "이미 클럽에 가입된 이메일이라는데...";

const ChangeEmail = ({ handleEmailInput, setAuthNum }) => {
  const [inputText, setInputText] = useState("");
  const [catMessage, setCatMessage] = useState(defaultMessage);
  // const [inputOutlineColor, setInputOutLineColor] = useState(DEFAULT_OUTLINE_COLOR);
  const [activeBar, setActiveBar] = useState(false);
  const [invaild, setInvaild] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);  // 연타 방지용

  const navigation = useNavigation(); // navigation 객체 가져오기

  const validateInput = (text) => {
    // 허용된 문자 정규식 (영문, 숫자, 공백, 일부 특수문자: _ .)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    if (!emailRegex.test(text)) {
      // 허용되지 않는 문자가 포함된 경우
      setCatMessage(noCondition);
      setInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      // 모든 조건 만족 (1자 이상 20자 이하, 유효한 문자)
      setCatMessage(defaultMessage);
      setInvaild(false);
      // setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = true;
    }

    setActiveBar(shouldActivateButton);

    return shouldActivateButton;
  };

  const handleInputChange = (text) => {
    setInputText(text);

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    // 텍스트 길이 검사 (빈 값일 때)
    if (text.length === 0) {
      setCatMessage(defaultMessage);
      setInvaild(false);
      // setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      shouldActivateButton = true;
    }

    setActiveBar(shouldActivateButton);
  };

  // 변경하기 버튼 담당 함수
  const handleNextStep = async () => {
    // 버튼 연타 방지
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (validateInput(inputText)) {
        if (activeBar === true) {
          // 유저 이메일 중복 확인
          const duplicate = await isEmailDuplicate(inputText)
          if (duplicate) {
            setCatMessage(usedEmail);
            setInvaild(true);
            // setInputOutLineColor(RED_OUTLINE_COLOR);
            setInvaild(true);
            setActiveBar(false)
            return
          }

          const url = `${BASE_URL}/oauth/mail_check`;
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ mail_addr: inputText }),
          };

          // 요청 로그 출력
          console.log(`${url} request :`, JSON.stringify(options, null, 2));

          const response = await fetch(url, options);

          // 응답 상태 로그 출력
          console.log(`${url} response status :`, response.status);

          const data = await response.json();

          // 응답 데이터 로그 출력
          console.log(`${url} response body :`, JSON.stringify(data, null, 2));

          if (data.authnum) {
            // 이메일 임시 저장
            handleEmailInput(inputText);
            // 인증번호 상태 업데이트
            setAuthNum(data.authnum);
            // 인증번호 체크 화면으로 이동
            navigation.navigate("SettingFrame", {
              screenName: "CheckNumberInSetting",
            });
          } else {
            console.error("Email Verification Failed:", data.msg || "Unknown error");
            alert("인증 메일 발송에 실패했습니다. 이메일을 확인해주세요.");
          }
        }
      }
    }
    catch (error) {
      console.error("Email API Error:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
    finally {
      // 버튼 연타 방지 해제
      setIsSubmitting(false);
    }
  };

  const isEmailDuplicate = async (emailText) => {
    try {
      const url = `${BASE_URL}/oauth/duple_mail_check`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mail: emailText, }),
      }
      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      console.log(`${url} response :`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // { duple:boolean }

      return Boolean(data?.duple);
    }
    catch (error) {
      console.error("ID Check API Error:", error);
      throw error;
    }
  }

  return (
    <ScreenLayout
      hideBackButton
      contentMode="flex"
      contentStyle={styles.fullScreenArea}
      nextBarActiveColor={ColorTokens.Point2}
      nextBarProps={{
        onPress: handleNextStep,
        disabled: !activeBar,
        message: "확인하기",
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.fullScreenArea}>
        <View style={styles.container}>
          <View style={styles.detailContainer}>
            {/* 글씨를 왼쪽 정렬시키기 위한 컨테이너 */}
            <View>
              <TextInput
                style={[
                  styles.textInputContainer,
                  // { borderColor: inputOutlineColor },
                ]}
                placeholderTextColor={ColorTokens.Typography}
                value={inputText}
                onChangeText={handleInputChange}
                // 자동 대문자 방지
                autoCapitalize="none"
                // 자동 수정 방지
                autoCorrect={false}
                spellCheck={false}
                maxLength={EMAIL_MAX_LENGTH}
              />
            </View>
          </View>
        </View>
        <CatMessageBox
          message={catMessage}
          invaild={invaild}
        />
        </View>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
};

export default ChangeEmail;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 레이아웃 속성
    flex: 1, // View가 화면의 모든 사용 가능한 공간을 차지함
  },
  container: {
    //위치 조정
    top: heightScale(0),
  },
  title: {
    // 색상 조정
    color: ColorTokens.Point,
    // 폰트 조정
    ...Typography.boldLarge,
    // 위치 조정
    marginLeft: Spacing[5],
  },
  detailContainer: {
    // 위치 조정
    paddingTop: TEXT_INPUT_TOP,
    alignItems: "center", // 가로 중앙에 정렬
  },
  textInputContainer: {
    // 색상 조정
    color: ColorTokens.Typography,
    backgroundColor: ColorTokens.InnerBox2,
    // 폰트 조정
    ...Typography.paraMedium,
    lineHeight: undefined,  // 글씨가 한칸 아래에 설정되는 문제 해결
    // 레이아웃 속성
    width: TEXT_INPUT_WIDTH,
    height: TEXT_INPUT_HEIGHT,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: true,
  },
});
