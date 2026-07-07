// 프로필 사진, 닉네임, 게시된 시간, 우측 더보기 탭 부분
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

import CachedImage from "../common/CachedImage.js";
import Tokens from "../../../Tokens.js";
import { defaultPostUpperMarginTop } from "../../design/token/constantsTokens.js";
import { ColorTokens } from "../../design/token/ColorTokens.js";
import { CalculatingTime } from "../../utils/CalculatingTime.js";
import { THEME } from "../../design/token/constantsTokens.js";
import MoreMenu from "../Moremenu.js";
import DynamicLabel from "../DynamicLabel";
import { SCREEN_WIDTH } from "../../utils/scale.js";
import { Radius } from "../../design/Radius.js";
import { Spacing } from "../../design/Spacing.js";
import { useMoreMenu } from "../MoreMenuContext.js";

export default function PostUserInfo({
  name,
  profileImage,
  userCode,
  timeStamp,
  onClose,
  isRelay,
  style,
  //showTypeLabel,   
  postType,
  showPostTypeLabel = false,  // Library, Userprofile에만 보이는 자유/진지 태그
  withMoreMenu,
  postOurid,  // 하드코딩용 임시 파라미터
  moreMenuProps = {},
  label,
  onPressLabel, // 답변 유형 라벨(및 그 오른쪽 영역) 터치 시 글 세부 열기
}) {
  const navigation = useNavigation();
  const { currentUserCode } = useMoreMenu();

  const normalize = (code) => code ? String(code).replace(/^@/, '').trim().toLowerCase() : '';
  const getPostTypeLabel = (type) => {
    const normalizedType = String(type ?? "").toLowerCase();

    if (
      type === THEME.JIN ||
      type === 1 ||
      normalizedType === "1" ||
      normalizedType.includes("jin") ||
      normalizedType.includes("think") ||
      normalizedType.includes("serious")
    ) {
      return THEME.JIN;
    }

    if (
      type === THEME.JAM ||
      type === 0 ||
      normalizedType === "0" ||
      normalizedType.includes("jam") ||
      normalizedType.includes("talk") ||
      normalizedType.includes("free")
    ) {
      return THEME.JAM;
    }

    return "";
  };

  const postTypeLabel = getPostTypeLabel(postType);

  return (
    <View style={[styles.upperContainer, style]}>
      {/* Top Row: User Info + More Menu */}
      <View style={styles.headerRow}>
        {/* 유저 정보 */}
          <TouchableOpacity
            onPress={() => {
              onClose?.(); // ?. 는 onClose 함수가 undefinded가 아닐때 만 호출
              setTimeout(() => {
                const isMe = normalize(userCode) === normalize(currentUserCode);
                if (isMe) {
                  navigation.navigate("Library");
                } else {
                  navigation.navigate("Userprofile", {
                    usercode: userCode, // PostUserInfo의 userCode prop 사용
                  });
                }
              }, 300); // 300ms 지연
            }}
            style={styles.userInfoTouchable}
          >
            <CachedImage
              source={profileImage || require("../../../tokenImage/defaultProfileImage.png")}
              style={styles.profileImage}
              placeholder={require("../../../tokenImage/defaultProfileImage.png")}
              resizeWidth={200}
            />
            {/* 닉네임, 게시시간, 이어서 게시, 해시태그 */}
            <View>
              {/* 닉네임, 게시시간, 이어서 게시 */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={Tokens.nickname}>{name || ""}</Text>

                {/* timeStamp가 ""로 되었으면 출력하지 말기 */}
                {timeStamp !== "" && timeStamp !== undefined && (
                  <>
                    <Image
                      source={require("../../../tokenImage/point.png")}
                      style={styles.pointPadding}
                    />
                    {/* 하드 코딩 */}
                    {postOurid === 93 && (
                      <Text style={Tokens.profile_ex}>1분 전</Text>
                    )}
                    {postOurid === 95 && (
                      <Text style={Tokens.profile_ex}>5분 전</Text>
                    )}
                    {postOurid === 97 && (
                      <Text style={Tokens.profile_ex}>12분 전</Text>
                    )}
                    {postOurid === 98 && (
                      <Text style={Tokens.profile_ex}>19분 전</Text>
                    )}
                    {postOurid === 96 && (
                      <Text style={Tokens.profile_ex}>12시간 전</Text>
                    )}

                    {postOurid === 18 && (
                      <Text style={Tokens.profile_ex}>3분 전</Text>
                    )}
                    {postOurid === 19 && (
                      <Text style={Tokens.profile_ex}>10분 전</Text>
                    )}
                    {postOurid === 20 && (
                      <Text style={Tokens.profile_ex}>35분 전</Text>
                    )}
                    {postOurid === 23 && (
                      <Text style={Tokens.profile_ex}>38분 전</Text>
                    )}
                    {postOurid === 22 && (
                      <Text style={Tokens.profile_ex}>40분 전</Text>
                    )}

                    {/* timeStamp의 시간을 보기좋게 출력 */}
                    {/* 하드코딩, includes쪽 삭제하기 */}
                    {![93, 95, 97, 98, 96, 18, 19, 20, 23, 22].includes(postOurid) && (
                      <Text style={Tokens.profile_ex}>{CalculatingTime(timeStamp)}</Text>
                    )}

                    {/* Library, Userprofile에만 보이는 자유/진지 태그 */}
                    {showPostTypeLabel && postTypeLabel !== "" && (
                      <>
                        <Image
                          source={require("../../../tokenImage/point.png")}
                          style={[styles.pointPadding, { marginRight: 6 }]}
                        />
                        <Text style={[Tokens.profile_ex, { color: postTypeLabel === THEME.JIN ? ColorTokens.Point2 : ColorTokens.Point, fontFamily: "NeoDunggeunmoPro" }]}>
                          {postTypeLabel}
                        </Text>
                      </>
                    )}
                    {/* 이어서 게시 라벨*/}
                    {isRelay && (
                      <>
                        <Image
                          source={require("../../../tokenImage/point.png")}
                          style={styles.pointPadding}
                        />
                        <Text style={[Tokens.profile_ex, { color: ColorTokens.Point }]}>이어서 게시</Text>
                      </>
                    )}
                  </>
                )}
              </View>

              {/* 해시태그 */}
              <Text style={Tokens.profile_ex}>{userCode ? `@ ${userCode}` : ""}</Text>
            </View>
          </TouchableOpacity>

        {/* MoreMenu Logic */}
        {withMoreMenu && (
          <View style={styles.moreMenuContainer}>
            <MoreMenu {...moreMenuProps} />
          </View>
        )}
      </View>

      {/* ===== 답변유형 기능 임시 비활성화 [ANSWER_TYPE_HIDDEN] =====
          출시 보류로 유저에게 숨김. 복구하려면 이 주석 블록의 여는/닫는 표시를 제거하고
          아래 원본 JSX(답변 유형 라벨 표시)를 그대로 되살리세요.
          답변 유형 라벨 (홈/세부글 공통). 미선택 시 백엔드에서 공백(" ")으로 오므로 trim으로 거름
      {label && label.trim() !== "" && (
        // 라벨 자체뿐 아니라 그 오른쪽 빈 영역까지(가로 전체) 터치 시 글 세부로 들어가도록 감쌈
        <TouchableOpacity
          onPress={onPressLabel}
          disabled={!onPressLabel}
          style={{ marginTop: Spacing[2], alignItems: 'flex-start' }}
        >
          <DynamicLabel text={label} />
        </TouchableOpacity>
      )}
          ===== [ANSWER_TYPE_HIDDEN] 끝 ===== */}
    </View>
  );
}

const styles = StyleSheet.create({
  upperContainer: {
    // 위치 조정
    // flexDirection: "row", // Changed to column (default)
    // alignItems: "center", // Remove center to allow left alignment of label
    // justifyContent: "space-between", // Remove
    paddingTop: defaultPostUpperMarginTop,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%", // Ensure full width
  },
  userInfoTouchable: {
    justifyContent: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  moreMenuContainer: {
    marginLeft: Spacing[2],
    alignSelf: "flex-start",
    marginTop: -Spacing[3],
  },
  userInfoContainer: {
    // 위치 조정
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  profileImage: {
    // 위치 조정
    marginRight: Spacing[3], // 유저 정보와 간격 벌리기
    // 레이아웃 속성
    width: 40,
    height: 40,
    borderRadius: Radius.round,
  },
  userInfoDetailContainer: {
    // 위치 조정
    marginTop: 5, // 이미지 중앙에 맞춤
  },
  nameAndTime: {
    // 위치 조정
    flexDirection: "row",
    alignItems: "center",
  },
  pointPadding: {
    marginLeft: Spacing[1],
    marginRight: Spacing[1],
  },
});
