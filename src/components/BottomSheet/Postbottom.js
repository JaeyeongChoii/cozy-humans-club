import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  DeviceEventEmitter,
  ImageBackground,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { normalizeImageAssets } from "../../utils/normalizeImage";

import DeeptalkPicker from "../DeeptalkPicker";

import GlobalScrollView from "../GlobalScrollView";
import { ColorTokens } from "../../design/token/ColorTokens";
import Database from "../Database";
import PostUserInfo from "../PostUserInfo";
import Tokens from "../../../Tokens";
import PostUserSaved from "../PostUserSaved";
import Comments from "../Comments.js";
import {
  BOTTOM_SHEET_HEIGHT,
  THEME,
  SCREEN_WIDTH,
} from "../../design/token/constantsTokens.js";
import MoreMenu from "../Moremenu.js";
import { BottomSheetContext } from "../BottomSheetFrame/BottomSheetContext.js";
import ViewImage from "../ViewImage.js";
import PostMedia from "../PostMedia.js";
import ViewVideo from "../ViewVideo.js";
import LinkPreview from "../LinkPreview.js";
import { extractFirstUrl } from "../../utils/urlUtils.js";
import QuoteCard from "../QuoteCard.js";
import { CalculatingTime } from "../../utils/CalculatingTime.js";
import PostVote from "../PostVote.js";
import VoteComposer from "../VoteComposer";

import SetTheme from "../SetTheme";
import { postApi } from "../../api/postApi";
import { commentApi } from "../../api/commentApi";
import { generateMoreMenuProps } from "../../utils/userUtils";
import { useMoreMenu } from "../MoreMenuContext";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useComments } from "../../queries/useComments";
import { useCommentMutations } from "../../queries/useCommentMutations";
import { removePostEverywhere } from "../../queries/postCacheSync";
import { queryKeys } from "../../queries/keys";
import { Spacing } from "../../design/Spacing";
import { BottomSheetTypes } from "../../constants/bottomSheetTypes";
import Toast from "../Popup/Toast";
import Popup2Button from "../Popup2Button";
import { Typography } from "../../design/Typography.js";
import WriteBottomBar from "../WriteBottomBar";
import { MAX_TEXT_LENGTH, MAX_LINE_COUNT } from "../../hooks/useWriteLogic";
import { widthScale, heightScale } from "../../utils/scale.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";

const POLL_DAYS = [0, 1, 2, 3, 4, 5, 6, 7];
const POLL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const POLL_MINUTES = Array.from({ length: 60 }, (_, i) => i);

// [수동 조절] 댓글 입력 영역 위치/간격 (단위: px) ─────────────────────────────
// 1) 키보드가 내려가 있을 때, 입력 영역(입력칸+아이콘 줄)을 시트 하단에서 띄우는 기본 여백.
//    값을 "키우면" 아이콘이 위로 올라간다. (iOS 아이콘이 너무 낮으면 ios 값을 키운다)
//    안드로이드는 여기에 추가로 시스템 하단 인셋(insets.bottom)이 더해진다.
const INPUT_AREA_BOTTOM_GAP = Platform.select({ ios: 15, android: 10 });
// 2) 입력칸과 아이콘 줄 사이의 간격. "줄이면" 입력칸과 아이콘이 가까워진다.
const INPUT_TO_ICON_GAP = 8;
// 3) 댓글 입력칸 글자의 세로 미세조정. 픽셀폰트(Galmuri) 특성상 줄 박스 안에서
//    글자가 살짝 치우쳐 보일 수 있어 위/아래 패딩으로 눈으로 보며 맞춘다.
//    "위로 올리려면" PADDING_TOP을 줄이거나 PADDING_BOTTOM을 키운다.
//    iOS/안드로이드가 1~2px 다르게 보일 수 있어 플랫폼별로 따로 조절한다.
const INPUT_PADDING_TOP = Platform.select({ ios: 8, android: 8 });
const INPUT_PADDING_BOTTOM = Platform.select({ ios: 10, android: 5 });
// 댓글 입력창 줄 높이(styles.input의 lineHeight와 반드시 동일하게 유지) - 줄 수 계산용
const COMMENT_LINE_HEIGHT = 16;
// ────────────────────────────────────────────────────────────────────────────

const Postbottom = (props) => {
  const {
    onClose,
    post,
    like,
    setLike,
    onHostBottomSheet,
    focusInput,
    onRefresh,
  } = props;

  const [showWriter, setShowWriter] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [quotedPost, setQuotedPost] = useState(null);
  const [detailData, setDetailData] = useState(post);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  // 댓글 입력창의 화면에 보이는 줄 수 (숨김 Text의 onTextLayout으로 측정)
  const [commentLineCount, setCommentLineCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [commentMedia, setCommentMedia] = useState([]);
  const [blockImageSave, setBlockImageSave] = useState(false);

  // 안드로이드 시스템 내비게이션 바 높이만큼 하단 바를 위로 올리기 위한 inset
  const insets = useSafeAreaInsets();

  // 투표 관련 상태
  const [isVoteActive, setIsVoteActive] = useState(false);
  const [voteCandidates, setVoteCandidates] = useState(["", ""]);
  const [votePeriod, setVotePeriod] = useState({ day: 1, hour: 0, minute: 0 });
  const [isPeriodModalVisible, setIsPeriodModalVisible] = useState(false);

  // Toast 관련 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastPointMessage, setToastPointMessage] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    if (post) {
      setDetailData((prev) => {
        if (
          prev &&
          prev.id === post.id &&
          prev.isLiked === post.isLiked &&
          prev.isBookmarked === post.isBookmarked &&
          prev.like === like
        ) {
          return prev;
        }
        return {
          ...post,
          like: like,
          isLiked: post.isLiked !== undefined ? post.isLiked : prev?.isLiked,
          isBookmarked:
            post.isBookmarked !== undefined
              ? post.isBookmarked
              : prev?.isBookmarked,
        };
      });
    }
  }, [post?.id, post?.postType]);

  const [showImage, setShowImage] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const linkUrl = extractFirstUrl((detailData || post)?.posttext);

  const [sortOrder, setSortOrder] = useState("최신순");
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(300)).current;
  const { currentUserCode, openMenu, closeMenu } = useMoreMenu();

  // 댓글 목록을 React Query로 관리 → ['comments', type, id, sort] 캐시.
  const queryClient = useQueryClient();
  const { data: commentsData, isLoading: commentsLoading } = useComments(
    post,
    sortOrder,
  );
  const comments = commentsData?.comments ?? [];
  const commentCount = commentsData?.count ?? (post?.comment || 0);

  // 현재 글이 '댓글'인지(점등 기준: 댓글=isReplied, 일반글=isCommented)
  const isCommentDetail = !!(
    detailData?.is_comment ||
    post?.is_comment ||
    detailData?.postType === THEME.COMMENT ||
    post?.postType === THEME.COMMENT
  );

  // 상세 시트 상단 아이콘 점등을 댓글 목록에서 파생(내 댓글 보유 여부, 이어서게시 제외)
  const myActivity = useMemo(() => {
    if (currentUserCode == null || !commentsData?.comments) return undefined;
    const isMine = (c) => String(c.usercode) === String(currentUserCode);
    return isCommentDetail
      ? commentsData.comments.some((c) => isMine(c))
      : commentsData.comments.some((c) => isMine(c) && Number(c.draft) !== 1);
  }, [commentsData, currentUserCode, isCommentDetail]);

  // 댓글 작성/삭제 뮤테이션(Phase 4). onMutate에서 cancelQueries(['feed']) + 낙관적 delta,
  // onError 롤백, onSettled에서 댓글 목록만 재검증한다. 피드는 낙관적 값을 단일 진실로 유지해
  // 늦게 갱신되는 피드 API 값이 덮어쓰지 못하게 한다.
  const { createComment, deleteComment } = useCommentMutations(post);

  // 이어서 게시(+)/인용 성공 등, 댓글 수 변화 없이 댓글 목록만 다시 받고 싶을 때 사용.
  const invalidateCommentsForPost = useCallback(() => {
    const type =
      post?.postType ||
      (post?.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);
    queryClient.invalidateQueries({
      queryKey: queryKeys.comments(type, post?.id),
    });
  }, [queryClient, post?.id, post?.postType, post?.posttext]);

  // 댓글 삭제: Comments에서 호출. 낙관적 -1은 뮤테이션 onMutate가 처리한다.
  const handleDeleteComment = useCallback(
    (commentId) => {
      if (commentId == null) return;
      deleteComment.mutate(
        { commentId },
        {
          onError: (err) => {
            Alert.alert("오류", err?.message || "댓글 삭제 중 오류가 발생했습니다.");
          },
        },
      );
    },
    [deleteComment],
  );

  // 댓글 수/점등의 홈 반영은 useCommentMutations가 작성·삭제 성공 시 ['feed']를 invalidate해
  // /home을 다시 받는 것으로 처리한다(서버가 단일 진실). 여기서 피드 캐시를 직접 쓰거나
  // 이벤트버스로 보정하지 않는다 → 옛값이 되살아나는 race 없음.

  const handleImagePress = (image) => {
    console.log(
      "[Postbottom][handleImagePress] received:",
      JSON.stringify(image),
    );
    // ViewImage의 <Image source={imageAddress}/> 에 전달됨
    // 문자열이면 { uri: image } 로 변환 필요
    if (typeof image === "string") {
      setShowImage({ uri: image });
    } else {
      setShowImage(image);
    }
  };

  const handleVideoPress = (videoSource) => {
    setSelectedVideo(videoSource);
    setVideoModalVisible(true);
  };

  const handleVideoClose = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const fetchDetail = useCallback(async () => {
    if (!post || !post.id) return;
    setLoading(true);
    try {
      const currentPostId = post.id;
      const currentPostType =
        post.postType ||
        (post.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);
      // 본문이 댓글이면 댓글 상세 API(/comment/:id)로, 일반 글이면 글 상세 API로 조회
      const isComment = post.is_comment || currentPostType === THEME.COMMENT;
      const data = isComment
        ? await commentApi.fetchCommentDetail(currentPostId)
        : await postApi.fetchPostDetail(currentPostType, currentPostId);

      if (data && !data.msg) {
        setDetailData((prev) => {
          if (prev && prev.id !== currentPostId) return data;
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(
              ([_, v]) => v !== null && v !== "" && v !== undefined,
            ),
          );
          return {
            ...prev,
            ...filteredData,
            isLiked: data.isLiked !== undefined ? data.isLiked : prev?.isLiked,
            isBookmarked:
              data.isBookmarked !== undefined
                ? data.isBookmarked
                : prev?.isBookmarked,
          };
        });
      }
    } catch (error) {
      console.error("[Postbottom] fetchDetail Error:", error);
    } finally {
      setLoading(false);
    }
  }, [post?.id, post?.postType]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // (좋아요/북마크 동기화는 PostUserSaved가 setLike·onUpdatePost로 detailData를 직접 갱신하고,
  //  공유 캐시는 patchPostEverywhere가 처리한다. 더 이상 post_updated 이벤트버스를 쓰지 않는다.)

  // 댓글 목록 로딩/정렬/캐시는 useComments 쿼리가 담당한다(위 commentsData 참고).

  const handleAddCandidate = () => {
    if (voteCandidates.length < 4) setVoteCandidates([...voteCandidates, ""]);
  };

  const handleRemoveCandidate = (index) => {
    const newCandidates = [...voteCandidates];
    newCandidates.splice(index, 1);
    setVoteCandidates(newCandidates);
  };

  const handleUpdateCandidate = (index, text) => {
    const newCandidates = [...voteCandidates];
    newCandidates[index] = text;
    setVoteCandidates(newCandidates);
  };

  const MAX_COMMENT_MEDIA = 4; // 운영 제한: 4장 (backend는 6장지원)

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "사진 접근 권한을 허용해주세요.");
      return;
    }

    const remaining = MAX_COMMENT_MEDIA - commentMedia.length;
    if (remaining <= 0) {
      Alert.alert(
        "챨부",
        `이미지는 최대 ${MAX_COMMENT_MEDIA}장까지 쳊부할 수 있어.`,
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      // EXIF orientation(회전) 정규화: 원본 그대로 올리면 일부 뷰어에서 90도 돌아가 보인다.
      const normalized = await normalizeImageAssets(result.assets);
      const newItems = normalized.map((picked) => ({
        uri: picked.uri,
        type: picked.type || "image",
        width: picked.width,
        height: picked.height,
        duration: picked.duration,
      }));
      const merged = [...commentMedia, ...newItems].slice(0, MAX_COMMENT_MEDIA);
      console.log(`[Postbottom] commentMedia updated: ${merged.length} items`);
      setCommentMedia(merged);
    }
  };

  const handleRemoveImage = (index) => {
    setCommentMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    // 글자수(공백 제외 300자)/줄 수(20줄) 초과 시 게시 차단
    if (
      commentText.replace(/\s+/g, "").length > MAX_TEXT_LENGTH ||
      commentLineCount > MAX_LINE_COUNT
    )
      return;
    setSubmitting(true);
    try {
      const currentData = detailData || post;
      const typeStr =
        currentData.postType ||
        (currentData.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);

      const isJin =
        typeStr === THEME.JIN || typeStr === "Jin-Talk" || typeStr === "think";
      const isComment = typeStr === THEME.COMMENT || typeStr === "comment";
      const finalType = isComment ? "2" : isJin ? "1" : "0";

      const actualId =
        post?.id ||
        detailData?.id ||
        post?.talk_num ||
        props?.id ||
        props?.talk_num;
      const finalPostNum = String(actualId || "");

      // user_id 가져오기 (Write.js와 동일하게 추가)
      const userId = await AsyncStorage.getItem("user_id");

      if (!finalPostNum || finalPostNum === "undefined") {
        Alert.alert("오류", "게시글 정보를 찾을 수 없습니다.");
        setSubmitting(false);
        return;
      }

      console.log(
        `[Postbottom] Submitting comment: type=${finalType}, post_num=${finalPostNum}, user_id=${userId}`,
      );

      const formData = new FormData();
      formData.append("type", finalType);
      formData.append("post_num", finalPostNum);
      formData.append("subject", commentText);
      if (userId) {
        formData.append("user_id", userId);
      }

      // 다중 이미지/비디오: key는 files, 최대 4장
      if (commentMedia.length > MAX_COMMENT_MEDIA) {
        Alert.alert(
          "쳊부 초과",
          `이미지는 최대 ${MAX_COMMENT_MEDIA}장까지 쳊부 가능해.`,
        );
        setSubmitting(false);
        return;
      }
      commentMedia.forEach((media, idx) => {
        const uri = media.uri;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const mediaTypePrefix = media.type === "video" ? "video" : "image";
        const mime = match ? `${mediaTypePrefix}/${match[1]}` : mediaTypePrefix;
        console.log(
          `[Postbottom] Appending files[${idx}]: ${filename} (${mime})`,
        );
        formData.append("files", {
          uri,
          name:
            filename ||
            (media.type === "video"
              ? `comment-video-${idx}.mp4`
              : `comment-image-${idx}.jpg`),
          type: mime,
        });
      });

      if (isVoteActive) {
        console.log("[Postbottom] Adding poll data to FormData...");
        voteCandidates.forEach((candidate, idx) => {
          if (candidate && candidate.trim() !== "") {
            const fieldName = `vote[vote_${idx + 1}]`;
            const value = candidate.trim();
            formData.append(fieldName, value);
            console.log(`- ${fieldName}: ${value}`);
          }
        });

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + votePeriod.day);
        endDate.setHours(endDate.getHours() + votePeriod.hour);
        endDate.setMinutes(endDate.getMinutes() + votePeriod.minute);

        const localEndDate = new Date(
          endDate.getTime() - endDate.getTimezoneOffset() * 60000,
        );
        const endDateStr = localEndDate.toISOString().split(".")[0];

        formData.append("vote[end_date]", endDateStr);
        console.log(`- vote[end_date]: ${endDateStr}`);
      }

      // 뮤테이션 성공 시 onSuccess가 ['feed']와 ['comments']를 invalidate → 홈/글세부가
      // 각자 서버 최신값을 다시 받아 일치한다(낙관적 업데이트 없음).
      await createComment.mutateAsync({ formData, markCommented: !isComment });
      console.log("[Postbottom] Comment with poll submitted successfully!");
      setCommentText("");
      setCommentMedia([]);
      setIsVoteActive(false);
      setVoteCandidates(["", ""]);
      setVotePeriod({ day: 1, hour: 0, minute: 0 });
    } catch (error) {
      console.error("[Postbottom] Comment submission error:", error);
      Alert.alert("실패", error?.message || "댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (focusInput && post && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 200);
    }
  }, [post, focusInput]);

  const sheetContext = useContext(BottomSheetContext);

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  // 댓글 글자수(공백 제외)/줄 수 초과 여부 (경고문구·버튼 비활성화용)
  const commentNoSpaceLength = commentText.replace(/\s+/g, "").length;
  const isCommentOverLength = commentNoSpaceLength > MAX_TEXT_LENGTH;
  const isCommentOverLines = commentLineCount > MAX_LINE_COUNT;
  const isCommentOverLimit = isCommentOverLength || isCommentOverLines;

  if (!post) return null;

  return (
    <View style={{ flex: 1 }}>
      <GlobalScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        onScroll={sheetContext?.handleScroll}
        onScrollBeginDrag={closeMenu}
        onScrollEndDrag={sheetContext?.handleScrollEndDrag}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
      >
        <View>
          <PostUserInfo
            userCode={detailData?.usercode || post.usercode}
            profileImage={detailData?.profileImage || post.profileImage}
            name={detailData?.name || post.name}
            timeStamp={detailData?.timestamp || post.timestamp || 0}
            isRelay={
              detailData?.isRelay ||
              post.isRelay ||
              Number(detailData?.draft) === 1 ||
              Number(post?.draft) === 1
            }
            postType={detailData?.postType || post.postType}
            label={detailData?.label || post.label}
            postOurid={detailData?.id || post.id}
            onClose={onClose}
            withMoreMenu={true}
            style={styles.postUserInfoStyle}
            moreMenuProps={generateMoreMenuProps({
              data: detailData || post,
              currentUserCode:
                currentUserCode || Database.UserData?.[0]?.usercode,
              menuId: `detail-${(detailData || post)?.id || "unknown"}`,
              targetName:
                (detailData || post)?.name || (detailData || post)?.nickname,
              navigation: navigation,
              onReport: () => {
                onClose?.();
              },
              onCopy: async () => {
                await Clipboard.setStringAsync(detailData?.posttext || "");
              },
              onDelete: () => {
                setIsDeleteModalVisible(true);
              },
              dismissOnScroll: true,
            })}
          />
          <View style={styles.mainTouchable}>
            <View style={{ marginBottom: Spacing[4], zIndex: 10 }}>
              <MoreMenu
                menuId={`copy-menu-detail-${(detailData || post)?.id}`}
                hideTrigger={true}
                overrideMenuStyle={{
                  position: "relative",
                  top: 0,
                  right: 0,
                  alignSelf: "flex-start",
                }}
                options={[
                  {
                    label: "복사하기",
                    onPress: async () => {
                      const currentData = detailData || post;
                      if (currentData.usercode !== currentUserCode) {
                        setToastPointMessage("[코지의 마법]");
                        setToastMessage(
                          "다른 멤버의 게시글 복사는 막혀있다는 사실!",
                        );
                        setToastVisible(true);
                        return;
                      }
                      await Clipboard.setStringAsync(
                        currentData.posttext || "",
                      );
                      setToastPointMessage("");
                      setToastMessage("게시글이 복사되었어!");
                      setToastVisible(true);
                    },
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() =>
                openMenu(`copy-menu-detail-${(detailData || post)?.id}`)
              }
            >
              <Text style={Tokens.posttext}>
                {(() => {
                  const content = (detailData || post)?.posttext || "";
                  if (!content) return null;
                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                  const parts = content.split(urlRegex);
                  return parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                      return (
                        <Text
                          key={i}
                          style={{
                            color: ColorTokens.Point,
                            fontFamily: "Galmuri",
                            includeFontPadding: false,
                          }}
                        >
                          {part}
                        </Text>
                      );
                    }
                    return (
                      <Text
                        key={i}
                        style={{
                          fontFamily: "Galmuri",
                          includeFontPadding: false,
                        }}
                      >
                        {part}
                      </Text>
                    );
                  });
                })()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. 미디어 (사진 + 동영상) - URL 정규화 포함 */}
          {(() => {
            const currentData = detailData || post;
            const MEDIA_BASE_URL = "https://jamdeeptalk.com/files/";

            // QuoteCard.js와 동일한 URL 정규화 함수
            const processSource = (src) => {
              if (
                typeof src === "string" &&
                !src.startsWith("http") &&
                !src.startsWith("file://")
              ) {
                return { uri: MEDIA_BASE_URL + src };
              }
              if (
                typeof src === "object" &&
                src !== null &&
                src.uri &&
                !src.uri.startsWith("http") &&
                !src.uri.startsWith("file://")
              ) {
                return { ...src, uri: MEDIA_BASE_URL + src.uri };
              }
              return src;
            };

            let combinedMedia = [];
            if (currentData?.media && currentData.media.length > 0) {
              combinedMedia = currentData.media.map((m) => ({
                ...m,
                source: processSource(m.source ?? m),
              }));
            } else {
              if (currentData?.videos) {
                currentData.videos.forEach((v) =>
                  combinedMedia.push({
                    type: "video",
                    source: processSource(v),
                  }),
                );
              }
              if (currentData?.images) {
                currentData.images.forEach((i) =>
                  combinedMedia.push({
                    type: "image",
                    source: processSource(i),
                  }),
                );
              }
            }
            console.log(
              "[Postbottom][media] count:",
              combinedMedia.length,
              "sample source:",
              JSON.stringify(combinedMedia[0]?.source),
            );
            return (
              <PostMedia
                media={combinedMedia}
                onMediaPress={(item) => {
                  console.log(
                    "[Postbottom][mediaTap] type:",
                    item?.type,
                    "source:",
                    JSON.stringify(item?.source),
                  );
                  if (item?.type === "video") {
                    handleVideoPress(item.source);
                  } else if (item?.type === "image") {
                    handleImagePress(item.source);
                  }
                }}
              />
            );
          })()}

          {/* 3. 투표 */}
          {(detailData?.hasVote || post.hasVote) && (
            <View style={{ marginTop: 10 }}>
              <PostVote voteId={detailData?.voteId || post.voteId} />
            </View>
          )}

          {/* 4. 인용 카드 */}
          {(detailData || post)?.quote && (
            <View style={{ marginHorizontal: 8, marginBottom: 0 }}>
              <QuoteCard
                quotedPost={(detailData || post).quote}
                compactMedia={true}
                onPress={() =>
                  onHostBottomSheet(
                    BottomSheetTypes.POST,
                    (detailData || post).quote,
                  )
                }
              />
            </View>
          )}

          {/* 5. 링크 미리보기 - 가장 하단 */}
          <View style={styles.mainTouchable}>
            {linkUrl && <LinkPreview url={linkUrl} />}
          </View>

          <View style={styles.mainTouchable}>
            <Text style={[Tokens.profile_ex, { marginTop: Spacing[2] }]}>
              {[93, 95, 97, 98, 96, 18, 19, 20, 23, 22].includes(post.id) &&
                "오전 7:24 • 2024. 08. 21 • 조회수 500"}
            </Text>
          </View>
        </View>

        <ViewImage
          visible={!!showImage}
          onClose={() => setShowImage(null)}
          images={showImage ? [showImage] : []}
          blockImageSave={detailData?.imageBlocked || post.imageBlocked}
          meatballVisible={!(detailData?.imageBlocked || post.imageBlocked)}
        />
        <ViewVideo
          visible={videoModalVisible}
          onClose={handleVideoClose}
          videoSource={selectedVideo}
        />

        <PostUserSaved
          like={like}
          setLike={setLike}
          data={
            myActivity === undefined
              ? detailData || {}
              : {
                  ...(detailData || {}),
                  [isCommentDetail ? "isReplied" : "isCommented"]: myActivity,
                }
          }
          commentCountOverride={commentCount}
          showChat={true}
          showMoreMenu={true}
          onHostBottomSheet={(type, data) => onHostBottomSheet(type, data)}
          setQuotedPost={setQuotedPost}
          setShowWriter={setShowWriter}
          modalVisible={showWriter}
          quotedPost={quotedPost}
          onUpdatePost={(updatedFields) => {
            setDetailData((prev) => ({ ...prev, ...updatedFields }));
          }}
          relayUpload={true}
          onRefresh={() => {
            // 이어서 게시(+)/인용을 글세부 안에서 성공한 직후 댓글 목록 갱신
            onRefresh?.();
            invalidateCommentsForPost();
          }}
          marginHorizontalValue={widthScale(30)}
          isPostbottom={true}
          // 글세부 메인 아이템이 '댓글'이면 isComment 전달 → 댓글 아이콘이 isReplied(대댓글 작성)로 점등
          isComment={
            !!(
              detailData?.is_comment ||
              post?.is_comment ||
              detailData?.postType === THEME.COMMENT ||
              post?.postType === THEME.COMMENT
            )
          }
          currentUserCode={currentUserCode}
        />

        <View style={[styles.chooseSortContainer, styles.mainTouchable]}>
          <TouchableOpacity
            style={styles.chooseSortTouchable}
            onPress={openModal}
          >
            <Text style={Tokens.nickname}>{sortOrder}</Text>
            <Image
              source={require("../../../tokenImage/sort_bottom.png")}
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>

        <View>
          {comments.map((data, index) => (
            <Comments
              key={`${data.id}-${index}`}
              data={data}
              onClose={onClose}
              menuId={`comment-${data.id || index}`}
              onDeleteComment={handleDeleteComment}
              onRefresh={onRefresh}
              onHostBottomSheet={onHostBottomSheet}
            />
          ))}
          {comments.length === 0 && !commentsLoading && (
            <Text
              style={[
                Typography.paraMedium,
                {
                  textAlign: "center",
                  marginTop: 20,
                  color: ColorTokens.Unselected,
                },
              ]}
            >
              아직 댓글이 없어. 첫 댓글을 남겨보세요!
            </Text>
          )}
        </View>
      </GlobalScrollView>

      <View
        style={{
          marginTop: 0,
          marginBottom:
            INPUT_AREA_BOTTOM_GAP + (Platform.OS === "ios" ? 0 : insets.bottom),
        }}
      >
        {/* 입력칸↔아이콘 간격을 INPUT_TO_ICON_GAP로 고정 (이전 isInputFocused 8↔40 점프 제거) */}
        <View
          style={[
            styles.writerContainer,
            { minHeight: 40, marginBottom: INPUT_TO_ICON_GAP, zIndex: 10 },
          ]}
        >
          {isVoteActive && (
            <VoteComposer
              candidates={voteCandidates}
              selectedPeriod={votePeriod}
              onOpenPeriodModal={() => {
                Keyboard.dismiss();
                setIsPeriodModalVisible(true);
              }}
              onCloseVote={() => setIsVoteActive(false)}
              onChangeCandidate={handleUpdateCandidate}
              onAddCandidate={handleAddCandidate}
              onRemoveCandidate={handleRemoveCandidate}
            />
          )}
          <TextInput
            ref={inputRef}
            style={styles.input}
            multiline
            placeholder="하고 싶은 이야기가 있나요?"
            placeholderTextColor={ColorTokens.Unselected}
            selectionColor={ColorTokens.Typography}
            value={commentText}
            onChangeText={setCommentText}
            editable={!submitting}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            // 자동 대문자 방지
            autoCapitalize="none"
            // 자동 수정 방지
            autoCorrect={false}
            spellCheck={false}
            // 실제 입력창의 렌더 높이로 줄 수를 계산한다. onTextLayout과 달리
            // 끝부분 빈 줄(연속 줄바꿈)도 반영되고 iOS 줄바꿈 누락 문제가 없다.
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              const paddingV =
                (INPUT_PADDING_TOP || 0) + (INPUT_PADDING_BOTTOM || 0);
              const lines = Math.max(
                1,
                Math.round((h - paddingV) / COMMENT_LINE_HEIGHT),
              );
              if (lines !== commentLineCount) setCommentLineCount(lines);
            }}
          />

          {commentMedia.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.commentImageScroll}
            >
              {commentMedia.map((img, idx) => (
                <View
                  key={`${img.uri}-${idx}`}
                  style={styles.commentImageContainer}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      console.log("[Postbottom][mediaTap]", {
                        type: img.type,
                        uri: img.uri,
                        duration: img.duration,
                      });
                      if (img.type === "video") {
                        console.log("[Postbottom][openVideoModal]", {
                          source: { uri: img.uri },
                        });
                        setSelectedVideo({ uri: img.uri });
                        setVideoModalVisible(true);
                      } else {
                        handleImagePress({ uri: img.uri });
                      }
                    }}
                  >
                    {img.type === "video" ? (
                      <View style={styles.commentVideo}>
                        <Video
                          source={{ uri: img.uri }}
                          style={styles.commentImage}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={false}
                        />
                        <Text style={styles.videoBadge}>VIDEO</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: img.uri }}
                        style={styles.commentImage}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(idx)}
                    style={styles.commentImageDeleteButton}
                  >
                    <Image
                      source={require("../../../tokenImage/CircleDeleteButton.png")}
                      style={styles.deleteIcon}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 글자수/줄 수 초과 안내문구 (초과 시에만 입력창 아래에 표시) */}
        {isCommentOverLimit && (
          <Text style={styles.exceedLengthMessage}>
            {isCommentOverLength
              ? "300자 이내로 입력해야 한다던데.."
              : "20줄 이내로 입력해야 한다던데.."}
          </Text>
        )}

        {/* 하단 바(이미지/투표/게시 버튼)는 댓글창에서 항상 표시한다.
            예전엔 (isInputFocused || commentText.length>0 ...) 조건부로 마운트했는데,
            iOS에서 키보드를 내려 blur되면 컴포넌트가 통째로 언마운트되어 사라졌다가
            한 글자 입력하면 다시 마운트되는 문제가 있어 조건을 제거했다. */}
        {
          <WriteBottomBar
            handleAddPhoto={handleAddPhoto}
            handleToggleVote={() => setIsVoteActive(!isVoteActive)}
            blockImageSave={blockImageSave}
            setBlockImageSave={setBlockImageSave}
            currentTextLength={commentNoSpaceLength}
            textCountColor={
              isCommentOverLimit ? ColorTokens.Warning : ColorTokens.Unselected
            }
            relayPostButtonState={(() => {
              const isCommentValid = commentText.trim().length > 0;
              const isPollValid =
                !isVoteActive ||
                voteCandidates.every((c) => c.trim().length > 0);
              return isCommentValid && isPollValid && !isCommentOverLimit;
            })()}
            handleRelayPress={handleCommentSubmit}
            isImageFull={commentMedia.length >= MAX_COMMENT_MEDIA}
            isVoteActive={isVoteActive}
            isImageExisting={commentMedia.length > 0}
            isPostbottom={true}
          />
        }
      </View>

      <SetTheme
        isVisible={modalVisible}
        onClose={closeModal}
        selectedTheme={sortOrder}
        setTheme={(theme) => setSortOrder(theme)}
        translateY={translateY}
        textGroup="최신순, 인기순"
        themeModalHeight={280}
      />

      <Toast
        visible={toastVisible}
        pointMessage={toastPointMessage}
        message={toastMessage}
        onDismiss={() => {
          setToastVisible(false);
          setToastPointMessage("");
        }}
        withOverlay={true}
      />

      <Popup2Button
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
        mainText={"정말 이 게시물을 삭제할꺼야?"}
        leftText={"취소하기"}
        rightText={"삭제하기"}
        leftOnPress={() => setIsDeleteModalVisible(false)}
        rightOnPress={async () => {
          setIsDeleteModalVisible(false);
          const result = await postApi.deletePost(
            detailData?.postType ||
              (detailData?.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN),
            detailData.id,
          );
          if (result.success) {
            const deletedType =
              detailData?.postType ||
              (detailData?.posttext?.includes("Jam") ? THEME.JAM : THEME.JIN);

            // 홈/라이브러리/검색 공유 캐시에서 즉시 제거
            removePostEverywhere(detailData.id, deletedType);

            // 인용 카드(QuoteCard) '삭제된 게시물' 표시용 신호
            DeviceEventEmitter.emit("post_deleted", {
              id: detailData.id,
              postType: deletedType,
            });

            // 전역 토스트 메시지 발생
            DeviceEventEmitter.emit("show_toast", {
              message: "게시글이 삭제되었어!",
            });

            // 부모 새로고침 호출
            onRefresh?.();
            onClose?.();
          }
        }}
      />

      <DeeptalkPicker
        visible={isPeriodModalVisible}
        dismissOnBackdropPress={true}
        onClose={() => setIsPeriodModalVisible(false)}
        initialFirst={votePeriod.day}
        initialSecond={votePeriod.hour}
        initialThird={votePeriod.minute}
        initialFirstText={"일"}
        initialSecondText={"시간"}
        initialThirdText={"분"}
        data1={POLL_DAYS}
        data2={POLL_HOURS}
        data3={POLL_MINUTES}
        message="확인"
        accentColor={ColorTokens.Point}
        onConfirm={(d, h, m) => {
          setVotePeriod({ day: d, hour: h, minute: m });
          setIsPeriodModalVisible(false);
        }}
      />
    </View>
  );
};

export default Postbottom;

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    width: "100%",
    maxHeight: BOTTOM_SHEET_HEIGHT - 15,
  },
  postUserInfoStyle: {
    paddingLeft: Spacing[2],
  },
  mainTouchable: {
    marginHorizontal: Spacing[2],
  },
  chooseSortContainer: {
    marginVertical: 5,
  },
  chooseSortTouchable: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "center",
  },
  writerContainer: {
    paddingHorizontal: Spacing[2],
    backgroundColor: ColorTokens.InnerBox,
    borderRadius: 8,
    justifyContent: "center",
  },
  submitButtonText: {
    ...Typography.boldMedium,
    color: ColorTokens.Point,
  },
  input: {
    width: "100%",
    ...Typography.paraMedium,
    // 픽셀폰트 글자가 줄 박스 안에서 치우쳐 보이지 않도록 lineHeight를 폰트 크기에
    // 가깝게 좁혀 중앙 정렬 정확도를 높인다. (paraMedium 기본 22 → 16)
    lineHeight: 16,
    // 10줄까지 확장: 10줄 * lineHeight(16) + 상/하 패딩(약 18)
    maxHeight: 178,
    color: ColorTokens.Typography,
    paddingTop: INPUT_PADDING_TOP,
    paddingBottom: INPUT_PADDING_BOTTOM,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  commentImageScroll: {
    marginTop: 10,
    marginBottom: 4,
  },
  commentImageContainer: {
    position: "relative",
    marginRight: 8,
  },
  commentImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  commentImageDeleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 1,
  },
  commentVideo: {
    position: "relative",
  },
  videoBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    color: "#fff",
    ...Typography.boldSmall,
  },
  exceedLengthMessage: {
    ...Typography.paraSmall,
    color: ColorTokens.Warning,
    marginHorizontal: Spacing[2],
    marginTop: 6,
  },
});
