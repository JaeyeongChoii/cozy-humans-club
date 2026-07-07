// Home 화면에서 출력되는 게시물들의 형식(모양)을 지정하는 파일
import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Database from "./Database";
import Toast from "./Popup/Toast";
import { postApi } from "../api/postApi";
import { DeviceEventEmitter } from "react-native";

// 사용자 선언 변수
import Tokens from "../../Tokens.js";
import PostUserInfo from "./PostUserInfo";
import PostUserSaved from "./PostUserSaved";
import { ColorTokens } from "../design/token/ColorTokens.js";
import { STROKE_WIDTH } from "../design/token/constantsTokens";
import MoreMenu from "./Moremenu.js";
import Popup2Button from "./Popup2Button/index.js";
import { defaultPostUpperMarginTop } from "../design/token/constantsTokens.js";
import { BottomSheetTypes } from "../constants/bottomSheetTypes.js";
import ViewImage from "./ViewImage.js";
import PostVote from "./PostVote.js";
import PostMedia from "./PostMedia.js";
import LinkPreview from "./LinkPreview.js";
import { widthScale } from "../utils/scale.js";
import { extractFirstUrl } from "../utils/urlUtils.js";
import ViewVideo from "./ViewVideo.js";
import QuoteCard from "./QuoteCard.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateMoreMenuProps } from "../utils/userUtils";
import { useMoreMenu } from "./MoreMenuContext";
import { BASE_URL } from "../constants/BaseURL";
import { Spacing } from "../design/Spacing";

import { useNavigation } from "@react-navigation/native";
import HighlightText from "./HighlightText/index.js";
import { Typography } from "../design/Typography.js";
import { removePostEverywhere } from "../queries/postCacheSync";

const Posts = memo(({
  data,
  onHostBottomSheet,
  menuId,
  onRefresh,
  onUpdatePost,
  isMuted: isMutedProp,
  showPostTypeLabel = false,
  withMoreMenu = true,
  dismissMenuOnScroll = false, // 홈처럼 스크롤로 미트볼 메뉴를 닫고 싶을 때 true
}) => {
  // ... 중략 (나머지 내용 유지되도록 주의해서 replace 범위를 줄이는 게 안전하므로 StartLine/EndLine 재조정) ...

  const [showWriter, setShowWriter] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [quotedPost, setQuotedPost] = useState(null);
  const { openMenu, currentUserCode } = useMoreMenu();
  const navigation = useNavigation();
  const textContainerRef = useRef(null);
  const [menuVerticalPosition, setMenuVerticalPosition] = useState("top");

  // 이미지 뷰어 상태
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleQuotePress = useCallback(() => {
    onHostBottomSheet(BottomSheetTypes.POST, data.quote, { onUpdate: onUpdatePost });
  }, [data.quote, onHostBottomSheet, onUpdatePost]);

  // 글 세부(상세 바텀시트) 열기 — 본문 텍스트/답변 유형 라벨에서 공통으로 사용
  const handleOpenPostDetail = useCallback(() => {
    onHostBottomSheet(BottomSheetTypes.POST, data, { onUpdate: onUpdatePost });
  }, [data, onHostBottomSheet, onUpdatePost]);

  // 비디오 뷰어 상태
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Toast 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastPointMessage, setToastPointMessage] = useState("");

  const handleUpdate = (updatedFields) => {
    if (onUpdatePost) {
      onUpdatePost({ ...data, ...updatedFields });
    }
  };

  const handleImagePress = (imageList, index = 0) => {
    setSelectedImages(imageList);
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const handleVideoPress = (video) => {
    setSelectedVideo(video.source); // video source (require/uri)
    setVideoModalVisible(true);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const MAX_LINES = 6;

  const linkUrl = useMemo(() => extractFirstUrl(data.posttext), [data.posttext]);

  const onBlock = async (blockId) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token"); // AsyncStorage : 앱 내부의 영구 저장 값
      if (!idToken) return; // 저장된 토큰이 없으면 로그인 화면 유지

      const url = `${BASE_URL}/profile/block`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          target_id: blockId,
        }),
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);

      if (response.ok) {
        setToastMessage("사용자가 차단되었어.");
        setToastVisible(true);
        // 1초 뒤에 목록 새로고침 (선택 사항)
        setTimeout(() => {
          onRefresh?.();
        }, 1000);
      } else {
        setToastMessage("차단에 실패했어. 다시 시도해줘.");
        setToastVisible(true);
      }
    } catch (error) {
      console.error("onBlock Error:", error);
      setToastMessage("오류가 발생했어.");
      setToastVisible(true);
    }
  };

  // 뮤트 상태 관리 (prop으로 받거나 내부에서 토글)
  const [isMuted, setIsMuted] = useState(isMutedProp);

  useEffect(() => {
    setIsMuted(isMutedProp);
  }, [isMutedProp]);

  // checkIsMuted 제거 (Home에서 일괄 처리)

  const onMute = async (muteId) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token"); // AsyncStorage : 앱 내부의 영구 저장 값
      if (!idToken) return; // 저장된 토큰이 없으면 로그인 화면 유지

      const url = `${BASE_URL}/profile/mute`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          target_id: muteId,
        }),
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);

      if (response.ok) {
        // 성공 시 상태 토글 및 메시지 변경
        const newIsMuted = !isMuted;
        setIsMuted(newIsMuted);

        setToastMessage(
          newIsMuted ? "사용자가 뮤트되었어." : "뮤트가 해제되었어.",
        );
        setToastVisible(true);
        // 1초 뒤에 목록 새로고침 (선택 사항)
        setTimeout(() => {
          onRefresh?.();
        }, 1000);
      } else {
        setToastMessage("요청에 실패했어. 다시 시도해줘.");
        setToastVisible(true);
      }
    } catch (error) {
      console.error("onMute Error:", error);
      setToastMessage("오류가 발생했어.");
      setToastVisible(true);
    }
  };

  return (
    <View>
      <View style={styles.background}>
        {/* 프로필 사진, 닉네임, 게시된 시간 부분, 더보기 */}
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          {/* 프로필 사진, 닉네임, 게시된 시간 부분 */}
          <PostUserInfo
            userCode={data.usercode}
            profileImage={data.profileImage}
            name={data.name}
            timeStamp={data.timestamp}
            isRelay={data.draft === 1} // draft 1이면 이어 게시 라벨 표시
            style={styles.postUserInfoStyle}
            //showTypeLabel={selectedTab === THEME.ALL}  // ALL 탭일 때만
            postType={data.postType} // Jam인지 Jin인지 알려주기 위함
            showPostTypeLabel={showPostTypeLabel}
            withMoreMenu={withMoreMenu}
            label={data.label}
            onPressLabel={handleOpenPostDetail} // 답변 유형 라벨(및 오른쪽 영역) 터치 시 글 세부 열기
            postOurid={data.id} // 하드코딩을 위한 임시 변수
            moreMenuProps={generateMoreMenuProps({ // 더보기 버튼을 눌렀을때 구현될 함수
              data: data,
              currentUserCode:
                currentUserCode || Database.UserData?.[0]?.usercode,
              menuId: menuId,
              targetName: data.name || data.nickname,
              isMuted: isMuted,
              navigation: navigation,
              onBlock: () => onBlock(data.writer_id),
              onMute: () => onMute(data.writer_id),
              onCopy: async () => {
                await Clipboard.setStringAsync(data.posttext);
                setToastMessage("게시글이 복사되었어!");
                setToastVisible(true);
              },
              onDelete: () => {
                setIsDeleteModalVisible(true);
              },
              dismissOnScroll: dismissMenuOnScroll,
            })}
          />
        </View>

        {/* 게시물 본문*/}
        <View style={{ position: "relative" }}>
          {/* 본문 꾹 누르기를 위한 숨겨진 MoreMenu (본문과 겹치도록 절대 위치 지정) */}
          <MoreMenu
            menuId={`copy-menu-${data.id}`}
            hideTrigger={true}
            overrideMenuStyle={{
              position: "absolute",
              right: 16,
              top: menuVerticalPosition === "top" ? -50 : undefined,
              bottom: menuVerticalPosition === "bottom" ? -100 : undefined,
              alignSelf: "flex-start",
              zIndex: 100,
            }}
            options={[
              {
                label: "복사하기",
                onPress: async () => {
                  if (data.userCode !== currentUserCode) {
                    setToastPointMessage("[코치의 마법]");
                    setToastMessage(
                      "다른 멤버의 게시글 복사는 막혀있다는 사실!",
                    );
                    setToastVisible(true);
                    return;
                  }

                  await Clipboard.setStringAsync(data.posttext);
                  setToastPointMessage("");
                  setToastMessage("게시글이 복사되었어!");
                  setToastVisible(true);
                },
              },
            ]}
          />

          {/* 복사하기 */}
          <TouchableOpacity
            ref={textContainerRef}
            style={styles.mainTouchable}
            onPress={handleOpenPostDetail}
            onLongPress={() => {
              if (textContainerRef.current) {
                textContainerRef.current.measureInWindow(
                  (x, y, width, height) => {
                    const screenHeight = Dimensions.get("window").height;
                    console.log(
                      `[Posts] Copy Menu measurement - ID:${data.id}, pageY:${y}, height:${height}, screenHeight:${screenHeight}`,
                    );

                    // 화면 상단에 너무 붙어 있으면 아래쪽에 버튼 표시 (pageY < 150)
                    // 화면 하단에 너무 붙어 있으면 위쪽에 버튼 표시 (pageY > 730)
                    // 그 외 평소에는 글 상단(위쪽)에 표시
                    if (y < 150) {
                      setMenuVerticalPosition("bottom");
                      console.log("[Posts] Position set to BOTTOM (too close to top)");
                    } else if (y > 730) {
                      setMenuVerticalPosition("top");
                      console.log("[Posts] Position set to TOP (too close to bottom)");
                    } else {
                      setMenuVerticalPosition("top");
                      console.log("[Posts] Position set to TOP (default case)");
                    }
                    openMenu(`copy-menu-${data.id}`);
                  },
                );
              } else {
                console.warn("[Posts] textContainerRef is null, showing menu at default position");
                openMenu(`copy-menu-${data.id}`);
              }
            }}
          >
            {/* 실제 표시용 Text (subject) */}
            <View style={{ position: "relative" }}>
              <Text
                style={Tokens.posttext}
                numberOfLines={isExpanded ? undefined : MAX_LINES}
              >
                {useMemo(() => {
                  if (!data.posttext) return null;
                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                  const parts = data.posttext.split(urlRegex);
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
                }, [data.posttext])}
              </Text>

              {/* 더보기 버튼 */}
              {!isExpanded && lineCount > MAX_LINES && (
                <TouchableOpacity onPress={() => setIsExpanded(true)}>
                  <HighlightText
                    message="... 더보기"
                    highlightMap={{
                      더보기: {
                        color: ColorTokens.Point,
                      },
                    }}
                    style={[Tokens.talk_category, { marginVertical: 5 }]}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 숨겨진 Text — 실제 라인 수 계산용 (화면에는 출력 x) */}
            <Text
              style={[
                Tokens.posttext,
                { position: "absolute", opacity: 0, zIndex: -1 },
              ]}
              onTextLayout={(e) => {
                const newCount = e.nativeEvent.lines.length;
                if (lineCount !== newCount) {
                  setLineCount(newCount);
                }
              }}
            >
              {data.posttext}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. 미디어 (사진 + 동영상) */}
        {(() => {
          // [임시 하드코딩]
          if (data.id === 95) {
            const hardcodedMedia = [
              {
                type: "image",
                source: require("../../assets/image/moviePoster1.png"),
              },
              {
                type: "image",
                source: require("../../assets/image/moviePoster2.png"),
              },
            ];
            const hardcoded95Images = hardcodedMedia.filter(m => m.type === "image").map(m => m.source);
            return (
              <PostMedia
                media={hardcodedMedia}
                onMediaPress={(item) => {
                  if (item?.type === "image") {
                    const idx = hardcoded95Images.findIndex(src => src === item.source);
                    handleImagePress(hardcoded95Images, Math.max(0, idx));
                  } else if (item?.type === "video") handleVideoPress(item);
                }}
              />
            );
          }
          if (data.id === 23) {
            const hardcodedMedia = [
              {
                type: "image",
                source: require("../../assets/image/bookImage1.png"),
              },
              {
                type: "image",
                source: require("../../assets/image/bookImage2.png"),
              },
            ];
            const hardcoded23Images = hardcodedMedia.filter(m => m.type === "image").map(m => m.source);
            return (
              <PostMedia
                media={hardcodedMedia}
                onMediaPress={(item) => {
                  if (item?.type === "image") {
                    const idx = hardcoded23Images.findIndex(src => src === item.source);
                    handleImagePress(hardcoded23Images, Math.max(0, idx));
                  } else if (item?.type === "video") handleVideoPress(item);
                }}
              />
            );
          }

          let combinedMedia = [];

          // 1. data.media가 있으면 그것을 우선 사용 (순서 보장)
          if (data.media && data.media.length > 0) {
            combinedMedia = data.media;
          } else {
            // 2. 기존 방식: videos + images 합치기 (videos 먼저)
            if (data.videos) {
              data.videos.forEach((v) =>
                combinedMedia.push({ ...v, type: "video", source: v }),
              );
            }
            if (data.images) {
              data.images.forEach((i) =>
                combinedMedia.push({ type: "image", source: i }),
              );
            }
          }

          const combinedImageSources = combinedMedia.filter(m => m.type === "image").map(m => m.source);
          return (
            <PostMedia
              media={combinedMedia}
              onMediaPress={(item) => {
                if (item?.type === "image") {
                  const idx = combinedImageSources.findIndex(src => src === item.source);
                  handleImagePress(combinedImageSources, Math.max(0, idx));
                } else if (item?.type === "video") handleVideoPress(item);
              }}
            />
          );
        })()}

        {/* 3. 투표 */}
        {data.hasVote && (
          <View style={{ marginTop: 10 }}>
            <PostVote voteId={data.voteId} />
          </View>
        )}

        {/* 4. 인용 카드 추가 */}
        {data.quote ? (
          <View style={{ marginHorizontal: 8, marginBottom: 0 }}>
            <QuoteCard
              quotedPost={data.quote}
              compactMedia={true}
              onPress={handleQuotePress}
              containerStyle={{ marginTop: Spacing[3] }} // 프사↔본문(10)과 동일하게 본문↔인용카드 간격 맞춤 (기존 20 → 10)
            />
          </View>
        ) : null}

        {/* 5. 링크 미리보기 */}
        {linkUrl && (
          <View style={{ marginHorizontal: Spacing[2] }}>
            <LinkPreview url={linkUrl} />
          </View>
        )}

        {/* 이미지 상세 보기 모달 */}
        <ViewImage
          visible={imageModalVisible}
          onClose={() => setImageModalVisible(false)}
          images={selectedImages}
          initialIndex={selectedImageIndex}
          blockImageSave={data.imageBlocked}
          meatballVisible={!data.imageBlocked}
        />

        {/* 비디오 상세 보기 모달 */}
        <ViewVideo
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          videoSource={selectedVideo}
        />

        {/* 좋아요, 북마크, 댓글, 인용 */}
        <PostUserSaved
          like={data.like}
          setLike={(newLike, newIsLiked) => {
            handleUpdate({ like: newLike, isLiked: newIsLiked });
          }}
          data={data}
          showChat={true}
          showMoreMenu={false}
          onHostBottomSheet={onHostBottomSheet}
          setQuotedPost={setQuotedPost}
          setShowWriter={setShowWriter}
          modalVisible={showWriter}
          quotedPost={quotedPost}
          onUpdatePost={onUpdatePost}
          onRefresh={onRefresh}
          marginHorizontalValue={widthScale(50)}
        />

        {/* Toast Message */}
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

        {/* 게시글 삭제 확인 팝업 */}
        <Popup2Button
          visible={isDeleteModalVisible}
          onRequestClose={() => setIsDeleteModalVisible(false)}
          mainText={"정말 이 게시물을 삭제할꺼야?"}
          leftText={"취소하기"}
          rightText={"삭제하기"}
          leftOnPress={() => setIsDeleteModalVisible(false)}
          rightOnPress={async () => {
            console.log(`[Posts] Attempting to delete post. Data:`, JSON.stringify({
              id: data.id,
              postType: data.postType,
              usercode: data.usercode,
              posttext: data.posttext?.substring(0, 20) + "..."
            }));
            setIsDeleteModalVisible(false);
            try {
              const result = await postApi.deletePost(
                data.postType,
                data.id,
              );

              if (result.success) {
                console.log("[Posts] Delete successful. New quote_num:", result.quote_num);

                // 홈/라이브러리/검색 공유 캐시에서 즉시 제거
                removePostEverywhere(data.id, data.postType);

                // 인용 카드(QuoteCard) '삭제된 게시물' 표시용 신호 (목록이 아니라 캐시로 못 닿는 UI)
                DeviceEventEmitter.emit('post_deleted', {
                  id: data.id,
                  postType: data.postType
                });

                // 전역 토스트 메시지 발생
                DeviceEventEmitter.emit('show_toast', {
                  message: "게시글이 삭제되었어!"
                });

                // 데이터 새로고침 호출 (지연 없이 즉시 호출)
                onRefresh?.();
              } else {
                console.error("[Posts] Delete failed:", result);
                setToastMessage("삭제에 실패했어. 다시 시도해줘.");
                setToastVisible(true);
              }
            } catch (error) {
              setToastMessage("오류가 발생했어.");
              setToastVisible(true);
            }
          }}
        />

        {/* 글 구분 선 */}
        <View
          style={{
            borderTopWidth: STROKE_WIDTH,
            borderColor: ColorTokens.Unselected,
            opacity: 0.2,
            margin: 5,
          }}
        />
      </View>
    </View>
  );
});

export default Posts;

const styles = StyleSheet.create({
  background: {
    // 색상 조정
    backgroundColor: ColorTokens.Background,
  },
  postUserInfoStyle: {
    paddingLeft: Spacing[2], // mainTouchable의 horizontal과 연결됨
  },
  mainTouchable: {
    // 위치 조정
    marginHorizontal: Spacing[2], // upperContainer의 left와 연결됨
  },
});
