// 글쓰기
// 글쓰기총 집본
import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import Tokens from "../../Tokens";
import { ExplicitLanguageList } from "../constants/explicitLanguageList";

import * as ImagePicker from "expo-image-picker";
import { ColorTokens } from "../design/token/ColorTokens";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { heightScale, SCREEN_WIDTH, widthScale } from "../utils/scale";
import {
  THEME,
  DYNAMIC_LABEL_0_NONE,
  DYNAMIC_LABEL_1_EMPATHY,
  DYNAMIC_LABEL_2_ADVISE,
  DYNAMIC_LABEL_3_EXPLAIN,
  DYNAMIC_LABEL_4_OTHER,
  DYNAMIC_LABEL_HEIGHT,
  STROKE_WIDTH,
} from "../design/token/constantsTokens";
import SetTheme from "./SetTheme";
import { Video, ResizeMode } from "expo-av";
import DeeptalkPicker from "./DeeptalkPicker";
import QuoteCard from "./QuoteCard";
import useWriteLogic, {
  MAX_TEXT_LENGTH,
  MAX_LINE_COUNT,
} from "../hooks/useWriteLogic";
import WriteBottomBar from "./WriteBottomBar";
import Popup2Button from "./Popup2Button";
import { useToast } from "./ToastContext";
import DynamicLabel from "./DynamicLabel";
import VoteComposer from "./VoteComposer";
import ViewImage from "./ViewImage";
import ViewVideo from "./ViewVideo";
import LinkPreview from "./LinkPreview";
import { postApi } from "../api/postApi";
import { commentApi } from "../api/commentApi";
import { extractFirstUrl } from "../utils/urlUtils";
import { normalizeImageAssets } from "../utils/normalizeImage";
import { Spacing } from "../design/Spacing";
import { Radius } from "../design/Radius";
import { Typography } from "../design/Typography";
import UserSearchResultList from "./UserSearchResultList";

// ============================================================
// iOS 전용 글쓰기 화면 미세 조정 값 (← 이 두 숫자만 바꿔가며 확인하세요)
//  * 안드로이드에는 전혀 영향을 주지 않습니다 (Platform.OS === "ios"일 때만 적용).
// ------------------------------------------------------------
// (1) 답변 유형 라벨과 글 입력창 사이의 '추가' 간격(px).
//     값이 클수록 입력창이 아래로 더 내려가 라벨과 멀어집니다. (0이면 기존과 동일)
const IOS_LABEL_TO_INPUT_GAP = -30;
//
// (2) 키보드가 올라왔을 때 하단 바(투표/사진추가/이어서게시)를 위로 더 올리는 값(px).
//     값이 클수록 하단 바가 키보드 위로 더 올라옵니다. (0이면 기존과 동일)
//     혹시 방향이 반대로 움직이면 음수로 넣어보세요.
const IOS_KEYBOARD_BOTTOM_BAR_LIFT = 25;
// ============================================================

// ============================================================
// 안드로이드 전용 글쓰기 화면 미세 조정 값 (← 이 두 숫자만 바꿔가며 확인하세요)
//  * iOS에는 전혀 영향을 주지 않습니다 (Platform.OS === "android"일 때만 적용).
// ------------------------------------------------------------
// (1) 답변 유형 라벨과 글 입력창 사이의 '추가' 간격(px).
//     값이 클수록 입력창이 아래로 더 내려가 라벨과 멀어집니다. (0이면 기존과 동일)
const ANDROID_LABEL_TO_INPUT_GAP = -5;
//
// (2) 키보드가 올라왔을 때 하단 바(투표/사진추가/이어서게시)를 위로 더 올리는 값(px).
//     값이 클수록 하단 바가 키보드 위로 더 올라옵니다. (0이면 기존과 동일)
//     혹시 방향이 반대로 움직이면 음수로 넣어보세요.
const ANDROID_KEYBOARD_BOTTOM_BAR_LIFT = 0;
// ============================================================

const formatDuration = (millis) => {
  if (!millis) return "";
  const totalSeconds = Math.round(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

// 투표 기간 설정용 상수 배열 (컴포넌트 외부에 두어 리렌더링 시 참조 무결성 유지)
const POLL_DAYS = [0, 1, 2, 3, 4, 5, 6, 7];
const POLL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const POLL_MINUTES = Array.from({ length: 60 }, (_, i) => i);

const Write = forwardRef(
  (
    { onClose, quotedPost = null, postType = THEME.JAM, onPostSuccess },
    ref,
  ) => {
    const inputRefs = useRef({}); // 입력창 ref 관리
    const focusTimeoutRef = useRef(null); // 포커스/블러 디바운스용 ref
    const insets = useSafeAreaInsets(); // 안드로이드 시스템 네비게이션 바 높이 등 하단 인셋
    // << ==================== 테마 (jam/jin) 부분 ====================
    const [selectedJam, setSelectedJam] = useState(postType); // 기본 타입을 잼톡(자유)으로 선정
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const translateY = useRef(new Animated.Value(350)).current; // 모달 높이만큼 시작점 아래

    const handleJamSelect = (theme) => {
      //jam이 선택되었는지 아닌지에 따라 분기처리
      if (theme === THEME.JAM) {
        setSelectedJam(THEME.JAM);
      } else {
        setSelectedJam(THEME.JIN);
      }
    };

    const openModal = () => {
      setThemeModalVisible(true);
      Animated.timing(translateY, {
        toValue: 0, // 제자리
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const closeModal = () => {
      Animated.timing(translateY, {
        toValue: 350, // 다시 아래로
        duration: 300,
        useNativeDriver: true,
      }).start(() => setThemeModalVisible(false)); // 애니메이션 끝난 후 모달 닫기
    };
    // ==================== 테마 (jam/jin) 부분 끝 ==================== >>

    // << ==================== 게시판(Dynamic Label) 선택 부분 ====================
    const [selectedBoard, setSelectedBoard] = useState(DYNAMIC_LABEL_0_NONE);
    const [boardModalVisible, setBoardModalVisible] = useState(false);
    const boardTranslateY = useRef(new Animated.Value(500)).current; // 모달 높이만큼

    const openBoardModal = () => {
      setBoardModalVisible(true);
      Animated.timing(boardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const closeBoardModal = () => {
      Animated.timing(boardTranslateY, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setBoardModalVisible(false));
    };
    // ==================== 게시판 선택 부분 끝 ==================== >>

    // << ==================== 글, 투표, 이미지 시작 ====================
    const MAX_IMAGES = 4; // 최대 이미지 수 제한

    // state : 글, 투표, 이미지 상태 관리
    // dispatch : 글, 투표, 이미지 함수 관리
    // 파생 상태들도 함께 받아옴
    const {
      state,
      dispatch,
      lastInput,
      currentTextLength,
      textCountColor,
      currentInputWithModal,
      isExistingText,
      relayPostButtonState,
      isImageFull,
      isVoteActive,
      isImageExisting,
    } = useWriteLogic();

    // 자동 포커스 효과 (일회성 신호 기반)
    // 기존엔 focusedInputId가 바뀔 때마다 focus()를 호출 → 탭 이동/blur·focus가 오갈 때마다
    // 재포커스되어 블록이 2개 이상이면 서로 포커스를 뺏는 경쟁이 발생했다.
    // → ADD_INPUT이 세팅하는 pendingFocusId가 있을 때만, 그 새 블록에 딱 한 번 포커스를 주고
    //   바로 CONSUME_FOCUS로 신호를 비운다. 이후 focusedInputId가 아무리 바뀌어도 재포커스 없음.
    useEffect(() => {
      if (!state.pendingFocusId) return;

      const ref = inputRefs.current?.[state.pendingFocusId];
      if (!ref) {
        // 새 블록 ref가 아직 안 잡혔으면 신호만 소비하고 종료 (무한 재시도 방지)
        dispatch({ type: "CONSUME_FOCUS" });
        return;
      }

      const t = setTimeout(() => {
        ref.focus?.();
        dispatch({ type: "CONSUME_FOCUS" });
      }, 10); // 딜레이 최소화하여 키보드 내려가는 현상 방지

      return () => clearTimeout(t);
    }, [state.pendingFocusId]);

    const { showToast } = useToast();

    // 링크 미리보기 고정 URL 상태 ({ [inputId]: url | null })
    const [pinnedUrls, setPinnedUrls] = useState({});

    // 멘션 관련 상태
    const [mentionVisible, setMentionVisible] = useState(false);
    const [mentionKeyword, setMentionKeyword] = useState("");
    const [selectedMentionsByInput, setSelectedMentionsByInput] = useState({});

    useEffect(() => {
      const sub = Keyboard.addListener("keyboardDidHide", () => {
        setMentionVisible(false);
        setMentionKeyword("");
      });

      return () => sub.remove();
    }, []);

    // 나가기 확인 팝업 상태
    const [exitPopupVisible, setExitPopupVisible] = useState(false);

    // 닫기 요청: 실제 닫힘(키보드 내림 + 슬라이드 아웃)은 부모 오버레이(WriteOverlay)가 담당한다.
    // WriteOverlay는 앱과 같은 윈도우에서 Keyboard.dismiss()와 슬라이드를 동시에 실행해, iOS/안드로이드
    // 모두 키보드와 화면이 자연스럽게 함께 내려간다. 여기서는 onClose만 호출하면 된다.
    const closeWithKeyboard = () => {
      onClose();
    };

    // 나가기 요청 핸들러
    const handleCloseRequest = () => {
      // 작성 중인 내용 확인 logic
      const hasUnsaved = state.inputs.some((input) => {
        // 1. 텍스트 확인 (trim해서 길이가 0보다 큰지)
        const hasText = (input.text ?? "").trim().length > 0;
        // 2. 이미지 확인
        const hasImages = (input.images?.length ?? 0) > 0;
        // 3. 투표 확인 (투표 기능이 켜져 있는지)
        const hasVote = input.vote?.showVote === true;

        return hasText || hasImages || hasVote;
      });

      if (hasUnsaved) setExitPopupVisible(true);
      else {
        dispatch({ type: "RESET" });
        closeWithKeyboard();
      }
    };

    const handleCloseRequestRef = useRef(handleCloseRequest);
    handleCloseRequestRef.current = handleCloseRequest;

    useImperativeHandle(ref, () => ({
      requestClose: () => handleCloseRequestRef.current(),
      // 입력창들을 직접 blur해 키보드를 내린다.
      // 이 앱에선 Keyboard.dismiss()가 커스텀 ref로 관리되는 multiline TextInput을 못 잡아 안 먹힐 때가
      // 있어, 오버레이가 닫힐 때 ref로 직접 blur해야 키보드가 확실히(그리고 슬라이드와 동시에) 내려간다.
      blurInputs: () => {
        Object.values(inputRefs.current || {}).forEach((r) => r?.blur?.());
      },
    }));

    // 버튼 비활성화를 위한 현재 활성 기능 수 계산
    const _limitTargetIndex = state.inputs.findIndex(
      (i) => i.id === (state.focusedInputId || lastInput.id),
    );
    const _limitTargetInput = state.inputs[_limitTargetIndex] ?? lastInput;
    const activeFeatureCount =
      (_limitTargetIndex === 0 && quotedPost ? 1 : 0) +
      (_limitTargetInput.images.length > 0 ? 1 : 0) +
      (_limitTargetInput.vote.showVote ? 1 : 0);
    const isPhotoLimitReached =
      activeFeatureCount >= 2 && _limitTargetInput.images.length === 0;
    const isVoteLimitReached =
      activeFeatureCount >= 2 && !_limitTargetInput.vote.showVote;

    // 기능 제한 체크 공통 함수
    const checkFeatureLimit = (targetIndex, targetInput, featureType) => {
      let activeFeatures = 0;

      // 1. 인용 (첫 번째 인풋이고 quotedPost가 있을 때)
      if (targetIndex === 0 && quotedPost) activeFeatures++;

      // 2. 이미지 (이미지가 있거나, 이미지를 추가하려는 경우)
      const hasImages = targetInput.images.length > 0;
      if (hasImages || featureType === "image") activeFeatures++;

      // 3. 투표 (투표가 켜져있거나, 투표를 켜려는 경우)
      const hasVote = targetInput.vote.showVote;
      if (hasVote || featureType === "vote") activeFeatures++;

      if (activeFeatures > 2) {
        // console.log(`[Write] Feature limit reached (active: ${activeFeatures}). Action blocked.`);
        return false;
      }
      return true;
    };

    // 이미지 추가 함수
    const handleAddPhoto = async () => {
      // 현재 추가 대상 ID 결정
      const targetId =
        state.focusedInputId || state.inputs[state.inputs.length - 1].id;

      // 대상 입력창의 현재 이미지 확인
      const targetIndex = state.inputs.findIndex(
        (input) => input.id === targetId,
      );
      const targetInput = state.inputs[targetIndex];
      const currentImages = targetInput?.images || [];

      // 기능 개수 제한 (공통 함수 사용)
      if (!checkFeatureLimit(targetIndex, targetInput, "image")) {
        showToast({
          pointMessage: "사진, 인용, 투표 중\n2개까지만 사용할 수 있어.",
        });
        return;
      }

      // 권한 요청
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast({ pointMessage: "사진 접근 권한이 필요합니다." });
        return;
      }

      // 이미지 개수 제한
      if (currentImages.length >= MAX_IMAGES) {
        return;
      }

      // 이미지/동영상 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - currentImages.length,
        quality: 1,
      });

      // 이미지 추가
      if (!result.canceled) {
        // EXIF orientation(회전) 정규화: 원본 그대로 올리면 일부 뷰어에서 90도 돌아가 보인다.
        const normalized = await normalizeImageAssets(result.assets);
        const picked = normalized.map((a) => ({
          uri: a.uri,
          type: a.type, // image or video
          width: a.width,
          height: a.height,
          duration: a.duration, // 영상 길이 (ms)
        }));

        dispatch({
          type: "ADD_IMAGES",
          id: targetId, // 포커싱된 입력창 또는 마지막 입력창에 추가
          newImages: picked,
        });
      }
    };

    // 이어서 게시하기 버튼 핸들러
    const handleRelayPress = () => {
      // 블러 타이머가 있다면 취소 (새 인풋 추가로 인한 포커스 이동으로 간주)
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
      dispatch({ type: "ADD_INPUT" });
    };

    // 이미지 삭제 함수
    const handleRemoveImage = (id, indexToRemove) => {
      dispatch({ type: "REMOVE_IMAGE", id, index: indexToRemove });
    };

    // 투표 토글 함수 (기능 제한 적용)
    const handleToggleVote = () => {
      const targetId = state.focusedInputId || lastInput.id;
      const targetIndex = state.inputs.findIndex(
        (input) => input.id === targetId,
      );
      const targetInput = state.inputs[targetIndex];

      // 켜려고 할 때 제한 체크
      if (!targetInput.vote.showVote) {
        if (!checkFeatureLimit(targetIndex, targetInput, "vote")) {
          showToast({
            pointMessage: "사진, 인용, 투표 중\n2개까지만 사용할 수 있어.",
          });
          return;
        }
      }

      dispatch({ type: "TOGGLE_VOTE", id: targetId });
    };

    // 사진 저장 블락 관련
    const [blockImageSave, setBlockImageSave] = useState(false);

    // 업로드 중복 제출 방지 (게시하기 연타로 게시물이 여러 번 생성되는 버그 방지)
    const isUploadingRef = useRef(false);

    // 이미지 뷰어 상태
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // 비디오 뷰어 상태
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const handleImagePress = (imageList, index = 0) => {
      setSelectedImages(imageList);
      setSelectedImageIndex(index);
      setImageModalVisible(true);
    };

    const handleVideoPress = (video) => {
      // console.log("video:", video);
      setSelectedVideo(video); // { uri: ... }
      setVideoModalVisible(true);
    };

    // << ==================== 게시하기 끝 ==================== >>

    // 욕설 필터링 및 업로드 핸들러
    const handleUpload = async () => {
      // 중복 제출 방지: 업로드가 진행 중이면 무시 (연타로 게시물 중복 생성되는 버그 방지)
      if (isUploadingRef.current) return;
      isUploadingRef.current = true;

      // 1. 입력된 모든 텍스트 수집 (본문 + 투표 후보)
      let allText = "";
      state.inputs.forEach((input) => {
        allText += (input.text || "") + " ";
      });

      // 2. 욕설 감지 로직 주석 처리
      /*
    let detectedWord = null;
    for (const category of ExplicitLanguageList) {
      if (allText.includes(category.base)) {
        detectedWord = category.base;
        break;
      }
      for (const variation of category.variations) {
        if (allText.includes(variation)) {
          detectedWord = variation;
          break;
        }
      }
      if (detectedWord) break;
    }

    // 욕설이 발견되면 팝업
    if (detectedWord) {
      Alert.alert(
        "게시 불가",
        `부적절한 단어가 포함되어 있습니다: ${detectedWord}`
      );
      return;
    }
    */

      // 3. 실제 업로드 로직
      try {
        // 유저 정보 가져오기
        const accountInfo = await postApi.fetchAccountInfo();
        const userId = accountInfo?.currentUser_id;

        if (!userId) {
          Alert.alert("알림", "유저 정보를 불러올 수 없어. 다시 로그인해볼래?");
          return;
        }

        const isJin = selectedJam === THEME.JIN;
        const modeValue = isJin ? "Jin-Talk" : "Jam-Talk";
        // 답변 유형(header)은 자유/진지 구분 없이 전송. 미선택 시 공백(" ")으로 보냄
        const headerValue =
          selectedBoard && selectedBoard !== DYNAMIC_LABEL_0_NONE
            ? selectedBoard
            : " ";

        // 이어서 게시 모드: 이미 존재하는 글(quotedPost)에 댓글(draft=1)로 이어 붙임
        const isRelayMode = quotedPost?.isRelay === true;
        // 인용 모드(이어서 게시 아님): 외부 글을 인용하는 새 글의 quote_type
        const quoteType = quotedPost
          ? quotedPost.isComment
            ? "comment"
            : quotedPost.postType === THEME.JIN
              ? "Jin-Talk"
              : "Jam-Talk"
          : null;

        // 이어서 게시 댓글이 부착될 원글 ID와 댓글 type(0:자유, 1:진지, 2:댓글)
        // 이어서 게시 모드면 quotedPost가 곧 원글, 일반/인용 모드면 첫 블록 작성 후 채워짐
        let rootPostId = isRelayMode ? quotedPost.id : null;
        const relayCommentType = isRelayMode
          ? quotedPost.isComment
            ? 2
            : quotedPost.postType === THEME.JIN
              ? 1
              : 0
          : isJin
            ? 1
            : 0;

        // 블록의 이미지/투표를 FormData에 추가하는 헬퍼
        const appendImages = (formData, input) => {
          if (input.images && input.images.length > 0) {
            input.images.forEach((img) => {
              const uri = img.uri || img;
              const filename = uri.split("/").pop();
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : `image/jpeg`;
              formData.append("files", { uri, name: filename, type });
            });
          }
        };
        const appendVote = (formData, input) => {
          if (input.vote?.showVote && input.vote?.candidates) {
            input.vote.candidates.forEach((candidate, idx) => {
              if (candidate && candidate.trim() !== "") {
                formData.append(`vote[vote_${idx + 1}]`, candidate.trim());
              }
            });
            const { day, hour, minute } = input.vote.selectedPeriod;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + day);
            endDate.setHours(endDate.getHours() + hour);
            endDate.setMinutes(endDate.getMinutes() + minute);
            const localEndDate = new Date(
              endDate.getTime() - endDate.getTimezoneOffset() * 60000,
            );
            formData.append(
              "vote[end_date]",
              localEndDate.toISOString().split(".")[0],
            );
          }
        };

        // 각 블록(input)을 순차적으로 업로드
        // - 이어서 게시 모드: 모든 블록을 원글의 댓글(draft=1)로 부착
        // - 일반/인용 모드: 첫 블록은 원글(POST /write), 나머지는 그 원글의 댓글(draft=1)
        for (let i = 0; i < state.inputs.length; i++) {
          const input = state.inputs[i];
          const asRelayComment = isRelayMode || i > 0;

          if (!asRelayComment) {
            // 원글 작성 (POST /write)
            const formData = new FormData();
            formData.append("mode", modeValue);
            formData.append("user_id", userId);
            formData.append("header", headerValue);
            formData.append("subject", input.text.trim());
            if (quotedPost) {
              formData.append("quote", String(quotedPost.id));
              formData.append("quote_type", quoteType);
            }
            formData.append("draft", "0");
            appendImages(formData, input);
            appendVote(formData, input);
            formData.append("image_blocked", blockImageSave ? "1" : "0");

            console.log(
              `[Write] Uploading root post (block ${i + 1}/${state.inputs.length})...`,
            );
            const result = await postApi.createPost(formData);
            if (!result.success) {
              throw new Error(
                result.message || `블록 ${i + 1} 작성에 실패했어.`,
              );
            }
            rootPostId =
              result.data?.id ??
              result.data?.talk_num ??
              result.data?.think_num ??
              null;
            console.log(`[Write] Root post created. ID: ${rootPostId}`);
            // 이어서 게시 블록이 더 있는데 원글 ID를 못 받으면 연결 불가
            if (state.inputs.length > 1 && !rootPostId) {
              throw new Error(
                "게시글 ID를 받지 못해 이어서 게시를 연결할 수 없어.",
              );
            }
          } else {
            // 이어서 게시: 원글에 댓글(draft=1)로 부착 (POST /comment)
            if (!rootPostId) {
              throw new Error("이어서 게시할 원글 정보를 찾을 수 없어.");
            }
            const formData = new FormData();
            formData.append("type", String(relayCommentType));
            formData.append("post_num", String(rootPostId));
            formData.append("subject", input.text.trim());
            formData.append("user_id", userId);
            formData.append("draft", "1");
            appendImages(formData, input);
            appendVote(formData, input);

            console.log(
              `[Write] Uploading 이어서 게시 comment (block ${i + 1}/${state.inputs.length}) on post ${rootPostId}, type=${relayCommentType}...`,
            );
            const result = await commentApi.createComment(
              rootPostId,
              modeValue,
              formData,
            );
            if (!result.success) {
              throw new Error(
                result.message || `블록 ${i + 1} 이어서 게시에 실패했어.`,
              );
            }
            console.log(
              `[Write] 이어서 게시 comment uploaded (block ${i + 1}).`,
            );
          }
        }

        // 모든 업로드 성공 시: 모달을 먼저 닫아 글세부로 복귀시킨 뒤 새로고침
        dispatch({ type: "RESET" });
        closeWithKeyboard();
        onPostSuccess?.();
      } catch (error) {
        console.error("handleUpload API Error:", error);
        Alert.alert("오류", error.message || "게시글 작성 중 오류가 발생했어.");
      } finally {
        isUploadingRef.current = false;
      }
    };

    // 멘션 선택 핸들러
    const handleMentionSelect = (user) => {
      if (!state.focusedInputId) return;
      const userId = user?.usercode ? `@${user.usercode}` : user?.userId;
      if (!userId) return;

      const targetInput = state.inputs.find(
        (i) => i.id === state.focusedInputId,
      );
      if (!targetInput) return;

      // 현재 텍스트에서 마지막 @를 찾고 해당 부분을 유저 아이디로 교체
      const text = targetInput.text;
      const lastAtIndex = text.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const newText = text.substring(0, lastAtIndex) + userId + " ";
        dispatch({
          type: "UPDATE_TEXT",
          id: state.focusedInputId,
          text: newText,
        });
        setSelectedMentionsByInput((prev) => {
          const currentMentions = prev[state.focusedInputId] || [];
          if (currentMentions.includes(userId)) return prev;

          return {
            ...prev,
            [state.focusedInputId]: [...currentMentions, userId],
          };
        });
      }
      setMentionVisible(false);
      setMentionKeyword("");
    };

    // << ==================== 게시하기 부분 ====================
    // 글 존재 여부에 따라 버튼 눌림 여부 결정
    const UploadButtonWrapper = isExistingText ? TouchableOpacity : View;
    // ==================== 게시하기 끝 ==================== >>

    const scrollViewRef = useRef(null); // 스크롤 뷰 ref

    // 블록이 '추가'된 경우에만 스크롤을 맨 아래로 이동 (삭제/초기 마운트엔 불필요)
    const prevInputCountRef = useRef(state.inputs.length);
    useEffect(() => {
      const prev = prevInputCountRef.current;
      prevInputCountRef.current = state.inputs.length;
      if (state.inputs.length <= prev) return;

      // 새 블록 포커스로 키보드가 올라오는 애니메이션과 겹치면 focus/scroll이 충돌하므로,
      // 키보드 애니메이션이 끝난 뒤(>=300ms) '애니메이션 없이' 한 번만 끝으로 이동한다.
      const t = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 300);
      return () => clearTimeout(t);
    }, [state.inputs.length]);

    const inputLayouts = useRef({}); // 각 인풋의 y 위치 저장
    const blockLayoutsRef = useRef({}); // 각 블록의 {y, height} (자동 스크롤 위치 계산용)
    const scrollViewHeightRef = useRef(0); // 스크롤 뷰포트 높이(키보드 올라오면 줄어듦)
    const scrollTimerRef = useRef(null); // 자동 스크롤 디바운스 타이머

    // ==================== 포커스된 블록 자동 노출 스크롤 ====================
    // 텍스트 줄바꿈/자동 줄바꿈, 이미지 추가, 투표 켜기, 경고문구 등장 등으로
    // '포커스된(활성) 블록'의 높이가 늘어나면, 그 블록의 하단이 키보드에 가려지지 않도록
    // 자동으로 스크롤한다. 블록 높이 변화(onLayout)에 연동하므로 모든 경우를 한 번에 처리.
    // - 마지막 블록이면 scrollToEnd(하단 패딩까지 노출), 중간 블록이면 그 블록 하단이
    //   뷰포트 바닥에 오도록 scrollTo로 정밀 이동한다.
    const scrollFocusedIntoView = (id) => {
      const targetId = id ?? state.focusedInputId ?? lastInput?.id;
      if (targetId == null) return;
      const isLast =
        state.inputs[state.inputs.length - 1]?.id === targetId;

      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        if (isLast) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
          return;
        }
        const layout = blockLayoutsRef.current[targetId];
        const vh = scrollViewHeightRef.current;
        if (layout && vh) {
          // 블록 하단이 뷰포트 바닥에서 24px 위에 오도록
          const target = Math.max(0, layout.y + layout.height - vh + 24);
          scrollViewRef.current?.scrollTo({ y: target, animated: true });
        } else {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    };
    // ======================================================================

    // [iOS 전용] 하단 입력창(예: "이어서 게시중")을 탭해 키보드가 올라올 때
    // 키보드가 그 입력창을 가리지 않도록, 포커스된 블록이 맨 아래 블록이면 끝으로 스크롤해 키보드 위로 끌어올린다.
    // - 안드로이드는 이미 키보드가 이어서 게시 영역을 침범하지 않게 동작하므로 제외(iOS만 보정).
    // - onFocus가 아니라 keyboardDidShow(키보드가 완전히 올라온 시점)에 처리하여
    //   포커스 churn으로 인한 스크롤 충돌/무한 루프 우려를 피한다.
    useEffect(() => {
      if (Platform.OS !== "ios") return;
      const sub = Keyboard.addListener("keyboardDidShow", () => {
        const focusedId = state.focusedInputId;
        if (!focusedId) return;
        const lastId = state.inputs[state.inputs.length - 1]?.id;
        if (focusedId === lastId) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      });
      return () => sub.remove();
    }, [state.focusedInputId, state.inputs.length]);

    // 본문 빈 영역(텍스트가 없는 넓은 공간)을 탭했을 때 활성 입력창에 포커스를 준다.
    // TextInput의 실제 터치 대상은 글자 줄뿐이라, 그 아래 빈 공간을 탭하면 아무 일도
    // 일어나지 않았고, 특히 iOS에서 키보드가 한 번 내려간 뒤 재포커스가 잘 안 됐다.
    const focusActiveInput = () => {
      const id = state.focusedInputId ?? lastInput?.id;
      if (id == null) return;
      inputRefs.current[id]?.focus?.();
    };

    // 텍스트가 하나라도 입력되어 있는지 확인 (키보드 유지용)
    const hasAnyText = state.inputs.some(
      (input) => input.text.trim().length > 0,
    );
    // console.log("[Write] hasAnyText for keyboard persistence :", hasAnyText);

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: ColorTokens.Background }}
      >
        {/* 취소 버튼 (absolute) */}
        <TouchableOpacity
          onPress={handleCloseRequest}
          hitSlop={20}
          style={{
            position: "absolute",
            top: 62,
            left: Spacing[4],
            zIndex: 10,
          }}
        >
          <Text style={Tokens.cancel_import_Text}>취소</Text>
        </TouchableOpacity>

        {/* Jam-talk / Jin-talk 테마 정하기 (absolute) */}
        <TouchableOpacity
          style={[
            Tokens.dropdown,
            {
              position: "absolute",
              top: 62,
              left: "50%",
              transform: [{ translateX: -25 }],
              zIndex: 10,
            },
          ]}
          onPress={openModal}
        >
          <Text
            style={[
              Tokens.dropdownText,
              {
                color:
                  selectedJam === THEME.JIN
                    ? ColorTokens.Purple
                    : ColorTokens.Point,
              },
            ]}
          >
            {selectedJam}
          </Text>
          {/* 아래 화살표 이미지 */}
          <Image
            source={require("../../tokenImage/dropdown.png")}
            style={{
              marginLeft: 2,
              width: 17,
              height: 8,
            }}
          />
        </TouchableOpacity>

        {/* 게시하기 버튼 (absolute) */}
        <UploadButtonWrapper
          {...(isExistingText && { onPress: handleUpload })}
          style={{
            position: "absolute",
            top: 56,
            right: Spacing[4],
            zIndex: 10,
          }}
        >
          <Image
            source={
              isExistingText
                ? require("../../tokenImage/uploadButton.png")
                : require("../../tokenImage/uploadButtonDisabled.png")
            }
          />
        </UploadButtonWrapper>

        {/* ===== 답변유형 기능 임시 비활성화 [ANSWER_TYPE_HIDDEN] =====
            출시 보류로 유저에게 숨김. 복구하려면 이 주석 블록의 여는/닫는 표시를 제거하고
            아래 원본 JSX(DynamicLabel 선택 버튼)를 그대로 되살리세요.
        <View
          style={{
            position: "absolute",
            top: 102,
            left: 0,
            zIndex: 10,
            alignItems: "flex-start",
            marginLeft: Spacing[4],
          }}
        >
          <TouchableOpacity onPress={openBoardModal}>
            {selectedBoard === DYNAMIC_LABEL_0_NONE ? (
              <Image
                source={require("../../tokenImage/writeCategoryNone.png")}
                style={{
                  height: DYNAMIC_LABEL_HEIGHT,
                }}
              />
            ) : (
              <DynamicLabel text={selectedBoard} />
            )}
          </TouchableOpacity>
        </View>
            ===== [ANSWER_TYPE_HIDDEN] 끝 ===== */}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // edge-to-edge(Expo SDK 54)에서는 adjustResize가 창을 줄이지 않고 키보드가 콘텐츠 위로 겹친다.
          // 안드로이드 "height"는 이 환경에서 키보드 높이를 제대로 못 잡아 하단 바가 가려지므로 "padding" 사용.
          behavior="padding"
          // iOS: baseline -20 + IOS_KEYBOARD_BOTTOM_BAR_LIFT / 안드로이드: baseline 0 + ANDROID_KEYBOARD_BOTTOM_BAR_LIFT
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? -20 + IOS_KEYBOARD_BOTTOM_BAR_LIFT
              : 0 + ANDROID_KEYBOARD_BOTTOM_BAR_LIFT
          }
        >
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {/* 메인부분 */}
              <ScrollView
                ref={scrollViewRef}
                // 답변 유형 라벨(absolute, top:102 + 높이 DYNAMIC_LABEL_HEIGHT)을 스크롤 영역 밖에 두기 위해
                // ScrollView 뷰포트를 라벨 아래에서 시작시킨다. 이러면 본문/이미지가 길어져 스크롤되어도
                // 콘텐츠가 라벨 위로 올라가 겹치지 않고, 라벨 하단에서 잘려(clip) 보인다.
                // 라벨과 입력창 사이 간격: 공통 base + 플랫폼별 추가 간격
                style={{
                  flex: 1,
                  // [ANSWER_TYPE_HIDDEN] 답변유형 라벨을 숨기는 동안, 라벨이 차지하던 높이
                  // (DYNAMIC_LABEL_HEIGHT)와 라벨-입력창 gap을 제거해 상단 빈 여백을 없앤다.
                  // 복구 시 아래 원본 marginTop 계산식으로 되돌리세요.
                  //   marginTop:
                  //     90 +
                  //     DYNAMIC_LABEL_HEIGHT +
                  //     (Platform.OS === "ios"
                  //       ? IOS_LABEL_TO_INPUT_GAP
                  //       : ANDROID_LABEL_TO_INPUT_GAP),
                  marginTop: Platform.OS === "ios" ? 50 : 65,
                }}
                // flexGrow:1 → 콘텐츠가 짧아도 컨테이너가 뷰포트 전체 높이를 채워,
                // 글 아래 빈 영역을 잡고 스와이프해도 스크롤이 동작한다.
                // (이전엔 이게 iOS 첫/이후 진입 위치 차이를 유발했으나, 모달 콘텐츠를
                //  SafeAreaProvider + initialWindowMetrics로 감싸 인셋을 고정했으므로 이제 안전하다.)
                contentContainerStyle={{ paddingTop: Spacing[0], flexGrow: 1 }} // 라벨과 첫 줄 사이 간격
                keyboardShouldPersistTaps={hasAnyText ? "always" : "handled"}
                nestedScrollEnabled={true}
                // 뷰포트 높이 저장(키보드가 올라오면 KeyboardAvoidingView가 줄여줌)
                // → 중간 블록의 하단을 뷰포트 바닥에 맞춰 스크롤할 때 사용.
                onLayout={(e) => {
                  scrollViewHeightRef.current = e.nativeEvent.layout.height;
                }}
              >
                {/* 본문 빈 영역을 탭하면 활성 입력창에 포커스를 줘 키보드를 다시 올린다.
                    (TextInput 글자 줄 밖의 빈 공간 탭 대응 + iOS 재포커스 문제 해결) */}
                <TouchableWithoutFeedback accessible={false} onPress={focusActiveInput}>
                <View
                  style={{
                    paddingHorizontal: Spacing[4],
                    flex: 1,
                    paddingTop: Spacing[0],
                    paddingBottom: 30, // 터치를 수월하게 만들어줌
                  }}
                >
                  {/* 텍스트 입력 */}
                  {state.inputs.map((item, index) => {
                    // 공백 제외 글자수 / 화면에 보이는 줄 수 초과 여부 (블록별)
                    const noSpaceLength = (item.text ?? "").replace(
                      /\s+/g,
                      "",
                    ).length;
                    const isOverLength = noSpaceLength > MAX_TEXT_LENGTH;
                    const isOverLines = (item.lineCount ?? 0) > MAX_LINE_COUNT;

                    const isFocused = state.focusedInputId === item.id;
                    // 포커스된 인풋이 없으면 마지막 인풋을 활성화로 간주
                    const isLastActive =
                      !state.focusedInputId &&
                      index === state.inputs.length - 1;
                    const isActive = isFocused || isLastActive;
                    // 두 번째 블록부터는 우측 상단에 문단 삭제(X) 버튼이 뜨므로,
                    // 텍스트가 그 영역을 침범해 가려지지 않도록 입력창/오버레이에 우측 여백을 확보한다.
                    // (X 버튼은 활성 상태에서만 보이지만, 포커스 이동 시 텍스트가 리플로우되어 흔들리는 것을
                    //  막기 위해 index>0이면 활성 여부와 무관하게 항상 같은 여백을 유지한다.)
                    const deleteButtonSpace = index > 0 ? 30 : 0;
                    // [이어서 게시하기 dimming] 포커스(활성)된 블록만 opacity 1로 두고,
                    // 나머지 블록(=다른 이어서 게시하기 단위)은 0.5로 흐리게 한다.
                    // 각 블록(item)이 하나의 '이어서 게시하기'이며, 그 안의 텍스트/투표/이미지는
                    // 한 덩어리로 취급되므로 블록 wrapper에 opacity를 걸면 요구사항이 모두 충족된다.
                    // [주의] 과거 Android에서 opacity 1↔0.5 전환 시 subtree가 오프스크린 레이어로
                    // 재합성되며, 포커스된 TextInput이 든 블록이 재합성되는 순간 포커스가 옆 EditText로
                    // 점프 → focusedInputId 변경 → 또 재합성 → 커서가 무한히 오가며 멈추는 문제가 있었다.
                    // 활성 블록은 항상 opacity 1로 유지(값 변화 없음)해 이 트리거를 최소화했으나,
                    // 포커스 전환 시점(0.5→1 / 1→0.5)의 재합성은 남으므로 Android 실기기(블록 3개+) 확인 필요.

                    return (
                      <View
                        key={item.id}
                        style={{ opacity: isActive ? 1 : 0.5 }}
                        onLayout={(event) => {
                          const layout = event.nativeEvent.layout;
                          inputLayouts.current[item.id] = layout.y;
                          const prev = blockLayoutsRef.current[item.id];
                          blockLayoutsRef.current[item.id] = {
                            y: layout.y,
                            height: layout.height,
                          };
                          // 활성 블록의 높이가 늘어났을 때만(텍스트 줄바꿈/이미지/투표/경고 등)
                          // 그 블록 하단이 보이도록 자동 스크롤. 줄어들 때는 스크롤하지 않는다.
                          if (
                            isActive &&
                            prev &&
                            layout.height > prev.height + 1
                          ) {
                            scrollFocusedIntoView(item.id);
                          }
                        }}
                      >
                        {/* 외부에서 연결된 원글 정보 및 인용 UI (첫 번째 블록 상단에 표시 - 이어서 게시할 때만) */}
                        {index === 0 && quotedPost && quotedPost.isRelay && (
                          <View style={styles.relayPostContainer}>
                            <QuoteCard
                              quotedPost={quotedPost}
                              isWrite={true}
                              isRelay={true}
                            />
                            <View style={styles.relayLabelContainer}>
                              <View style={styles.relayLine} />
                              <Text style={styles.relayLabelText}>
                                이어서 게시중...
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* 내부 블록 이어서 게시 UI (두 번째 블록부터 표시) */}
                        {index > 0 && (
                          <View style={styles.relayLabelContainer}>
                            <View style={styles.relayLine} />
                            <Text style={styles.relayLabelText}>
                              이어서 게시중...
                            </Text>
                          </View>
                        )}

                        {/* 입력창 + 오버레이 컨테이너 */}
                        <View style={{ position: "relative" }}>
                          {/* 1. 실제 입력 레이어 (in-flow, 높이 결정) */}
                          <TextInput
                            ref={(r) => {
                              if (r) inputRefs.current[item.id] = r;
                              else delete inputRefs.current[item.id];
                            }}
                            style={[
                              Tokens.inputtext,
                              {
                                paddingTop: 5,
                                paddingBottom: 5,
                                paddingLeft: 0,
                                paddingRight: deleteButtonSpace,
                                textAlignVertical: "top",
                                color: ColorTokens.Typography,
                                includeFontPadding: false,
                              },
                            ]}
                            underlineColorAndroid="transparent"
                            selectionColor={ColorTokens.Typography}
                            placeholder="어떤 이야기를 해볼까요?"
                            placeholderTextColor={ColorTokens.Unselected}
                            multiline //여러 줄 입력
                            // 자동 대문자 방지
                            autoCapitalize="none"
                            // 자동 수정 방지
                            autoCorrect={false}
                            spellCheck={false}
                            value={item.text}
                            // 실제 입력창의 렌더 높이로 '화면에 보이는 줄 수'를 계산한다.
                            // onTextLayout과 달리 끝부분 빈 줄(연속 줄바꿈)도 높이에 반영되고,
                            // iOS에서 경고문구 이후 줄바꿈이 누락되던 문제도 해결된다.
                            onContentSizeChange={(e) => {
                              const h = e.nativeEvent.contentSize.height;
                              const lh =
                                Typography.paraMedium.lineHeight || 22;
                              const lines = Math.max(1, Math.round(h / lh));
                              if (lines !== (item.lineCount ?? 0)) {
                                dispatch({
                                  type: "SET_LINE_COUNT",
                                  id: item.id,
                                  lineCount: lines,
                                });
                              }
                            }}
                            onChangeText={(text) => {
                              // 욕설 치환 로직 (심화): ExplicitLanguageList 기반 랜덤 치환
                              let processedText = text;
                              try {
                                ExplicitLanguageList.forEach((group) => {
                                  group.words.forEach((word) => {
                                    // 단어 뒤에 공백이 올 때만 치환 (기존 규칙 유지)
                                    if (processedText.includes(`${word} `)) {
                                      const pattern = new RegExp(
                                        `${word}\\s`,
                                        "g",
                                      );
                                      processedText = processedText.replace(
                                        pattern,
                                        () => {
                                          const randomReplacement =
                                            group.replacement[
                                              Math.floor(
                                                Math.random() *
                                                  group.replacement.length,
                                              )
                                            ];
                                          console.log(
                                            `[Filter] Replaced "${word}" with "${randomReplacement}"`,
                                          );
                                          return `${randomReplacement} `;
                                        },
                                      );
                                    }
                                  });
                                });
                              } catch (e) {
                                console.error(
                                  "[Filter] Error during swear word replacement:",
                                  e,
                                );
                              }

                              // 멘션 감지 로직
                              const mentionMatch = processedText.match(/@([^\s@]*)$/);
                              if (mentionMatch) {
                                setMentionVisible(true);
                                setMentionKeyword(mentionMatch[1]);
                              } else {
                                setMentionVisible(false);
                                setMentionKeyword("");
                              }

                              dispatch({
                                type: "UPDATE_TEXT",
                                id: item.id,
                                text: processedText,
                              });

                              // 핀된 URL이 변형되면(삭제/추가 모두) 미리보기 제거
                              const currentPinned = pinnedUrls[item.id] || null;
                              const newUrl = extractFirstUrl(processedText);
                              if (currentPinned && newUrl !== currentPinned) {
                                setPinnedUrls((prev) => ({
                                  ...prev,
                                  [item.id]: null,
                                }));
                              } else if (!currentPinned && newUrl) {
                                setPinnedUrls((prev) => ({
                                  ...prev,
                                  [item.id]: newUrl,
                                }));
                              }
                            }}
                            onFocus={() => {
                              // 블러 타이머가 있다면 취소 (다른 인풋으로 이동 중이라는 뜻)
                              if (focusTimeoutRef.current) {
                                clearTimeout(focusTimeoutRef.current);
                                focusTimeoutRef.current = null;
                              }
                              dispatch({
                                type: "SET_FOCUSED_INPUT",
                                id: item.id,
                              });
                              // [중요] 여기서 scrollTo를 하지 않는다.
                              // 포커스가 바뀔 때마다 스크롤하면, 새 블록 추가 시
                              // (blur→키보드 내려감 → focus→키보드 올라옴) 휘청임과
                              // 스크롤 애니메이션이 충돌해 focus/blur/layout 이벤트가
                              // 폭주하며 앱이 멈추는 무한 루프가 발생한다(블록 3개+).
                              // 새 블록을 화면에 보이게 하는 스크롤은 아래 useEffect(scrollToEnd)가
                              // 추가 시점에 '한 번만' 처리한다.
                            }}
                            // onBlur에서 focusedInputId를 null로 비우지 않는다.
                            // (기존: blur 100ms 뒤 CLEAR_FOCUSED_INPUT → 새 블록 추가 시 일어나는
                            //  blur·focus 연쇄마다 focusedInputId가 null↔id로 churn하고, 이게
                            //  opacity 변화/키보드와 얽혀 focus 이벤트가 폭주, 앱이 멈췄다.)
                            // focusedInputId는 '마지막으로 포커스된 블록'으로 안정적으로 유지되며,
                            // 이미지/투표 타깃팅도 focusedInputId(없으면 lastInput)로 정상 동작한다.
                          />

                          {/* 문단 삭제 버튼 (첫 번째 문단 제외, 활성 블록일 때만) */}
                          {index > 0 && isActive && (
                            <TouchableOpacity
                              style={{
                                position: "absolute",
                                right: 0,
                                top: 5,
                                zIndex: 1,
                              }}
                              onPress={() =>
                                dispatch({ type: "REMOVE_INPUT", id: item.id })
                              }
                            >
                              <Image
                                source={require("../../tokenImage/GrayCircleDeleteButton.png")}
                                style={{ width: 24, height: 24 }}
                              />
                            </TouchableOpacity>
                          )}

                          {/* 멘션 추천 리스트 (현재 포커스된 인풋 하단에 표시) */}
                          {isFocused && mentionVisible && mentionKeyword.length > 0 && (
                            <View style={styles.mentionOverlay}>
                              <UserSearchResultList
                                keyword={mentionKeyword}
                                onSelectUser={handleMentionSelect}
                                virtualized={false}
                                scrollable={true}
                                selectOnPressIn={false}
                              />
                            </View>
                          )}
                        </View>

                        {/* 글자수/줄 수 초과 안내문구 (초과 시에만 입력 블록 바로 아래에 표시) */}
                        {(isOverLength || isOverLines) && (
                          <Text style={styles.exceedLengthMessage}>
                            {isOverLength
                              ? "300자 이내로 입력해야 한다던데.."
                              : "20줄 이내로 입력해야 한다던데.."}
                          </Text>
                        )}

                        {/* 이미지 부분 - 텍스트 바로 아래로 이동 */}
                        {item.images.length > 0 && (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                          >
                            {item.images.map((img, index) => {
                              const ratio = img.width / img.height;
                              const isWide = ratio >= 1.2;
                              const appliedStyle = isWide
                                ? styles.wideImageStyle
                                : styles.imageStyle;
                              const imageOnlyList = item.images
                                .filter((m) => m.type !== "video")
                                .map((m) => ({ uri: m.uri }));
                              const imageOnlyIndex = item.images
                                .filter((m) => m.type !== "video")
                                .findIndex((m) => m === img);

                              return (
                                <View key={index} style={styles.imageContainer}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      if (img.type === "video") {
                                        handleVideoPress({ uri: img.uri });
                                      } else {
                                        handleImagePress(
                                          imageOnlyList,
                                          Math.max(0, imageOnlyIndex),
                                        );
                                      }
                                    }}
                                    activeOpacity={0.8}
                                  >
                                    {img.type === "video" ? (
                                      <View>
                                        <Video
                                          source={{ uri: img.uri }}
                                          style={appliedStyle}
                                          useNativeControls={false} // 썸네일에서는 컨트롤 숨김
                                          resizeMode={ResizeMode.COVER}
                                          shouldPlay={false} // 썸네일에서는 재생 안함
                                        />
                                        {/* 플레이 버튼 오버레이 */}
                                        <View
                                          style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            zIndex: 1,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              fontSize: 24,
                                              color: "white",
                                              opacity: 0.9,
                                            }}
                                          >
                                            ▶
                                          </Text>
                                        </View>
                                      </View>
                                    ) : (
                                      <Image
                                        source={{ uri: img.uri }}
                                        style={appliedStyle}
                                      />
                                    )}
                                    {img.type === "video" && img.duration && (
                                      <View
                                        style={{
                                          position: "absolute",
                                          bottom: 15,
                                          right: 15,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: "white",
                                            ...Typography.boldSmall,
                                          }}
                                        >
                                          {formatDuration(img.duration)}
                                        </Text>
                                      </View>
                                    )}
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveImage(item.id, index)
                                    }
                                    style={styles.imageDeleteButtonTouchable}
                                  >
                                    <Image
                                      source={require("../../tokenImage/CircleDeleteButton.png")}
                                      style={styles.imageDeleteButton}
                                    />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </ScrollView>
                        )}

                        {/* 투표버튼 누를시 추가 */}
                        {item.vote.showVote && (
                          <VoteComposer
                            candidates={item.vote.candidates}
                            selectedPeriod={item.vote.selectedPeriod}
                            // 투표 후보 입력에 포커스가 가면 이 블록을 활성(포커스) 블록으로 만들어
                            // 해당 이어서 게시하기만 밝아지고 나머지는 어두워지도록 한다.
                            onFocusVote={() =>
                              dispatch({
                                type: "SET_FOCUSED_INPUT",
                                id: item.id,
                              })
                            }
                            onOpenPeriodModal={() => {
                              Keyboard.dismiss();
                              dispatch({
                                type: "OPEN_PERIOD_MODAL",
                                id: item.id,
                              });
                            }}
                            onCloseVote={() =>
                              dispatch({ type: "TOGGLE_VOTE", id: item.id })
                            }
                            onChangeCandidate={(index, text) =>
                              dispatch({
                                type: "UPDATE_CANDIDATE",
                                id: item.id,
                                index,
                                text,
                              })
                            }
                            onAddCandidate={() =>
                              dispatch({ type: "ADD_CANDIDATE", id: item.id })
                            }
                            onRemoveCandidate={(index) =>
                              dispatch({
                                type: "REMOVE_CANDIDATE",
                                id: item.id,
                                index,
                              })
                            }
                          />
                        )}

                        {/* 외부에서 연결된 인용 UI (첫 번째 블록 하단에 표시 - 인용할 때만) */}
                        {index === 0 && quotedPost && !quotedPost.isRelay && (
                          <View style={{ marginTop: 0 }}>
                            {/* containerStyle로 QuoteCard 내부 Tokens.quotedContainer의 marginTop:20을 덮어씀 (글쓰기 화면에만 적용) */}
                            <QuoteCard
                              quotedPost={quotedPost}
                              isWrite={true}
                              containerStyle={{ marginTop: 10 }}
                            />
                          </View>
                        )}

                        {/* 링크 미리보기 추가 - 가장 하단으로 이동 */}
                        {(() => {
                          const linkUrl = pinnedUrls[item.id] || null;
                          return linkUrl ? (
                            <View
                              style={{
                                marginBottom: Spacing[4],
                                marginTop: 10,
                              }}
                            >
                              <LinkPreview url={linkUrl} />
                            </View>
                          ) : null;
                        })()}

                        {/* 마지막 인풋이 아닐 때만 구분선 표시 (이어서 게시 UI로 대체되었으므로 제거 또는 간격 조정) */}
                        {/* {index < state.inputs.length - 1 && (
                        <Image
                          style={{ marginTop: 30 }}
                          source={require("../../tokenImage/VerticalLine.png")}
                        />
                      )} */}
                      </View>
                    );
                  })}
                </View>
                </TouchableWithoutFeedback>
              </ScrollView>

              {/* 이미지 + 바텀탭 컨테이너 분리됨 */}
              <WriteBottomBar
                handleAddPhoto={handleAddPhoto}
                handleToggleVote={handleToggleVote}
                blockImageSave={blockImageSave}
                setBlockImageSave={setBlockImageSave}
                currentTextLength={currentTextLength}
                textCountColor={textCountColor}
                relayPostButtonState={relayPostButtonState}
                handleRelayPress={handleRelayPress}
                isImageFull={isImageFull}
                isVoteActive={isVoteActive}
                isImageExisting={isImageExisting}
                isPhotoLimitReached={isPhotoLimitReached}
                isVoteLimitReached={isVoteLimitReached}
              />
            </View>

            {/* 이미지 상세 보기 모달 */}
            <ViewImage
              visible={imageModalVisible}
              onClose={() => setImageModalVisible(false)}
              images={selectedImages}
              initialIndex={selectedImageIndex}
              blockImageSave={blockImageSave}
              meatballVisible={!blockImageSave}
            />

            {/* 비디오 상세 보기 모달 */}
            <ViewVideo
              visible={videoModalVisible}
              onClose={() => setVideoModalVisible(false)}
              videoSource={selectedVideo}
            />

            {/* 기간 설정 */}
            <DeeptalkPicker
              visible={Boolean(currentInputWithModal)}
              initialFirst={
                currentInputWithModal?.vote.selectedPeriod?.day ?? 3
              }
              initialSecond={
                currentInputWithModal?.vote.selectedPeriod?.hour || 0
              }
              initialThird={
                currentInputWithModal?.vote.selectedPeriod?.minute || 0
              }
              initialFirstText={"일"}
              initialSecondText={"시간"}
              initialThirdText={"분"}
              data1={POLL_DAYS}
              data2={POLL_HOURS}
              data3={POLL_MINUTES}
              message="확인"
              accentColor={ColorTokens.Point}
              // 확인을 누르지 않아도 바깥을 터치/스크롤하면 닫히도록
              dismissOnBackdropPress={true}
              // 글쓰기 화면에서는 하단 탭바를 숨기므로(WriteOverlay가 신호를 보냄) 피커를
              // 화면 가장 아래에 붙인다. 다만 이 화면의 루트 SafeAreaView가 edge-to-edge
              // 환경에서 하단 인셋만큼 패딩을 넣기 때문에, bottom:0으로 두면 그 패딩 높이만큼
              // 떠 보인다. 그래서 안드로이드는 -insets.bottom으로 패딩을 상쇄해 시스템
              // 네비게이션 바(자체 탭바) 바로 위에 딱 붙이고, iOS는 기존대로 bottom:0을 쓴다.
              style={{ bottom: Platform.OS === "android" ? -insets.bottom + 15 : 0 }}
              onClose={() =>
                dispatch({
                  type: "CLOSE_PERIOD_MODAL",
                  id: currentInputWithModal?.id || lastInput.id,
                })
              }
              onConfirm={(d, h, m) =>
                dispatch({
                  type: "SET_PERIOD",
                  id: currentInputWithModal?.id || lastInput.id,
                  day: d,
                  hour: h,
                  minute: m,
                })
              }
            />
            {/* 테마 설정 모달 */}
            <SetTheme
              isVisible={themeModalVisible}
              onClose={closeModal}
              selectedTheme={selectedJam}
              setTheme={handleJamSelect}
              translateY={translateY} // Animated.Value 넘겨받음,
              textGroup={[THEME.JAM, THEME.JIN]}
              themeModalHeight={262}
            />
            {/* ===== 답변유형 기능 임시 비활성화 [ANSWER_TYPE_HIDDEN] =====
                출시 보류로 유저에게 숨김. 복구하려면 이 주석 블록의 여는/닫는 표시를 제거하고
                아래 원본 JSX(게시판 선택 모달)를 그대로 되살리세요.
            <SetTheme
              isVisible={boardModalVisible}
              onClose={closeBoardModal}
              selectedTheme={selectedBoard}
              setTheme={(theme) => {
                setSelectedBoard(theme);
              }}
              translateY={boardTranslateY}
              textGroup={[
                DYNAMIC_LABEL_0_NONE,
                DYNAMIC_LABEL_1_EMPATHY,
                DYNAMIC_LABEL_2_ADVISE,
                DYNAMIC_LABEL_3_EXPLAIN,
                DYNAMIC_LABEL_4_OTHER,
              ]}
              themeModalHeight={410}
            />
                ===== [ANSWER_TYPE_HIDDEN] 끝 ===== */}
            {/* 나가기 확인 팝업 */}
            <Popup2Button
              visible={exitPopupVisible}
              onRequestClose={() => setExitPopupVisible(false)}
              leftOnPress={() => setExitPopupVisible(false)}
              rightOnPress={() => {
                setExitPopupVisible(false);
                dispatch({ type: "RESET" });
                setTimeout(() => {
                  closeWithKeyboard();
                }, 300); // 팝업 닫히는 애니메이션 기다림
              }}
              mainText="지금 나가면 작성 중인 글은 사라져. 괜찮아?"
              leftText="취소"
              rightText="나가기"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  },
);

export default Write;

const styles = StyleSheet.create({
  mentionOverlay: {
    position: "absolute",
    top: 30, // 텍스트 입력창 높이에 맞춰 조정
    left: 0,
    right: 0,
    backgroundColor: ColorTokens.InnerBox2,
    borderRadius: Radius.sm,
    borderWidth: STROKE_WIDTH,
    borderColor: ColorTokens.Stroke,
    zIndex: 100,
    maxHeight: 200,
    overflow: "hidden",
    paddingHorizontal: Spacing[2],
  },
  imageContainer: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
    marginTop: 15,
  },
  imageStyle: {
    width: 160,
    height: 160,
    borderRadius: 3,
  },
  wideImageStyle: {
    width: 256, // 160 * 1.6
    height: 160,
    borderRadius: 3,
  },
  imageDeleteButtonTouchable: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 1,
  },
  imageDeleteButton: {
    width: 20,
    height: 20,
  },
  relayPostContainer: {
    marginBottom: 0,
    marginTop: 0,
  },
  relayLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  relayLine: {
    width: 2,
    height: 54,
    backgroundColor: ColorTokens.Point, // 노란색
    marginRight: 8,
  },
  relayLabelText: {
    color: ColorTokens.Point,
    ...Typography.paraMedium,
  },
  exceedLengthMessage: {
    ...Typography.paraSmall,
    color: ColorTokens.Warning,
    marginTop: 6,
  },
});
