// 온보딩
// 이메일 설정 단계
import { useState, useEffect } from "react";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  StyleSheet,
} from "react-native";

// 사용자 선언 변수
import { ColorTokens } from "../../design/token/ColorTokens";
import {
  DEFAULT_OUTLINE_COLOR,
  EMAIL_MAX_LENGTH,
  RED_OUTLINE_COLOR,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../design/token/constantsTokens";
import CatMessageBox from "../CatMessageBox";
import { Typography } from "../../design/Typography";
import { postApi } from "../../api/postApi";

// 고양이 안내 메시지들 정의
const defaultCatMessage =
  "지구에서 사용하시는 이메일 주소를 알려줘.\n\n급한 상황에는, 내가 이쪽으로도 연락을 줄거야.";
const noCondition = "지구에서 사용하는 이메일 양식과 다른데...";
const usedEmail = "이미 클럽에 가입된 이메일이라는데...";

const SetEmail = ({ onActivationChange, onValidate, onDataChange }) => {
  // 특정 스타일 적용
  const highlightWords = {
    "이메일 주소": {
      color: ColorTokens.Point,
    },
    "급한 상황에는, 내가 이쪽으로도 연락을 줄거야.": {
      ...Typography.paraSmall,
    },
  };

  // 훅 정의
  const [inputText, setInputText] = useState("");
  const [catMessage, setCatMessage] = useState(defaultCatMessage);
  const [catInvaild, setCatInvaild] = useState(false);  // 조건에 맞지 않을때 찡그린 고양이 이미지 출력
  const [inputOutLineColor, setInputOutLineColor] = useState(
    DEFAULT_OUTLINE_COLOR,
  );

  const validateInput = async (text) => {
    // 허용된 문자 정규식 (영문, 숫자, 공백, 일부 특수문자: _ .)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화
    const isEmailAvailable = await handleEmailCheck(text);
    // console.log("isEmailAvailable : ", isEmailAvailable);

    if (!emailRegex.test(text)) {
      // 허용되지 않는 문자가 포함된 경우
      setCatMessage(noCondition);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else if (!isEmailAvailable) {
      setCatMessage(usedEmail);
      setCatInvaild(true);
      shouldActivateButton = false;
    } else {
      // 모든 조건 만족 (1자 이상 20자 이하, 유효한 문자)
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      // setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = true;
    }

    // 상위 컴포넌트에 최종 유효성 상태를 전달
    onActivationChange(shouldActivateButton); // 잘못된 조건일시 버튼 비활성화

    return shouldActivateButton;
  };

  // Email 중복 체크
  const handleEmailCheck = async (text) => {
    try {
      const isDuplicate = await postApi.isEmailDuplicate(text);

      // 사용 가능 여부(중복이 아니면 true)를 리턴
      return !isDuplicate;
    } catch (error) {
      console.error("handleEmailCheck 오류:", error);
      setCatMessage("네트워크 오류");
      setCatInvaild(true);
      return false; // 오류 발생 시 안전하게 사용 불가능으로 처리
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);

    // 부모 컴포넌트로 데이터 전달
    onDataChange?.("email", text);

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    // 텍스트 길이 검사 (빈 값일 때)
    if (text.length === 0) {
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      shouldActivateButton = true;
    }

    // 상위 컴포넌트에 최종 유효성 상태를 전달
    onActivationChange(shouldActivateButton);
  };

  useEffect(() => {
    if (onValidate) {
      onValidate(() => validateInput(inputText));
    }
  }, [inputText, onValidate]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.fullScreenArea}>
        <View style={styles.container}>
          <TextInput
            style={[
              styles.textInputContainer,
              {
                borderColor: inputOutLineColor,
              },
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

        {/* 고양이 안내문구 */}
        <CatMessageBox
          message={catMessage}
          highlightWords={highlightWords}
          invaild={catInvaild}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SetEmail;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 레이아웃 속성
    flex: 1, // View가 화면의 모든 사용 가능한 공간을 차지함
  },
  container: {
    // 위치 조정
    paddingTop: TEXT_INPUT_TOP,
    alignItems: "center",
  },
  textInputContainer: {
    // 색상 조정
    color: ColorTokens.Typography,
    backgroundColor: ColorTokens.Dark_Brown,
    // 폰트 조정
    ...Typography.paraMedium,
    // 레이아웃 속성
    width: TEXT_INPUT_WIDTH,
    height: TEXT_INPUT_HEIGHT,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: true,
    lineHeight: undefined,
    paddingHorizontal: 15,
  },
});
