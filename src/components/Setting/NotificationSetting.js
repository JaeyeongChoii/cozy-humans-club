// 설정, 알림설정
import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 이미지
import onButton from "../../../assets/button/on.png";
import offButton from "../../../assets/button/off.png";

// 사용자 정의 변수
import { ColorTokens } from "../../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH } from "../../utils/scale";
import { BASE_URL } from "../../constants/BaseURL";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";

const settingList = [
  {
    index: 0,
    text: "활동 알림",
    information: "다른 유저의 댓글, 좋아요, 언급 등",
  },
  {
    index: 1,
    text: "서비스 알림",
    information: "이벤트, 서비스 이용관련 알림",
  },
];

const NotificationSetting = () => {
  // service, user 순, 처음에 true로 초기화
  const [notificationList, setNotificationList] = useState([true, true]);

  useEffect(() => {
    const getNotificationSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem("notification_settings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setNotificationList([parsedSettings.user, parsedSettings.service]);
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      }
    };

    getNotificationSettings();
  }, []);

  const requestAPI = async (user, service) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const idToken = await AsyncStorage.getItem("id_token");
      const reqData = {
        id: idToken,
        service: service,
        market: true, // 마케팅 알림은 true로 고정
        user: user,
      };

      const url = `${BASE_URL}/profile/alram`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reqData),
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      console.log(`${url} response body :`, JSON.stringify(resData, null, 2));

      // AsyncStorage 업데이트
      await AsyncStorage.setItem("notification_settings", JSON.stringify(reqData));

    } catch (error) {
      console.error("Alarm API Error:", error);
    }
  };

  // 어떤 버튼이 눌렸는지 알기 위해 'index'를 인자로 받음
  const handleOnOFF = (index) => {
    const newNotificationList = [...notificationList];
    newNotificationList[index] = !newNotificationList[index];
    setNotificationList(newNotificationList);

    // API 요청 및 AsyncStorage 저장
    // newNotificationList[0] = user, newNotificationList[1] = service
    requestAPI(newNotificationList[0], newNotificationList[1]);
  };

  return (
    <View style={styles.container}>
      {/* 메인 */}
      <View
        style={{
          marginTop: Spacing[9],
        }}
      >
        {settingList.map((settingItem) => (
          <View
            key={settingItem.index}
            style={{
              paddingBottom: Spacing[11], // 객체마다 간격조정
            }}
          >
            {/* 설정 상세 내용 */}
            <Text style={styles.textStyle}>{settingItem.text}</Text>
            {/* 구분선 */}
            <View style={styles.horizonLine} />

            <View style={styles.notificationDetailContainer}>
              <Text style={styles.informationText}>
                {settingItem.information}
              </Text>
              {/* on/ off 버튼 */}
              <TouchableOpacity
                onPress={() => handleOnOFF(settingItem.index)}
                style={{

                }}
              >
                <Image
                  source={
                    // true일 때 on
                    notificationList[settingItem.index] ? onButton : offButton
                  }
                  style={styles.buttonStyle}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default NotificationSetting;

const styles = StyleSheet.create({
  container: {
    // 위치 조정
    position: "absolute",
    top: heightScale(192),
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[5],
    flex: 1,
  },
  notificationDetailContainer: {
    // 위치 조정
    marginTop: Spacing[5],
    flexDirection: "row", //태그를 가로로 정렬
    justifyContent: "space-between", //태그들을 양끝으로 정렬
    alignItems: "center", // 하위 아이템들을 수직 중앙 정렬
  },
  textStyle: {
    // 색상 조정
    color: ColorTokens.Point,
    // 폰트 조정
    ...Typography.headingLarge,
  },
  horizonLine: {
    borderColor: ColorTokens.InnerBox,
    width: "100%",
    borderWidth: 0.5,
    opacity: 0.5,
    marginTop: Spacing[1],
  },
  informationText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.paraMedium,
    // 레이아웃 속성
  },
  buttonStyle: {
    // 레이아웃 속성
    width: 44,
    height: 24,
  },
});
