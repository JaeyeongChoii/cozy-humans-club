// 유저 프로필
import { Animated, View, Text, Image, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import GlobalScrollView from "./GlobalScrollView";
import { React, useState, useEffect, useCallback, useRef } from "react";
import Posts from "./Posts";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import MoreMenu from "./Moremenu";
import { useMoreMenu } from "./MoreMenuContext";
import { ColorTokens } from "../design/token/ColorTokens";
import { SafeAreaView } from "react-native-safe-area-context";
import { postApi } from "../api/postApi";
import { Spacing } from "../design/Spacing";
import DynamicButton from "./DynamicButton";
import ProfileMainHeader from "./ProfileMainHeader";
import ProfileRefreshIndicator from "./ProfileRefreshIndicator";
import ProfileStatusMessage from "./ProfileStatusMessage";
import { Typography } from "../design/Typography";
import { SearchTabTypes } from "../constants/SearchTabTypes";
import { BottomSheetTypes } from "../constants/bottomSheetTypes";
import { THEME, STROKE_WIDTH } from "../design/token/constantsTokens";
import ViewImage from "./ViewImage";
import Toast from "./Popup/Toast";
import Popup2Button from "./Popup2Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/BaseURL";
import { generateMoreMenuProps } from "../utils/userUtils";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../utils/scale";
import BackButton from "./BackButton";

const MIN_REFRESH_DURATION_MS = 2000;
const PINNED_TAB_BAR_TOP = 30;
const TAB_BAR_PULL_DISTANCE = 100;
const AnimatedGlobalScrollView = Animated.createAnimatedComponent(GlobalScrollView);

  const Userprofile = ({ route, onHostBottomSheet }) => {
  const navigation = useNavigation();
  const usercode = route?.params?.usercode;
  const [tabBarOffsetY, setTabBarOffsetY] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [postList, setPostList] = useState([]);
  const [commentList, setCommentList] = useState([]);

  // 유저 정보
  const userId = usercode;  // 갱신은 useFocusEffect 쪽에서 함
  const [writterId, setWritterId] = useState("");
  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState(require("../../tokenImage/defaultProfileImage.png"));
  const [statusMessage, setStatusMessage] = useState("");
  const [isProfileImageVisible, setIsProfileImageVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [relationshipUserId, setRelationshipUserId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [releasePopupType, setReleasePopupType] = useState(null);
  const [isFollow, setFollow] = useState(false); // 임시로 false
  const [following, setFollowing] = useState(0);
  const [follower, setFollower] = useState(0);
  const [showFollowStats, setShowFollowStats] = useState(true); // 팔로워/팔로잉 수 표시 여부
  const [refreshing, setRefreshing] = useState(false);

  // user_id에 붙어있는 불필요한 단어 제거
  const normalize = (code) => code ? String(code).replace(/^@/, '').trim().toLowerCase() : '';
  const user = ""

  const [selectedTab, setSelectedTab] = useState(SearchTabTypes.ALL);
  const { currentUserCode, closeMenu } = useMoreMenu();

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
        {[SearchTabTypes.ALL,
        SearchTabTypes.JAM,
        SearchTabTypes.JIN,
          "Comment",
        ].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPressIn={() => {
              handleTabPress(tab);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
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
            {tab !== "Comment" && (
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

  const onBlock = async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const targetId = writterId || userId;
      if (!idToken || !targetId) return;

      const response = await fetch(`${BASE_URL}/profile/block`, {
        method: isBlocked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ target_id: targetId }),
      });

      setToastMessage(response.ok ? "사용자가 차단되었어." : "차단에 실패했어. 다시 시도해줘.");
      setToastVisible(true);
    } catch (error) {
      console.error("Userprofile onBlock Error:", error);
      setToastMessage("오류가 발생했어.");
      setToastVisible(true);
    }
  };

  const onBlockAction = async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const targetId = writterId || userId;
      if (!idToken || !targetId) return;

      const response = await fetch(`${BASE_URL}/profile/block`, {
        method: isBlocked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ target_id: targetId }),
      });

      if (response.ok) {
        const nextBlocked = !isBlocked;
        setIsBlocked(nextBlocked);
        if (!nextBlocked) {
          await refreshProfileData({ clearBeforeLoad: true });
        }
        setToastMessage(nextBlocked ? "사용자가 차단되었어." : "차단이 해제되었어.");
      } else {
        setToastMessage("요청에 실패했어. 다시 시도해줘.");
      }
      setToastVisible(true);
    } catch (error) {
      console.error("Userprofile onBlock Error:", error);
      setToastMessage("오류가 발생했어.");
      setToastVisible(true);
    }
  };

  const onMute = async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const targetId = writterId || userId;
      if (!idToken || !targetId) return;

      const response = await fetch(`${BASE_URL}/profile/mute`, {
        method: isMuted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ target_id: targetId }),
      });

      if (response.ok) {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        setToastMessage(nextMuted ? "사용자가 뮤트되었어." : "뮤트가 해제되었어.");
      } else {
        setToastMessage("요청에 실패했어. 다시 시도해줘.");
      }
      setToastVisible(true);
    } catch (error) {
      console.error("Userprofile onMute Error:", error);
      setToastMessage("오류가 발생했어.");
      setToastVisible(true);
    }
  };

  const handleBlockMenuPress = () => {
    if (isBlocked) {
      setReleasePopupType("block");
      return;
    }

    onBlockAction();
  };

  const handleMuteMenuPress = () => {
    if (isMuted) {
      setReleasePopupType("mute");
      return;
    }

    onMute();
  };

  const handleReleaseConfirm = () => {
    const type = releasePopupType;
    setReleasePopupType(null);

    if (type === "block") {
      onBlockAction();
    } else if (type === "mute") {
      onMute();
    }
  };

  // 게시글 가져오는 함수
  const fetchPosts = async (tab, userId) => {
    try {
      if (tab === SearchTabTypes.ALL) {
        // console.log(`[Userprofile] '모두' 탭 데이터 로딩 중 - userId: ${userId}`);
        const [talkData, thinkData] = await Promise.all([
          postApi.fetchUserPost(userId, 'talk'),
          postApi.fetchUserPost(userId, 'think')
        ]);

        const combined = [...(talkData || []), ...(thinkData || [])];
        // console.log(`[Userprofile] '모두' 탭 로드 완료 - 자유: ${talkData?.length}, 진지: ${thinkData?.length}, 총: ${combined.length}`);
        setPostList(combined);
      } else {
        const type = (tab === SearchTabTypes.JAM) ? 'talk' : 'think';
        // console.log(`[Userprofile] '${tab}' 탭 데이터 로딩 중 - type: ${type}`);
        const data = await postApi.fetchUserPost(userId, type);
        // console.log(`[Userprofile] '${tab}' 탭 로드 완료 - 데이터 ${data?.length}건`);
        setPostList(data);
      }
    }
    catch (error) {
      console.error("Userprofile fetchPosts Error:", error);
    }
  };

  const fetchComments = async (userId) => {
    try {
      const data = await postApi.fetchUserPost(userId, "comment");
      setCommentList(data || []);
    } catch (error) {
      console.error("Userprofile fetchComments Error:", error);
    }
  };

  const refreshProfileData = useCallback(async ({
    clearBeforeLoad = false,
    showIndicator = false,
  } = {}) => {
    const refreshDelayPromise = showIndicator
      ? new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_DURATION_MS))
      : Promise.resolve();

    if (showIndicator) {
      setRefreshing(true);
    }

    if (clearBeforeLoad) {
      setRelationshipUserId(null);
      setIsBlocked(false);
      setHasBlockedMe(false);
      setPostList([]);
      setCommentList([]);
    }

    try {
      const profileInfo = await postApi.fetchProfileInfo(userId);

      if (profileInfo?.profileBlocked) {
        setWritterId(userId);
        setNickname("");
        setImageUrl(require("../../tokenImage/defaultProfileImage.png"));
        setStatusMessage("");
        setPostList([]);
        setCommentList([]);
        setIsBlocked(false);
        setHasBlockedMe(true);
        setIsMuted(false);
        setRelationshipUserId(userId);
        return;
      }

      const {
        currentId,
        currentNickname,
        currentImage,
        currentStatusMessage,
        currentHideFollowList,
        currentFollowCount,
        currentFollowerCount,
        blocked
      } = profileInfo || {};
      const isBlockedByMe = blocked === true;

      if (currentId) setWritterId(currentId);
      if (currentNickname) setNickname(currentNickname);
      if (currentImage) setImageUrl(currentImage);
      setStatusMessage(currentStatusMessage ?? "");
      setShowFollowStats(!currentHideFollowList ?? "");
      if (currentFollowCount != null) setFollowing(currentFollowCount);
      if (currentFollowerCount != null) setFollower(currentFollowerCount);

      const postsPromise = fetchPosts(SearchTabTypes.ALL, userId);
      const commentsPromise = fetchComments(userId);
      const [[followResult, muteList]] = await Promise.all([
        Promise.all([
          postApi.checkIsFollow(userId),
          postApi.pullMuteList(),
        ]),
        postsPromise,
        commentsPromise,
      ]);

      if (followResult !== undefined) {
        setFollow(followResult);
      }

      const targetIds = [currentId, userId].filter(Boolean).map(String);

      setIsBlocked(isBlockedByMe);
      setHasBlockedMe(false);
      setRelationshipUserId(userId);
      setIsMuted(
        Array.isArray(muteList) &&
        muteList.some((item) =>
          targetIds.includes(String(item.blocked_user_id ?? item.user_id ?? item.target_id))
        )
      );
    }
    catch (error) {
      console.error("Userprofile refresh error:", error);
    } finally {
      if (showIndicator) {
        await refreshDelayPromise;
        setRefreshing(false);
      }
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refreshProfileData({ clearBeforeLoad: true });
    }, [refreshProfileData])
  );

  // 버튼별로 서버에서 가져오는 데이터 지정
  const posts = (() => {
    switch (selectedTab) {
      case SearchTabTypes.ALL:
        return postList;
      case SearchTabTypes.JAM:
        return postList.filter((post) => post.postType === THEME.JAM);
      case SearchTabTypes.JIN:
        return postList.filter((post) => post.postType === THEME.JIN);
      case "Comment":
        return commentList;
      default:
        return [];
    }
  })();
  const emptyPostsMessage =
    selectedTab === "Comment"
      ? "아직까지 클럽에서 한번도 댓글을 올리지 않았어! "
      : "아직까지 클럽에서 아무 이야기도 하지 않았어!";

  const isCurrentRelationship =
    normalize(relationshipUserId) === normalize(userId);
  const blockRelation = !isCurrentRelationship
    ? "none"
    : hasBlockedMe
      ? "blockedByTarget"
      : isBlocked
        ? "blockedByMe"
        : "none";

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
            onRefresh={() => refreshProfileData({ showIndicator: true })}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
      >
        {/* 뒤로가기, 더보기 부분 */}
        <View style={styles.headerContainer}>
          <BackButton
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.moreMenuIconContainer}>
            <MoreMenu
              menuId={`profile_more_${usercode}`}
              options={[
                ...(normalize(user?.usercode) !== normalize(currentUserCode)
                  ? [
                    { label: "뮤트하기", onPress: () => console.log("뮤트하기 눌림") },
                    { label: "차단하기", onPress: () => console.log("차단하기 눌림") },
                  ]
                  : []),
                { label: "신고하기", onPress: () => console.log("신고하기 눌림") },
              ]}
              {...generateMoreMenuProps({
                data: {
                  usercode: userId,
                  name: nickname,
                },
                currentUserCode,
                menuId: `profile_more_${usercode}`,
                targetName: nickname || userId,
                isMuted,
                isBlocked,
                navigation,
                onBlock: handleBlockMenuPress,
                onMute: handleMuteMenuPress,
              })}
            />
          </View>
        </View>

        <ProfileMainHeader
          imageUrl={imageUrl}
          onProfileImagePress={() => setIsProfileImageVisible(true)}
          rightContent={
            <>
              {/* 팔로우/팔로잉 버튼 */}
              {normalize(user?.usercode || usercode) !== normalize(currentUserCode) && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={async () => {
                    if (isBlocked) {
                      handleBlockMenuPress();
                      return;
                    }

                    try {
                      // 1 : 팔로우 완료, 0: 팔로우 해제
                      const toggleResult = await postApi.toggleFollowButton(userId);

                      setFollow(toggleResult);
                    } catch (error) {
                      console.error("팔로우 상태 변경 누락:", error);
                    }
                  }}
                >
                  {isBlocked ? (
                    <DynamicButton
                      text={"차단해제하기"}
                      isPoint2={false}
                    />
                  ) : isFollow ?  // 차단 당하지 않을 경우 보여지는 버튼
                    <DynamicButton
                      text={"팔로잉"}
                      disabled={true}
                      isPoint2={false}
                    />
                    :
                    <DynamicButton
                      text={"팔로우"}
                      isPoint2={false}
                    />
                  }
                </TouchableOpacity>
              )}
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
            {showFollowStats && ( // 사용자가 팔로우/팔로잉 수를 보여주려할때만 사용
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
            )}
          </View>
          {/*유저 텍스트 데이터 부분 끝*/}
        </ProfileMainHeader>

        {/*여기서부터 하단 탭바 + 게시물 부분*/}
        {blockRelation !== "none" ? (
          /* 차단한 유저를 보는 화면  */
          <View style={styles.blockedMessageContainer}>
            <Text style={styles.blockedMessageText}>
              현재 이 멤버와 서로 차단된 상태야!
            </Text>
          </View>
        ) : (
          /* 탭바: 프로필 영역이 접히면 화면 상단에 고정 */
          <View style={styles.tabBarPlaceholder} onLayout={(event) => {
            setTabBarOffsetY(event.nativeEvent.layout.y);
          }} />
        )}
        {blockRelation === "none" && <ProfileRefreshIndicator refreshing={refreshing} />}

        {/* 게시물 리스트 */}
        {blockRelation === "none" && (
          posts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <Text style={styles.emptyPostsText}>
                {emptyPostsMessage}
              </Text>
            </View>
          ) : (
            posts.map((post, idx) => (
              <Posts
                key={post.id || idx}
                data={post}
                menuId={`profile-${selectedTab}-${post.id || idx}`}
                showPostTypeLabel={true}
                onRefresh={() => refreshProfileData()}
                onUpdatePost={(updatedData) => {
                  setPostList((prevPosts) =>
                    prevPosts.map((p) =>
                      p.id === updatedData.id && p.postType === updatedData.postType
                        ? { ...p, ...updatedData }
                        : p
                    )
                  );
                  setCommentList((prevComments) =>
                    prevComments.map((p) =>
                      p.id === updatedData.id && p.postType === updatedData.postType
                        ? { ...p, ...updatedData }
                        : p
                    )
                  );
                }}
                onHostBottomSheet={(type, options) =>
                  onHostBottomSheet(type, post, options)
                }
                withMoreMenu={false}
              />
            ))
          )
        )}
      </AnimatedGlobalScrollView>

      {blockRelation === "none" && tabBarOffsetY != null && (
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
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />

      <Popup2Button
        visible={releasePopupType !== null}
        onRequestClose={() => setReleasePopupType(null)}
        leftOnPress={() => setReleasePopupType(null)}
        rightOnPress={handleReleaseConfirm}
        mainText={
          releasePopupType === "block"
            ? "정말 이 멤버의 차단을 해제할래?"
            : "정말 이 멤버의 뮤트를 해제할래?"
        }
        leftText={"취소하기"}
        rightText={"해제하기"}
      />

      <ViewImage
        visible={isProfileImageVisible}
        onClose={() => setIsProfileImageVisible(false)}
        images={[imageUrl]}
        initialIndex={0}
        blockImageSave={true}
        meatballVisible={false}
      />
    </SafeAreaView>
  );
};

export default Userprofile;

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
    marginTop: 60,
  },
  headerBackButton: {
    position: "relative",
    marginTop: 0,
    marginLeft: 15,
  },
  moreMenuIconContainer: {
    height: 59,
    justifyContent: "center",
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
    height: 40,
    backgroundColor: ColorTokens.Background,
    paddingTop: Spacing[0],
  },
  animatedTabBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
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
    height: 40,
  },
  tabBarContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: 40,
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyPostsText: {
    ...Typography.boldMedium,
    color: ColorTokens.Point2,
    textAlign: "center",
  },
  tabIcon: {
    width: 18,
    height: 18,
  },
  unselectedTabOpacity: {
    opacity: 0.5,
  },
  commentTabIcon: {
    // 홈 댓글 아이콘과 동일한 크기
    width: 16,
    height: 12,
  },
  blockedMessageContainer: {
    position: "absolute",
    top: SCREEN_HEIGHT / 2,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  blockedMessageText: {
    ...Typography.headingMedium,
    color: ColorTokens.Point2,
    textAlign: "center",
  },
});
