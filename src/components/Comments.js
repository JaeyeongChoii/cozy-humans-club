import { React, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { commentApi } from "../api/commentApi";

import Tokens from "../../Tokens";
import PostUserSaved from "./PostUserSaved";
import { generateMoreMenuProps } from "../utils/userUtils";
import { useMoreMenu } from "./MoreMenuContext";
import { widthScale } from "../utils/scale";
import PostUserInfo from "./PostUserInfo";
import Database from "./Database";
import Toast from "./Popup/Toast";
import Popup2Button from "./Popup2Button";
import { Spacing } from "../design/Spacing";
import QuoteCard from "./QuoteCard";
import PostVote from "./PostVote";
import PostMedia from "./PostMedia";
import ViewImage from "./ViewImage";
import ViewVideo from "./ViewVideo";
import LinkPreview from "./LinkPreview";
import { ColorTokens } from "../design/token/ColorTokens";
import { THEME, STROKE_WIDTH } from "../design/token/constantsTokens";
import { BottomSheetTypes } from "../constants/bottomSheetTypes";

const Comments = ({
  data,
  onClose,
  menuId,
  onDeleteSuccess,
  onDeleteComment,
  onRefresh,
  onPostSuccess,
  onHostBottomSheet,
}) => {
  const [like, setLike] = useState(data.like);
  // 댓글 좋아요 점등 값. PostUserSaved는 점등을 data.isLiked로 직접 그리므로,
  // 여기서 로컬 state로 들고 있다가 onUpdatePost로 갱신해 점등이 정확히 반영되도록 한다.
  const [isLiked, setIsLiked] = useState(!!data.isLiked);
  const [showWriter, setShowWriter] = useState(false);
  const [quotedPost, setQuotedPost] = useState(null);
  const { currentUserCode } = useMoreMenu();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [showImages, setShowImages] = useState([]);
  const [showImageIndex, setShowImageIndex] = useState(0);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const navigation = useNavigation();

  return (
    <View>
      <View>
        <View
          style={{
            borderTopWidth: STROKE_WIDTH,
            borderColor: "#8D8D8D",
            opacity: 0.2,
            marginTop: 5,
          }}
        />

        <PostUserInfo
          userCode={data.usercode}
          profileImage={data.profileImage}
          name={data.name}
          timeStamp={data.timestamp}
          isRelay={data.draft === 1}
          onClose={onClose}
          style={{ paddingLeft: Spacing[2] }}
          withMoreMenu={true}
          moreMenuProps={generateMoreMenuProps({
            data: data,
            currentUserCode: currentUserCode || Database.UserData?.[0]?.usercode,
            menuId: menuId,
            navigation: navigation,
            onCopy: async () => {
              await Clipboard.setStringAsync(data.posttext);
              setToastMessage("댓글을 복사했어");
              setToastVisible(true);
            },
            onDelete: () => {
              setDeletePopupVisible(true);
            },
            dismissOnScroll: true,
          })}
        />

        <TouchableOpacity
          style={{ marginHorizontal: Spacing[2], marginTop: Spacing[4] }}
          onPress={() =>
            onHostBottomSheet?.(BottomSheetTypes.POST, {
              ...data,
              postType: THEME.COMMENT,
              is_comment: true,
            })
          }
        >
          <Text style={Tokens.posttext}>
            {(() => {
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
            })()}
          </Text>
        </TouchableOpacity>

        <PostMedia
          media={data?.media || []}
          onMediaPress={(item) => {
            if (item?.type === "video") {
              setSelectedVideo(item.source);
              setVideoModalVisible(true);
              return;
            }
            if (item?.type === "image") {
              const allImages = (data?.media || [])
                .filter(m => m.type === "image")
                .map(m => m.source || m);
              const idx = allImages.findIndex(src => src === item.source);
              setShowImages(allImages);
              setShowImageIndex(Math.max(0, idx));
              setImageViewerVisible(true);
            }
          }}
          style={{ marginHorizontal: Spacing[2] }}
        />

        {/* 3. 투표 - 인용 위로 이동 */}
        {data.hasVote && (
          <View style={{ marginTop: 10, marginHorizontal: Spacing[2] }}>
            <PostVote voteId={data.voteId} />
          </View>
        )}

        {/* 4. 인용 카드 */}
        {data.quote && (
          <View style={{ marginBottom: 10, marginTop: 10, marginHorizontal: Spacing[2] }}>
            <QuoteCard quotedPost={data.quote} />
          </View>
        )}

        {/* 5. 링크 미리보기 - 신규 추가 */}
        {(() => {
          const firstUrl = data.posttext ? (data.posttext.match(/(https?:\/\/[^\s]+)/) || [])[0] : null;
          if (firstUrl) {
            return (
              <View style={{ marginHorizontal: Spacing[2], marginTop: 10 }}>
                <LinkPreview url={firstUrl} />
              </View>
            );
          }
          return null;
        })()}

        <PostUserSaved
          like={like}
          setLike={setLike}
          data={{ ...data, isLiked }}
          onUpdatePost={(updated) => {
            if (updated.isLiked !== undefined) setIsLiked(!!updated.isLiked);
            if (typeof updated.like === "number") setLike(updated.like);
          }}
          showChat={true}
          setQuotedPost={setQuotedPost}
          setShowWriter={setShowWriter}
          modalVisible={showWriter}
          quotedPost={quotedPost}
          onRefresh={onRefresh}
          onPostSuccess={onPostSuccess}
          marginHorizontalValue={widthScale(40)}
          isComment={true}
          onHostBottomSheet={onHostBottomSheet}
        />

        <ViewImage
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
          images={showImages}
          initialIndex={showImageIndex}
          blockImageSave={false}
        />

        <ViewVideo
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          videoSource={selectedVideo}
        />

        <Toast
          visible={toastVisible}
          pointMessage={toastMessage}
          onDismiss={() => setToastVisible(false)}
          withOverlay={true}
        />

        <Popup2Button
          visible={deletePopupVisible}
          onRequestClose={() => setDeletePopupVisible(false)}
          mainText="정말로 이 댓글을 삭제할 거야?"
          leftText="취소"
          rightText="삭제할래"
          leftOnPress={() => setDeletePopupVisible(false)}
          rightOnPress={async () => {
            setDeletePopupVisible(false);
            // 신규 경로: 부모의 삭제 뮤테이션에 위임(낙관적 -1 + cancelQueries + 롤백 처리).
            if (onDeleteComment) {
              onDeleteComment(data.id);
              return;
            }
            // 폴백(구 경로): 직접 API 호출 후 성공 콜백.
            try {
              const result = await commentApi.deleteComment(data.id);
              if (result.success) {
                onDeleteSuccess?.();
              } else {
                Alert.alert("실패", result.message || "댓글 삭제에 실패했습니다.");
              }
            } catch (error) {
              console.error("[Comments] Delete error:", error);
              Alert.alert("오류", "댓글 삭제 중 오류가 발생했습니다.");
            }
          }}
        />
      </View>
    </View>
  );
};

export default Comments;
