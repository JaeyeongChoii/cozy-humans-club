// 온보딩
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  StyleSheet,
} from "react-native";

// 사용자 선언 변수
import { ColorTokens } from "../../design/token/ColorTokens";
import CatMessageBox from "../CatMessageBox";
import {
  DEFAULT_OUTLINE_COLOR,
  RED_OUTLINE_COLOR,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../design/token/constantsTokens";
import { Typography } from "../../design/Typography";

// 고양이 안내 메시지들 정의
const defaultCatMessage =
  "방금 입력해준 주소로 인증번호를 보냈어.\n\n암호를 정확하게 입력해줘.";
const noCondition = "내가 보내준 암호랑 다른데...";

const CheckNumberInOnboarding = ({
  onActivationChange,
  onValidate,
  serverAuthNum,
}) => {
  // 특정 스타일 적용
  const highlightWords = {
    인증번호: {
      color: ColorTokens.Point,
    },
    "암호를 정확하게 입력해줘.": {
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

  const validateInput = (text) => {
    console.log(
      `[CheckNumberInOnboarding] 인증번호 체크 - 서버 인증번호: ${serverAuthNum}, 입력한 인증번호: ${text}`,
    );
    // serverAuthNum이 문자열로 온다고 가정하고 비교
    // (서버 응답에 따라 타입 변환이 필요할 수 있음. 일단 문자열 비교)

    let shouldActivateButton = false;

    if (String(serverAuthNum) !== text) {
      // 입력번호가 다를 경우
      setCatMessage(noCondition);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      // setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = true;
    }
    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton);

    return shouldActivateButton;
  };

  const handleInputChange = (text) => {
    setInputText(text); // 입력 텍스트 상태 업데이트

    setCatMessage(defaultCatMessage); // 입력 글자를 하나라도 지우면 원래 박스로 돌아감
    setCatInvaild(false);
    let shouldActivateButton = false;

    if (text.length === 0) {
      // 텍스트가 없는 경우
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      // setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      shouldActivateButton = true;
    }

    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton);
  };

  useEffect(() => {
    console.log("서버비번 : ", serverAuthNum);
    if (onValidate) {
      onValidate(() => validateInput(inputText));
    }
  }, [inputText, onValidate, serverAuthNum]); // dep에 serverAuthNum 추가

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.fullScreenArea}>
        <View style={styles.container}>
          {/* 글씨를 왼쪽 정렬시키기 위한 컨테이너 */}
          <View>
            <TextInput
              style={[
                styles.textInputContainer,
                { borderColor: inputOutLineColor },
              ]}
              placeholderTextColor={ColorTokens.Typography}
              value={inputText}
              onChangeText={handleInputChange}
              // 자동 대문자 방지
              autoCapitalize="none"
              // 자동 수정 방지
              autoCorrect={false}
              spellCheck={false}
              maxLength={20} // TextInput 자체에 최대 길이 제한을 두는 것이 좋습니다.
            />
          </View>
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

export default CheckNumberInOnboarding;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 레이아웃 속성
    flex: 1, // View가 화면의 모든 사용 가능한 공간을 차지함
  },
  container: {
    // 위치 조정
    top: TEXT_INPUT_TOP,
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
    paddingHorizontal: 10,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: true,
    lineHeight: undefined,
  },
});
