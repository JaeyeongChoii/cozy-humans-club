// 라이브러리
// 수정 버튼을 누른뒤, 자신의 프로필을 수정하는 화면
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import GlobalScrollView from "./GlobalScrollView";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { ColorTokens } from "../design/token/ColorTokens";
import { BASE_URL } from "../constants/BaseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postApi } from "../api/postApi";
import { Typography } from "../design/Typography.js";
import { Radius } from "../design/Radius.js";
import { Spacing } from "../design/Spacing.js";
import DynamicButton from "../components/DynamicButton";
import CachedImage from "./common/CachedImage";

const INTRO_BOX_HEIGHT = 110;
const INTRO_FOCUS_SCROLL_Y = Platform.select({
  ios: 90,
  android: 220,
  default: 120,
});
const STATUS_MESSAGE_MAX_LENGTH = 200;
const STATUS_MESSAGE_MAX_LINES = 7 + 1;
const STATUS_MESSAGE_LINE_HEIGHT = Typography.paraMedium.lineHeight;

const isTruthySetting = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const Correction = () => {
  const navigation = useNavigation();
  const route = useRoute(); //  라우팅을 통해 정보를 받아오는 형태
  const userId = route.params.userId;
  const initialHideFollowList = isTruthySetting(
    route.params.hideFollowList ?? route.params.hide_follow_list,
  );
  const initialShowFollowList = !initialHideFollowList;

  // 유저 정보 수정 가능하도록 이름, 메시지, 프로필이미지 상태 설정
  const [nickname, setNickname] = useState(route.params.nickname); // Library.js에서 전달받은 닉네임
  const [statusMessage, setStatusMessage] = useState(
    route.params.statusMessage ?? "",
  );
  const [imageUrl, setImageUrl] = useState(route.params.imageUrl);

  const [isSubmitting, setIsSubmitting] = useState(false); // 연타 방지용
  const [isIntroFocused, setIsIntroFocused] = useState(false);
  const [introLineCount, setIntroLineCount] = useState(1);
  const statusMessageRef = useRef(route.params.statusMessage ?? "");
  const introLineCountRef = useRef(1);
  const isIntroFocusedRef = useRef(false);
  const scrollViewRef = useRef(null);
  const introInputRef = useRef(null);
  const releaseSelectionTimeoutRef = useRef(null);
  const [nicknameSelection, setNicknameSelection] = useState(null);

  useEffect(() => {
    const keyboardHideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (!isIntroFocusedRef.current) return;

        isIntroFocusedRef.current = false;
        setIsIntroFocused(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      },
    );

    return () => keyboardHideSubscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (releaseSelectionTimeoutRef.current) {
        clearTimeout(releaseSelectionTimeoutRef.current);
      }
    };
  }, []);

  const restoreCursorToEnd = (text, setTargetSelection) => {
    if (Platform.OS !== "ios") return;

    const cursorPosition = text.length;
    setTargetSelection({ start: cursorPosition, end: cursorPosition });

    if (releaseSelectionTimeoutRef.current) {
      clearTimeout(releaseSelectionTimeoutRef.current);
    }

    releaseSelectionTimeoutRef.current = setTimeout(() => {
      setTargetSelection(null);
    }, 250);
  };

  // 이름, 자기소개 글자수 초과 여부 표기
  const nameLimit = 20;
  const messageLimit = STATUS_MESSAGE_MAX_LENGTH;
  const isNameValid = nickname.length <= 20;
  const isMessageLengthValid = statusMessage.length <= messageLimit;
  const isMessageLineValid = introLineCount <= STATUS_MESSAGE_MAX_LINES;
  const isMessageValid = isMessageLengthValid && isMessageLineValid;
  const messageErrorText = !isMessageLengthValid
    ? "200자 이내로 입력해야 한다던데.."
    : "7줄 이내로 입력해야한다던데..";

  // 둘 다 글자수를 넘지 않는지 여부 표기(게시하기 조건부 활성화를 위한 조건)
  const isFormValid = isNameValid && isMessageValid;

  // 팔로우목록 보이기 허용
  const [showFollowList, setShowFollowList] = useState(initialShowFollowList);

  const handleToggleFollowList = () => {
    setShowFollowList((prev) => !prev);
  };

  const handleStatusMessageChange = (text) => {
    statusMessageRef.current = text;

    if (text.length === 0) {
      introLineCountRef.current = 1;
      setIntroLineCount(1);
    }

    setStatusMessage(text);
  };

  const handleIntroContentSizeChange = (event) => {
    if (statusMessageRef.current.length === 0) {
      if (introLineCountRef.current !== 1) {
        introLineCountRef.current = 1;
        setIntroLineCount(1);
      }
      return;
    }

    const contentHeight = event.nativeEvent.contentSize.height;
    const nextLineCount = Math.max(
      1,
      Math.ceil(contentHeight / STATUS_MESSAGE_LINE_HEIGHT),
    );

    if (introLineCountRef.current === nextLineCount) return;

    introLineCountRef.current = nextLineCount;
    setIntroLineCount(nextLineCount);
  };

  // 이미지 선택 함수
  const pickImage = async () => {
    // 권한 요청
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("갤러리 접근 권한이 필요합니다.");
      return;
    }
    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true, --->이거 하면 이미지 추가 전에 편집기능이 생김.
      quality: 1,
    });
    if (!result.canceled) {
      setImageUrl({ uri: result.assets[0].uri });
    }
  };

  // 저장하기를 누른경우 서버로 부터 닉네임, 이미지, 상태메세지 변경을 수행
  const handleSave = async () => {
    // 버튼 연타 방지
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. 아이디 변경 (닉네임 변경)
      if (nickname !== route.params.nickname) {
        const successNickname = postApi.changeingNickname(userId, nickname);
        if (!successNickname) {
          console.log("닉네임 변경에 실패했습니다.");
        }
      }

      // 2. 상태메세지 변경
      if (statusMessage !== route.params.statusMessage) {
        const successStatusMessage = postApi.changeStatusMsg(statusMessage);
        if (!successStatusMessage) {
          console.log("상태메세지 변경에 실패했습니다.");
        }
      }

      // 3. 이미지 변경 (새로운 이미지를 선택했을 때만 실행)
      // 새로 선택한 이미지면 uri 값이 "file://" 로 시작합니다. 기존 네트워크(https)나 require(숫자)와 구분됩니다.
      if (imageUrl && imageUrl.uri && imageUrl.uri.startsWith("file://")) {
        const successImageUrl = await changingImage(imageUrl.uri);
        if (!successImageUrl) {
          console.log("이미지 변경에 실패했습니다.");
        }
      } else {
        // console.log("이미지가 변경되지 않아 업로드를 생략합니다.");
      }

      if (showFollowList !== initialShowFollowList) {
        await postApi.updateHideFollowList(!showFollowList);
      }

      // 업데이트 완료 후 이전 화면으로 돌아가기
      navigation.goBack();
    } catch (error) {
      console.error("handleSave flow error:", error);
    } finally {
      // 버튼 연타 방지 해제
      setIsSubmitting(false);
    }
  };

  // 프로필 이미지 변경 요청 함수
  const changingImage = async (localImageUri) => {
    const idToken = await AsyncStorage.getItem("id_token");
    if (!idToken) return false;

    try {
      // 1. URI에서 파일 이름과 확장자 추출하기
      const filename = localImageUri.split("/").pop();

      // 2. 확장자를 통해 정확한 MIME 타입(type) 유추하기
      const match = /\.(\w+)$/.exec(filename ?? "");
      const ext = match ? match[1].toLowerCase() : "jpeg";
      const type = ext === "png" ? "image/png" : "image/jpeg";

      // 3. FormData 객체 생성
      const formData = new FormData();
      formData.append("file", {
        uri: localImageUri,
        name: `${userId}_profile.${ext}`, // 유저 고유 ID와 확장자 결합
        type: type,
      });

      const url = `${BASE_URL}/profile/image`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          // Content-Type은 fetch가 FormData 객체를 통해 자동으로 설정하도록 둡니다 (boundary 포함)
        },
        body: formData,
      };

      console.log(`${url} 요청 보냄 (FormData)`);

      const response = await fetch(url, options);
      console.log(`${url} response :`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("서버에서 반환한 500 에러 상세 내용:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // { success: bool, message: string(if success==0), filename: string }

      if (data.success) {
        console.log("이미지 업로드 성공, 파일명:", data.filename);
      } else {
        console.log("이미지 업로드 실패:", data.message);
      }

      return Boolean(data?.success);
    } catch (error) {
      console.error("changingImage API Error:", error);
      throw error;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined} // 안드로이드는 키보드어보이딩뷰 적용이 잘 안됨. 패딩도 안 먹으니 undefined
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <GlobalScrollView
        ref={scrollViewRef}
        scrollEnabled={isIntroFocused}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 뒤로가기, 게시하기 버튼 */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={10}
          >
            <Text style={styles.back}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!isFormValid}
            activeOpacity={1}
            onPress={() => {
              if (!isFormValid) return;

              handleSave();
            }}
          >
            <DynamicButton
              text={"저장하기"}
              disabled={!isFormValid}
              isPoint2={true}
            />

            {/* <Image source={
              isFormValid ?
                require("../../tokenImage/saveButton.png")
                :
                require("../../tokenImage/saveButtonDisabled.png")
            } /> */}
          </TouchableOpacity>
        </View>

        {/* 프로필 이미지 + 변경 */}
        <View style={styles.profileSection}>
          {imageUrl ? (
            <CachedImage
              source={imageUrl}
              style={styles.imageUrl}
              placeholder={require("../../tokenImage/defaultProfileImage.png")}
              resizeWidth={200}
            />
          ) : (
            <View style={styles.imageUrl} />
          )}
          <TouchableOpacity onPress={pickImage} hitSlop={10}>
            <Text style={styles.changeText}>변경</Text>
          </TouchableOpacity>
        </View>

        {/* 이름 입력 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>이름</Text>
          <View style={styles.nameBox}>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Text
                style={[
                  styles.nickname,
                  {
                    position: "absolute",
                    left: 0,
                    right: 0,
                    zIndex: 1,
                    elevation: 1,
                  },
                ]}
                pointerEvents="none"
                numberOfLines={1}
              >
                <Text style={{ color: ColorTokens.Typography }}>
                  {nickname.slice(0, nameLimit)}
                </Text>
                {/* 범위를 초과하면 빨갛게 보이도록 설정 */}
                <Text style={{ color: ColorTokens.Typography }}>
                  {nickname.slice(nameLimit)}
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.nickname,
                  {
                    color: "transparent",
                    padding: 0,
                    margin: 0,
                    height: "100%",
                    textAlignVertical: "center",
                    transform:
                      Platform.OS === "ios" ? [{ translateY: -5 }] : undefined,
                  },
                ]}
                value={nickname}
                onChangeText={setNickname}
                selectTextOnFocus={false}
                selection={nicknameSelection}
                onPressIn={() =>
                  restoreCursorToEnd(nickname, setNicknameSelection)
                }
                onFocus={() =>
                  restoreCursorToEnd(nickname, setNicknameSelection)
                }
                // 자동 대문자 방지
                autoCapitalize="none"
                // 자동 수정 방지
                autoCorrect={false}
                spellCheck={false}
              />
            </View>
          </View>
        </View>
        <Text
          style={[
            styles.errorText,
            {
              opacity: isNameValid ? 0 : 1,
            },
          ]}
        >
          20자 이내로 입력해야 한다던데..
        </Text>

        {/* 자기소개 입력 */}
        <View style={styles.introSection}>
          <Text style={styles.label}>자기소개</Text>
          <View style={styles.introBox}>
            <View style={styles.introInputWrapper}>
              <TextInput
                ref={introInputRef}
                style={[styles.introduce, styles.introduceInput]}
                defaultValue={statusMessage}
                onChangeText={handleStatusMessageChange}
                // 자동 대문자 방지
                autoCapitalize="none"
                // 자동 수정 방지
                autoCorrect={false}
                spellCheck={false}
                multiline
                blurOnSubmit={true}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => {
                  introInputRef.current?.blur();
                }}
                scrollEnabled={true}
                onFocus={() => {
                  isIntroFocusedRef.current = true;
                  setIsIntroFocused(true);
                  setTimeout(
                    () => {
                      scrollViewRef.current?.scrollTo({
                        y: INTRO_FOCUS_SCROLL_Y,
                        animated: true,
                      });
                    },
                    Platform.OS === "ios" ? 250 : 350,
                  );
                }}
                onBlur={() => {
                  isIntroFocusedRef.current = false;
                  setIsIntroFocused(false);
                  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }}
                onContentSizeChange={handleIntroContentSizeChange}
                selectTextOnFocus={false}
              />
            </View>
          </View>
        </View>
        <Text
          style={[
            styles.errorText,
            {
              opacity: isMessageValid ? 0 : 1,
            },
          ]}
        >
          {messageErrorText}
        </Text>

        {/* 팔로우, 팔로잉 목록 숨기기*/}
        <View style={styles.followSection}>
          <Text style={styles.label}>팔로우/팔로잉 목록</Text>
          <View style={styles.followContainer}>
            <Text style={styles.followText}>팔로우/팔로잉 목록 공개하기</Text>
            <TouchableOpacity onPress={handleToggleFollowList}>
              <Image
                source={
                  showFollowList
                    ? require("../../assets/button/on.png")
                    : require("../../assets/button/off.png")
                }
                style={{
                  width: 45,
                  height: 25,
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </GlobalScrollView>
    </KeyboardAvoidingView>
  );
};

export default Correction;

const styles = StyleSheet.create({
  container: {
    // 최상위 컴포넌트로, 모든 컴포넌트를 포함하는 컨테이너 스타일
    flex: 1,
    backgroundColor: ColorTokens.Background2,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[10],
  },
  scrollContainer: {
    paddingBottom: Platform.select({
      ios: 80,
      android: 360,
    }),
  },
  topBar: {
    // 뒤로가기, 게시하기 묶는 View 스타일링
    flexDirection: "row", //가로로 컴포넌트를 배치
    alignItems: "center", //자식 요소들을 중앙 정렬
    justifyContent: "space-between", // 자식 요소들 사이에 최대한의 간격을 둠
  },
  backButton: {
    // 뒤로가기 버튼 스타일
  },
  back: {
    ...Typography.boldMedium,
    color: ColorTokens.Unselected,
    alignSelf: "center",
  },
  profileSection: {
    //프로필 사진, 변경 text를 가운데로 정렬해주는 상위 View 스타일링
    alignItems: "center",
    marginTop: Spacing[7],
  },
  imageUrl: {
    //프로필 이미지 속성
    width: 120,
    height: 120,
    borderRadius: Radius.round,
    backgroundColor: ColorTokens.Unselected,
    marginBottom: 8,
  },
  changeText: {
    color: ColorTokens.Point,
    ...Typography.boldMedium,
    marginTop: Spacing[4],
  },
  inputContainer: {
    marginTop: Spacing[8],
  },
  introSection: {
    marginTop: Spacing[6],
  },
  label: {
    // 변경, 이름, 자기소개 등 하드코딩된 라벨에 관한 스타일
    color: ColorTokens.Point,
    ...Typography.headingMedium,
    paddingLeft: Spacing[2],
    marginBottom: Spacing[4],
  },
  nickname: {
    // 이름 텍스트에 적용되는 스타일링
    color: ColorTokens.Typography,
    ...Typography.boldMedium,
  },
  introduce: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
  introInputWrapper: {
    flex: 1,
    position: "relative",
  },
  introduceInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    textAlignVertical: "top",
    zIndex: 1,
  },
  nameBox: {
    // 자기소개 배경 박스 스타일링
    backgroundColor: ColorTokens.InnerBox2,
    height: 45,
    borderRadius: Radius.sm,
    justifyContent: "center",
    paddingHorizontal: Spacing[2],
  },
  introBox: {
    // 자기소개 배경 박스 스타일링
    backgroundColor: ColorTokens.InnerBox2,
    height: INTRO_BOX_HEIGHT,
    borderRadius: Radius.sm,
    padding: Spacing[2],
  },
  introBoxInvalid: {
    // 자기소개 제한 수 넘어가면 나오는 빨간 박스 스타일링
    borderColor: ColorTokens.Warning,
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: ColorTokens.InnerBox,
  },
  errorText: {
    // 제한수 넘어가면 나오는 경고 텍스트 스타일링
    paddingTop: Spacing[3],
    paddingLeft: Spacing[2],
    color: ColorTokens.Warning,
    ...Typography.boldSmall,
  },
  followSection: {
    marginTop: Spacing[4],
  },
  followContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  followText: {
    paddingLeft: Spacing[2],
    ...Typography.paraMedium,
    color: ColorTokens.Typography,
  },
});
