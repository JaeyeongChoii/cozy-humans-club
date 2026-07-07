// 설정
// 설정용 컴포넌트가 오는 스크린
import React, { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

// 컴포넌트
import AccountManagementSetting from "../components/Setting/SettingAccount/AccountManagementSetting.js";
import BlockedListSetting from "../components/Setting/BlockedListSetting.js";
import HelpSetting from "../components/Setting/HelpSetting.js";
import MoreSetting from "../components/Setting/MoreSetting.js";
import NotificationSetting from "../components/Setting/NotificationSetting.js";
import ChangeEmail from "../components/Setting/SettingAccount/ChangeEmail.js";
import CheckNumberInSetting from "../components/Setting/SettingAccount/CheckNumberInSetting.js";
import ChangeId from "../components/Setting/SettingAccount/ChangeId.js";
import SettingDetailView from "../components/Setting/SettingDetailView.js";
import ClubRule from "../components/Setting/ClubRule.js";

// 사용자 정의 변수
import BackButton from "../components/BackButton/index.js";
import { ColorTokens } from "../design/token/ColorTokens";

const stepComponents = {
  AccountManagementSetting,
  NotificationSetting,
  BlockedListSetting,
  HelpSetting,
  MoreSetting,
  ChangeEmail,
  CheckNumberInSetting,
  ChangeId,
  SettingDetailView,
  ClubRule,
};

const SettingFrame = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // navigation을 위한 스크린 이름
  const { screenName, currentId: paramId } = route.params || {};
  const CurrentSettingComponent = stepComponents[screenName];

  // 회원 정보 변경 훅
  const [currentEmail, setCurrentEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [authNum, setAuthNum] = useState(""); // 인증번호 상태 추가
  const [currentId, setCurrentId] = useState(paramId || "");

  // 파라미터가 변경되면 상태 업데이트 (화면 전환 시 데이터 동기화)
  React.useEffect(() => {
    if (paramId) {
      setCurrentId(paramId);
    }
  }, [paramId]);

  // 뒤로 가기
  const handlePreviousStep = () => {
    navigation.goBack();
  };

  // 하위 컴포넌트에서 변경할 이메일을 임시 저장하는 함수
  const handleEmailInput = (newEmail) => {
    setTempEmail(newEmail);
  };

  // 하위 컴포넌트에서 id를 변경하는 함수
  const handleIdChange = (newId) => {
    setCurrentId(newId);
  };

  return (
    <SafeAreaView style={styles.fullScreenArea} edges={[]}>
      {/* 뒤로가기 버튼 */}
      <BackButton disabled={CurrentSettingComponent.name === "HelpSetting"} onPress={handlePreviousStep} />
      {/* 내용 영역 */}
      <View style={styles.container}>
        {CurrentSettingComponent ? (
          <CurrentSettingComponent
            navigation={navigation}
            // AccountManagementSetting에 전달되는 prop들            
            currentEmail={currentEmail}
            currentId={currentId}
            // ChangeEmail에 전달됨
            handleEmailInput={handleEmailInput} // 임시 이메일 설정
            setAuthNum={setAuthNum} // 인증번호 설정 함수 전달
            // CheckNumberInSetting에 전달됨
            serverAuthNum={authNum} // 서버 인증번호 전달
            tempEmail={tempEmail} // 임시 이메일 전달
            // ChangeId에 전달됨
            onIdChange={handleIdChange}
          />
        ) : (
          <Text style={styles.errorText}>
            선택된 설정 화면을 찾을 수 없습니다.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SettingFrame;

const styles = StyleSheet.create({
  fullScreenArea: {
    flex: 1,
    backgroundColor: ColorTokens.Background2,
  },
  container: {
    // 레이아웃 속성
    flex: 1,
    alignSelf: "stretch",
  },
  errorText: {
    color: ColorTokens.Typography,
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
});
