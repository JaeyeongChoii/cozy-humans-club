// 좋아요, 북마크, 댓글, 인용
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  Modal,
} from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import Tokens from "../../../Tokens";
import Write from "../Write";
import { SCREEN_WIDTH, widthScale } from "../../utils/scale";
import { BottomSheetTypes } from "../../constants/bottomSheetTypes";
import { LONG_PRESS_TIME, THEME } from "../../design/token/constantsTokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/BaseURL";
import { postApi } from "../../api/postApi";
import { commentApi } from "../../api/commentApi";
import { Spacing } from "../../design/Spacing";
import { patchPostEverywhere } from "../../queries/postCacheSync";
import { formatCount } from "../../utils/formatCount";

export default function PostUserSaved({
  like,
  setLike,
  data, // Home.js의 dataMap기반
  showChat,
  setQuotedPost,
  setShowWriter,
  modalVisible,
  quotedPost,
  onHostBottomSheet,
  relayUpload,
  onUpdatePost, // 추가
  onRefresh, // 추가: 인용 성공 후 새로고침용
  marginHorizontalValue = widthScale(15),  // 기본값, 사용되는 곳에 따라 scale을 따로 지정해줄 수 있음
  isComment = false,
  isPostbottom = false,
  commentCountOverride,
  currentUserCode,
}) {
  const [activeBookmark, setActiveBookmark] = useState(!!data.isBookmarked);
  // [좋아요 점등] 로컬 state를 두지 않는다. 점등은 항상 서버 값인 data.isLiked를 '직접' 그린다.
  // (로컬 state + useEffect 동기화 방식은 FlashList 재활용/리렌더 타이밍에 따라 서버 값과
  //  어긋나 좋아요 불이 불규칙하게 켜지던 원인이었다.)
  // 토글 시에는 부모 data를 즉시 갱신(낙관적)하고, 서버 응답으로 다시 확정한다.
  // 좋아요 요청 처리 중 여부. 연타로 인한 요청 중복/상태 꼬임 방지용.
  // state가 아닌 ref로 둬서 연타 사이에도 즉시(동기) 반영되도록 함.
  const likeProcessingRef = useRef(false);
  const commentCount = React.useMemo(() => {
    if (commentCountOverride !== undefined && commentCountOverride !== null) {
      const overrideParsed = Number(commentCountOverride);
      return Number.isFinite(overrideParsed) && overrideParsed > 0
        ? overrideParsed
        : 0;
    }

    const possibleFields = [
      // 댓글(대댓글 개수)은 신규 reply_count를 최우선으로 사용
      data?.reply_count,
      data?.comment,
      data?.comment_count,
      Array.isArray(data?.comments) ? data.comments.length : data?.comments,
      data?.comment_num,
      data?.count_comment,
    ];
    const raw = possibleFields.find(
      (value) => value !== undefined && value !== null
    );
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [
    commentCountOverride,
    data?.reply_count,
    data?.comment,
    data?.comment_count,
    data?.comments,
    data?.comment_num,
    data?.count_comment,
  ]);

  // 북마크 로컬 상태 동기화. 의존성에 data.id(및 postType)를 포함해, FlashList 재활용으로
  // 같은 인스턴스가 다른 글로 재사용될 때도 항상 서버 값으로 재동기화되게 한다.
  // (좋아요는 로컬 state를 없애고 data.isLiked를 직접 그리므로 여기서 동기화하지 않는다.)
  React.useEffect(() => {
    setActiveBookmark(!!data.isBookmarked);
  }, [data.id, data.postType, data.isBookmarked]);

  const handleLike = async (postId, selectedTabText) => {
    // 이전 좋아요 요청이 아직 처리 중이면 무시 (연타로 인한 상태 꼬임 방지)
    if (likeProcessingRef.current) {
      console.log(`[Like] ID ${postId} 무시됨 - 이전 요청 처리 중`);
      return;
    }
    likeProcessingRef.current = true;

    // 현재 점등 상태는 서버 값(data.isLiked)을 기준으로 한다.
    const currentLiked = !!data.isLiked;
    const nextLikeState = !currentLiked;
    const nextLikeCount = like + (nextLikeState ? 1 : -1);

    console.log(`[Like] ID ${postId} Clicked. Target -> isLiked: ${nextLikeState}, count: ${nextLikeCount}`);

    // 1. 낙관적 업데이트: 부모 data(isLiked·like)를 즉시 갱신 → 점등은 data.isLiked를 직접 그리므로 바로 반영
    setLike?.(nextLikeCount, nextLikeState);
    onUpdatePost?.({ ...data, isLiked: nextLikeState, like: nextLikeCount });
    // 홈/라이브러리/검색 공유 캐시도 즉시 반영 (게시글 좋아요만; 댓글 좋아요는 목록 캐시에 없음)
    if (!isComment) patchPostEverywhere(data.id, data.postType, { isLiked: nextLikeState, like: nextLikeCount });

    let resData;
    try {
      if (isComment) {
        // 댓글 좋아요 처리
        resData = await commentApi.toggleCommentLike(postId);
      } else {
        // 게시글 좋아요 처리
        resData = await postApi.toggleLike(postId, selectedTabText);
      }

      console.log(`[Like] API Response for ID ${postId}:`, JSON.stringify(resData));

      // 백엔드 응답이 유효한 객체인지 확인
      if (resData && typeof resData === 'object' && !Array.isArray(resData)) {
        // ── 서버 응답을 '단일 진실 소스'로 사용 ──
        // 서버 toggle 응답은 개수(like)는 주지만 isLiked는 안 주므로,
        // msg("좋아요 완료" / "좋아요 해제 완료")로 실제 좋아요 여부를 판별한다.
        const serverLikeCount = typeof resData.like === 'number' ? resData.like : (typeof resData.likes === 'number' ? resData.likes : null);

        let serverLiked = nextLikeState; // 기본값: 낙관적 추측 (msg가 없을 때만 사용)
        if (typeof resData.msg === 'string') {
          if (resData.msg.includes('해제')) serverLiked = false;
          else if (resData.msg.includes('완료')) serverLiked = true;
        }

        const finalLikeCount = serverLikeCount !== null ? serverLikeCount : nextLikeCount;

        if (serverLiked !== nextLikeState || finalLikeCount !== nextLikeCount) {
          console.warn(`[Like] 서버 기준으로 보정 -> isLiked: ${serverLiked}, like: ${finalLikeCount} (낙관적 추측: ${nextLikeState}, ${nextLikeCount})`);
        }

        // 2. 서버 기준으로 부모 data를 다시 확정
        setLike?.(finalLikeCount, serverLiked);
        onUpdatePost?.({ ...data, isLiked: serverLiked, like: finalLikeCount });
        // 서버 확정값으로 공유 캐시 재확정
        if (!isComment) patchPostEverywhere(data.id, data.postType, { isLiked: serverLiked, like: finalLikeCount });

      } else {
        // 실패 → 낙관적 업데이트 롤백 (원래 서버 값으로 복구)
        console.error("[Like] API 요청 실패 또는 잘못된 응답 데이터입니다. 상태를 롤백합니다.");
        setLike?.(like, currentLiked);
        onUpdatePost?.({ ...data, isLiked: currentLiked, like });
        if (!isComment) patchPostEverywhere(data.id, data.postType, { isLiked: currentLiked, like });
      }
    } catch (error) {
      console.error("[Like] 예외 발생. 상태를 롤백합니다:", error);
      setLike?.(like, currentLiked);
      onUpdatePost?.({ ...data, isLiked: currentLiked, like });
      if (!isComment) patchPostEverywhere(data.id, data.postType, { isLiked: currentLiked, like });
    } finally {
      // 요청 완료(성공/실패 무관) 후 잠금 해제 → 다음 토글 허용
      likeProcessingRef.current = false;
    }
  }

  const handleBookmark = async (postId, selectedTabText) => {
    // postApi의 함수 호출
    const resData = await postApi.toggleBookmark(postId, selectedTabText);

    console.log(`[PostUserSaved] handleBookmark response for ID ${postId}:`, JSON.stringify(resData));

    // 백엔드 응답이 유효한 객체인지 확인
    if (resData && typeof resData === 'object' && !Array.isArray(resData)) {
      const newBookmarkState = !activeBookmark;

      // 서버에서 반환된 북마크 수 또는 성공 여부 확인
      console.log(`[PostUserSaved] Bookmark toggled - server bookmark field: ${resData.bookmark}, isBookmarked: ${newBookmarkState}`);

      setActiveBookmark(newBookmarkState);

      console.log(`[PostUserSaved] Bookmark ID ${postId} state change: ${activeBookmark} -> ${newBookmarkState}`);

      // 부모 상태 업데이트 (Library 등에서 즉시 반영되도록)
      if (onUpdatePost) {
        onUpdatePost({ ...data, isBookmarked: newBookmarkState });
      }

      // 홈/라이브러리/검색 공유 캐시에 북마크 상태 반영
      if (!isComment) patchPostEverywhere(data.id, data.postType, { isBookmarked: newBookmarkState });
    } else {
      console.log("Bookmark request failed or returned invalid data");
    }
  }

  // 이어서 게시하기(+) 버튼 노출 여부 (본인 게시글 + 글세부에서만)
  const showRelayButton = isPostbottom && data.usercode === currentUserCode;

  return (
    <View style={
      [styles.bottomContainer,
      {
        marginHorizontal: marginHorizontalValue,
        marginTop: isPostbottom || isComment ? Spacing[3] : Spacing[7],
      }]}>
      {/* 좋아요 버튼 */}
      <TouchableOpacity
        style={styles.buttonTouchable}
        onPress={() => {
          handleLike(data.id, data.postType);
        }}
        onLongPress={() => {
          // 길게 누르면 LikersList 열기
          onHostBottomSheet(BottomSheetTypes.LIKE, data);
        }}
        delayLongPress={LONG_PRESS_TIME} // 길게 누르는 조건 : 0.5초 이상
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.buttonTouchable}>
          <Image
            source={
              isPostbottom
                ? require("../../../tokenImage/bigPixelheart.png")
                : require("../../../tokenImage/pixelHeart_active.png")
            } //하트 버튼
            style={[!isPostbottom && styles.heartImage, {
              // 점등은 서버 값(data.isLiked)을 직접 반영
              opacity: data.isLiked ? 1 : 0.5
            }]}
          />
          {/* 숫자 자리는 항상 고정 너비로 예약하고, 0이면 그리지 않음 */}
          <View style={styles.countSlot}>
            {like !== 0 && <Text style={Tokens.likenumber}>
              {formatCount(like)}
            </Text>
            }
          </View>

        </View>
      </TouchableOpacity>
      {/* 댓글 버튼 */}
      {/* showChat이 false일 경우 아무것도 렌더링하지 않음 */}
      {showChat === true ? (
        <TouchableOpacity
          onPress={() =>
            onHostBottomSheet(
              BottomSheetTypes.POST,
              isComment ? { ...data, postType: THEME.COMMENT, is_comment: true } : data,
              { focusInput: true, onUpdate: onUpdatePost || null }
            )
          }
        >
          <View style={styles.buttonTouchable}>
            <Image
              // 본인이 댓글(게시글) / 대댓글(댓글) 작성 시 active 아이콘으로 점등
              // 글세부: 빅(액티브)챗버블 24x18 / 홈·라이브러리: (액티브)챗버블 16x12
              source={
                isPostbottom
                  ? ((isComment ? data.isReplied : data.isCommented)
                    ? require("../../../tokenImage/bigactiveChatbubble.png")
                    : require("../../../tokenImage/bigchatbubble.png"))
                  : ((isComment ? data.isReplied : data.isCommented)
                    ? require("../../../tokenImage/activeChatbubble.png")
                    : require("../../../tokenImage/chatbubble.png"))
              } //댓글 부분.
              style={isPostbottom ? styles.chatImageBig : styles.chatImage}
            />
            {/* 숫자 자리는 항상 고정 너비로 예약하고, 0이면 그리지 않음 */}
            <View style={styles.countSlot}>
              {commentCount > 0 &&
                <Text style={Tokens.likenumber}>
                  {formatCount(commentCount)}
                </Text>
              }
            </View>

          </View>
        </TouchableOpacity>
      ) : null}

      {/* 인용버튼 */}
      <TouchableOpacity
        onPress={() => {
          setQuotedPost({
            ...data,
            isComment: isComment,
            postType: isComment ? THEME.COMMENT : data.postType
          });
          setShowWriter(true);  // 해당 글을 인용해서 글쓰기 모달 열기
        }}
        onLongPress={() => {
          // 길게 누르면 QuotoList 열기
          onHostBottomSheet(BottomSheetTypes.QUOTO, data);
        }}
        delayLongPress={LONG_PRESS_TIME} // 길게 누르는 조건 : 0.5초 이상
      >
        <View style={styles.buttonTouchable}>
          <Image
            // 본인이 인용했으면 active 아이콘으로 점등 (홈/글세부/라이브러리 동일)
            // 글세부: 빅(액티브)쿼토 24x24 / 홈·라이브러리: (액티브)쿼토 16x16
            source={
              isPostbottom
                ? (data.isQuoted
                  ? require("../../../tokenImage/bigactiveQuotoIcon.png")
                  : require("../../../tokenImage/bigQuotoIcon.png"))
                : (data.isQuoted
                  ? require("../../../tokenImage/quotoIcon_active.png")
                  : require("../../../tokenImage/quotoIcon.png"))
            } //인용 부분.
            style={isPostbottom ? styles.quoteImageBig : styles.quoteImage}
          />
          {/* 숫자 자리는 항상 고정 너비로 예약하고, 0이면 그리지 않음 */}
          <View style={styles.countSlot}>
            {data.quote_num > 0 &&
              <Text style={Tokens.likenumber}>
                {formatCount(data.quote_num)}
              </Text>
            }
          </View>
        </View>
      </TouchableOpacity>
      {/* 북마크 버튼 */}
      <TouchableOpacity
        onPress={
          () => handleBookmark(data.id, data.postType)
        }
      >
        <View style={styles.buttonTouchable}>
          <Image
            source={
              isPostbottom
                ? require("../../../tokenImage/bigPixelbookmark.png")   // 세부글
                : require("../../../tokenImage/pixelBookmark_active.png")
            } //북마크 부분.
            style={[!isPostbottom && styles.bookmarkImage,
            {
              opacity: activeBookmark === true ? 1 : 0.5
            }

            ]}
          />
          {/* 1 이상부터 표시 */}
          {/*
          {data.comment !== 0 ? (
            <Text style={Tokens.likenumber}>{data.bookmark}</Text>
          ) : null}
          */}
          {/* 이어서 게시하기(+) 버튼이 뒤따를 때만, 다른 버튼들과 간격을 맞추기 위해
              북마크 아이콘 뒤에도 동일한 빈 자리(countSlot)를 예약한다.
              (버튼이 없으면 북마크가 우측 끝이라 뒤 여백이 불필요) */}
          {showRelayButton && <View style={styles.countSlot} />}
        </View>
      </TouchableOpacity>

      {/* 이어서 게시하기 (+) 버튼 - 본인 게시글인 경우에만 상세글에서 표시 */}
      {showRelayButton && (
        <TouchableOpacity
          onPress={() => {
            setQuotedPost({
              ...data,
              isComment: isComment,
              postType: isComment ? THEME.COMMENT : data.postType,
              isRelay: true, // 이어서 게시 모드 플래그
            });
            setShowWriter(true);
          }}
        >
          <View style={styles.buttonTouchable}>
            <Image
              source={require("../../../tokenImage/activePlusButton.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Todo 임시 비활성화 */}
      {/* {relayUpload === true ? (
        <TouchableOpacity>
          <Image
            source={
              require("../../../tokenImage/repost.png")} //재게시 버튼, 구현 필요.
            style={{ width: 28, height: 28 }}
          />
        </TouchableOpacity>
      ) : null} */}

      {/* 인용 모달 */}
      <Modal visible={modalVisible} animationType="slide" statusBarTranslucent={true}>
        {/* RN Modal은 iOS에서 별도 윈도우라 SafeArea 인셋이 진입마다 달라진다.
            자체 SafeAreaProvider + initialWindowMetrics로 첫 렌더부터 인셋을 고정한다. */}
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <Write
            onClose={() => {
              setShowWriter(false);
              setQuotedPost(null);
            }}
            onPostSuccess={onRefresh}
            quotedPost={quotedPost}
            postType={data.postType}
          />
        </SafeAreaProvider>
      </Modal>
      {/* 미트볼 버튼 */}
      {/* showMoreMenu가 false일 경우 아무것도 렌더링하지 않음 */}

      {/* 
      {showMoreMenu === true ? <MoreMenu type="post" /> : null}
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    // 위치 조정
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // 숫자(텍스트)가 생겨도 줄 높이가 변하지 않도록 미리 고정.
    // likenumber의 높이(lineHeight 22 + paddingTop 1)에 맞춤 → 0↔1에서 세로 밀림 방지.
    minHeight: 23,

    marginBottom: Spacing[5],
  },
  buttonTouchable: {
    // 레이아웃 속성
    flexDirection: "row",
    alignItems: "center",
  },
  countSlot: {
    // 숫자(좋아요/댓글/인용)가 들어갈 자리를 항상 고정 너비로 예약.
    // 0이면 비어 있어도 너비가 유지되어 옆 아이콘이 밀리지 않음.
    // likenumber에 marginLeft:6이 있으므로 그만큼 포함해 잡음. (1~2자리 기준)
    minWidth: widthScale(24),
  },
  heartImage: {
    // 레이아웃 속성
    width: 16,
    height: 16,
  },
  chatImage: {
    // 홈·라이브러리 댓글 아이콘 크기
    width: 16,
    height: 12,
  },
  chatImageBig: {
    // 글세부 댓글 아이콘 크기
    width: 24,
    height: 18,
  },
  quoteImage: {
    // 홈·라이브러리 인용 아이콘 크기
    width: 16,
    height: 16,
  },
  quoteImageBig: {
    // 글세부 인용 아이콘 크기
    width: 24,
    height: 24,
  },
  bookmarkImage: {
    // 레이아웃 속성
    width: 15.23,
    height: 17.02,
  },
});
