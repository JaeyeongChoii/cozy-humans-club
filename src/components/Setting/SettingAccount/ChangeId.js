// 설정
// 아이디 변경 화면
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 사용자 정의 변수
import { heightScale } from "../../../utils/scale";
import ScreenLayout from "../../ScreenLayout";
import {
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_TEXT_COLOR,
  ID_MAX_LENGTH,
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
import Popup2Button from "../../Popup2Button";
import { postApi } from "../../../api/postApi";
import CatMessageBox from "../../CatMessageBox";
import Toast from "../../Popup/Toast";

const defaultText = "변경할 아이디를 입력해줘."
const inputtedMessage = "좋아... 이거면 너를 바로 찾을 수 있을 거야!";
const noCondition = "하단에 있는 문자만 입력 해야 해...";
const exceed20Words = "20자 이내로 입력해야 해...";
const usedId = "이미 사용중인 아이디라고 나오는데...";
const sameId = "똑같은 아이디인데..."
const networkErrorText = "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.";

// 특정 스타일 적용
const highlightWords = {
  "하단에 있는 문자": {
    color: ColorTokens.Point,
  },
  "20자 이내": {
    color: ColorTokens.Point,
  },
  "사용중인 아이디": {
    color: ColorTokens.Point,
  },
};


const ChangeId = ({ onIdChange, currentId }) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);
  const [catMessage, setCatMessage] = useState(defaultText); // 유저에게 보여지는 거절 사유 텍스트
  const [invaild, setInvaild] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);  // 연타 방지용 
  // const [inputOutlineColor, setInputOutLineColor] = useState(DEFAULT_OUTLINE_COLOR);  // 인풋창 테두리 색깔
  // const [smalltextColor, setSmalltextColor] = useState(DEFAULT_TEXT_COLOR);
  const [activeBar, setActiveBar] = useState(false);  // NextBar active 유무
  const [confirmModalVisible, setConfirmModalVisible] = useState(false); // 변경확인 모달 함수
  const [toastVisible, setToastVisible] = useState(false); // 완료 토스트 메시지 함수

  const navigation = useNavigation(); // navigation 객체 가져오기

  // 서버 호출 없이 로컬 검증
  const validateInput = (text) => {
    // 문자 유효성 검사 (영문자, 숫자, _, . 만 허용)
    const englishNumber_DotOnly = /^[a-zA-Z0-9_.]*$/;

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    console.log("validateInput: 아이디 검증 시작", { text, length: text.length });

    // 1. 문자가 20자를 넘어갈때
    if (text.length > 20) {
      console.log("validateInput: 20자 초과 오류 발생");
      setCatMessage(exceed20Words);
      setInvaild(true);
      shouldActivateButton = false;
    }
    // 2. 허용되지 않는 문자가 포함된 경우
    else if (!englishNumber_DotOnly.test(text)) {
      console.log("validateInput: 정규식(영문,숫자,_,.) 불일치 오류 발생");
      setCatMessage(noCondition);
      setInvaild(true);
      shouldActivateButton = false;
    }
    // 3. 동일한 Id인경우
    else if (text === currentId) {
      console.log("validateInput: 기존 아이디와 동일함");
      setCatMessage(sameId);
      setInvaild(true);
      shouldActivateButton = false;
    }
    // 4. 모든 조건 만족
    else {
      console.log("validateInput: 모든 검증 통과");
      setCatMessage(defaultText);
      setInvaild(false);
      shouldActivateButton = true;
    }

    setActiveBar(shouldActivateButton);
    return shouldActivateButton;
  };

  // 입력한 텍스트에 따른 NextBar 활성화
  const handleInputChange = (text) => {
    setInputText(text);
    setCatMessage(inputtedMessage)

    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    // 텍스트 길이 검사 (빈 값일 때)
    if (text.length === 0) {
      setCatMessage(defaultText);
      setInvaild(false);
      //setSmalltextColor(DEFAULT_TEXT_COLOR);
      //setInputOutLineColor(DEFAULT_OUTLINE_COLOR);
      shouldActivateButton = false;
    } else {
      shouldActivateButton = true;
    }

    setActiveBar(shouldActivateButton);
  };

  // 팝업을 모두 내리는 함수
  const modalOff = () => {
    setConfirmModalVisible(false);
  };

  // 1단계: NextBar 클릭 시 실행 (유효성 검사 및 중복 체크)
  const handlePopup = () => {
    console.log("handlePopup: NextBar 클릭, 입력값 검증 시작", { inputText });
    if (validateInput(inputText)) {
      handleComplete(inputText);
    } else {
      console.log("handlePopup: 입력값 로컬 검증 실패");
    }
  };

  // 2단계: 중복 체크 수행 및 결과에 따라 확인 모달 표시
  const handleComplete = async (idText) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("handleComplete: 중복 체크 시작", { idText });

    try {
      const duplicate = await postApi.isIdDuplicate(idText);

      if (duplicate) {
        console.log("handleComplete: 중복된 아이디임");
        setCatMessage(usedId);
        setInvaild(true);
        //setInputOutLineColor(RED_OUTLINE_COLOR);
        //setSmalltextColor(RED_OUTLINE_COLOR);
        return;
      }

      console.log("handleComplete: 중복 없음, 변경 확인 모달 표시");
      setConfirmModalVisible(true);
      setInvaild(false);
    }
    catch (error) {
      console.error("handleComplete 오류:", error);
      setCatMessage(networkErrorText);
      setInvaild(true);
      //setInputOutLineColor(RED_OUTLINE_COLOR);
      //setSmalltextColor(RED_OUTLINE_COLOR);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // 3단계: 확인 모달에서 '확정하기' 클릭 시 실제 아이디 변경 수행
  const handleFinalChange = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("handleFinalChange: 아이디 변경 요청 시작", { inputText });

    try {
      modalOff(); // 확인 모달 닫기
      const success = await changeingID(inputText);

      if (!success) {
        console.log("handleFinalChange: 변경 실패");
        setCatMessage(networkErrorText);
        setInvaild(true);
        //setInputOutLineColor(RED_OUTLINE_COLOR);
        //setSmalltextColor(RED_OUTLINE_COLOR);
        return;
      }

      console.log("handleFinalChange: 변경 성공, 토스트 메시지 출력 시작");
      setToastVisible(true);
      setInvaild(false);

      // 1.5초 후 화면 이동
      setTimeout(() => {
        console.log("handleFinalChange: 1.5초 지연 완료, 화면 이동 시도");
        handleGoAccountManager();
      }, 1500);
    }
    catch (error) {
      console.error("handleFinalChange 오류:", error);
      setCatMessage(networkErrorText);
      setInvaild(true);
      //setInputOutLineColor(RED_OUTLINE_COLOR);
      //setSmalltextColor(RED_OUTLINE_COLOR);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // 팝업 처리 함수
  const handleGoAccountManager = () => {
    console.log("handleGoAccountManager: 완료 후 화면 이동");
    // 완료되면 모든 모달 비활성화
    modalOff();
    // 변경한 id를 반영, 상위 컴포넌트로 보냄
    onIdChange(inputText);

    // AccountManagementSetting 화면으로 이동
    navigation.navigate("SettingFrame", {
      screenName: "AccountManagementSetting",
    });
  };

  // userId 변경 요청 함수
  const changeingID = async (idText) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      if (!idToken) {
        throw new Error("인증 토큰이 없습니다.");
      }

      const url = `${BASE_URL}/profile/id`;
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          change_id: idText,
        }),
      };
      console.log(`${url} request :`, JSON.stringify({
        ...options,
        headers: {
          ...options.headers,
          Authorization: "Bearer [TOKEN]",
        },
      }, null, 2));

      const response = await fetch(url, options);
      console.log(`${url} response :`, response.status);
      const text = await response.text();
      console.log(`${url} response body :`, text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(text); // { success: bool }
      return Boolean(data?.success);
    }
    catch (error) {
      console.error("changeingID API Error:", error);
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
        onPress: handlePopup,
        disabled: !activeBar,
        message: "이게 내 아이디야",
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.fullScreenArea}>
        <View style={styles.container}>
          <View style={styles.detailContainer}>
            {/* 글씨를 왼쪽 정렬시키기 위한 컨테이너 */}
            <View>
              <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
                <View
                  style={[
                    styles.textInputContainer,
                    // { borderColor: inputOutlineColor },
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
                    maxLength={ID_MAX_LENGTH} 
                  />
                </View>
              </TouchableWithoutFeedback>
              <Text style={styles.smallTextStyle
              }>
                영문자, 숫자, ( _ ), ( . ) 를 20 자 이내로
              </Text>
            </View>
          </View>
        </View>
        <CatMessageBox
          message={catMessage}
          invaild={invaild}
          highlightWords={highlightWords}
        />
        {/* 변경확인 모달 */}
        <Popup2Button
          onRequestClose={() => modalOff()}
          visible={confirmModalVisible}
          leftOnPress={() => modalOff()}
          rightOnPress={handleFinalChange}
          mainText={"지금 입력한 아이디로 변경 확정할까?"}
          leftText={"뒤로가기"}
          rightText={"확정하기"}
        />
        {/* 변경완료 토스트 */}
        <Toast
          visible={toastVisible}
          message={"변경이 완료됐어!"}
          onDismiss={() => setToastVisible(false)}
          withOverlay={true}
          highlightWords={{
            "변경이 완료됐어!": {
              color: ColorTokens.Point,
            }
          }}
        />
        </View>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
};

export default ChangeId;

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
    backgroundColor: ColorTokens.InnerBox2,
    // 레이아웃 속성
    width: TEXT_INPUT_WIDTH,
    height: TEXT_INPUT_HEIGHT,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
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
    opacity: 0.5,
  },
});
