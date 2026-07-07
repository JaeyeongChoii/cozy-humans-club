// 설정
// 계정관리 화면
import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
// 사용자 정의 변수
import { ColorTokens } from "../../../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH, widthScale } from "../../../utils/scale";
import Popup2Button from "../../Popup2Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postApi } from "../../../api/postApi";
import { Typography } from "../../../design/Typography";
import { Spacing } from "../../../design/Spacing";
import DynamicButton from "../../DynamicButton";

const containerWidth = SCREEN_WIDTH * 0.95;

const AccountManagementSetting = ({ currentEmail: initialEmail, currentId: initialId }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState(initialEmail || "");
  const [userId, setUserId] = useState(initialId || "");

  useFocusEffect(
    React.useCallback(() => {
      const loadAccountInfo = async () => {
        try {
          const { currentEmail, currentUser_id } = await postApi.fetchAccountInfo();

          if (currentEmail) setEmail(currentEmail);
          if (currentUser_id) setUserId(currentUser_id);
        } catch (error) {
          console.error("Account info load error:", error);
        }
      };

      loadAccountInfo();
    }, [])
  );

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    setModalVisible(false);

    try {
      // 1. 현재 로그인했던 프로바이더(구글, 애플 등) 확인
      const provider = await AsyncStorage.getItem("auth_provider");

      // 2. 활성 세션 관련 공통 토큰 삭제
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("id_token"); // 완전한 로그아웃을 위해 활성 세션 토큰도 삭제
      await AsyncStorage.removeItem("refresh_token");

      // 3. 해당 프로바이더 전용 토큰 및 기록 삭제
      // 백업 차원에서 주요 프로바이더 토큰도 일괄 삭제 시도
      await AsyncStorage.removeItem("id_token_google");
      await AsyncStorage.removeItem("id_token_apple");
      await AsyncStorage.removeItem("id_token_discord");

      if (provider) {
        await AsyncStorage.removeItem(`id_token_${provider}`);
      }
      await AsyncStorage.removeItem("auth_provider");

      console.log(`Logout successful. Tokens cleared for provider: ${provider || 'basic or google'}`);

      // 4. Splash 화면으로 이동 (뒤로가기 방지를 위해 reset 사용)
      navigation.reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>계정관리</Text>
      <View style={styles.contentWrapper}>
        {/* 이메일 */}
        <View style={styles.accountInfoRow}>
          <Text style={styles.accountLabel}>이메일</Text>
          <View style={styles.accountDetailContainer}>
            <Text
              style={styles.infoText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {email}
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() =>
                navigation.navigate("SettingFrame", {
                  screenName: "ChangeEmail",
                })
              }
            >
              <DynamicButton text={"변경하기"} isPoint2={true} />
            </TouchableOpacity>
          </View>
        </View>
        {/* 아이디 */}
        <View style={styles.accountInfoRow}>
          <Text style={styles.accountLabel}>아이디</Text>
          <View style={styles.accountDetailContainer}>
            <Text
              style={styles.infoText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              @{userId}
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                console.log("Navigating to ChangeId with userId:", userId);
                navigation.navigate("SettingFrame", {
                  screenName: "ChangeId",
                  currentId: userId,
                });
              }}
            >
              <DynamicButton text={"변경하기"} isPoint2={true} />
            </TouchableOpacity>
          </View>
        </View>
        {/* 계정 로그아웃 */}
        <View style={styles.accountInfoRow}>
          <Text style={styles.accountLabel}>계정 로그아웃</Text>
          <View style={styles.accountDetailContainer}>
            {/* 양측 정렬을 위해 추가 */}
            <Text />
            {/* 로그아웃 버튼 */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={1}
            >
              <DynamicButton text={"로그아웃"} isPoint2={true} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 계정 삭제 */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("DeletingAccountFrame", {
              screenName: "IntroDeletingAccount", // Starts from Intro
            })
          }
          style={styles.menuItem}
        >
          <Text style={styles.menuItemText}>계정 삭제</Text>
          <Image
            source={require("../../../../assets/button/RightDirection.png")}
            style={styles.menuItemArrow}
          />
        </TouchableOpacity>
        {/* 로그아웃 모달 */}
        <Popup2Button
          onRequestClose={() => setModalVisible(false)}
          visible={modalVisible}
          leftOnPress={() => setModalVisible(false)}
          rightOnPress={handleLogout}
          mainText={"클럽에서 잠시 로그아웃 할래?"}
          leftText={"뒤로가기"}
          rightText={"로그아웃"}
        />
      </View>
    </View>
  );
};
export default AccountManagementSetting;

const styles = StyleSheet.create({
  container: {
    // 색상 조정
    backgroundColor: ColorTokens.Background2,
    //위치 조정
    top: heightScale(180),
    // 레이아웃 속성
    flex: 1,
    marginHorizontal: Spacing[5],
  },
  title: {
    // 색상 조정
    color: ColorTokens.Point,
    // 폰트 조정
    ...Typography.boldLarge,
  },
  contentWrapper: {
    // 위치 조정
    marginTop: heightScale(50),
    // 레이아웃 속성

  },
  accountInfoRow: {
    // 위치 조정
    flexDirection: "row", // 태그를 가로로 정렬
    alignItems: "center", // 태그들의 가로축을 중앙으로 정렬
    paddingBottom: Spacing[7],
  },
  accountLabel: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldMedium,
    // 레이아웃 속성
    flex: 2, // flex 값을 주어 공간 배분
  },
  accountDetailContainer: {
    // 위치 조정
    flexDirection: "row", // 태그를 가로로 정렬
    alignItems: "center", // 태그들의 가로축을 중앙으로 정렬
    justifyContent: "space-between",
    width: widthScale(250),
  },
  infoText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.paraMedium,
    // 위치 조정
    marginRight: 10,
    // 레이아웃 속성
    flex: 1,
    opacity: 0.8,
  },
  menuItem: {
    // 위치 조정
    flexDirection: "row", // 태그를 가로로 정렬
    justifyContent: "space-between", // 태그들을 같은 간격으로 정렬
    alignItems: "center", // 태그들의 가로축을 중앙으로 정렬
  },
  menuItemText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldMedium,
  },
  menuItemArrow: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    fontSize: 20,
  },
});
