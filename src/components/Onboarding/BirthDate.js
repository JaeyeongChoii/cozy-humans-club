import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { ColorTokens } from "../../design/token/ColorTokens";
import CatMessageBox from "../CatMessageBox";
import { heightScale, SCREEN_HEIGHT } from "../../utils/scale";
import DeepTalkPicker from "../DeeptalkPicker";
import { BASE_URL } from "../../constants/BaseURL";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import { TEXT_INPUT_TOP } from "../../design/token/constantsTokens";

const currentCatMessage =
  "이제 본격적으로 가입을 시작해보자.\n너가 세상에 태어난 날짜를 알려줄래?";
const less14Message = "14세 미만의 인간은 아직 클럽 가입이 어려워...";

export default function BirthDate({
  onActivationChange,
  onValidate,
  onDataChange,
  onOverlayVisibilityChange,
}) {
  const highlightWords = {
    "14세 미만": { color: ColorTokens.Point },
  };

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [displayDateText, setDisplayDateText] = useState("");
  const [isValidAge, setIsValidAge] = useState(true); // 초기값은 true로 설정하거나, 검증 전 상태를 관리해야 함. 여기서는 15세(유효)가 초기값이므로 true.

  const [birth, setBirth] = useState({ year: 2025, month: 1, day: 1 });

  // 부모에서 validate 받는 구조 유지
  useEffect(() => {
    if (onValidate) onValidate(() => true);
  }, [onValidate]);

  useEffect(() => {
    onOverlayVisibilityChange?.(isPickerVisible);
  }, [isPickerVisible, onOverlayVisibilityChange]);

  // 서버 통신을 통한 나이 확인
  const checkAgeWithServer = async (year, month, day) => {
    try {
      // YYYY-MM-DD 형식으로 변환
      const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const reqData = { birthdate: formattedDate };
      const url = `${BASE_URL}/oauth/check_age`;
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqData),
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);

      const resData = await response.json();
      console.log(`${url} response body :`, JSON.stringify(resData, null, 2));

      // checkage가 true이면 14세 이상
      const isAllowed = resData.checkage;
      setIsValidAge(isAllowed);

      // 부모 컴포넌트에 활성화 상태 전달
      // isAllowed가 true면 활성화, false면 비활성화
      onActivationChange?.(isAllowed);
    } catch (error) {
      console.error("Age Check API Error:", error);
      // 에러 발생 시 일단 진행을 막거나 허용하는 정책 필요.
      // 여기서는 안전하게 false로 처리하거나 사용자에게 알림 필요.
      setIsValidAge(false);
      onActivationChange?.(false);
    }
  };

  const handleConfirm = (year, month, day) => {
    setBirth({ year, month, day });
    setDisplayDateText(`${year}년 ${month}월 ${day}일`);
    setIsPickerVisible(false);

    // 부모 컴포넌트로 데이터 전달
    onDataChange?.("birth", { year, month, day });

    // 서버로 나이 확인 요청
    checkAgeWithServer(year, month, day);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.dateContainer}
          onPress={() => setIsPickerVisible(true)}
        >
          <Text style={styles.selectedDateText}>
            {displayDateText || "생년월일을 선택하세요"}
          </Text>
        </TouchableOpacity>
      </View>

      <CatMessageBox
        message={isValidAge ? currentCatMessage : less14Message}
        highlightWords={highlightWords}
        invaild={!isValidAge}
      />

      <DeepTalkPicker
        visible={isPickerVisible}
        initialFirst={birth.year}
        initialSecond={birth.month}
        initialThird={birth.day - 1}
        initialFirstText={"년"}
        initialSecondText={"월"}
        initialThirdText={"일"}
        message="확인"
        onClose={() => setIsPickerVisible(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[5],
    top: TEXT_INPUT_TOP,
  },
  dateContainer: {
    backgroundColor: ColorTokens.Dark_Brown,
    justifyContent: "center",
    alignItems: "center",
    width: 360,
    height: 45,
    borderRadius: 10,
  },
  selectedDateText: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
});
