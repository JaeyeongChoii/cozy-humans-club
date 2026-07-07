// import * as Notifications from "expo-notifications";

// 홈 화면. app.js에서 디폴트 값으로 지정되어 첫 화면으로 뜨는 부분.
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ImageBackground,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

// 컴포넌트
import Posts from "../components/Posts";
import WriteOverlay from "../components/WriteOverlay";
import Toast from "../components/Popup/Toast";
import TutorialModal from "../components/Tutorial/TutorialModal";
import { postApi } from "../api/postApi";
// TEMP: iOS 접속 차단 원인 확인을 위해 알림 유틸 import 비활성화
// import {
//   registerForPushNotificationsAsync,
//   scheduleTestNotificationAsync,
// } from "../utils/notifications";

// 이미지
import serviceBellImage from "../../tokenImage/serviceBell.png";

// 사용자 선언 변수
import { ColorTokens } from "../design/token/ColorTokens";
import { heightScale, widthScale } from "../utils/scale";
import { BottomSheetTypes } from "../constants/bottomSheetTypes";
import { useMoreMenu } from "../components/MoreMenuContext";

import { Animated } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRef } from "react";

// 네이티브 드라이버 스크롤 이벤트를 붙이려면 FlashList를 Animated 컴포넌트로 감싸야 한다.
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
import { THEME, TAB_BAR_HEIGHT } from "../design/token/constantsTokens";
import { Typography } from "../design/Typography";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useFeed } from "../queries/useFeed";
import { queryKeys } from "../queries/keys";


const logoBackgroundHeight = heightScale(155);
const logoMarginTop = heightScale(70);

// [수동 조절] 안드로이드에서만 자유/진지 탭 글자 상하 위치 미세조정 (단위: px)
// 음수 = 위로, 양수 = 아래로. iOS에는 영향 없음.
const JAM_JIN_TEXT_ANDROID_TOP = 2;
// 상단 아래 윤곽선과 탭의 간격을 없앰
const detailContainerMarginTop =
  logoBackgroundHeight - logoMarginTop - heightScale(70);

// LayoutAnimation은 Home에서 미사용 → 스크롤 중 예기치 않은 레이아웃 시프트 방지를 위해 제거
// (WritingExplain.js, ReportTargetInput.js에서 자체적으로 활성화함)

const Home = ({ onHostBottomSheet }) => {
  const [selectedTab, setSelectedTab] = useState(THEME.JAM); //디폴트로 jam
  const [showWriter, setShowWriter] = useState(false);
  // 튜토리얼 모달. 한 번 보여주면 다시 안보여줌 -> 기능 추가해야함
  const [modalVisible, setModalVisible] = useState(false);
  const { closeMenu, setCurrentUserCode } = useMoreMenu();
  const route = useRoute();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false); // UI/Spacer용
  const [nativeRefreshing, setNativeRefreshing] = useState(false); // RefreshControl 전용

  // 게시글 상태 (React Query 무한 쿼리로 관리 → 홈/라이브러리/상세가 ['feed', tab] 캐시 공유)
  const queryClient = useQueryClient();
  const {
    posts,
    isLoading: loading,
    isFetchingNextPage: isMoreLoading,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch: refetchFeed,
  } = useFeed(selectedTab);
  /* posts 내용물
    bookmark      : int      -> 북마크 수 
    comment       : int      -> 댓글 수
    header        : string   -> ,
    id            : int      -> 포스트 고유 id
    like          : int      -> 좋아요 수
    media         : json     -> 
    name          : string   -> 글쓴이 닉네임
    postType      : string   -> 글 타입 JAM/JIN
    posttext      : string   -> 글 내용
    profileImage  : string   -> 글쓴이 프로필 이미지
    quote_num     : int      -> 인용 수
    reported      : bool     -> ,
    timestamp     : int      -> 글 작성 시간(초)
    usercode      : string   -> 글쓴이 유저 Id
    view          : int      -> 조회수
    writer_id     : int      -> 글쓴이 고유 Id 
   */
  // 뮤트 관련 상태
  const [mutedUserCodes, setMutedUserCodes] = useState(new Set());

  // Toast 관련 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastPointMessage, setToastPointMessage] = useState("");

  // 최초 실행 시 AsyncStorage 체크 및 뮤트 목록 로드
  useEffect(() => {
    const fetchMuteList = async () => {
      try {
        const muteList = await postApi.pullMuteList();
        if (muteList && Array.isArray(muteList)) {
          const mutedCodes = new Set(muteList.map(item => item.user_id || item.target_id));
          setMutedUserCodes(mutedCodes);
        }
      } catch (error) {
        console.error("[Home] 뮤트 목록 동기화 중 에러:", error);
      }
    };

    const loadUserInfo = async () => {
      try {
        const { currentUser_id } = await postApi.fetchAccountInfo();
        if (currentUser_id) {
          // console.log("[Home] Setting currentUserCode in context:", currentUser_id);
          setCurrentUserCode(currentUser_id);

          // FCM 토큰 발급 및 백엔드 등록
          const token = null; // TEMP: iOS notification disabled
          if (token) {
            try {
              const os = Platform.OS;
              const response = await postApi.registerFcmToken(os, token);
              if (response.success) {
                console.log("[Home] FCM token 백엔드 등록 성공");
              } else {
                console.error(`[Home] FCM token 등록 실패. 상태: ${response?.status}. 백엔드 문제일 수 있습니다.`);
              }
            } catch (apiError) {
              console.error("[Home] FCM token 등록 중 API 에러:", apiError);
            }
          }
        }
      } catch (error) {
        console.error("Home loadUserInfo Error:", error);
      }
    };

    loadUserInfo();
    fetchMuteList();

    const checkTutorial = async () => {
      const hasSeen = await AsyncStorage.getItem("hasSeenTutorial");
      const showFromParam = route.params?.showTutorial;

      console.log(`[Home] checkTutorial - hasSeen: ${hasSeen}, showFromParam: ${showFromParam}`);

      // 본적이 없거나, 튜토리얼 페이지에서 명시적으로 보여주라고 한 경우
      if (hasSeen !== "true" || showFromParam) {
        setModalVisible(true);
        // 기록 남기기 (한 번 보면 다시 안 뜨게)
        if (hasSeen !== "true") {
          await AsyncStorage.setItem("hasSeenTutorial", "true");
        }
      }
    };
    checkTutorial();
  }, [route.params?.showTutorial]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    closeMenu();
  };

  // 게시글 가져오기(새로고침) — useInfiniteQuery의 refetch로 대체.
  // 기존 호출부(triggerRefresh/renderItem/onPostSuccess 등)와 호환되도록 Promise를 반환한다.
  // 인자(tab/pageNum)는 useFeed(selectedTab)가 이미 처리하므로 무시한다.
  const fetchPosts = useCallback(() => refetchFeed(), [refetchFeed]);

  // 추가 데이터 불러오기 — 다음 페이지 패칭
  const handleLoadMore = () => {
    if (!hasMore || loading || isMoreLoading) {
      // console.log("[Home] 추가 로딩 스킵:", { hasMore, loading, isMoreLoading });
      return;
    }

    fetchNextPage();
  };

  // 한 게시글의 정보만 업데이트하는 함수 → ['feed', 탭] 캐시를 직접 갱신.
  // 어느 탭에 있든 반영되도록 두 탭 캐시를 모두 패치한다.
  const handleUpdatePost = useCallback((updatedData) => {
    const patch = (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((post) =>
            post.id === updatedData.id && post.postType === updatedData.postType
              ? { ...post, ...updatedData }
              : post
          )
        ),
      };
    };
    queryClient.setQueryData(queryKeys.feed(THEME.JAM), patch);
    queryClient.setQueryData(queryKeys.feed(THEME.JIN), patch);
  }, [queryClient]);

  // 좋아요/북마크/삭제는 이제 이벤트버스가 아니라 공유 RQ 캐시(postCacheSync)로 직접 반영되므로
  // 여기서 post_updated/post_deleted를 따로 수신할 필요가 없다.

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

  // 탭 변경 시 데이터 패칭은 useFeed(selectedTab)의 queryKey 변경으로 자동 처리된다.

  // 다른 화면(검색 등)에서 돌아올 때, 데이터가 실제로 stale한 경우에만 재검증한다.
  // refetchFeed()는 명시적 호출이라 refetchOnWindowFocus:false나 staleTime을 무시하고
  // 항상 서버를 호출한다. 안드로이드에서 시트 닫기(PanGesture/백버튼)가 useFocusEffect를
  // 재발화시키면, 방금 setQueryData로 쓴 신선한 낙관적 값을 서버의 지연된 응답이 덮어써
  // "4였다가 3으로 돌아가는" 버그가 생긴다. dataUpdatedAt 기준으로 stale 여부를 직접
  // 확인해 신선한 경우 refetch를 건너뛴다.
  useFocusEffect(
    useCallback(() => {
      const state = queryClient.getQueryState(queryKeys.feed(selectedTab));
      const age = state?.dataUpdatedAt
        ? Date.now() - state.dataUpdatedAt
        : Infinity;
      if (age > 1000 * 30) {
        refetchFeed();
      }
    }, [refetchFeed, queryClient, selectedTab])
  );

  // 모달 닫기 함수
  const closeModal = () => {
    setModalVisible(false); // 닫히면 다시는 안보여줌 -> 기능 추가해야함
  };


  // 스크롤 시 상단 헤더 사라짐 — 네이티브 드라이버로 처리(JS 스레드 부담 제거).
  // 스크롤 y를 scrollY에 네이티브로 바인딩하고, diffClamp로 "아래로 스크롤=숨김 / 위로=노출"을
  // 네이티브에서 계산한다. 더 이상 onScroll에서 JS로 setValue 하지 않는다.
  const scrollY = useRef(new Animated.Value(0)).current;
  // iOS는 당겨서 새로고침 시 contentOffset.y가 음수로 내려갔다가 0으로 복귀한다.
  // diffClamp는 값의 변화량을 누적하므로, 이 "음수→0 복귀"를 아래로 스크롤로 오인해
  // 헤더(상단 탭바)를 숨겨버리고, 새로고침을 반복할수록 오차가 누적되어 탭바가 점점
  // 위로 올라가며 새로고침이 끝나도 원위치로 내려오지 않는다.
  // 음수(바운스) 구간을 0으로 클램프한 값을 diffClamp에 넣어 바운스가 헤더 위치에
  // 영향을 주지 않도록 한다. (안드로이드는 바운스가 없어 기존과 동일하게 동작)
  const clampedScrollY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: "clamp",
      }),
    [scrollY]
  );
  // 0(상단/위로 올림) ~ logoBackgroundHeight(아래로 스크롤) 사이로 누적 클램프
  const headerClamp = useMemo(
    () => Animated.diffClamp(clampedScrollY, 0, logoBackgroundHeight),
    [clampedScrollY]
  );
  // 헤더 뷰 translateY: 0(노출) ~ -logoBackgroundHeight(숨김)
  const headerTranslateY = useMemo(
    () =>
      headerClamp.interpolate({
        inputRange: [0, logoBackgroundHeight],
        outputRange: [0, -logoBackgroundHeight],
        extrapolate: "clamp",
      }),
    [headerClamp]
  );
  // 새로고침 인디케이터: 헤더와 함께 완전히 숨겨지도록(헤더높이 + GIF높이 만큼)
  const refreshIndicatorTranslateY = useMemo(
    () =>
      headerClamp.interpolate({
        inputRange: [0, logoBackgroundHeight],
        outputRange: [0, -(logoBackgroundHeight + 120)],
        extrapolate: "clamp",
      }),
    [headerClamp]
  );
  // 당겨서 새로고침 양: 상단에서 위로 당기면(scrollY 음수) 0~200으로 매핑
  const pullAmount = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-200, 0],
        outputRange: [200, 0],
        extrapolate: "clamp",
      }),
    [scrollY]
  );
  // 네이티브 드라이버 스크롤 이벤트 (JS 리스너 없음)
  const onScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY]
  );

  // 새로고침 높이 애니메이션
  const refreshHeightAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // 홈 탭이 이미 활성화된 상태에서 탭 아이콘을 다시 누르면 피드 최상단으로 부드럽게 스크롤
  // (인스타그램 동작 참고). 다른 탭에서 홈으로 진입할 때는 동작하지 않음.
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          BackHandler.exitApp();
          return true;
        },
      );

      return () => backHandler.remove();
    }, []),
  );

  // 헤더 표시/숨김 + 당겨서 새로고침 인디케이터는 이제 scrollY 기반 네이티브 드라이버로 처리한다.
  // (handleScroll에서 매 프레임 JS로 setValue 하던 부담 제거)
  // 페이지네이션은 FlashList의 onEndReached로, 메뉴 닫기는 onScrollBeginDrag로 처리.

  const triggerRefresh = (currentOffset = 0) => {
    // <RULE[p-test.md]> 로그 추가
    console.log(`[Home] triggerRefresh 호출됨. offset: ${currentOffset}`);
    setRefreshing(true);
    setNativeRefreshing(false); // 네이티브 스피너는 즉시 종료해서 translateY와 충돌 방지

    // 상단 당기기일 때(보통 -50 이하) Spacer 공간 확보 및 2초 대기 준비
    const isTopPull = currentOffset < -50;
    if (isTopPull) {
      console.log("[Home] 상단 당기기 감지 - Spacer 애니메이션 시작");

      // <RULE[p-test.md]> 튐 현상 방지: 시작 높이를 현재 당긴 만큼으로 설정
      const startHeight = Math.abs(currentOffset);
      refreshHeightAnim.setValue(startHeight);
      console.log(`[Home] Spacer 시작 높이 설정: ${startHeight}`);

      Animated.timing(refreshHeightAnim, {
        toValue: 120, // 목표 높이
        duration: 250, // 조금 더 빠르게 반응
        useNativeDriver: true, // translateY는 네이티브 드라이버 지원 가능
      }).start(() => {
        console.log("[Home] Spacer 전개 완료 (120px)");
      });

      // 기존의 scrollTo는 제거된 상태 유지
    }

    // 1. 데이터 페칭 (서버에서 새로운 게시글 로드)
    // 2. 상단 당기기인 경우 최소 2초 대기 타이머
    const fetchPromise = fetchPosts(selectedTab);
    const delayPromise = isTopPull
      ? new Promise(resolve => setTimeout(() => {
        // console.log("[Home] 2초 지연 시간 완료");
        resolve();
      }, 2000))
      : Promise.resolve();

    Promise.all([fetchPromise, delayPromise]).then(() => {
      console.log("[Home] 새로고침 데이터 수신 완료 및 지연 종료. 정리 작업 시작.");
      
      // 뮤트 목록도 함께 갱신 (fetchMuteList는 이제 useEffect 외부에서 정의되지 않았으므로 수동 호출하거나 함수 추출 필요)
      // 여기서는 pullMuteList를 직접 호출하여 상태 업데이트
      postApi.pullMuteList().then(muteList => {
        if (muteList && Array.isArray(muteList)) {
          setMutedUserCodes(new Set(muteList.map(item => item.user_id || item.target_id)));
        }
      });

      Animated.timing(refreshHeightAnim, {
        toValue: 0,
        duration: 150, // 속도 대폭 향상 (기존 250ms)
        useNativeDriver: true,
      }).start(() => {
        setRefreshing(false);
        console.log("[Home] 새로고침 루프 종료. refreshing 상태: false");
      });
    }).catch(error => {
      console.error("[Home] triggerRefresh 중 에러 발생:", error);
      setRefreshing(false);
      refreshHeightAnim.setValue(0);
    });
  };

  const handleHostBottomSheet = (type, data, options) => {
    // 바텀시트/상세를 열기 전, 루트 오버레이로 떠 있을 수 있는 미트볼 메뉴를 닫는다.
    closeMenu();
    // (헤더 위치는 이제 scrollY 기반 네이티브 드라이버로만 제어 — 수동 노출 spring 제거)
    onHostBottomSheet(type, data, options); // 기존 동작 유지 (부모로 이벤트 전달)
  };

  const renderItem = useCallback(({ item, index }) => (
    <Posts
      key={item.id || index}
      data={item}
      menuId={`${selectedTab}-${item.id || index}`}
      onRefresh={() => {
        fetchPosts(selectedTab);
        // 뮤트 상태도 함께 갱신
        postApi.pullMuteList().then(muteList => {
          if (muteList && Array.isArray(muteList)) {
            setMutedUserCodes(new Set(muteList.map(m => m.user_id || m.target_id)));
          }
        });
      }}
      onUpdatePost={handleUpdatePost}
      dismissMenuOnScroll={true}
      isMuted={mutedUserCodes.has(item.writer_id) || mutedUserCodes.has(item.usercode)}
      onHostBottomSheet={(type, post, options) =>
        handleHostBottomSheet(type, post || item, { ...options, onRefresh: () => fetchPosts(selectedTab) })
      }
    />
  ), [selectedTab, handleUpdatePost, handleHostBottomSheet, mutedUserCodes]);

  // FlatList용 헤더 컴포넌트
  const ListHeader = useCallback(() => (
    <View style={{ height: logoBackgroundHeight }} />
  ), []);

  // FlatList용 푸터 컴포넌트
  const ListFooter = useCallback(() => (
    <>
      {isMoreLoading && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={ColorTokens.Point} />
        </View>
      )}
      <View style={{ height: TAB_BAR_HEIGHT + 60 }} />
    </>
  ), [isMoreLoading]);




  return (
    <SafeAreaView style={styles.fullScreenArea} edges={[]}>
      {/* TutorialModal */}
      <TutorialModal
        visible={modalVisible} // 모달 표시 여부 전달
        onClose={closeModal} // 모달 닫기 함수 전달
      />

      {/* 새로고침 로딩 인디케이터 (배경 뒤에 위치) 
          당기고 있거나(pullAmountAnim > 0) 새로고침/로딩 중일 때 표시 */}
      <Animated.View style={{
        position: 'absolute',
        top: logoBackgroundHeight,
        left: 0,
        right: 0,
        height: 120, // 공간 확보에 맞춤
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0, // 컨텐츠 뒤로 이동 (사용자 요청)
        backgroundColor: ColorTokens.Black,
        // <RULE[p-test.md]> 헤더와 함께 '완전히' 숨겨지도록 보간법 적용 (헤더높이 + GIF높이 만큼 이동)
        transform: [{
          translateY: refreshIndicatorTranslateY
        }],
        opacity: refreshing || loading ? 1 : pullAmount.interpolate({
          inputRange: [0, 100],
          outputRange: [0, 1],
          extrapolate: 'clamp'
        }),
      }}>
        <Animated.Image
          source={require("../../tokenImage/animation_512px.gif")}
          style={{
            width: 100,
            height: 100,
            transform: [{
              scale: refreshing || loading ? 1 : pullAmount.interpolate({
                inputRange: [0, 200],
                outputRange: [0.5, 1],
                extrapolate: 'clamp'
              })
            }]
          }}
        />
      </Animated.View>


      {/* 홈화면 윗부분 디자인 */}
      <Animated.View
        style={[
          styles.logoBackground,
          {
            transform: [{ translateY: headerTranslateY }], // 네이티브 diffClamp 값으로 헤더 이동
            position: "absolute",  // 항상 위에 띄우기
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            borderBottomColor: selectedTab === THEME.JAM ? ColorTokens.Point : ColorTokens.Point2,
            borderBottomWidth: 1.5,
          },
        ]}
      >
        {/* 제목 */}
        <View style={styles.logo}>
          {/*
          <Text style={Tokens.deeptalktoken}>DeepTalk</Text>
           */}
        </View>

        {/* all, jam, jin, 서비스 벨 컨테이너 */}
        <View style={styles.detailContainer}>
          {/* jam, jin 탭 */}
          <View style={styles.jam_jinTab}>
            {/* all 탭 
            <TouchableOpacity onPress={() => handleTabChange(THEME.ALL)}>
              <Image
                source={require("../../tokenImage/allTab.png")}
                style={[
                  styles.jam_jin_TabStyle,
                  {
                    opacity: selectedTab === THEME.ALL ? 1 : 0.6,
                  },
                ]}
              />
            </TouchableOpacity>
            */}
            {/* JAM */}
            <TouchableOpacity onPress={() => handleTabChange(THEME.JAM)}>
              <ImageBackground
                source={
                  require("../../tokenImage/themeFrame.png")
                }
                resizeMode="contain"
                style={[
                  styles.jam_jin_TabStyle,
                  {
                    opacity: selectedTab === THEME.JAM ? 1 : 0.6,
                  },
                ]}
              >
                <Text
                  style={styles.nextBarText}
                >
                  {THEME.JAM}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
            {/* JIN */}
            <TouchableOpacity onPress={() => handleTabChange(THEME.JIN)}>
              <ImageBackground
                source={
                  require("../../tokenImage/themeFrameJIN.png")
                }
                resizeMode="contain"
                style={[
                  styles.jam_jin_TabStyle,
                  {
                    opacity: selectedTab === THEME.JIN ? 1 : 0.6,
                  },
                ]}
              >
                <Text
                  style={styles.nextBarJinText
                  }
                >
                  {THEME.JIN}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
          {/* 서비스 벨 */}
          {/* Todo : onPress바꾸기. fcm token를 실험하는데 쓰기위해 바꿈, 현재 임시 비활성화 */}
          <TouchableOpacity
            // onPress={async () => {
            //   try {
            //     console.log("[Home] 서비스 벨 클릭 - FCM 토큰 등록 실험 시작");

            //     // 1. 토큰 가져오기 시도
            //     console.log("[Home] 디바이스 푸시 토큰 요청 중...");
            //     const tokenData = await Notifications.getDevicePushTokenAsync();
            //     const token = tokenData.data;
            //     const os = Platform.OS;

            //     if (!token) {
            //       console.error("[Home] FCM 토큰을 가져오지 못했습니다. 시뮬레이터 환경이거나 권한 문제일 수 있습니다.");
            //       return;
            //     }

            //     console.log(`[Home] 토큰 획득 성공: ${token.substring(0, 20)}..., OS: ${os}`);

            //     // 2. API 호출
            //     const response = await postApi.registerFcmToken(os, token);

            //     // <RULE[p-test.md]> 응답 결과 상세 로그
            //     console.log("[Home] registerFcmToken API 응답:", JSON.stringify(response, null, 2));

            //     if (response.success) {
            //       console.log("[Home] fcm token 등록 성공");
            //     } else {
            //       // 백엔드 문제 가능성 제시
            //       console.error(`[Home] fcm token 등록 실패. 상태 코드: ${response.status}. 백엔드 API 명세와 일치하는지 확인이 필요합니다.`);
            //     }
            //   } catch (error) {
            //     console.error("[Home] FCM 실험 중 예외 발생:", error);
            //     // <RULE[p-test.md]> 오류 원인 분석 및 제시
            //     if (error.message.includes("permission")) {
            //       console.warn("[Home] 알림 권한이 거부된 상태일 수 있습니다.");
            //     } else if (error.message.includes("Network request failed")) {
            //       console.warn("[Home] 네트워크 연결 상태를 확인해 주세요.");
            //     }
            //   }
            // }}
            onPress={() => onHostBottomSheet(BottomSheetTypes.ALERTS)}
            onLongPress={async () => {
              console.log("[Home] Local test notification disabled temporarily.");
            }}
          >
            <Image source={serviceBellImage} style={styles.serviceBell} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* 글 쓰기(플로팅) 버튼 */}
      <TouchableOpacity
        style={styles.writeButtonContainer}
        onPress={() => setShowWriter(true)}
      >
        <Image
          source={require("../../tokenImage/floatingButton.png")}
          style={styles.writeButton}
        />
      </TouchableOpacity>

      {/* 글 쓰기 오버레이
          RN Modal 대신 '앱과 같은 윈도우' 오버레이로 띄운다. 같은 윈도우라 닫을 때 키보드와 화면이
          자연스럽게 함께 내려간다(iOS Modal에서 키보드가 뒤늦게 내려가며 버벅이던 문제 해결).
          앱 루트에 SafeAreaProvider가 있어 Write 내부 SafeAreaView 인셋도 그대로 동작한다. */}
      <WriteOverlay
        visible={showWriter}
        onClose={() => setShowWriter(false)} //onclose 함수 정의
        onPostSuccess={async () => {
          // 새 글 작성 후 피드를 새로고침하고, 스크롤을 최상단으로 이동시켜
          // 방금 작성한 글이 바로 보이도록 한다.
          await fetchPosts(selectedTab);
          // await 직후는 RQ 캐시만 갱신된 시점이라, 새 글 삽입으로 인한 리렌더와
          // FlashList의 네이티브 레이아웃이 아직 반영되지 않았다. 이 시점에 스크롤하면
          // 새 글 높이만큼 덜 올라가거나(iOS) 애니메이션 중 오프셋 재계산으로 멈춘다(Android).
          // 레이아웃이 반영되는 다음 프레임까지 기다린 뒤 스크롤한다.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Android는 RecyclerView 기반이라 먼 거리로의 애니메이션 스크롤(smoothScroll)이
              // 감속 한계로 목표에 못 미치고 중간에 멈추는 이슈가 있다. iOS(UIScrollView)는
              // 문제없이 끝까지 올라가므로, Android만 즉시 점프(animated:false)로 확실히 이동시킨다.
              scrollViewRef.current?.scrollToOffset({
                offset: 0,
                animated: Platform.OS === "ios",
              });
            });
          });
        }}
        postType={selectedTab}
      />

      {/* 메인 관리 */}
      {/* 콘텐츠 영역: headerAnim 제거로 피드백 루프(헤더숨김→콘텐츠이동→offset변경→헤더토글) 차단 */}
      <Animated.View style={{
        flex: 1,
        transform: [{ translateY: refreshHeightAnim }],
        zIndex: 1,
      }}>
        {/*
          FlashList(@shopify/flash-list v2): 셀을 마운트/언마운트 대신 재활용(recycle)해
          무거운 피드의 빠른 스크롤 성능을 크게 개선한다(특히 iOS).
          v2는 estimatedItemSize가 필요 없고 자동 측정한다.
          FlatList 전용 튜닝 prop(windowSize/maxToRenderPerBatch/initialNumToRender/
          removeClippedSubviews)은 FlashList에서 불필요하므로 제거했다.
        */}
        <AnimatedFlashList
          ref={scrollViewRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          scrollEventThrottle={16}
          onScroll={onScrollEvent}
          onScrollBeginDrag={() => closeMenu()}
          overScrollMode="always"
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={nativeRefreshing}
              onRefresh={() => {
                setNativeRefreshing(true);
                triggerRefresh(-100);
              }}
              tintColor={ColorTokens.Point}
              colors={[ColorTokens.Point]}
            />
          }
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          // 화면 밖으로 더 멀리(약 2~3화면) 미리 렌더 → 이미지가 보이기 전에 미리 디코딩되어
          // 스크롤 중 이미지에서 버벅이는 현상을 줄인다(라이브러리가 전부 미리 렌더해 매끄러운 것과 동일 원리).
          drawDistance={1500}
        />
      </Animated.View>

      <Toast
        visible={toastVisible}
        pointMessage={toastPointMessage}
        message={toastMessage}
        onDismiss={() => {
          setToastVisible(false);
          setToastPointMessage("");
        }}
      />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  fullScreenArea: {
    // 위치 조정
    flex: 1,
    backgroundColor: ColorTokens.Black,
  },
  logoBackground: {
    // 색상 조정
    backgroundColor: ColorTokens.Main,
    // 위치 조정
    height: logoBackgroundHeight,
    justifyContent: "center",
    alignItems: "center",
    // 레이아웃 속성
  },
  logo: {
    // 위치 조정
    marginTop: logoMarginTop,
    height: 25,
  },
  detailContainer: {
    // 위치 조정
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: detailContainerMarginTop,
    paddingLeft: 8,
    top: Platform.select({ ios: 0, android: -3 }),
    // 레이아웃 속성
    width: "100%",
  },
  jam_jinTab: {
    // 위치 조정
    flexDirection: "row",
  },
  jam_jin_TabStyle: {
    // 위치 조정
    justifyContent: "center", //글씨를 중양에 정렬
    alignItems: "center",
    width: 94,
    height: 44,
  },
  nextBarText: {
    // 폰트 조정
    ...Typography.boldMedium,
    color: ColorTokens.Point,
    // iOS는 기존대로 2px, 안드로이드는 상단 JAM_JIN_TEXT_ANDROID_TOP 값으로 수동 조절
    top: Platform.OS === "android" ? JAM_JIN_TEXT_ANDROID_TOP : 2,
    // 안드로이드는 lineHeight(22) 박스 안에서 글자가 위로 쏠려 정렬됨 → 수직 중앙으로 보정 (iOS는 무시되는 속성)
    ...(Platform.OS === "android" && { textAlignVertical: "center" }),
  },
  nextBarJinText: {
    // 폰트 조정
    ...Typography.boldMedium,
    color: ColorTokens.Point2,
    // iOS는 기존대로 2px, 안드로이드는 상단 JAM_JIN_TEXT_ANDROID_TOP 값으로 수동 조절
    top: Platform.OS === "android" ? JAM_JIN_TEXT_ANDROID_TOP : 2,
    // 안드로이드는 lineHeight(22) 박스 안에서 글자가 위로 쏠려 정렬됨 → 수직 중앙으로 보정 (iOS는 무시되는 속성)
    ...(Platform.OS === "android" && { textAlignVertical: "center" }),
  },
  jam_jin: {
    // 위치 조정
    flexDirection: "row",
    alignItems: "center",
  },
  serviceBell: {
    // 위치 조정
    right: 15,
    top: 4,
    // 레이아웃 속성
    width: 30,
    height: 30,
  },
  writeButtonContainer: {
    // 위치 조정
    position: "absolute",
    left: widthScale(306),
    top: heightScale(630),
    // 레이아웃 속성
    zIndex: 50,
  },
  writeButton: {
    // 위치 조정
    justifyContent: "center", // 세로 중앙에 정렬
    alignItems: "center", // 가로 중앙에 정렬
    // 레이아웃 속성
    width: 62,
    height: 62,
  },
  detailWriteButton: {
    // 레이아웃 속성
    width: 34,
    height: 34,
  },
  mainContainer: {
    // 색상 조정
    backgroundColor: 'transparent',
  },
});
