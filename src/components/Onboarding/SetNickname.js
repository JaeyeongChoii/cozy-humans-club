// 온보딩
import { useEffect, useState, useRef } from "react";
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
const defaultCatMessage = "이번엔, 클럽에서 불리게 될 이름을 알려줄래?";
const inputtedMessage = "호오.. 꽤나 멋진 이름인데?";
const noCondition = "텍스트, 공백, 특수문자만 입력해야해...";
const exceed20Words = "20자 이내로 입력해야 해...";

const SetNickname = ({ onActivationChange, onValidate, onDataChange }) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);
  const [catMessage, setCatMessage] = useState(defaultCatMessage);
  const [catInvaild, setCatInvaild] = useState(false);  // 조건에 맞지 않을때 찡그린 고양이 이미지 출력
  const [inputOutLineColor, setInputOutLineColor] = useState(
    DEFAULT_OUTLINE_COLOR,
  );

  // 허용된 문자 정규식 (영문, 숫자, 한글, 공백, 일부 특수문자: .!?)
  const allowedCharsRegex = /^[a-zA-Z0-9가-힣\u3131-\u3163\s.,!?:_@#-()]+$/;

  // 특정 스타일 적용
  const highlightWords = {
    ...(catMessage?.includes("이번엔") && {
      // defaultCatMessage에만 뜨도록 설정
      이름: {
        color: ColorTokens.Point,
      },
    }),
    "20자 이내": {
      color: ColorTokens.Point,
    },
    "텍스트, 공백, 특수문자": {
      color: ColorTokens.Point,
    },
  };

  const validateInput = (text) => {
    let shouldActivateButton = false;

    if (text.length > 20) {
      // 20자 초과인 경우
      setCatMessage(exceed20Words);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else if (!allowedCharsRegex.test(text)) {
      // 허용되지 않는 문자가 포함된 경우
      setCatMessage(noCondition);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      // 모든 조건 만족 (1자 이상 20자 이하, 유효한 문자)
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = true;
    }
    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton); // 잘못된 조건일시 버튼 비활성화

    return shouldActivateButton;
  };

  // 입력 텍스트가 변경될 때 호출되는 핸들러 함수
  const handleInputChange = (text) => {
    setInputText(text); // 입력 텍스트 상태 업데이트
    setCatMessage(inputtedMessage);

    // 부모 컴포넌트로 데이터 전달
    onDataChange?.("nickname", text);

    let shouldActivateButton = false;

    if (text.length === 0) {
      // 텍스트가 없는 경우
      setCatMessage(defaultCatMessage);
      setCatInvaild(false);
      setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      shouldActivateButton = true;
    }

    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton);
  };

  useEffect(() => {
    if (onValidate) {
      onValidate(() => validateInput(inputText));
    }
  }, [inputText, onValidate]);

  return (
    //키보드 외의 터치를 감지할 영역 선언
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.fullScreenArea}>
        <View style={styles.container}>
          {/* 글씨를 왼쪽 정렬시키기 위한 컨테이너 */}
          <View>
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View
                style={[
                  styles.textInputContainer,
                  {
                    borderColor: inputOutLineColor,
                  },
                ]}
              >
                <Text style={styles.prefixText}>전설이 될 이름 </Text>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholderTextColor={ColorTokens.Typography}
                  value={inputText}
                  onChangeText={handleInputChange}
                  // 자동 대문자 방지
                  autoCapitalize="none"
                  // 자동 수정 방지
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
            </TouchableWithoutFeedback>
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

export default SetNickname;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 레이아웃 속성
    flex: 1, // View가 화면의 모든 사용 가능한 공간을 차지함
  },
  container: {
    // 위치 조정
    top: TEXT_INPUT_TOP, // 해당 컴포넌트의 시작 위치
    alignItems: "center", // 세로축을 중앙에 정렬
  },
  textInputContainer: {
    // 색상 조정
    backgroundColor: ColorTokens.Dark_Brown,
    // 레이아웃 속성
    width: TEXT_INPUT_WIDTH,
    height: TEXT_INPUT_HEIGHT,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  prefixText: {
    ...Typography.paraMedium,
    color: ColorTokens.Unselected,
    includeFontPadding: true,
    lineHeight: undefined,
  },
  textInput: {
    flex: 1,
    height: TEXT_INPUT_HEIGHT,
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.paraMedium,
    paddingVertical: 0,
    margin: 0,
    textAlignVertical: "center",
    includeFontPadding: true,
    lineHeight: undefined,
  },
});
