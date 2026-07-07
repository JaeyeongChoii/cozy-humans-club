// 설정
// 변경하려는 이메일을 검증하는 단계
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
  RED_OUTLINE_COLOR,
  TEXT_INPUT_HEIGHT,
  TEXT_INPUT_TOP,
  TEXT_INPUT_WIDTH,
} from "../../../design/token/constantsTokens";
import { ColorTokens } from "../../../design/token/ColorTokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../../constants/BaseURL";
import { Typography } from "../../../design/Typography";
import { Spacing } from "../../../design/Spacing";
import { Radius } from "../../../design/Radius";
import CatMessageBox from "../../CatMessageBox";
import Toast from "../../Popup/Toast";

const defaultMessage = "방금 입력해준 주소로 인증번호를 보냈어.\n\n암호를 정확하게 입력해줘."
const noCondition = "내가 보내준 암호와 다른데...";
const networkErrorText = "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.";

const CheckNumberInSetting = ({ serverAuthNum, tempEmail }) => {
  const navigation = useNavigation(); // navigation 객체 가져오기

  const [inputText, setInputText] = useState("");
  const [catMessage, setCatMessage] = useState(defaultMessage);
  // const [inputOutlineColor, setInputOutLineColor] = useState(DEFAULT_OUTLINE_COLOR);
  const [isSubmitting, setIsSubmitting] = useState(false);  // 연타 방지용 
  const [activeBar, setActiveBar] = useState(false);
  const [invaild, setInvaild] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const validateInput = (text) => {
    let shouldActivateButton = false; // 기본적으로 버튼은 비활성화

    if (String(serverAuthNum) !== text) {
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
  const handlePopup = () => {
    console.log("handlePopup: 인증번호 확인 시도", { inputText, activeBar });
    // 조건에 맞는경우 모달 생성
    if (validateInput(inputText)) {
      if (activeBar === true) {
        console.log("handlePopup: 검증 성공, 이메일 변경 프로세스 시작");
        handleComplete();
      }
    } else {
      console.log("handlePopup: 인증번호 검증 실패");
    }
  };

  // 변경하기 클릭한 경우 Email을 서버에게 변경 요청 수행
  const handleComplete = async () => {
    // 버튼 연타 방지
    if (isSubmitting) {
      console.log("handleComplete: 이미 제출 중입니다.");
      return;
    }
    setIsSubmitting(true);
    console.log("handleComplete: 이메일 변경 요청 시작", { tempEmail });

    try {
      // 이메일 변경
      const success = await changeingEmail(tempEmail);

      // 오류시 변경 거부
      if (!success) {
        console.log("handleComplete: 이메일 변경 실패 (API 반환값 false)");
        setCatMessage(networkErrorText);
        setInvaild(true);
        // setInputOutLineColor(RED_OUTLINE_COLOR);
        return;
      }

      console.log("handleComplete: 이메일 변경 성공, 완료 모달 표시");

      // 변경 완료 토스트 메세지 출력
      console.log("handleComplete: 이메일 변경 성공, 토스트 메시지 출력 시작");
      setToastVisible(true);

      // 토스트 메시지를 3초 동안 보여준 후 화면 이동
      setTimeout(() => {
        console.log("handleComplete: 1.5초 지연 완료, 화면 이동 시도");
        navigation.navigate("SettingFrame", {
          screenName: "AccountManagementSetting",
        });
      }, 1500);
    }
    catch (error) {
      console.error("handleComplete: 이메일 변경 중 예외 발생", error);
      setCatMessage(networkErrorText);
      setInvaild(true);
      // setInputOutLineColor(RED_OUTLINE_COLOR);
    }
    finally {
      // 버튼 연타 방지 해제
      setIsSubmitting(false);
    }
  };

  // 이메일 변경 요청 함수
  const changeingEmail = async (tempEmail) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      if (!idToken) return;
      console.log("Checking Auto Login with token:", idToken);

      const url = `${BASE_URL}/profile/mail`;
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          mail: tempEmail,
        }),
      };
      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      const text = await response.text();
      console.log(`${url} response body:`, text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(text); // { success:bool, msg: string }
      return Boolean(data?.success);
    }
    catch (error) {
      console.error("changeingEmail API Error:", error);
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
                maxLength={20}
              />
            </View>
          </View>
        </View>
        <CatMessageBox
          message={catMessage}
          highlightWords={{
            인증번호: {
              color: ColorTokens.Point,
            },
            "암호를 정확하게 입력해줘.": {
              ...Typography.paraSmall,
            },
          }}
          invaild={invaild}
        />
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

export default CheckNumberInSetting;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 레이아웃 속성
    flex: 1, // View가 화면의 모든 사용 가능한 공간을 차지함
  },
  container: {
    //위치 조정
    top: heightScale(0),
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
