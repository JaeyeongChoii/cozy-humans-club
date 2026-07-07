import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  StyleSheet,
  Platform,
} from "react-native";
import Tokens from "../../Tokens";
import { ColorTokens } from "../design/token/ColorTokens";
import { Typography } from "../design/Typography";
import { widthScale, heightScale } from "../utils/scale";

// ============================================================
// 안드로이드 전용: 투표 후보 박스 안의 텍스트(placeholder/실제 입력/글자수 "25")를
// 박스 안에서 아래로 내리는 값(px). 값이 클수록 더 내려갑니다. (0이면 기존과 동일)
//  * iOS에는 전혀 영향을 주지 않습니다 (android에서만 적용).
//  * transform translateY로 적용하므로 TextInput과 글자수 Text가 '정확히 같은 px'만큼 이동합니다.
const ANDROID_CANDIDATE_TEXT_DROP = 1;
// ============================================================

/**
 * 투표 작성 UI 공용 컴포넌트.
 * 글쓰기(Write)와 댓글 작성(Postbottom)이 동일한 레이아웃을 공유한다.
 * 상태 관리 방식(글쓰기 reducer / 댓글 useState)은 콜백 props로 주입받는다.
 *
 * @param {string[]} candidates - 후보 텍스트 배열
 * @param {{day:number,hour:number,minute:number}} selectedPeriod - 투표 기간
 * @param {number} [maxCandidates=4] - 최대 후보 개수
 * @param {() => void} onOpenPeriodModal - 기간 설정 모달 열기
 * @param {() => void} onCloseVote - 투표 영역 닫기/삭제
 * @param {(index:number, text:string) => void} onChangeCandidate - 후보 텍스트 변경
 * @param {() => void} onAddCandidate - 후보 추가
 * @param {(index:number) => void} onRemoveCandidate - 후보 삭제
 */
const VoteComposer = ({
  candidates,
  selectedPeriod,
  maxCandidates = 4,
  onOpenPeriodModal,
  onCloseVote,
  onChangeCandidate,
  onAddCandidate,
  onRemoveCandidate,
  onFocusVote,
}) => {
  const periodLabel = (() => {
    const { day, hour, minute } = selectedPeriod;
    if (hour === 0 && minute === 0) {
      return `${day}일 동안`;
    }
    return `${day}일 ${hour}시간 ${minute}분 동안`;
  })();

  return (
    <View style={Tokens.votebox}>
      <View style={styles.voteAndDeleteButtonContainer}>
        {/* 기간 설정 */}
        <TouchableOpacity
          onPress={onOpenPeriodModal}
          style={styles.periodContainer}
        >
          <Text style={styles.periodTextStyle}>{periodLabel}</Text>
          <Image
            source={require("../../tokenImage/dropdown.png")}
            style={{ width: 17, height: 8 }}
          />
        </TouchableOpacity>

        {/* 삭제(닫기) 버튼 */}
        <TouchableOpacity
          style={{ marginLeft: "auto", marginRight: 15 }}
          onPress={onCloseVote}
        >
          <Image
            source={require("../../tokenImage/CircleDeleteButton.png")}
            style={styles.imageDeleteButton}
          />
        </TouchableOpacity>
      </View>

      {/* 후보 리스트 */}
      {candidates.map((candidate, index) => (
        <ImageBackground
          source={require("../../tokenImage/candidatesBoxNew.png")}
          style={styles.candidateBoxContainer}
          resizeMode="contain"
          key={index}
        >
          <TextInput
            style={
              index < 2 ? styles.candidateText : styles.candidateTextWithDelete
            }
            value={candidate}
            placeholder={`${index + 1}`}
            placeholderTextColor={ColorTokens.Unselected}
            maxLength={25}
            // 자동 대문자 방지
            autoCapitalize="none"
            // 자동 수정 방지
            autoCorrect={false}
            spellCheck={false}
            onChangeText={(text) => onChangeCandidate(index, text)}
            onFocus={onFocusVote}
          />
          <Text
            style={
              index < 2 ? styles.leftCandidateText : styles.charCountWithDelete
            }
          >
            {25 - candidate.length}
          </Text>

          {/* 추가 후보(3번째+)만 삭제 버튼을 박스 안쪽 오른쪽에 배치 */}
          {index >= 2 && (
            <TouchableOpacity
              onPress={() => onRemoveCandidate(index)}
              style={styles.deleteButtonInside}
            >
              <Image
                source={require("../../tokenImage/GrayCircleDeleteButton.png")}
                style={styles.imageDeleteButton}
              />
            </TouchableOpacity>
          )}
        </ImageBackground>
      ))}

      {/* 후보 추가 버튼 */}
      {candidates.length < maxCandidates && (
        <TouchableOpacity
          onPress={onAddCandidate}
          style={styles.addCandidateTouchable}
          activeOpacity={1}
        >
          {/* 후보 추가 버튼: DynamicButton(다중 레이어 합성)은 블록 dimming(opacity 0.5) 시
              Android에서 노란 테두리 아티팩트가 보여, 단일 flat 이미지로 교체 */}
          <Image
            source={require("../../tokenImage/coloraddingCandidiate.png")}
            style={styles.addCandidateImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  voteAndDeleteButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 0,
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  periodTextStyle: {
    color: ColorTokens.Point,
    ...Typography.boldMedium,
    marginLeft: 15,
    marginRight: 8,
    marginVertical: 16,
  },
  imageDeleteButton: {
    width: 20,
    height: 20,
  },
  candidateBoxContainer: {
    // 홈 화면(PostVote)과 동일한 너비/정렬
    width: widthScale(348),
    height: heightScale(40),
    marginBottom: 10,
    alignSelf: "center",
    justifyContent: "center",
  },
  candidateText: {
    color: ColorTokens.Typography,
    height: 40,
    paddingLeft: 20,
    paddingRight: 50,
    ...Typography.paraMedium,
    textAlignVertical: "center", // 안드로이드 세로 중앙 정렬
    includeFontPadding: false,
    marginLeft: 5,
    marginVertical: 0,
    // paraMedium에 들어있는 lineHeight(22)가 iOS 한 줄 TextInput의 placeholder/입력 정렬을
    // 틀어지게 하므로, iOS는 lineHeight를 제거(기본 세로 중앙)하고 안드로이드만 22 유지한다.
    // 안드로이드는 ANDROID_CANDIDATE_TEXT_DROP 만큼 translateY로 텍스트를 아래로 내린다.
    ...Platform.select({
      ios: { lineHeight: undefined },
      android: {
        lineHeight: 22,
        transform: [{ translateY: ANDROID_CANDIDATE_TEXT_DROP }],
      },
    }),
  },
  // 추가 후보(3번째+): 박스 안쪽 삭제 버튼 자리를 확보한 변형
  candidateTextWithDelete: {
    color: ColorTokens.Typography,
    height: 40,
    paddingLeft: 20,
    paddingRight: 78,
    ...Typography.paraMedium,
    textAlignVertical: "center", // 안드로이드 세로 중앙 정렬
    includeFontPadding: false,
    marginLeft: 5,
    marginVertical: 0,
    // paraMedium에 들어있는 lineHeight(22)가 iOS 한 줄 TextInput의 placeholder/입력 정렬을
    // 틀어지게 하므로, iOS는 lineHeight를 제거(기본 세로 중앙)하고 안드로이드만 22 유지한다.
    // 안드로이드는 ANDROID_CANDIDATE_TEXT_DROP 만큼 translateY로 텍스트를 아래로 내린다.
    ...Platform.select({
      ios: { lineHeight: undefined },
      android: {
        lineHeight: 22,
        transform: [{ translateY: ANDROID_CANDIDATE_TEXT_DROP }],
      },
    }),
  },
  leftCandidateText: {
    position: "absolute",
    right: 12,
    color: ColorTokens.Unselected,
    height: 40,
    textAlignVertical: "center", // 안드로이드 세로 중앙 정렬
    ...Typography.paraMedium,
    includeFontPadding: false,
    // iOS는 textAlignVertical을 무시하므로 lineHeight를 박스 높이(40)와 맞춰 세로 중앙 정렬
    // 안드로이드는 ANDROID_CANDIDATE_TEXT_DROP 만큼 translateY로 텍스트를 아래로 내린다.
    ...Platform.select({
      ios: { lineHeight: 40 },
      android: { transform: [{ translateY: ANDROID_CANDIDATE_TEXT_DROP }] },
    }),
  },
  charCountWithDelete: {
    position: "absolute",
    right: 44, // 삭제 버튼 왼쪽
    color: ColorTokens.Unselected,
    height: 40,
    textAlignVertical: "center", // 안드로이드 세로 중앙 정렬
    ...Typography.paraMedium,
    includeFontPadding: false,
    // iOS는 textAlignVertical을 무시하므로 lineHeight를 박스 높이(40)와 맞춰 세로 중앙 정렬
    // 안드로이드는 ANDROID_CANDIDATE_TEXT_DROP 만큼 translateY로 텍스트를 아래로 내린다.
    ...Platform.select({
      ios: { lineHeight: 40 },
      android: { transform: [{ translateY: ANDROID_CANDIDATE_TEXT_DROP }] },
    }),
  },
  deleteButtonInside: {
    position: "absolute",
    right: 14, // 박스 안쪽 오른쪽
    top: "50%",
    transform: [{ translateY: -10 }], // 버튼 높이(20)의 절반
  },
  addCandidateTouchable: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  addCandidateImage: {
    // 이미지 원본 비율(280:136 ≈ 2.06:1) 유지, 높이는 기존 버튼(28)에 맞춤
    width: 58,
    height: 28,
  },
});

export default VoteComposer;
