// 온보딩
import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  StyleSheet,
} from "react-native";

import { ColorTokens } from "../../design/token/ColorTokens";
import CatMessageBox from "../CatMessageBox";
import {
  DEFAULT_OUTLINE_COLOR,
  ID_MAX_LENGTH,
  RED_OUTLINE_COLOR,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../design/token/constantsTokens";
import { Typography } from "../../design/Typography";
import { postApi } from "../../api/postApi";
import { Spacing } from "../../design/Spacing";

// 고양이 안내 메시지들 정의
const defaultCatMessage = "너만의 고유한 아이디를 입력해줘";
const inputtedMessage = "좋아... 이거면 너를 바로 찾을 수 있을 거야!";
const noCondition = "하단에 있는 문자만 입력 해야 해...";
const exceed20Words = "20자 이내로 입력해야해...";
const usedID = "이미 사용중인 아이디라고 나오는데...";

const SetId = ({ onActivationChange, onValidate, onDataChange }) => {
  // 특정 스타일 적용
  const highlightWords = {
    "하단에 있는 문자": {
      color: ColorTokens.Point,
    },
    "20자 이내": {
      color: ColorTokens.Point,
    },
    "고유한 아이디": {
      color: ColorTokens.Point,
    },
    "사용중인 아이디": {
      color: ColorTokens.Point,
    },
  };

  // 훅 정의
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);
  const [catMessage, setCatMessage] = useState(defaultCatMessage);
  const [catInvaild, setCatInvaild] = useState(false);  // 조건에 맞지 않을때 찡그린 고양이 이미지 출력
  const [inputOutLineColor, setInputOutLineColor] = useState(
    DEFAULT_OUTLINE_COLOR,
  );

  const validateInput = async (text) => {
    // 허용된 문자 정규식 (영문, 숫자, 공백, 일부 특수문자: _ .)
    const englishNumber_DotOnly = /^[a-zA-Z0-9_.]*$/;

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    const isIdAvailable = await handleIDCheck(text);
    // console.log("isIdAvailable  : ", isIdAvailable);

    if (text.length > 20) {
      // 20자 초과인 경우
      setCatMessage(exceed20Words);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else if (!englishNumber_DotOnly.test(text)) {
      // 허용되지 않는 문자가 포함된 경우
      setCatMessage(noCondition);
      setCatInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else if (!isIdAvailable) {
      setCatMessage(usedID);
      setCatInvaild(true);
      shouldActivateButton = false;
      console.log("중복 오류 발생");
    } else {
      // 모든 조건 만족 (1자 이상 20자 이하, 유효한 문자)
      setCatMessage(defaultCatMessage);
      setCatInvaild(false)
      setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = true;
    }

    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton); // 잘못된 조건일시 버튼 비활성화
    return shouldActivateButton;
  };

  const handleInputChange = (text) => {
    setInputText(text);
    setCatMessage(inputtedMessage);

    // 부모 컴포넌트로 데이터 전달
    onDataChange?.("id", text);

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    // 유효성 검사 로직 재정비
    if (text.length === 0) {
      // 텍스트가 없는 경우 (가장 먼저 체크)
      setCatMessage(defaultCatMessage);
      setCatInvaild(false)
      setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      // 모든 조건 만족 (1자 이상 20자 이하, 유효한 문자)
      shouldActivateButton = true;
    }

    // 버튼 활성화 상태 업데이트 (부모 컴포넌트로 전달)
    onActivationChange(shouldActivateButton);
  };

  // ID 중복 체크
  const handleIDCheck = async (idText) => {
    try {
      const isDuplicate = await postApi.isIdDuplicate(idText);

      // 로그를 남기고 싶다면 이렇게 작성할 수 있습니다.
      console.log(isDuplicate ? "handleIDCheck: 중복된 아이디임" : "handleIDCheck: 중복 없음");

      // 사용 가능 여부(중복이 아니면 true)를 리턴
      return !isDuplicate;
    } catch (error) {
      console.error("handleIDCheck 오류:", error);
      setCatMessage("네트워크 오류");
      setCatInvaild(true);
      return false; // 오류 발생 시 안전하게 사용 불가능으로 처리
    }
  };

  useEffect(() => {
    if (onValidate) {
      onValidate(() => validateInput(inputText));
    }
  }, [inputText, onValidate]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
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
                <Text style={styles.prefixText}>@</Text>
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
                  maxLength={ID_MAX_LENGTH} // TextInput 자체에 최대 길이 제한
                />
              </View>
            </TouchableWithoutFeedback>
            <Text style={styles.smallTextStyle}>
              영문자, 숫자, ( _ ), ( . ) 를 20 자 이내로
            </Text>
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

export default SetId;

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
  smallTextStyle: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 폰트 조정
    ...Typography.paraSmall,
    // 위치 조정
    margin: Spacing[3],
    // 레이아웃 속성
    opacity: 0.5,
  },
});
