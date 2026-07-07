// 글쓰기 화면 오버레이 래퍼
// ------------------------------------------------------------------------------------
// 기존엔 글쓰기를 RN <Modal animationType="slide">로 띄웠는데, iOS에서 Modal은 앱 화면과
// '별도의 네이티브 윈도우(UIWindow)'라, 키보드가 올라온 채로 모달을 닫으면 키보드 내림
// 애니메이션과 모달 슬라이드가 동기화되지 않아 버벅였다(모달 먼저 닫히고 키보드가 뒤늦게
// 내려가거나, 키보드가 다 내려간 뒤 화면이 멈칫하며 닫힘).
//
// 이 래퍼는 Modal을 쓰지 않고 '앱과 같은 윈도우' 안에서 absolute 오버레이 + Animated 슬라이드로
// 글쓰기를 띄운다. 같은 윈도우이므로 닫을 때 Keyboard.dismiss()가 즉시 먹혀, 키보드 내림과
// 화면 슬라이드가 자연스럽게 겹쳐 함께 내려간다(안드로이드가 매끄러웠던 것과 동일한 원리).
import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
  Keyboard,
  Easing,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import Write from "./Write";

// 글쓰기 오버레이 표시 여부를 하단 탭바(App.js BottomTabBar)에 알리는 이벤트.
// 오버레이는 탭바와 '같은 윈도우'에 떠서 탭바를 덮지 못하므로(탭바는 씬 바깥 하단에 렌더됨),
// 이 신호로 오버레이가 떠 있는 동안 탭바를 숨긴다.
export const WRITE_OVERLAY_EVENT = "writeOverlayVisibilityChange";

const ANIM_DURATION = 300; // 키보드가 없을 때(또는 안드로이드) 쓰는 기본 슬라이드 길이
// iOS 키보드 show/hide의 표준 애니메이션 커브 근사값. 오버레이 슬라이드를 여기에 맞춰
// 키보드와 같은 곡선으로 움직이게 한다.
const IOS_KEYBOARD_EASING = Easing.bezier(0.17, 0.59, 0.4, 0.77);

export default function WriteOverlay({ visible, onClose, ...writeProps }) {
  const { height } = useWindowDimensions();
  // rendered: 닫힘 애니메이션이 끝날 때까지 마운트를 유지하기 위한 상태
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(height)).current;
  const writeRef = useRef(null);
  const closingRef = useRef(false); // 닫힘 중복 실행 방지

  // 실제 슬라이드 아웃 실행 → 완료 후 부모 상태 정리(onClose)
  const slideOut = (duration, easing) => {
    Animated.timing(translateY, {
      toValue: height,
      duration: typeof duration === "number" ? duration : ANIM_DURATION,
      easing: easing || Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setRendered(false);
      onClose?.();
    });
  };

  const runClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    // 키보드 내림과 화면 슬라이드를 '정확히 같은 순간'에 시작해 함께 내려가게 한다.
    // 이 앱은 Keyboard.dismiss()가 잘 안 먹히므로 Write가 자기 입력창을 직접 blur해 키보드를 내린다.
    writeRef.current?.blurInputs?.();
    Keyboard.dismiss(); // 보조

    // iOS: 키보드 표준 애니메이션 시간(약 250ms)·커브로 슬라이드 → 키보드와 겹쳐 동시에 내려간다.
    // 안드로이드: 기존 기본 슬라이드.
    if (Platform.OS === "ios") {
      slideOut(0, IOS_KEYBOARD_EASING);
    } else {
      slideOut(ANIM_DURATION, Easing.in(Easing.cubic));
    }
  };

  // visible 변화 처리
  //  - true: 마운트 후 아래에서 위로 슬라이드 인
  //  - false인데 아직 떠 있으면(외부에서 직접 내린 경우): 슬라이드 아웃으로 닫는다.
  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setRendered(true);
      translateY.setValue(height);
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered && !closingRef.current) {
      runClose();
    }
  }, [visible, height]);

  // 오버레이 표시 여부(rendered)에 맞춰 탭바 숨김 신호를 보낸다.
  // (WriteOverlay 컴포넌트 자체는 항상 마운트되어 있고 rendered로 표시만 토글되므로
  //  mount/unmount가 아니라 rendered 변화에 연동해야 한다.)
  useEffect(() => {
    DeviceEventEmitter.emit(WRITE_OVERLAY_EVENT, rendered);
  }, [rendered]);

  // 안드로이드 하드웨어 백버튼 → Write의 나가기 확인 로직(requestClose)으로 위임
  useEffect(() => {
    if (!rendered) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      writeRef.current?.requestClose();
      return true; // 기본 뒤로가기(앱 종료/화면 전환) 차단
    });
    return () => sub.remove();
  }, [rendered]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[styles.overlay, { transform: [{ translateY }] }]}
    >
      <Write ref={writeRef} onClose={runClose} {...writeProps} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // 탭바/플로팅 버튼 등 화면 위 요소들보다 위에 오도록 최상단으로 끌어올린다.
    zIndex: 1000,
    elevation: 1000, // 안드로이드
    backgroundColor: ColorTokens.Background,
  },
});
