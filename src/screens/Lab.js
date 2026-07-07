import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ColorTokens } from "../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH } from "../utils/scale";
import { SafeAreaView } from "react-native-safe-area-context";
import Popup2Button from "../components/Popup2Button";
import PopupOneButton from "../components/PopupOneButton";
import PopupPasswordButton from "../components/PopupPasswordButton";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";
import { Radius } from "../design/Radius";

const Lab = () => {
  const navigation = useNavigation();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [modalTwoButtonlVisible, setModalTwoButtonlVisible] = useState(false);  // 가입 권유 모달
  const [modalOneButtonlVisible, setModalOneButtonlVisible] = useState(false);  // 가입 안내 모달
  const [modalAlertlVisible, setModalAlertVisible] = useState(false);  // 알림 받기 모달

  const handlePasswordPress = () => {
    setPasswordModalVisible(false);
    setModalTwoButtonlVisible(true);
  };

  const handleRegisterPress = () => {
    setModalTwoButtonlVisible(false);
    setModalOneButtonlVisible(true);
  }

  const handleConfirmPress = () => {
    console.log("[Lab] Confirm button pressed. Navigating to Splash with passwordEntered=true");
    setModalOneButtonlVisible(false);
    navigation.navigate("Splash", { passwordEntered: true }); // 올바른 암호를 입력하면 이동
  }

  return (
    <SafeAreaView style={styles.background}>
      {/* 로고 */}
      <Image
        style={styles.logo}
        source={require("../../tokenImage/titleBanner.png")}
      />
      {/* 부제 */}
      <Text style={styles.miniLogo}>
        안전하고 아늑한 이야기 소굴
      </Text>
      {/* 인원 관련 텍스트 */}
      <Text style={styles.userUnacceptedText}>
        현재 입장문이 닫혀 있어..
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => setPasswordModalVisible(true)}>
          <Image source={require("../../tokenImage/letterButton.png")} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalAlertVisible(true)}>
          <Image source={require("../../tokenImage/openAlertButoon.png")} />
        </TouchableOpacity>
      </View>
      <View style={styles.loginContainer}>
        {/* iOS일 때만 Apple 로그인 버튼 표시 */}
        {Platform.OS === "ios" && (
          <TouchableOpacity>
            <Image
              source={require("../../assets/button/loginBar_IOS.png")}
              style={styles.loginBar}
            />
          </TouchableOpacity>
        )}

        {/* Google 로그인 버튼 */}
        <TouchableOpacity>
          <Image
            source={require("../../assets/button/loginBar_Google.png")}
            style={[
              styles.loginBar,
              Platform.OS === "ios" && { marginTop: 8 },
            ]}
          />
        </TouchableOpacity>

        {/* Discord 로그인 버튼 */}
        <TouchableOpacity>
          <Image
            source={require("../../assets/button/loginBar_Discord.png")}
            style={[styles.loginBar, { marginTop: 8 }]}
          />
        </TouchableOpacity>
      </View>
      {/* 패스워드 입력 모달 */}
      <PopupPasswordButton
        onRequestClose={() => setPasswordModalVisible(false)}
        leftOnPress={() => setPasswordModalVisible(false)}
        rightOnPress={handlePasswordPress}
        visible={passwordModalVisible}
        mainText={"암호를 입력해 주세요"}
        leftText={"뒤로가기"}
        rightText={"확인하기"}
        correctPassword={"달콤한고양이"}
      />
      {/* 가입 권유 모달 */}
      <Popup2Button
        onRequestClose={() => setModalTwoButtonlVisible(false)}
        visible={modalTwoButtonlVisible}
        leftOnPress={() => setModalTwoButtonlVisible(false)}
        rightOnPress={handleRegisterPress}
        mainText={"비밀 암호 확인되었어...\n바로 클럽에 가입할거야?"}
        secondMainText={"*주의*[가입하기]를 선택하면 비밀 암호는 사용돼"}
        leftText={"나중에 하기"}
        rightText={"가입하기"}
        highlightMap={{
          "*주의*[가입하기]를 선택하면": {
            ...Typography.paraXSmall,
          },
          "비밀 암호는 사용돼": {
            ...Typography.paraXSmall,
            color: ColorTokens.Warning,
          },
          "비밀 암호 확인되었어...\n바로 클럽에 가입할거야?": {
            ...Typography.boldMedium,
            color: ColorTokens.Point
          },
        }}
      />
      {/* 알림 받기 모달 */}
      <Popup2Button
        onRequestClose={() => setModalAlertVisible(false)}
        visible={modalAlertlVisible}
        leftOnPress={() => setModalAlertVisible(false)}
        rightOnPress={() => setModalAlertVisible(false)} // Todo : 알림관련은 비어있음
        mainText={"현재 공식적인 입장문은 닫혀있어."}
        secondMainText={"입장문이 열리면 알려줄까?"}
        leftText={"뒤로가기"}
        rightText={"응, 좋아"}
        highlightMap={{
          "현재 공식적인 입장문은 닫혀있어.": {
            ...Typography.paraMedium,
          },
          "입장문이 열리면 알려줄까?": {
            ...Typography.boldMedium,
            color: ColorTokens.Point,
          },
        }}
      />
      {/* 가입 안내 모달 */}
      <PopupOneButton
        onRequestClose={() => setModalOneButtonlVisible(false)}
        onPress={handleConfirmPress}
        visible={modalOneButtonlVisible}
        mainText={"좋아! 그러면 어떤 계정으로 가입할지\n아래에서 선택해서 로그인 해줘."}
        bottomText={"응, 알겠어"}
        highlightMap={{
          "좋아! 그러면 어떤 계정으로 가입할지\n아래에서 선택해서 로그인 해줘.": {
            ...Typography.boldMedium,
          },
        }}
      />
    </SafeAreaView>
  );
};

export default Lab;

const styles = StyleSheet.create({
  background: {
    // 색상 조정
    backgroundColor: ColorTokens.Background2,
    // 위치 조정
    flex: 1,
    alignItems: "center", //태그를 세로축 중앙에 정렬
  },
  logo: {
    width: 230,
    height: 80,
    // 위치 조정
    marginTop: heightScale(210),
  },
  miniLogo: {
    // 색상 조정
    color: ColorTokens.SplashSubTitleColor,
    // 폰트 조정
    ...Typography.boldMedium,
    textAlign: "center", // 글씨를 중앙에 정렬
  },
  userUnacceptedText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 위치 조정
    marginTop: Spacing[6],
    ...Typography.headingMedium,
  },
  buttonContainer: {
    flexDirection: "row",
    position: "absolute",
    marginTop: heightScale(545),
    gap: Spacing[2],
  },
  loginContainer: {
    // 위치 조정
    position: "absolute",
    marginTop: heightScale(589),
  },
  loginBar: {
    // 레이아웃 속성
    width: SCREEN_WIDTH - 40,
    height: 55,
    borderRadius: Radius.md,
  },
});
