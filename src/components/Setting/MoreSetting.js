// 설정, 이용약관 및 더보기
import React from "react";
import { Image, Text, View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH, widthScale } from "../../utils/scale";

import { useNavigation } from "@react-navigation/native";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";

const items = [
  { id: 0, text: "이용약관" },
  { id: 1, text: "개인정보 처리방침" },
  { id: 2, text: "라이선스" },
];

const MoreSetting = () => {
  const navigation = useNavigation();

  const handlePress = (item) => {
    navigation.push("SettingFrame", {
      screenName: "SettingDetailView",
      detailType: item.id
    });
  };

  return (
    <View style={styles.settingListContainer}>
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            paddingBottom: 35, // 객체마다 간격조정
          }}
        >
          <TouchableOpacity
            onPress={() => handlePress(item)}
            style={styles.settingTouchable}
            key={item.id}
          >
            {/* 설정 상세 내용 */}
            <Text style={styles.settingText}>{item.text}</Text>
            {/* 설정 상세 내용 화살표 */}
            <Image
              source={require("../../../assets/button/RightDirection.png")}
              style={styles.nextButton}
            />
          </TouchableOpacity>
          {/* 구분선 */}
          <View style={styles.line} />
        </View>
      ))}
    </View>
  );
};

export default MoreSetting;

const styles = StyleSheet.create({
  settingListContainer: {
    // 위치 조정
    top: heightScale(219),
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
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    fontSize: 25,
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
