import React, { useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import GlobalScrollView from "../GlobalScrollView";
import serviceBellImage from "../../../tokenImage/serviceBell.png";
import { ColorTokens } from "../../design/token/ColorTokens";
import Database from "../Database";
import PostUserInfo from "../PostUserInfo";
import {
  BOTTOM_SHEET_SUBTITLE_HEIGHT,
  BOTTOM_SHEET_HEIGHT,
  STROKE_WIDTH,
} from "../../design/token/constantsTokens";
import { BottomSheetContext } from "../BottomSheetFrame/BottomSheetContext";
import { Spacing } from "../../design/Spacing";
import { Typography } from "../../design/Typography";

const AlertsList = ({ onClose }) => {
  const sheetContext = useContext(BottomSheetContext);

  return (
    <GlobalScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 70 }} // 아래공간 여유
      onScroll={sheetContext?.handleScroll}
      scrollEventThrottle={16}
    >
      {/* 알림 사진 */}
      <View style={styles.subTitleArea}>
        <Image source={serviceBellImage} style={styles.serviceBell} />
        <Text style={styles.subTitle}>알림 목록</Text>
      </View>
      {Database.AlertsData.map((data, idx) => (
        <View key={idx}>
          <View style={styles.listGap}>
            {/* 프로필 사진, 닉네임, 게시된 시간 부분 */}
            <PostUserInfo
              name={data.name}
              profileImage={data.profileImage}
              userCode={data.usercode}
              timeStamp={data.timestamp}
              onClose={onClose}
            />
            {/* 알림 메세지 */}
            <View style={{ marginTop: Spacing[3] }}>
              <Text style={styles.alertMessageStyle}>
                {data.alertMessage}
              </Text>
            </View>

            {/* 인용된 경우 */}
            {data.quotoState === true && (
              <View style={styles.quoteContainer}>
                <PostUserInfo
                  name={data.name}
                  profileImage={data.profileImage}
                  userCode={data.usercode}
                  timeStamp={data.timestamp}
                  onClose={onClose}
                />
                {/* 인용 메세지 */}
                <View style={{ marginTop: Spacing[2] }}>
                  <Text style={styles.alertMessageStyle}>
                    {data.quotoMessage}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View style={{
            borderColor: ColorTokens.Stroke,
            borderBottomWidth: STROKE_WIDTH,
          }} />
        </View>

      ))}
    </GlobalScrollView>
  );
};

export default AlertsList;

const styles = StyleSheet.create({
  subTitleArea: {
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
    height: BOTTOM_SHEET_SUBTITLE_HEIGHT,
    paddingBottom: Spacing[5],
    borderBottomColor: ColorTokens.Stroke,
    borderBottomWidth: STROKE_WIDTH,
    marginBottom: Spacing[2]
  },
  serviceBell: {
    // 레이아웃 속성
    width: 30,
    height: 30,
  },
  subTitle: {
    color: ColorTokens.Point,
    ...Typography.boldSmall,
  },
  listArea: {
    flex: 1,
  },
  listGap: {
    marginBottom: Spacing[5],
    paddingHorizontal: Spacing[2],
  },
  alertMessageStyle: {
    color: ColorTokens.Typography,
    fontFamily: "Galmuri",
    fontSize: 12,
  },
  quoteContainer: {
    borderColor: ColorTokens.Stroke,
    borderWidth: STROKE_WIDTH,
    marginTop: Spacing[5],
    paddingHorizontal: Spacing[2],
    paddingBottom: Spacing[4],
  },
});
