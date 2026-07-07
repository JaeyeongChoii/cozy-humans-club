import React, { useState, useContext } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GlobalScrollView from "../GlobalScrollView";
import { ColorTokens } from "../../design/token/ColorTokens";
import Database from "../Database";
import PostUserInfo from "../PostUserInfo";
import {
  BOTTOM_SHEET_SUBTITLE_HEIGHT,
  BOTTOM_SHEET_HEIGHT,
  STROKE_WIDTH,
} from "../../design/token/constantsTokens";
import Tokens from "../../../Tokens";
import Comments from "../Comments";
import { BottomSheetContext } from "../BottomSheetFrame/BottomSheetContext";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";

const QuotoList = ({ onClose, post }) => {
  const sheetContext = useContext(BottomSheetContext);

  if (!post) {
    return null; // post가 없으면 렌더링 안함
  }

  return (
    <View style={[styles.listContainer, { flex: 1 }]}>
      <GlobalScrollView
        onScroll={sheetContext?.handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* 인용 사진 */}
        <View style={styles.subTitleArea}>
          <Image source={require("../../../tokenImage/quotoIcon_active.png")}
            style={styles.quotoIcon}
          />
          <Text style={styles.subTitle}>인용</Text>
        </View>
        <View style={styles.postUserInfoStyle}>
          {/* 프로필 사진, 닉네임, 게시된 시간, 우측 더보기 탭 부분 */}
          <PostUserInfo
            userCode={post.usercode}
            profileImage={post.profileImage}
            name={post.name}
            timeStamp={post.timestamp}
            onClose={onClose}
          />

          {/* 본문 */}
          <Text style={Tokens.posttext}>{post.posttext}</Text>
        </View>

        {/* 코멘트 */}
        <View>
          {Database.QuoteData.map((data, index) => (
            <Comments
              key={index}
              data={data}
              onClose={onClose} //onClose 함수를 Comments 쪽에 전달. 이래야 댓글에서 유저프로필로 이동할 때 모달이 닫히면서 이동 가능
            />
          ))}
        </View>
      </GlobalScrollView>
    </View>
  );
};

export default QuotoList;

const styles = StyleSheet.create({
  listContainer: {
    width: "100%", // 이 View가 실제 바텀시트 박스.
    flex: 1,
  },
  subTitleArea: {
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
    height: BOTTOM_SHEET_SUBTITLE_HEIGHT,
    paddingBottom: Spacing[5],
    borderBottomColor: ColorTokens.Stroke,
    borderBottomWidth: STROKE_WIDTH,
    marginBottom: Spacing[2]
  },
  quotoIcon: {
    // 홈과 동일한 작은 인용 아이콘 크기
    width: 16,
    height: 16,
  },
  subTitle: {
    color: ColorTokens.Point,
    ...Typography.boldSmall,
  },
  postUserInfoStyle: {
    marginBottom: 10,
    paddingHorizontal: Spacing[2],
  },
  chooseSortContainer: {
    borderTopWidth: STROKE_WIDTH,
    borderColor: ColorTokens.Typography,
  },
  chooseSortTouchable: {
    flexDirection: "row",
    margin: 8,
    alignItems: "center",
  },
});
