import React, { useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import GlobalScrollView from "../GlobalScrollView";
import heartImage from "../../../tokenImage/pixelHeart_active.png";
import { ColorTokens } from "../../design/token/ColorTokens";
import { postApi } from "../../api/postApi";
import PostUserInfo from "../PostUserInfo";
import {
  BOOTOM_SHEET_SUBTITLE_HEIGHT,
  STROKE_WIDTH,
} from "../../design/token/constantsTokens";
import { BottomSheetContext } from "../BottomSheetFrame/BottomSheetContext";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import { heightScale, SCREEN_HEIGHT } from "../../utils/scale";

const LikersList = ({ onClose, post }) => {
  const sheetContext = useContext(BottomSheetContext);
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (post) {
      console.log(`[LikersList] Initial fetch for post ID: ${post.id}, type: ${post.postType}`);
      setLoading(true);
      fetchLikers(0);
    } else {
      // 컴포넌트가 마운트된 상태에서만 경고 출력 (언마운트 중일 때는 무시)
      if (isMounted && !post) {
        // console.log("[LikersList] post is null, skipping fetch.");
      }
    }
    return () => { isMounted = false; };
  }, [post]);

  const fetchLikers = async (pageNum) => {
    try {
      if (!post) return;

      const data = await postApi.fetchLikeListForPost(post.id, post.postType, pageNum);

      // <RULE[p-test.md]> 백엔드 응답 분석 로그
      console.log(`[LikersList] Page ${pageNum} response:`, JSON.stringify(data));

      if (data && Array.isArray(data)) {
        const currentUserId = await AsyncStorage.getItem("user_id");
        const currentNickname = await AsyncStorage.getItem("nickname");
        
        // 데이터 매핑
        let mappedData = data.map(user => ({
          name: user.nickname,
          usercode: user.user_id,
          profileImage: user.image && user.image.trim() !== ""
            ? { uri: `https://jamdeeptalk.com/files/profile/${user.image}` }
            : require("../../../tokenImage/defaultProfileImage.png")
        }));

        // <RULE[p-test.md]> 즉각적 반영을 위한 프론트엔드 동기화 (백엔드 지연 대응)
        if (pageNum === 0 && currentUserId) {
          const isMeInList = mappedData.some(u => String(u.usercode) === String(currentUserId));
          
          if (post.isLiked && !isMeInList) {
            // 좋아요 상태인데 목록에 없으면 맨 앞에 추가 (백엔드 반영 지연 대비)
            console.log(`[LikersList] SYNC: Adding current user to the top (isLiked: true, user: ${currentUserId})`);
            mappedData.unshift({
                name: currentNickname || "나",
                usercode: currentUserId,
                profileImage: require("../../../tokenImage/defaultProfileImage.png")
            });
          } else if (!post.isLiked && isMeInList) {
            // 좋아요 취소 상태인데 목록에 있으면 제거
            console.log(`[LikersList] SYNC: Filtering out current user (isLiked: false, user: ${currentUserId})`);
            mappedData = mappedData.filter(u => String(u.usercode) !== String(currentUserId));
          }
        }

        if (mappedData.length === 0 && data.length === 0) {
          setHasMore(false);
          if (pageNum === 0) setLikers([]);
        } else {
          if (pageNum === 0) {
            setLikers(mappedData);
          } else {
            setLikers(prev => [...prev, ...mappedData]);
          }
          
          // 데이터가 적으면 다음 페이지가 없을 것으로 간주
          if (data.length < 10) { 
            setHasMore(false);
          }
        }
      } else {
        // <RULE[p-test.md]> 백엔드 문제 제시
        console.error("[LikersList] Backend returned invalid data format. Array expected.");
        setHasMore(false);
      }
    } catch (error) {
      console.error("[LikersList] fetchLikers Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (event) => {
    // BottomSheetContext의 스크롤 처리 유지
    sheetContext?.handleScroll(event);

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loadingMore && hasMore && !loading) {
      console.log("[LikersList] Loading more likers... Next page:", page + 1);
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLikers(nextPage);
    }
  };

  if (loading) {
    return (
      <View style={[styles.subTitleArea, { height: 200, justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={ColorTokens.Point} />
      </View>
    );
  }

  return (
    <GlobalScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 70 }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* 좋아요 사진 */}
      <View style={styles.subTitleArea}>
        <Image source={heartImage} style={styles.heartStyle} />
        <Text style={styles.subTitle}>좋아요</Text>
      </View>

      {likers.length === 0 ? (
        <View style={{ alignItems: 'center', top: SCREEN_HEIGHT / 2 - heightScale(140) }}>
          <Text style={{
            ...Typography.boldMedium,
            color: ColorTokens.Unselected
            }}>
            아직 좋아요를 누른 멤버가 없어.
          </Text>
        </View>
      ) : (
        likers.map((data, idx) => (
          <View key={`${data.usercode}-${idx}`} style={styles.listGap}>
            <View style={styles.listDetailContainer}>
              <PostUserInfo
                name={data.name}
                profileImage={data.profileImage}
                userCode={data.usercode}
                timeStamp={""}
                onClose={onClose}
                style={styles.userInfo}
              />
              <TouchableOpacity style={styles.followButtonTouchable}>
                <Image
                  source={require("../../../tokenImage/followButton.png")}
                  style={styles.followButtonStyle}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {loadingMore && (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={ColorTokens.Point} />
        </View>
      )}
    </GlobalScrollView>
  );
};

export default LikersList;

const styles = StyleSheet.create({
  subTitleArea: {
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
    height: BOOTOM_SHEET_SUBTITLE_HEIGHT,
    paddingBottom: Spacing[5],
    borderBottomColor: ColorTokens.Stroke,
    borderBottomWidth: STROKE_WIDTH,
  },
  heartStyle: {
    // 레이아웃 속성
    width: 20,
    height: 20,
  },
  subTitle: {
    color: ColorTokens.Point,
   ...Typography.boldSmall,
  },
  listArea: {
    flex: 1,
  },
  listGap: {
    marginBottom: 0,
  },
  listDetailContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[2],
  },
  userInfo: {
    flex: 1,
    width: 0,
    marginRight: Spacing[2],
  },
  followButtonTouchable: {
    flexShrink: 0,
    alignSelf: "center",
  },
  followButtonStyle: {
    width: 60,
    height: 30,
  },
});
