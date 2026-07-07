import React, { useRef, useState } from "react";
import {
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../constants/BaseURL";
import { ColorTokens } from "../design/token/ColorTokens";
import { Radius } from "../design/Radius.js";

const AppleLoginWebView = ({ visible, onClose, onSuccess }) => {
  const navigation = useNavigation();
  const targetUrl = `${BASE_URL}/oauth/apple`;
  const webViewRef = useRef(null);
  const [shouldRenderWebView, setShouldRenderWebView] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // [NEW] 처리 중 상태

  // Request Log
  React.useEffect(() => {
    if (visible) {
      setShouldRenderWebView(true);
      setIsProcessing(false); // 모달 열릴 때 상태 초기화
    } else {
      console.log("[AppleLogin] Modal closed.");
      setShouldRenderWebView(false);
    }
  }, [visible]);

  const closeAppleLogin = () => {
    try {
      webViewRef.current?.stopLoading?.();
      webViewRef.current?.injectJavaScript?.(`
        try {
          window.stop();
          window.location.replace('about:blank');
        } catch (e) {}
        true;
      `);
    } catch (e) {
      // ignore
    }

    setIsProcessing(false);
    setShouldRenderWebView(false);
    setWebViewKey((key) => key + 1);
    requestAnimationFrame(onClose);
  };

  const handleNavigationStateChange = async (event) => {
    const { url } = event;
    // console.log("WebView URL:", url);

    // 콜백 URL 감지 (예: https://deeptalk.com/oauth/callback/apple)
    if (url.includes("/oauth/callback/apple")) {
      console.log(`[AppleLogin] Response URL (Redirected): ${url}`);

      // [NEW] 콜백 감지 즉시 WebView 숨기고 로딩 표시
      // 상태 업데이트가 비동기일 수 있으므로 로직 흐름 상 중요
      setIsProcessing(true);

      // 성공적으로 리다이렉트된 경우
      // 정규식으로 토큰 추출
      const accessTokenMatch = url.match(/[?&]access_token=([^&]+)/);
      const refreshTokenMatch = url.match(/[?&]refresh_token=([^&]+)/);
      const idTokenMatch = url.match(/[?&]id_token=([^&]+)/);

      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
      const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
      const idToken = idTokenMatch ? idTokenMatch[1] : null;

      // Response Body Logging (Parsed Data)
      console.log(
        `[AppleLogin] Response Data (Parsed):`,
        JSON.stringify(
          {
            access_token: accessToken ? "(exists)" : null,
            refresh_token: refreshToken ? "(exists)" : null,
            id_token: idToken ? "(exists)" : null,
          },
          null,
          2,
        ),
      );

      if (idToken || accessToken) {
        await saveTokensAndNavigate(accessToken, refreshToken, idToken);
      } else {
        // URL에 토큰이 없다면, API 응답을 기다려야 할 수도 있음.
        // WebView의 injectedJavaScript를 통해 body 내용을 가져오는 방법 등 고려.
        // 하지만 보통 OAuth Implicit flow나 Redirect flow에서는 URL 파라미터로 줌.
        console.warn("[AppleLogin] No tokens found in URL yet.");
      }
    }
  };

  // [NEW] 웹뷰 본문 스크립트: Splash.js의 Discord 로그인 로직과 동일하게 맞춤 (검증된 코드)
  const debugging = `
      (function() {
        function checkJson() {
          try {
            var bodyText = document.body.innerText;
            if (!bodyText) return;
            
            // JSON 형태로 시작하고 끝나는지 간단 확인 (최적화)
            var trimmed = bodyText.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              var json = JSON.parse(bodyText);
              
              // 토큰이나 에러가 있으면 화면 숨기고 앱으로 전송
              // Apple Login 응답 키: access_token, id_token, refresh_token
              if (json.access_token || json.id_token || json.error) {
                document.body.style.display = 'none'; // 즉시 숨김
                window.ReactNativeWebView.postMessage(JSON.stringify(json));
              }
            }
          } catch (e) {
            // ignore
          }
        }
        
        // 1. 진입 즉시 실행
        checkJson();
        
        // 2. 주기적으로 실행 (300ms)
        setInterval(checkJson, 300);
      })();
      true;
    `;

  const handleMessage = async (event) => {
    try {
      const body = event.nativeEvent.data;
      console.log("[AppleLogin] WebView Message (Body):", body);

      const data = JSON.parse(body);

      // 토큰 추출 (Splash.js 로직)
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const idToken = data.id_token;

      if (idToken || accessToken) {
        await saveTokensAndNavigate(accessToken, refreshToken, idToken);
      }
    } catch (e) {
      // ignore
    }
  };

  const saveTokensAndNavigate = async (accessToken, refreshToken, idToken) => {
    console.log("[AppleLogin] Tokens found. Saving to AsyncStorage...");
    if (accessToken) await AsyncStorage.setItem("access_token", accessToken);
    if (refreshToken) await AsyncStorage.setItem("refresh_token", refreshToken);
    if (idToken) await AsyncStorage.setItem("id_token", idToken);

    // [NEW] Provider 명시적 저장
    await AsyncStorage.setItem("auth_provider", "apple");

    // [NEW] onSuccess 콜백이 있으면 호출 (Splash.js 등에서 사용)
    if (onSuccess) {
      onClose();
      setIsProcessing(false);
      setShouldRenderWebView(false);
      onSuccess(accessToken, refreshToken, idToken);
      return;
    }

    // 기본 동작: 토큰 저장 후 창 닫기 및 이동
    onClose();
    setIsProcessing(false);
    setShouldRenderWebView(false);
    navigation.navigate("OnboardingScreen");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAppleLogin}
      onDismiss={() => {
        setIsProcessing(false);
        setShouldRenderWebView(false);
      }}
    >
      <SafeAreaView style={styles.container} edges={[]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={closeAppleLogin} style={styles.closeButton}>
              <Image
                source={require("../../tokenImage/CircleDeleteButton.png")}
                style={{
                  width: 25,
                  height: 25,
                }}
              />
            </TouchableOpacity>
            <View style={styles.emptyView} />
          </View>
          {/* [NEW] WebView와 로딩 인디케이터 조건부/겹침 렌더링 */}
          <View style={{ flex: 1 }}>
            {shouldRenderWebView && (
              <WebView
                key={webViewKey}
                ref={webViewRef}
                source={{ uri: targetUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState={true}
                javaScriptEnabled={true}
                setSupportMultipleWindows={false}
                injectedJavaScript={debugging}
                onMessage={handleMessage}
                // isProcessing일 때 WebView를 숨김 (opacity 0)
                style={{ opacity: isProcessing ? 0 : 1 }}
              />
            )}
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={ColorTokens.Point} />
              </View>
            )}
          </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorTokens.Navigation,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: "hidden",
  },
  header: {
    height: Platform.OS === "android" ? 90 : 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // 요소를 양 끝과 중앙에 배치
    paddingHorizontal: 15,
    backgroundColor: ColorTokens.Typography,
  },
  closeButton: {
    width: 44, // 버튼 영역 확보
    height: 44,
    marginTop: Platform.OS === "android" ? 50 : 0,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyView: {
    width: 44, // closeButton과 동일한 너비로 설정하여 타이틀 중앙 정렬 유지
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ColorTokens.Navigation,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppleLoginWebView;
