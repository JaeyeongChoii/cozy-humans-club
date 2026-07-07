// 바텀 탭바를 통해 이동 가능한 라이브러리 화면
// 유저 프로필, 활동을 볼수 있는곳, 설정도 입장 가능
import { React, useCallback, useEffect, useRef, useState } from "react";
import { Animated, View, Text, Image, TouchableOpacity, StyleSheet, DeviceEventEmitter, RefreshControl } from "react-native";
import GlobalScrollView from "../components/GlobalScrollView";
import Tokens from "../../Tokens";
import Posts from "../components/Posts";
import { useMoreMenu } from "../components/MoreMenuContext";
import Toast from "../components/Popup/Toast";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ColorTokens } from "../design/token/ColorTokens";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME, STROKE_WIDTH } from "../design/token/constantsTokens";
import { BottomSheetTypes } from "../constants/bottomSheetTypes";
import { SearchTabTypes } from "../constants/SearchTabTypes";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";
import ViewImage from "../components/ViewImage";
import BackButton from "../components/BackButton";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../utils/scale";
import DynamicButton from "../components/DynamicButton";
import ProfileMainHeader from "../components/ProfileMainHeader";
import ProfileRefreshIndicator from "../components/ProfileRefreshIndicator";
import ProfileStatusMessage from "../components/ProfileStatusMessage";
import { useQueryClient } from "@tanstack/react-query";
import { useLibrary, libraryKey } from "../queries/useLibrary";

const MIN_REFRESH_DURATION_MS = 2000;
const PINNED_TAB_BAR_TOP = 30;
const TAB_BAR_PULL_DISTANCE = 100;
const AnimatedGlobalScrollView = Animated.createAnimatedComponent(GlobalScrollView);
const DEFAULT_PROFILE_IMAGE = require("../../tokenImage/defaultProfileImage.png");
const EMPTY_POST_MESSAGE_BY_TAB = {
  [SearchTabTypes.ALL]: "아직까지 클럽에서 아무 이야기도 하지 않았어! ",
  [SearchTabTypes.JAM]: "아직까지 클럽에서 아무 이야기도 하지 않았어! ",
  [SearchTabTypes.JIN]: "아직까지 클럽에서 아무 이야기도 하지 않았어! ",
  Like: "아직까지 클럽에서 한번도 좋아요를 누르지 않았어! ",
  Comment: "아직까지 클럽에서 한번도 댓글을 올리지 않았어! ",
  Quoto: "아직까지 클럽에서 한번도 인용을 하지 않았어! ",
  Bookmark: "아직까지 클럽에 있는 아무 이야기도 북마크 하지 않았어! ",
};

  const Library = ({ onHostBottomSheet }) => {
  const navigation = useNavigation();
  const { closeMenu } = useMoreMenu();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(SearchTabTypes.ALL);
  const [tabBarOffsetY, setTabBarOffsetY] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // 라이브러리 데이터(프로필 + 5개 리스트)는 ['library'] 공유 캐시에서 온다.
  const { data, refetch } = useLibrary();
  const profile = data?.profile;
  const postList = data?.postList ?? [];
  const likeList = data?.likeList ?? [];
  const bookList = data?.bookList ?? [];
  const commentList = data?.commentList ?? [];
  const quoteList = data?.quoteList ?? [];

  // 회원정보(캐시에서 파생)
  const userId = profile?.userId ?? "";
  const nickname = profile?.nickname ?? "";
  const imageUrl = profile?.imageUrl || DEFAULT_PROFILE_IMAGE;
  const statusMessage = profile?.statusMessage ?? "";
  const hideFollowList = profile?.hideFollowList ?? false;
  const following = profile?.following ?? 0;
  const follower = profile?.follower ?? 0;

  // Toast 관련 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastPointMessage, setToastPointMessage] = useState("");
  const [isProfileImageVisible, setIsProfileImageVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTabPress = useCallback((tab) => {
    if (tab === selectedTab) return;

    closeMenu();
    setSelectedTab(tab);
  }, [closeMenu, selectedTab]);

  const handleScrollBeginDrag = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )
  ).current;

  const tabBarTranslateY = tabBarOffsetY == null
    ? PINNED_TAB_BAR_TOP
    : scrollY.interpolate({
      inputRange: [-TAB_BAR_PULL_DISTANCE, 0, Math.max(tabBarOffsetY - PINNED_TAB_BAR_TOP, 1)],
      outputRange: [tabBarOffsetY + TAB_BAR_PULL_DISTANCE, tabBarOffsetY, PINNED_TAB_BAR_TOP],
      extrapolate: "clamp",
    });

  const renderTabBar = () => (
    <View
      style={styles.stickyTabBarContainer}
      pointerEvents="auto"
    >
      <View style={styles.tabBarContainer}>
        {[SearchTabTypes.ALL, SearchTabTypes.JAM, SearchTabTypes.JIN, "Like", "Comment", "Quoto", "Bookmark"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPressIn={() => {
              handleTabPress(tab);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {tab === "Like" && (
              <Image
                source={
                  require("../../tokenImage/pixelHeart_active.png")
                }
                style={[
                  styles.heartIcon,
                  selectedTab !== tab && { opacity: 0.5 }
                ]}
              />
            )}
            {tab === "Comment" && (
              <Image
                source={
                  require("../../tokenImage/activeChatbubble.png")
                }
                style={[
                  selectedTab !== tab && styles.unselectedTabOpacity,
                  styles.commentTabIcon
                ]}
              />
            )}
            {tab === "Quoto" && (
              <Image
                source={
                  require("../../tokenImage/quotoIcon_active.png")
                }
                style={[
                  styles.quotoIcon,
                  selectedTab !== tab && { opacity: 0.5 }
                ]}
              />
            )}
            {tab === "Bookmark" && (
              <Image
                source={
                  require("../../tokenImage/pixelBookmark_active.png")
                }
                style={[
                  styles.bookIcon,
                  selectedTab !== tab && { opacity: 0.5 }
                ]}
              />
            )}
            {!["Like", "Comment", "Quoto", "Bookmark"].includes(tab) && (
              <Text
                style={[
                  styles.tabText,
                  {
                    color: selectedTab === tab
                      ? tab === SearchTabTypes.JIN
                        ? ColorTokens.Point2
                        : ColorTokens.Point
                      : ColorTokens.Unselected,
                  },
                ]}
              >
                {tab}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 당겨서 새로고침: 서버에서 다시 받아오되 최소 표시 시간을 보장한다.
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_DURATION_MS));
    try {
      await Promise.all([refetch(), delay]);
    } catch (error) {
      console.error("Library refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // 다른 화면(설정/프로필 수정 등)에서 돌아올 때 서버 기준으로 재검증.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // ['library'] 캐시의 모든 리스트에서 일치하는 글을 부분 갱신한다(좋아요/북마크 등).
  const handleUpdatePost = useCallback((updatedData) => {
    queryClient.setQueryData(libraryKey, (old) => {
      if (!old) return old;
      const updater = (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((post) => {
          // ID와 postType이 모두 일치하는지 확인 (ID 중복방지)
          // postType이 없을 경우(댓글 등) ID만 비교
          const isMatch = post.id === updatedData.id &&
            (updatedData.postType && post.postType ? post.postType === updatedData.postType : true);
          return isMatch ? { ...post, ...updatedData } : post;
        });
      };
      return {
        ...old,
        postList: updater(old.postList),
        likeList: updater(old.likeList),
        bookList: updater(old.bookList),
        commentList: updater(old.commentList),
        quoteList: updater(old.quoteList),
      };
    });
  }, [queryClient]);

  // 좋아요/북마크/삭제는 이제 이벤트버스가 아니라 공유 RQ 캐시(postCacheSync)로 직접 반영되므로
  // post_updated/post_deleted를 따로 수신하지 않는다. (handleUpdatePost는 라이브러리 내부
  // Posts에서의 즉시 반영용으로 계속 사용된다.)

  // 전역 토스트 메시지 수신 처리
  useEffect(() => {
    const toastListener = DeviceEventEmitter.addListener('show_toast', (data) => {
      setToastMessage(data.message || "");
      setToastPointMessage(data.pointMessage || "");
      setToastVisible(true);
    });

    return () => {
      toastListener.remove();
    };
  }, []);

  const posts = (() => {
    switch (
    selectedTab //탭 선택시 현재 유저의 유저코드와 해당 탭 게시물의 유저코드를 비교해 일치하는 게시물들을 출력
    ) {
      case SearchTabTypes.ALL:
        return postList;
      case SearchTabTypes.JAM:
        return postList.filter((post) => post.postType === THEME.JAM);
      case SearchTabTypes.JIN:
        return postList.filter((post) => post.postType === THEME.JIN);
      case "Comment":
        return commentList;
      case "Like":
        return likeList;
      case "Quoto":
        return quoteList;
      case "Bookmark":
        return bookList.filter((post) => post.isBookmarked);
      default:
        return [];
    }
  })();
  const emptyPostsMessage =
    EMPTY_POST_MESSAGE_BY_TAB[selectedTab] ?? EMPTY_POST_MESSAGE_BY_TAB[SearchTabTypes.ALL];

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <AnimatedGlobalScrollView
        style={styles.profileScrollView}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleManualRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
      >
      <View style={styles.headerContainer}>
          <BackButton style={styles.headerBackButton} onPress={handleBackPress} />
          <View style={styles.settingIconContainer}>
            {/* 설정 버튼 */}
            <TouchableOpacity onPress={() => navigation.navigate("SettingHome")}>
              <Image
                source={require("../../tokenImage/setting.png")}
                style={styles.settingIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ProfileMainHeader
          imageUrl={imageUrl}
          onProfileImagePress={() => setIsProfileImageVisible(true)}
          placeholder={require("../../tokenImage/defaultProfileImage.png")}
          rightContent={
            <>
              {/* 수정버튼 */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() =>
                  navigation.navigate("correction", {
                    userId: userId,
                    nickname: nickname, // 닉네임 전달
                    imageUrl: imageUrl,
                    statusMessage: statusMessage,
                    hideFollowList: hideFollowList,
                  })
                } // 네비게이션 시 user 정보 전달하여 correction.js에서 사용 가능하도록 함
              >
                <DynamicButton
                  text={"수정하기"}
                />
              </TouchableOpacity>
            </>
          }
        >

          {/*유저 텍스트 데이터 부분 시작*/}
          {/*닉네임, 유저아이디, 상메, 팔로잉, 팔로워 순서*/}
          <View>
            <View style={styles.nicknameIdContainer}>
              <Text style={styles.nicknameText}>
                {nickname}
              </Text>
              <Text style={styles.userIdText}>
                @ {userId}
              </Text>
            </View>
            <ProfileStatusMessage
              message={statusMessage}
              style={styles.statusMessageText}
            />

            {/* 팔로워/팔로우 */}
            <View style={styles.followStatsRow}>
              <TouchableOpacity
                onPress={
                  () => onHostBottomSheet(BottomSheetTypes.FOLLOW, { userId: userId })
                }
                style={styles.followStatItem}
              >
                <Text style={styles.followCountText}>
                  {following}{" "}
                </Text>
                <Text style={[styles.followLabelText, { marginRight: 10 }]}>
                  팔로잉
                </Text>

                <Text style={styles.followCountText}>
                  {follower}{" "}
                </Text>
                <Text style={styles.followLabelText}>
                  팔로워
                </Text>
              </TouchableOpacity>

            </View>
          </View>
          {/*유저 텍스트 데이터 부분 끝*/}
        </ProfileMainHeader>

        {/*여기서부터 하단 탭바 + 게시물 부분*/}
        {/* 탭바 */}
        <View style={styles.tabBarPlaceholder} onLayout={(event) => {
          setTabBarOffsetY(event.nativeEvent.layout.y);
        }} />
        <ProfileRefreshIndicator refreshing={refreshing} />
        {/* 게시물 리스트 */}
        {posts.length === 0 ? (
          <View style={styles.emptyPostsContainer}>
            <Text style={styles.emptyPostsText}>
              {emptyPostsMessage}
            </Text>
          </View>
        ) : (
          posts.map((data, idx) => (
            <Posts
              key={data.id || idx}
              data={data}
              menuId={`library-${selectedTab}-${data.id || idx}`}
              showPostTypeLabel={true}
              dismissMenuOnScroll={true}
              onRefresh={() => refetch()}
              onUpdatePost={handleUpdatePost}
              onHostBottomSheet={(type, postArg, options) => {
                closeMenu();
                onHostBottomSheet(type, postArg || data, { ...options, onUpdate: handleUpdatePost });
              }}
            />
          ))
        )}
      </AnimatedGlobalScrollView>

      {tabBarOffsetY != null && (
        <>
          <Animated.View
            style={styles.tabBarTopCover}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.animatedTabBarContainer,
              { transform: [{ translateY: tabBarTranslateY }] },
            ]}
            pointerEvents="box-none"
          >
            {renderTabBar()}
          </Animated.View>
        </>
      )}

      <Toast
        visible={toastVisible}
        pointMessage={toastPointMessage}
        message={toastMessage}
        onDismiss={() => {
          setToastVisible(false);
          setToastPointMessage("");
        }}
      />

      <ViewImage
        visible={isProfileImageVisible}
        onClose={() => setIsProfileImageVisible(false)}
        images={[imageUrl]}
        initialIndex={0}
        blockImageSave={true}
        meatballVisible={false}
      />
    </SafeAreaView >
  );
};

export default Library;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: ColorTokens.Background,
    flex: 1,
  },
  profileScrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop:60,
  },
  headerBackButton: {
    position: "relative",
    marginTop: 0,
    marginLeft: 15,
  },
  settingIconContainer: {
    alignItems: "flex-end",
  },
  settingIcon: {
    width: 27,
    height: 27,
    margin: 16,
  },
  nicknameIdContainer: {
    marginTop: Spacing[3],
    marginHorizontal: 8,
  },
  nicknameText: {
    ...Typography.boldMedium,
    color: ColorTokens.Typography,
  },
  userIdText: {
    ...Typography.paraSmall,
    color: ColorTokens.Unselected,
  },
  statusMessageText: {
    ...Typography.paraSmall,
    color: ColorTokens.Typography,
    marginHorizontal: 8,
    marginTop: Spacing[2],
  },
  followStatsRow: {
    marginTop: Spacing[2],
    flexDirection: "row",
    marginHorizontal: 8,
  },
  followStatItem: {
    flexDirection: "row",
    marginRight: 9,
  },
  followCountText: {
    ...Typography.boldMedium,
    color: ColorTokens.Typography,
  },
  followLabelText: {
    ...Typography.boldMedium,
    color: ColorTokens.Unselected,
  },
  stickyTabBarContainer: {
    width: SCREEN_WIDTH,
    height: 46,
    backgroundColor: ColorTokens.Background,
    paddingTop: Spacing[0],
  },
  animatedTabBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    zIndex: 3000,
    elevation: 3000,
  },
  tabBarTopCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PINNED_TAB_BAR_TOP,
    backgroundColor: ColorTokens.Background,
    zIndex: 2999,
    elevation: 2999,
  },
  tabBarPlaceholder: {
    width: SCREEN_WIDTH,
    height: 46,
  },
  tabBarContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: 46,
    backgroundColor: ColorTokens.Background,
    // 게시물 구분 아래선
    borderBottomColor: ColorTokens.Stroke,
    borderBottomWidth: STROKE_WIDTH,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    elevation: 1001,
  },
  tabText: {
    ...Typography.boldMedium,
  },
  emptyPostsContainer: {
    minHeight: SCREEN_HEIGHT * 0.45,
    alignItems: "center",

    paddingTop: 112,
  },
  emptyPostsText: {
    ...Typography.boldMedium,
    color: ColorTokens.Point2,
  },
  heartIcon: {
    width: 16,
    height: 16,
  },
  commentTabIcon: {
    // 홈 댓글 아이콘과 동일한 크기
    width: 16,
    height: 12,
  },
  quotoIcon: {
    width: 16,
    height: 16,
  },
  bookIcon: {
    width: 14,
    height: 16,
  },
  unselectedTabOpacity: {
    opacity: 0.5,
  },

});
