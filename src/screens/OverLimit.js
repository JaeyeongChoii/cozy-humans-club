// 온보딩
// 정원초과되었을 경우 보여지는 화면
import { useState } from "react";
import { Text, View, StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";

// 사용자 선언 변수
import { ColorTokens } from "../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH } from "../utils/scale";
import HighlightText from "../components/HighlightText";
import { SafeAreaView } from "react-native-safe-area-context";
import Popup2Button from "../components/Popup2Button";
import NextBar from "../components/NextBar"


const OverLimit = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogInPress = () => {
    setModalVisible(false);
    navigation.navigate(""); //나중에 삭제 예정
  };

  return (
    <SafeAreaView style={styles.background}>
      {/* 로고 */}
            <Text style={styles.logo}>DEEPTALK</Text>
            {/* 부제 */}
            <Text style={styles.miniLogo}>
              안전하고 아늑한 이야기 소굴
            </Text>
      {/* 다음 모집 날짜 */}
      <View style={styles.nextTextContainer}>
        {/* 특정 글자에 하이라이팅 */}
        <HighlightText
          message={"다음 오픈 날짜  8/2 일요일"}
          highlightMap={{
            "8/2 일요일": {
              color: ColorTokens.Point,
              fontFamily: "Galmuri11Bold",
            },
          }}
          style={styles.nextText}
        />
      </View>

      <View style={styles.loginContainer}>
        {/* iOS일 때만 Apple 로그인 버튼 표시 */}
        {Platform.OS === 'ios' && (
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
            style={[styles.loginBar, Platform.OS === 'ios' && { marginTop: 15 }]}
          />
        </TouchableOpacity>

        {/* Discord 로그인 버튼 */}
        <TouchableOpacity>
          <Image
            source={require("../../assets/button/loginBar_Discord.png")}
            style={[styles.loginBar, { marginTop: 15 }]}
          />
        </TouchableOpacity>
      </View>
      {/* 소식 받아보기 버튼*/}
      <NextBar
        onPress={() => setModalVisible(true)}
        activeColor={ColorTokens.Point}
        message={"가입 오픈 알림 받기"}
        style={{
          top: "100%",
        }}
      />
      {/* 가입 권유 모달 */}
      <Popup2Button
        onRequestClose={() => setModalVisible(false)}
        visible={modalVisible}
        leftOnPress={() => setModalVisible(false)}
        rightOnPress={handleLogInPress}
        mainText={
          "다음 회원가입 오픈 날짜는 8/2 일요일입니다.\n대기 신청 알림을 걸어놓으시겠어요?"
        }
        leftText={"괜찮아요"}
        rightText={"걸어놓기"}
        highlightMap={{
          "8/2 일요일": {
            color: ColorTokens.Point,
            fontFamily: "Galmuri11Bold",
          },
        }}
      />
    </SafeAreaView>
  );
};

export default OverLimit;

const styles = StyleSheet.create({
  background: {
    // 색상 조정
    backgroundColor: ColorTokens.Navigation,
    // 위치 조정
    flex: 1,
    alignItems: "center", //태그를 세로축 중앙에 정렬
  },
  logo: {
    // 색상 조정
    color: "#981FDF",
    // 폰트 조정
    fontSize: 26,
    fontFamily: "Galmuri11Bold",
    // 위치 조정
    marginTop: heightScale(248),
  },
  miniLogo: {
    // 색상 조정
    color: ColorTokens.Point,
    // 폰트 조정
    textAlign: "center", // 글씨를 중앙에 정렬
    fontFamily: "Galmuri11Bold",
    fontSize: 10,
    lineHeight: 18,
    // 위치 조정
    marginTop: 10,
  },
  nextTextContainer: {
    // 위치 조정
    marginTop: heightScale(48),
    // 레이아웃 속성
    flexDirection: "row",
  },
  nextText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    fontFamily: "Galmuri11Bold",
    fontSize: 14,
  },
  loginContainer: {
      // 위치 조정
      position: "absolute",
      marginTop: heightScale(560),
    },
    loginBar: {
      // 레이아웃 속성
      width: SCREEN_WIDTH - 40,
      height: 55,
      borderRadius: 10,
    },

});
