import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, Image, ActivityIndicator, DeviceEventEmitter, TouchableOpacity } from "react-native";
import CachedImage from "./common/CachedImage";
import Tokens from "../../Tokens";
import PostMedia from "./PostMedia"; // PostMedia 추가
import { CalculatingTime, ConvertSecondsToDate } from "../utils/CalculatingTime";
import { postApi } from "../api/postApi";
import { commentApi } from "../api/commentApi";
import { THEME } from "../design/token/constantsTokens";
import { Typography } from "../design/Typography";
import { ColorTokens } from "../design/token/ColorTokens";
import PostVote from "./PostVote";
import LinkPreview from "./LinkPreview";
import { extractFirstUrl } from "../utils/urlUtils";
import ViewImage from "./ViewImage";

// 인용 대상 상세 모듈 레벨 캐시 (`${type}:${id}` -> detail).
// 인용된 게시물 본문/작성자 정보는 사실상 정적이라, 같은 인용카드가 반복 노출될 때마다
// fetchPostDetail/fetchCommentDetail을 다시 호출하며 스피너가 뜨던 문제를 없앤다.
const quoteDetailCache = new Map();

// postType 값을 THEME.JAM/JIN/COMMENT로 정규화 (API가 'Jam-Talk'/숫자/THEME 등 다양한 형식으로 줄 수 있음)
const normalizePostType = (type) => {
  const t = String(type ?? "").toLowerCase();
  if (type === THEME.JIN || type === 1 || t === "1" || t.includes("jin") || t.includes("think") || t.includes("serious") || t.includes("진지")) return THEME.JIN;
  if (type === THEME.COMMENT || type === 2 || t === "2" || t.includes("comment")) return THEME.COMMENT;
  if (type === THEME.JAM || type === 0 || t === "0" || t.includes("jam") || t.includes("talk") || t.includes("free") || t.includes("자유")) return THEME.JAM;
  return "";
};

const QuoteCard = React.memo(({ quotedPost: initialQuotedPost, isWrite = false, isRelay = false, compactMedia = false, onPress = null, containerStyle }) => {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isPollVisible, setIsPollVisible] = useState(false);
  const [quotedPost, setQuotedPost] = useState(initialQuotedPost);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);

  const COMPACT_GAP = 6;
  const COMPACT_MAX = 4;
  const imageSize = mediaWidth > 0
    ? Math.floor((mediaWidth - COMPACT_GAP * (COMPACT_MAX - 1)) / COMPACT_MAX)
    : 0;

  const BASE_URL = "https://jamdeeptalk.com/files/";
  const processSource = useCallback((src) => {
    if (!src) return src;
    if (typeof src === "string") {
      if (!src.startsWith("http") && !src.startsWith("file://")) {
        return { uri: BASE_URL + src };
      }
      return { uri: src };
    }
    if (typeof src === "object" && src.uri) {
      if (!src.uri.startsWith("http") && !src.uri.startsWith("file://")) {
        return { ...src, uri: BASE_URL + src.uri };
      }
      return src;
    }
    return src;
  }, []);

  const combinedMedia = useMemo(() => {
    if (!quotedPost) return [];
    if (quotedPost.media && quotedPost.media.length > 0) {
      return quotedPost.media.map(m => {
        if (typeof m === 'string') {
          return { type: 'image', source: processSource(m) };
        }
        // API에 따라 source 키 이름이 다를 수 있어서 (source / url / path / uri) 순서대로 찾음
        const rawSource = m.source ?? m.url ?? m.path ?? (m.uri ? { uri: m.uri } : null);
        const type = m.type || 'image';
        return { ...m, type, source: processSource(rawSource) };
      });
    }
    const result = [];
    if (quotedPost.videos) {
      quotedPost.videos.forEach(v => result.push({ ...v, type: "video", source: processSource(v) }));
    }
    if (quotedPost.images) {
      quotedPost.images.forEach(i => result.push({ type: "image", source: processSource(i) }));
    }
    return result;
  }, [quotedPost, processSource]);

  const imageOnlyList = useMemo(() => combinedMedia.filter(m => m.type === "image"), [combinedMedia]);

  const handleMediaPress = useCallback((item) => {
    if (item?.type === "image") {
      const idx = imageOnlyList.findIndex(m => m.source === item.source);
      setSelectedImages(imageOnlyList.map(m => m.source));
      setSelectedImageIndex(idx >= 0 ? idx : 0);
      setImageModalVisible(true);
    }
  }, [imageOnlyList]);

  useEffect(() => {
    let isCancelled = false;
    // props가 바뀔 때마다 내부 상태 초기화 (stale data 방지)
    setQuotedPost(initialQuotedPost);
    setIsPollVisible(false);

    const fetchQuotedDetail = async () => {
      // 본문, 이름 정보가 부족한 경우(단순 ID만 전달된 경우)에만 상세 정보를 가져옴
      if (initialQuotedPost && initialQuotedPost.id && (!initialQuotedPost.posttext || !initialQuotedPost.name)) {
        // 인용 대상 타입을 postType 정보를 바탕으로 가져옴
        const type = initialQuotedPost.postType || THEME.JAM;
        const cacheKey = `${type}:${initialQuotedPost.id}`;

        // 캐시가 있으면 네트워크/스피너 없이 즉시 표시
        const cached = quoteDetailCache.get(cacheKey);
        if (cached) {
          setQuotedPost(cached);
          return;
        }

        setLoading(true);
        try {
          let detail;
          if (type === THEME.COMMENT) {
            detail = await commentApi.fetchCommentDetail(initialQuotedPost.id);
          } else {
            detail = await postApi.fetchPostDetail(type, initialQuotedPost.id);
          }
          if (!isCancelled) {
            // console.log(`fetchQuotedDetail (all items):`, JSON.stringify(detail, null, 2));
            quoteDetailCache.set(cacheKey, detail);
            setQuotedPost(detail);
          }
        } catch (error) {
          if (!isCancelled) {
            console.error("[QuoteCard] Error fetching quoted detail:", error);
            setIsError(true);
          }
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      } else {
        setQuotedPost(initialQuotedPost);
      }
    };

    fetchQuotedDetail();

    // 전역 삭제 이벤트 리스너 추가
    const deleteListener = DeviceEventEmitter.addListener('post_deleted', (deletedData) => {
      // quotedPost가 현재 삭제된 게시물을 가리키고 있다면 에러 상태로 변경
      if (quotedPost && quotedPost.id === deletedData.id) {
        console.log(`[QuoteCard] Quoted post deleted: ${deletedData.id}. Showing placeholder.`);
        setIsError(true);
      }
    });

    return () => {
      isCancelled = true;
      deleteListener.remove();
    };
  }, [initialQuotedPost]);



  if (loading) {
    return (
      <View style={[Tokens.quotedContainer, { padding: 20, alignItems: 'center' }]}>
        <ActivityIndicator color="white" />
      </View>
    );
  }

  // 삭제된 게시물 처리
  if (isError || (!loading && quotedPost && !quotedPost.posttext && !quotedPost.name)) {
    return (
      <View style={[Tokens.quotedContainer, { padding: 20, justifyContent: 'center' }]}>
        <Text style={{ ...Typography.paraMedium, color: ColorTokens.Unselected }}>
          현재는 삭제된 게시물이야.
        </Text>
      </View>
    );
  }

  if (!quotedPost) return null;

  // 테마(자유/진지/comment) 정규화 및 색상 (진지=보라 Point2, 그 외=Point)
  const normalizedType = normalizePostType(initialQuotedPost?.postType ?? quotedPost?.postType);
  const isCommentQuote = normalizedType === THEME.COMMENT;
  const themeColor = normalizedType === THEME.JIN ? ColorTokens.Point2 : ColorTokens.Point;

  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardWrapperProps = onPress ? { activeOpacity: 0.8, onPress } : {};

  return (
    <CardWrapper style={[Tokens.quotedContainer, isRelay && { borderWidth: 0, padding: 0, marginTop: 0 }, containerStyle]} {...cardWrapperProps}>
      <View //프로필 사진, 닉네임, 게시된 시간, 우측 더보기 탭 부분
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 8,
          paddingBottom: 0, // 일반 게시글과 동일하게 프로필 행↔본문 세로 간격 제거
          paddingTop: 10,
        }}
      >
        <View
          style={{
            justifyContent: "flex-start",
            flexDirection: "row",
          }}
        >
          <CachedImage
            source={
              quotedPost.profileImage || require("../../tokenImage/defaultProfileImage.png")
            }
            placeholder={require("../../tokenImage/defaultProfileImage.png")}
            resizeWidth={200}
            style={{
              //프로필 사진.
              width: 40, // 일반 게시글과 동일한 프로필 사진 크기 (텍스트 블록 높이 40과 일치)
              height: 40,
              borderRadius: 100,
              marginRight: 10, // 일반 게시글(Spacing[3]=10)과 동일한 사진↔닉네임 간격
              backgroundColor: ColorTokens.Unselected, // 로딩 전 배경색
            }}
          />
          <View //닉네임, 게시시간, 해시태그 따로 분류한 View
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={Tokens.nickname}>{quotedPost.name} · </Text>
              {/* 게시 시간 (글쓰기: 절대날짜, 피드: 상대시간) */}
              <Text style={Tokens.profile_ex}>
                {isWrite ? ConvertSecondsToDate(quotedPost.timestamp) : CalculatingTime(quotedPost.timestamp)}
              </Text>
              {/* 테마(자유/진지) 또는 comment — 진지는 보라색(Point2) */}
              {normalizedType !== "" && (
                <>
                  <Text style={Tokens.profile_ex}> · </Text>
                  <Text style={{
                    ...Typography.boldSmall,
                    color: themeColor,
                  }}>
                    {isCommentQuote ? "comment" : normalizedType}
                  </Text>
                </>
              )}

            </View>
            <Text style={Tokens.profile_ex}>@ {quotedPost.usercode}</Text>
          </View>
        </View>
      </View>
      <View //게시물 본문 텍스트
        style={{ marginHorizontal: 8 }}
      >
        <Text
          style={Tokens.posttext}
          numberOfLines={isTextExpanded ? undefined : 4} // 줄 수 제한
          ellipsizeMode="tail"
          // 카드가 클릭형(onPress 있음, 예: 홈 피드)일 때는 본문 텍스트를 눌러도 인용 게시물로 이동.
          // 클릭형이 아닐 때(글쓰기 미리보기 등)는 기존처럼 펼치기/접기 토글.
          onPress={onPress ? onPress : () => setIsTextExpanded(!isTextExpanded)}
        >
          {(() => {
            const content = quotedPost.posttext || "";
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
                <Text key={i} style={{ fontFamily: "Galmuri", includeFontPadding: false }}>
                  {part}
                </Text>
              );
            });
          })()}
        </Text>


        {/* 2. 미디어 */}
        {compactMedia ? (
          imageOnlyList.length > 0 ? (
            <View
              style={{ marginTop: 10 }} // 홈 일반 게시글(PostMedia marginTop Spacing[3]=10)과 동일한 본문↔이미지 간격
              onLayout={(e) => setMediaWidth(e.nativeEvent.layout.width)}
            >
              {imageSize > 0 && (
                <View style={{ flexDirection: 'row' }}>
                  {imageOnlyList.slice(0, COMPACT_MAX).map((m, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={{
                        width: imageSize,
                        height: imageSize,
                        marginRight: idx < Math.min(imageOnlyList.length, COMPACT_MAX) - 1 ? COMPACT_GAP : 0,
                      }}
                      onPress={() => {
                        setSelectedImages(imageOnlyList.map(img => img.source));
                        setSelectedImageIndex(idx);
                        setImageModalVisible(true);
                      }}
                    >
                      <CachedImage
                        source={m.source}
                        style={{ width: imageSize, height: imageSize, borderRadius: 3 }}
                        resizeMode="cover"
                        resizeWidth={200}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : null
        ) : (
          <PostMedia
            media={combinedMedia}
            onMediaPress={handleMediaPress}
          />
        )}

        {/* 3. 투표 추가 */}
        {quotedPost.hasVote && (
          <View style={{ marginTop: 10, marginBottom: 0 }}>
            {isPollVisible ? (
              <PostVote voteId={quotedPost.voteId} />
            ) : (
              <TouchableOpacity
                onPress={() => setIsPollVisible(true)}
                style={{
                  paddingVertical: 8,
                }}
              >
                <Text style={{ ...Typography.paraMedium, color: ColorTokens.Point }}>
                  투표 보기
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 4. 링크 미리보기 추가 - 가장 하단 */}
        {(() => {
          const linkUrl = extractFirstUrl(quotedPost.posttext);
          return linkUrl ? (
            <View style={{ marginTop: 0, marginBottom:10}}>
              <LinkPreview url={linkUrl} />
            </View>
          ) : null;
        })()}
      </View>

      <ViewImage
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        images={selectedImages}
        initialIndex={selectedImageIndex}
      />
    </CardWrapper>
  );
});

export default QuoteCard;
