// 설정
// 초기 설정화면
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// 사용자 지정 변수
import { ColorTokens } from "../design/token/ColorTokens";
import BackButton from "../components/BackButton";
import { heightScale, SCREEN_WIDTH, widthScale } from "../utils/scale";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";

const item = [
  {
    id: 0,
    text: "계정 관리",
    address: "AccountManagementSetting",
  },
  {
    id: 1,
    text: "알림 설정",
    address: "NotificationSetting",
  },
  {
    id: 2,
    text: "차단 목록",
    address: "BlockedListSetting",
  },
  {
    id: 3,
    text: "코지의 사무실 방문하기",
    address: "HelpSetting",
  },
  {
    id: 4,
    text: "코지 휴먼즈 클럽 공간 규칙",
    address: "ClubRule",
  },
  {
    id: 5,
    text: "이용약관 및 더보기",
    address: "MoreSetting",
  },
];

const SettingHome = () => {
  const navigation = useNavigation();

  const handleInto = (item) => {
    navigation.navigate("SettingFrame", { screenName: item.address });
  };

  const handlePreviousStep = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.background}>
      {/* 뒤로가기 버튼 */}
      <BackButton onPress={handlePreviousStep} />

      {/*설정부분 */}
      <View style={styles.settingListContainer}>
        {item.map((item) => (
          <View
            key={item.id}
            style={{
              paddingBottom: Spacing[7], // 객체마다 간격조정
            }}
          >
            <TouchableOpacity
              onPress={() => handleInto(item)}
              style={styles.settingTouchable}
              key={item.id}
            >
              {/* 설정 상세 내용 */}
              <Text style={styles.settingText}>{item.text}</Text>
              {/* 설정 상세 내용 화살표 */}
              <Image
                source={require("../../assets/button/RightDirection.png")}
                style={styles.nextButton}
              />
            </TouchableOpacity>
            {/* 구분선 */}
            <View style={styles.line} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default SettingHome;

const styles = StyleSheet.create({
  background: {
    // 색상 조정
    backgroundColor: ColorTokens.Background2,
    // 위치 조정
    flex: 1,
  },
  settingListContainer: {
    // 위치 조정
    top: heightScale(190),
    left: (SCREEN_WIDTH - widthScale(359)) / 2, // line의 width길이를 제외한 남은공간 동일하게 부여
  },
  settingTouchable: {
    // 위치 조정
    paddingBottom: Spacing[1],
    flexDirection: "row", //태그를 가로로 정렬
    // 레이아웃 속성
    justifyContent: "space-between", //태그들을 양끝으로 정렬
    alignItems: "center", //태그들의 가로축을 중앙으로 정렬
  },
  settingText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldMedium,
    // 위치 조정
    marginLeft: Spacing[5],
  },
  nextButton: {
    width: 10,
    height: 20,
    // 위치 조정
    left: -(SCREEN_WIDTH - widthScale(359)) / 2 - 20, // line의 width길이를 제외한 남은공간 동일하게 부여 + 20 패딩
  },
  line: {
    // 색상 조정
    backgroundColor: ColorTokens.Typography,
    // 레이아웃 속성
    width: widthScale(359),
    height: 1,
    opacity: 0.2,
  },
});
