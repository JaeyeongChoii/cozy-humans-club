// App.js
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Image, Platform, View, TouchableOpacity, Keyboard, AppState, DeviceEventEmitter } from "react-native";
import { useState, useEffect, useRef } from "react";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { queryClient } from "./src/lib/queryClient";

// 스크린
import Shortcut from "./src/screens/Shortcut";
import Lab from "./src/screens/Lab";

import Splash from "./src/screens/Splash";
import OverLimit from "./src/screens/OverLimit";
// LandingPage 삭제됨
import OnboardingScreen from "./src/screens/OnboardingScreen";
import TutorialPage from "./src/screens/TutorialPage";
import Dialogue from "./src/screens/Dialogue";

import Home from "./src/screens/Home";
import SearchFrame from "./src/screens/SearchFrame";
import Library from "./src/screens/Library";
import Userprofile from "./src/components/Userprofile";

import SettingHome from "./src/screens/SettingHome";
import SettingFrame from "./src/screens/SettingFrame";
import DeletingAccountFrame from "./src/screens/DeletingAccountFrame";

// 컴포넌트
import Correction from "./src/components/Correction";
import AlertsList from "./src/components/BottomSheet/AlertsList";
import ScreenshotProtection from "./src/components/ScreenshotProtection";

// 사용자 정의 변수
import { BottomSheetTypes } from "./src/constants/bottomSheetTypes";
import { ColorTokens } from "./src/design/token/ColorTokens";
import Fonts from "./Fonts";
import BottomSheetFrame from "./src/components/BottomSheetFrame";
import LikersList from "./src/components/BottomSheet/LikersList";
import QuotoList from "./src/components/BottomSheet/QuotoList";
import Postbottom from "./src/components/BottomSheet/Postbottom";
import { TAB_BAR_HEIGHT } from "./src/design/token/constantsTokens";
import { MoreMenuProvider } from "./src/components/MoreMenuContext";
import { ToastProvider } from "./src/components/ToastContext";
import FollowList from "./src/components/BottomSheet/FollowList";
import { appLaunchApi } from "./src/api/appLaunchApi";
import { WRITE_OVERLAY_EVENT } from "./src/components/WriteOverlay";

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

// 탭 이름별 아이콘 매핑
const TAB_ICONS = {
  Home: require("./tokenImage/homeIcon.png"),
  SearchFrame: require("./tokenImage/searchIcon.png"),
  Library: require("./tokenImage/personIcon.png"),
};

// 하단 커스텀 탭바 (Material Top Tabs는 기본 탭바가 상단/라벨형이라 직접 구성)
const BottomTabBar = ({ state, navigation, bottomInset }) => {
  // 키보드가 올라오면 탭바 숨김 (기존 tabBarHideOnKeyboard 동작 재현)
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 글쓰기 오버레이가 떠 있는 동안 탭바 숨김.
  // (오버레이는 씬 안에 absolute로 떠서 씬 바깥 하단의 탭바를 덮지 못한다. 특히 투표 기간
  //  피커를 열 때 키보드가 내려가며 탭바가 다시 보이던 문제를 이 신호로 막는다.)
  const [writeOverlayVisible, setWriteOverlayVisible] = useState(false);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      WRITE_OVERLAY_EVENT,
      (visible) => setWriteOverlayVisible(!!visible),
    );
    return () => sub.remove();
  }, []);

  if (keyboardVisible || writeOverlayVisible) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        height: TAB_BAR_HEIGHT + bottomInset,
        backgroundColor: ColorTokens.Background2,
        borderTopColor: ColorTokens.Navigation,
        borderTopWidth: 0,
        paddingBottom: bottomInset,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const iconSource = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            activeOpacity={0.8}
            style={{
              flex: 1,
              height: TAB_BAR_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {iconSource && (
              <Image
                source={iconSource}
                style={{
                  width: 24,
                  height: 24,
                  opacity: focused ? 1 : 0.5,
                  marginBottom: 5
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// 탭 네비게이터 별도로 분리 (스와이프로 탭 전환 가능)
const TabNavigator = ({ openModal }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <BottomTabBar {...props} bottomInset={bottomInset} />}
      sceneContainerStyle={{ backgroundColor: ColorTokens.Background }}
      screenOptions={{
        swipeEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="Home">
        {() => <Home onHostBottomSheet={openModal} />}
      </Tab.Screen>
      <Tab.Screen name="SearchFrame">
        {() => <SearchFrame onHostBottomSheet={openModal} />}
      </Tab.Screen>
      <Tab.Screen name="Library">
        {() => <Library onHostBottomSheet={openModal} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function App() {
  const appState = useRef(AppState.currentState);
  // 바텀시트 '스택'. 글세부에서 댓글(대댓글) 상세를 열면 위로 쌓이고, 닫기/뒤로가기는
  // 한 단계씩 pop되어 이전 시트(예: 글세부)로 돌아간다. 비어 있으면 시트가 완전히 닫힌다.
  // 각 항목: { type, post, like, focusInput, onUpdate, onRefresh }
  const [sheetStack, setSheetStack] = useState([]);
  const [loaded, error] = Fonts();

  useEffect(() => {
    appLaunchApi.recordAppLaunch();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        appLaunchApi.recordAppLaunch();
      }

      // React Query focus 동기화.
      // setFocused(true)는 진짜 background/inactive → active 전환일 때만 호출한다.
      // 안드로이드에서 키보드 열기/닫기 등으로 AppState가 순간 'active'로 튀는 경우
      // (블립)에 반응하면 stale 쿼리가 불필요하게 재요청되어 낙관적 업데이트를 덮어쓴다.
      if (Platform.OS !== "web") {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          focusManager.setFocused(true);
        } else if (nextAppState !== "active") {
          focusManager.setFocused(false);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 바텀시트 열기 — 스택에 새 시트를 push (이전 시트는 아래에 보존된다)
  const openModal = (type, post = null, options = {}) => {
    setSheetStack((prev) => [
      ...prev,
      {
        type,
        post,
        like: post?.like ?? 0,
        focusInput: !!options.focusInput,
        onUpdate: options.onUpdate || null,
        onRefresh: options.onRefresh || null,
      },
    ]);
  };

  // 한 단계 뒤로 (스택 pop). 마지막 한 장이면 시트가 완전히 닫힌다.
  // → 글세부 위에 댓글 상세를 열었다가 닫으면 홈이 아니라 글세부로 돌아온다.
  // pop으로 '다시 드러나는' 시트는 재-포커스(키보드 재등장)를 막기 위해 focusInput을 해제한다.
  // (focusInput은 최초 열 때 한 번만 의미가 있고, 되돌아올 땐 키보드가 뜨면 안 된다.)
  const goBack = () =>
    setSheetStack((prev) => {
      const next = prev.slice(0, -1);
      const last = next[next.length - 1];
      if (last && last.focusInput) {
        next[next.length - 1] = { ...last, focusInput: false };
      }
      return next;
    });

  // 좋아요 상태 변경 → 현재(최상단) 시트 항목의 like/post를 갱신하고, '변경된 필드만' 콜백에 전달.
  // (selectedPost 전체 스냅샷을 넘기면 그 사이 invalidate로 갱신된 comment 수 등을 옛값으로 덮어씀)
  const handleSetLike = (newLike, newIsLiked) => {
    const top = sheetStack[sheetStack.length - 1];
    if (!top?.post) return;
    const finalIsLiked = newIsLiked !== undefined ? newIsLiked : top.post.isLiked;

    if (top.onUpdate) {
      top.onUpdate({
        id: top.post.id,
        postType: top.post.postType,
        like: newLike,
        isLiked: finalIsLiked,
      });
    }

    setSheetStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const t = next[next.length - 1];
      next[next.length - 1] = {
        ...t,
        like: newLike,
        post: { ...t.post, like: newLike, isLiked: finalIsLiked },
      };
      return next;
    });
  };

  // 시트 한 장의 내용을 타입에 맞게 렌더한다.
  // - index: 스택 내 절대 위치. 인스턴스 보존용 key로 사용한다(배경↔최상단 전환 시 재마운트 방지).
  // - 입력 자동 포커스(focusInput)는 '첫 번째 depth(index 0)'에서만 허용한다.
  //   배경 시트이거나 depth 2 이상(대댓글 등)으로 넘어갈 땐 카드만 전환되고 키보드는 뜨지 않게 한다.
  const renderSheetContent = (entry, index, { isBackground = false } = {}) => {
    if (!entry) return null;
    switch (entry.type) {
      case BottomSheetTypes.POST:
        return (
          <Postbottom
            key={`post-${entry.post?.id}-${index}`}
            onClose={goBack}
            post={entry.post}
            like={entry.like}
            setLike={handleSetLike}
            onHostBottomSheet={openModal}
            focusInput={isBackground || index >= 1 ? false : entry.focusInput}
            onRefresh={entry.onRefresh}
          />
        );
      case BottomSheetTypes.QUOTO:
        return (
          <QuotoList
            onClose={goBack}
            post={entry.post}
            like={entry.like}
            setLike={handleSetLike}
            onHostBottomSheet={openModal}
          />
        );
      case BottomSheetTypes.ALERTS:
        return <AlertsList onClose={goBack} />;
      case BottomSheetTypes.LIKE:
        return <LikersList onClose={goBack} post={entry.post} />;
      case BottomSheetTypes.FOLLOW:
        return (
          <FollowList
            onClose={goBack}
            userIdText={entry.post?.userId || entry.post}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    async function prepareApp() {
      try {
        if (loaded || error) {
          // 폰트 로딩이 완료되거나 오류가 발생하면 스크린을 숨김
        }
      } catch (e) {
        console.warn("앱 준비 중 오류 발생:", e);
      }
    }
    prepareApp();
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ToastProvider>
          <MoreMenuProvider>
            <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {/* 바로가기 */}
              <Stack.Screen name="Shortcut" component={Shortcut} />
              <Stack.Screen name="Lab" component={Lab} />
              <Stack.Screen name="Dialogue" component={Dialogue} />

              {/* 온보딩 스크린들 */}
              <Stack.Screen name="Splash" component={Splash} />
              <Stack.Screen name="OverLimit" component={OverLimit} />
              <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
              <Stack.Screen name="TutorialPage" component={TutorialPage} />

              {/* Main은 홈, 서치, 라이브러리를 포함하는 탭 네비게이터 */}
              <Stack.Screen name="Main" options={{ gestureEnabled: false }}>
                {() => <TabNavigator openModal={openModal} />}
              </Stack.Screen>

              {/* 유저프로필 (스와이프 탭 노출 방지를 위해 Stack으로 분리) */}
              <Stack.Screen name="Userprofile">
                {(props) => <Userprofile {...props} onHostBottomSheet={openModal} />}
              </Stack.Screen>

              {/* Correction */}
              <Stack.Screen name="correction" component={Correction} />

              {/* 설정 */}
              <Stack.Screen name="SettingHome" component={SettingHome} />
              <Stack.Screen name="SettingFrame" component={SettingFrame} />
              <Stack.Screen
                name="DeletingAccountFrame"
                component={DeletingAccountFrame}
              />
            </Stack.Navigator>

            {/* 바텀시트 스택: 상위 2개 레벨만 렌더한다. 각 프레임을 스택 '절대 index'로 keying하여
                push/pop 시에도 '같은 인스턴스'가 유지된다(재마운트 없음 → 뒤 카드 잔상/키보드 재등장/깜빡임 방지).
                아래(배경) 시트가 먼저, 최상단 시트가 나중에 렌더되어 위에 겹친다.
                - push: 배경(이전) 시트는 그 자리에 그대로 있고, 새 최상단 시트만 아래에서 슬라이드 업
                - pop: 최상단 시트만 아래로 내려가 언마운트되고, 배경 시트가 이미 자리해 그대로 드러남 */}
            {sheetStack
              .slice(Math.max(0, sheetStack.length - 2))
              .map((entry, i) => {
                const absIndex = Math.max(0, sheetStack.length - 2) + i;
                const isTop = absIndex === sheetStack.length - 1;
                return (
                  <BottomSheetFrame
                    key={absIndex}
                    isVisible={true}
                    isBackground={!isTop}
                    onClose={goBack}
                  >
                    {renderSheetContent(entry, absIndex, { isBackground: !isTop })}
                  </BottomSheetFrame>
                );
              })}
            </NavigationContainer>
          </MoreMenuProvider>
        </ToastProvider>
      </SafeAreaProvider>
      <ScreenshotProtection />
      <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
