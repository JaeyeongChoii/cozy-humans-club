import React, { useRef, useEffect, useState } from "react";
import { SCREEN_HEIGHT } from "../../utils/scale";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  BackHandler,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import GlobalScrollView from "../GlobalScrollView";
import { ColorTokens } from "../../design/token/ColorTokens";
import { BOTTOM_SHEET_START } from "../../design/token/constantsTokens";
import { BottomSheetContext } from "./BottomSheetContext";
import { useMoreMenu } from "../MoreMenuContext";

// [수동 조절] iOS 전용: 키보드가 올라올 때 입력 영역을 키보드 위로 띄우는 보정값 (단위: px).
// iOS는 KeyboardAvoidingView(padding)가 정상 동작하므로 이 값으로 미세조정한다.
// 하단 바가 키보드에 잘려 보이면 키우고, 너무 뜨면 줄인다.
const SHEET_KEYBOARD_OFFSET_IOS = 65;

// [수동 조절] 안드로이드 전용: 키보드와 입력 영역 사이의 추가 간격 (단위: px).
// 안드로이드는 KeyboardAvoidingView가 adjustResize와 충돌해 신뢰할 수 없어서,
// 키보드 높이를 직접 받아 그만큼 입력 영역을 올린다(=키보드 바로 위). 여기에 이 값만큼 더 띄운다.
// 키보드 위로 더 띄우려면 키우고(예: 8), 키보드에 더 붙이려면 줄이거나 음수로 둔다.
const ANDROID_KEYBOARD_GAP = 0;

export default function BottomSheetFrame({ isVisible, children, onClose, headerComponent, isBackground = false }) {
  const { closeMenu } = useMoreMenu();
  const [showBackdrop, setShowBackdrop] = useState(isVisible);  //반투명 배경 표시 여부 제어
  const [isDragging, setIsDragging] = useState(false);  // 바텀시트 드래그 중 여부 (스크롤 제어용)
  // [A] 무거운 컨텐츠(글 세부 등) 마운트를 시트 열림 애니메이션 직후로 미루기 위한 플래그.
  // 시트가 올라오는 첫 프레임에 본문/댓글이 한꺼번에 마운트되면 JS 스레드가 막혀 애니메이션이
  // "멈췄다 점프"하던 문제를 방지한다.
  // 배경 시트는 이미 열려 있던 카드이므로 즉시 내용 표시, 최상단 시트는 열림 애니메이션 직후 마운트.
  const [contentReady, setContentReady] = useState(isBackground);
  // [안드로이드 전용] 현재 키보드 높이(px). 키보드가 없으면 0.
  // 안드로이드는 이 높이만큼 입력 영역을 직접 올려 키보드 위로 보낸다(KAV 미사용).
  const [androidKbHeight, setAndroidKbHeight] = useState(0);
  const pan = useRef( // 바텀시트의 Y축 위치 애니메이션 값
    // 배경 시트는 열린 위치에서 시작(고정), 최상단 시트는 아래(닫힘)에서 시작해 마운트 시 위로 슬라이드.
    new Animated.Value(isBackground ? BOTTOM_SHEET_START : SCREEN_HEIGHT * 1.1)
  ).current;
  // [B] top(레이아웃 속성) 대신 transform: translateY(GPU 합성)로 시트를 움직이기 위한 파생값.
  // pan의 의미(화면 top 기준 위치)는 그대로 두고, 시트를 top:BOTTOM_SHEET_START에 고정한 뒤
  // 그 기준점으로부터의 오프셋만 translateY로 적용한다. (pan===START → translateY 0 → 열린 위치)
  const translateY = useRef(Animated.subtract(pan, BOTTOM_SHEET_START)).current;

  // 바텀시트 열림/닫힘 상태 변화 감지
  useEffect(() => {
    // 열릴 때 애니메이션으로 위로 올라옴
    if (isVisible) {
      setShowBackdrop(true);
      Animated.spring(pan, {
        toValue: BOTTOM_SHEET_START,
        useNativeDriver: true,
        speed: 15,
        bounciness: 4,
      }).start();
      // [A] 애니메이션이 먼저 시작되도록 다음 프레임에 컨텐츠를 마운트한다.
      // requestAnimationFrame 2번 = 약 2프레임 뒤(거의 즉시)라 빈 시트가 거의 보이지 않으면서도
      // 무거운 첫 렌더가 애니메이션 시작 프레임과 겹치지 않게 한다.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setContentReady(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // 시트가 닫히면 떠 있던 미트볼 오버레이 메뉴도 함께 닫는다 (스와이프/백드롭/뒤로가기 모두 커버)
      closeMenu();
      setContentReady(false); // [A] 다음 열림을 위해 컨텐츠 마운트 상태 초기화
      // 닫힐 때 아래로 사라짐
      Animated.timing(pan, {
        toValue: SCREEN_HEIGHT * 1.1,
        duration: 100,
        useNativeDriver: true,
      }).start(() => setShowBackdrop(false));
    }
  }, [isVisible]);

  // 백드롭 탭 등 '제스처 없이' 닫을 때, 아래로 슬라이드시킨 뒤 pop한다(즉시 언마운트 방지).
  // (드래그로 닫을 땐 제스처 릴리스 애니메이션이 이미 이 역할을 한다.)
  const animatedClose = () => {
    Animated.timing(pan, {
      toValue: SCREEN_HEIGHT * 1.1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  // [안드로이드 전용] 키보드 높이 추적 → 입력 영역을 그 높이만큼 직접 올린다.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setAndroidKbHeight(e?.endCoordinates?.height ?? 0)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setAndroidKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 안드로이드 뒤로가기 버튼 처리
  useEffect(() => {
    if (Platform.OS === "android" && isVisible && !isBackground) {
      const backAction = () => {
        if (onClose) {
          onClose();
          return true; // 이벤트를 소비하여 앱 종료 방지
        }
        return false; // onClose가 없으면 기본 동작 수행
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [isVisible, onClose]);

  // 손으로 시트를 내릴 수 있는 핸들바
  const handleBarPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // 핸들바를 잡고 끌기 시작하는 즉시 떠 있던 메뉴 닫기
        closeMenu();
      },
      onPanResponderMove: (evt, gestureState) => {
        // 현재 위치 + 이동 거리 계산
        const current = pan.__getValue();
        const newY = Math.max(0, current + gestureState.dy);
        pan.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 아래로 빠르게 스와이프하거나 일정 거리 이상 이동하면 닫힘
        if (gestureState.vy > 0.5 || gestureState.dy > SCREEN_HEIGHT * 0.3) {
          Animated.timing(pan, {
            toValue: SCREEN_HEIGHT * 1.1,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            if (onClose) onClose();
          });
        } else {
          // 그렇지 않으면 다시 원위치로 복귀
          Animated.spring(pan, {
            toValue: BOTTOM_SHEET_START,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // 스크롤 감지용 ref
  const scrollOffsetY = useRef(0);
  const [isAtTop, setIsAtTop] = useState(true);
  // 이 프레임이 (pop 등으로) 배경→최상단으로 바뀌면 끌어내리기 제스처를 다시 활성화한다.
  // (배경으로 있던 동안 스크롤/상태로 isAtTop=false로 남아 스와이프가 죽는 문제 방지)
  useEffect(() => {
    if (!isBackground) setIsAtTop(true);
  }, [isBackground]);
  // 바텀시트 드래그 중인지 추적 (리렌더링 방지를 위해 ref 사용)
  const isDraggingRef = useRef(false);

  // ScrollView에서 전달받은 스크롤 위치
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetY.current = offsetY;

    // 안드로이드: 스크롤 최상단(0 이하)일 때만 제스처 핸들러 활성화
    if (Platform.OS === 'android') {
      if (offsetY <= 0) {
        if (!isAtTop) setIsAtTop(true);
      } else {
        if (isAtTop) setIsAtTop(false);
      }
    }
  };

  // ---------------------------------------------------------
  // [iOS] 기존 방식: PanResponder 사용
  // ---------------------------------------------------------
  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // iOS만 동작
        if (Platform.OS !== 'ios') return false;

        if (isDraggingRef.current) return true;
        // 스크롤 최상단 + 아래로 드래그 시
        return (
          scrollOffsetY.current <= 0 &&
          gestureState.dy > 5 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        setIsDragging(true);
        // iOS: 시트 끌어내리기 시작 즉시 메뉴 닫기
        closeMenu();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDraggingRef.current) {
          const newY = BOTTOM_SHEET_START + gestureState.dy;
          pan.setValue(Math.max(BOTTOM_SHEET_START, newY));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDraggingRef.current = false;
        setIsDragging(false);
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.timing(pan, {
            toValue: SCREEN_HEIGHT * 1.1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => { if (onClose) onClose(); });
        } else {
          Animated.spring(pan, {
            toValue: BOTTOM_SHEET_START,
            useNativeDriver: true,
            speed: 12,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  // handleScrollEndDrag 제거: 스크롤 가속도로 인해 최상단 도달 시 즉각 닫히는 문제 해결

  // Gesture Handler Logic
  // Animated.event 대신 일반 함수로 직접 값 제어 (안정성 확보)
  const handleGestureEvent = (e) => {
    // Android: 시트 끌어내리기 제스처가 진행되는 즉시 메뉴 닫기
    // (이미 닫혀 있으면 setState가 동일값이라 리렌더 없이 무시됨)
    closeMenu();
    const translationY = e.nativeEvent.translationY;
    const newY = BOTTOM_SHEET_START + translationY;
    pan.setValue(Math.max(BOTTOM_SHEET_START, newY));
  };

  const handleStateChange = (e) => {
    if (e.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = e.nativeEvent;

      // 빠르게 내리거나(vy > 500) 일정 거리 이상(150px) 내렸을 때 닫기
      if (translationY > 150 || velocityY > 500) {
        Animated.timing(pan, {
          toValue: SCREEN_HEIGHT * 1.1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (onClose) onClose();
        });
      } else {
        // 아니면 원위치로 복구
        Animated.spring(pan, {
          toValue: BOTTOM_SHEET_START,
          useNativeDriver: true,
          speed: 12,
          bounciness: 4,
        }).start();
      }
    }
  };

  const animatedStyle = {
    // [B] top(레이아웃) 대신 transform translateY 사용 → 매 프레임 레이아웃 재계산 제거
    transform: [{ translateY }],
  };

  // 시트 내부 컨텐츠 (헤더 + 본문). iOS/안드로이드 공통.
  const innerContent = (
    <>
      {headerComponent && (
        <View
          style={styles.headerContainer}
          {...handleBarPanResponder.panHandlers}
        >
          {headerComponent}
        </View>
      )}
      {/* [A] 열림 애니메이션 직후에 컨텐츠 마운트 (첫 프레임 JS 블로킹 방지) */}
      <View style={[styles.content, { flex: 1 }]}>{contentReady ? children : null}</View>
    </>
  );

  // 렌더링 컨텐츠 (공통)
  // iOS: KeyboardAvoidingView(padding)가 정상 동작하므로 그대로 사용.
  // 안드로이드: adjustResize와 KAV가 충돌하므로 KAV를 쓰지 않고, 키보드 높이만큼 paddingBottom으로
  //            입력 영역을 직접 올린다. (키보드 없으면 0 → 하단에 붙음)
  const renderContent = () => (
    <Animated.View
      style={[styles.bottomSheet, isBackground && styles.backgroundSheet, animatedStyle]}
      pointerEvents={isVisible ? "auto" : "none"}
      {...(Platform.OS === 'ios' && !isBackground ? contentPanResponder.panHandlers : {})}
    >
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, width: "100%" }}
          keyboardVerticalOffset={SHEET_KEYBOARD_OFFSET_IOS}
        >
          {innerContent}
        </KeyboardAvoidingView>
      ) : (
        <View
          style={{
            flex: 1,
            width: "100%",
            paddingBottom: androidKbHeight > 0 ? androidKbHeight + ANDROID_KEYBOARD_GAP : 0,
          }}
        >
          {innerContent}
        </View>
      )}
    </Animated.View>
  );

  return (
    <BottomSheetContext.Provider value={{ handleScroll, scrollEnabled: !isDragging }}>
      {/* 백드롭은 최상단 시트만 그린다(zIndex 100 < 시트 200이라 배경 시트보다 뒤).
          → 위 시트를 내릴 때 백드롭이 아닌 '배경 시트(이전 depth)'가 드러난다. */}
      {showBackdrop && !isBackground && <Pressable onPress={animatedClose} style={styles.backdrop} />}

      {Platform.OS === 'android' && !isBackground ? (
        <PanGestureHandler
          enabled={isAtTop}
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
          activeOffsetY={[-99999, 5]}
        >
          {renderContent()}
        </PanGestureHandler>
      ) : (
        renderContent()
      )}
    </BottomSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ColorTokens.ModalBackground,
    zIndex: 100,
  },
  bottomSheet: {
    backgroundColor: ColorTokens.Black,
    alignItems: "center",
    paddingTop: 10,
    position: "absolute",
    left: 0,
    right: 0,
    // [B] 시트를 열린 위치(top:BOTTOM_SHEET_START)에 고정하고, 상하 이동은 transform translateY로 처리.
    // top + bottom 동시 지정으로 높이는 고정되며(기존 top:pan+bottom:0과 동일한 높이), pan은 translateY로만 반영됨.
    top: BOTTOM_SHEET_START,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    zIndex: 200,
  },
  backgroundSheet: {
    // 배경(이전 depth) 시트는 최상단 시트보다 아래에 깔린다.
    // 안드로이드는 elevation이 터치/그리기 순서를 지배하므로 최상단(10)보다 낮춰(5) 터치가
    // 위 시트로 가게 한다. 단 백드롭(zIndex 100, elevation 없음)보다는 위라, 위 시트를 내릴 때
    // 백드롭이 아닌 '이전 시트'가 드러난다.
    elevation: 5,
    zIndex: 150,
  },
  handleBarContainer: {
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
    height: 30,
    paddingTop: 20,
  },
  handleBar: {
    backgroundColor: ColorTokens.Unselected,
    marginBottom: 10,
    width: 35,
    height: 3,
    borderRadius: 3,
  },
  content: {
    paddingTop: 10,
    width: "100%",
  },
  headerContainer: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
