import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { postApi } from "../api/postApi";
import { Typography } from "../design/Typography";
import { widthScale } from "../utils/scale";
import { Spacing } from "../design/Spacing";

// 투표 데이터 모듈 레벨 캐시 (voteId -> data).
// 같은 투표가 스크롤로 화면 밖으로 나갔다 다시 들어올 때마다 fetchVote를 다시 호출하며
// 스피너가 깜빡이던 문제를 없앤다. 캐시가 있으면 즉시 표시하고, 최신 표수는 백그라운드에서
// 조용히 갱신한다. 투표(vote_cast) 시에는 캐시를 무효화해 정확한 표수를 다시 받아온다.
const voteCache = new Map();

const PostVote = ({ voteId }) => {
  // 캐시가 있으면 첫 렌더부터 스피너 없이 바로 보여준다.
  const [loading, setLoading] = useState(() => !voteCache.has(voteId));
  const [voteData, setVoteData] = useState(() => voteCache.get(voteId) || null);
  const [selectedOption, setSelectedOption] = useState(() => {
    const cached = voteCache.get(voteId);
    return cached ? (cached.user_choice || cached.choice || null) : null;
  });
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    if (!voteId) return;
    const cached = voteCache.get(voteId);
    if (cached) {
      // 캐시 즉시 반영 후 백그라운드에서 조용히 최신화
      setVoteData(cached);
      const choice = cached.user_choice || cached.choice;
      if (choice) setSelectedOption(choice);
      setLoading(false);
      loadVoteData({ silent: true });
    } else {
      loadVoteData();
    }
  }, [voteId]);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('vote_cast', ({ voteId: castVoteId }) => {
      if (castVoteId === voteId) {
        voteCache.delete(voteId); // 표수가 바뀌었으므로 캐시 무효화 후 재요청
        loadVoteData({ silent: true });
      }
    });
    return () => listener.remove();
  }, [voteId]);

  const loadVoteData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      // console.log(`[PostVote] Loading vote data for ID: ${voteId}`); // 스크롤 중 셀 마운트마다 반복 → 정리
      const data = await postApi.fetchVote(voteId);
      voteCache.set(voteId, data);
      setVoteData(data);

      // 이미 투표한 경우 선택된 옵션 설정
      const choice = data.user_choice || data.choice;
      if (choice) {
        setSelectedOption(choice);
      }
    } catch (error) {
      console.error("[PostVote] Failed to load vote data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null || isCasting) return;

    // 이미 투표했거나 마감된 경우 방지
    const hasAlreadyVoted = !!(voteData.user_choice || voteData.choice);
    if (hasAlreadyVoted || isExpired) {
      Alert.alert("알림", "이미 투표했거나 마감된 투표야.");
      return;
    }

    try {
      setIsCasting(true);
      console.log(`[PostVote] Casting vote for ID: ${voteId}, choice ${selectedOption}`);
      const result = await postApi.castVote(voteId, selectedOption);

      if (result.success) {
        DeviceEventEmitter.emit('vote_cast', { voteId });
      } else {
        Alert.alert("실패", result.message || "투표에 실패했어.");
      }
    } catch (error) {
      // <RULE[p-test.md]> 백엔드 문제 가능성 알림
      Alert.alert("오류", "투표 처리 중 서버 오류가 발생했어. 잠시 후 다시 시도해줘.");
    } finally {
      setIsCasting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={ColorTokens.Point} />
      </View>
    );
  }

  if (!voteData) return null;

  // 옵션들 추출 (vote_1 ~ vote_6)
  const options = [];
  for (let i = 1; i <= 6; i++) {
    const text = voteData[`vote_${i}`];
    if (text) {
      options.push({
        id: i,
        text: text,
        count: voteData[`vote${i}_count`] || 0,
      });
    }
  }

  // 투표 여부 및 마감 여부 확인
  const hasVoted = !!(voteData.user_choice || voteData.choice);
  const isExpired = new Date(voteData.end_date) < new Date();
  const showResults = hasVoted || isExpired;

  // 결과 표시 단계에서 최다 득표 계산.
  // 투표하기 버튼을 누른 뒤(showResults)에는 내가 선택한 항목 여부는 감추고,
  // 최다 득표 항목만 황금색으로 표시한다. (동점이면 해당 항목 모두 표시, 전부 0표면 미표시)
  const maxCount = options.reduce((max, o) => Math.max(max, o.count), 0);

  // 남은 시간 계산
  const getRemainingTime = () => {
    if (isExpired) return "투표 마감";
    const serverEndDate = new Date(voteData.end_date);
    const now = new Date();
    const diff = serverEndDate - now;

    /* <RULE[p-test.md]> 시간 오차 분석 로그 (분석 완료로 주석 처리)
    console.log("[PostVote] Time Comparison:");
    console.log("- Server End Date (Raw):", voteData.end_date);
    console.log("- Server End Date (Parsed):", serverEndDate.toLocaleString());
    console.log("- Client Now:", now.toLocaleString());
    console.log("- Time Diff (ms):", diff);
    */

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeStr = "";
    if (days > 0) timeStr += `${days}일 `;
    if (hours > 0) timeStr += `${hours}시간 `;
    timeStr += `${minutes}분 남음`;
    return timeStr;
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        // 투표하기 누르기 전: 내가 선택한 항목을 하얀색으로 표시
        const isSelectedPreVote =
          !showResults && selectedOption === option.id;
        // 투표하기 누른 후: 최다 득표 항목만 황금색으로 표시 (내 선택 여부는 감춤)
        const isWinner =
          showResults && maxCount > 0 && option.count === maxCount;
        const highlightImage = isSelectedPreVote
          ? require("../../tokenImage/whiteactiveCandidatesBox.png")
          : require("../../tokenImage/candidatesBoxNew_active.png");

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => !showResults && setSelectedOption(option.id)}
            activeOpacity={0.8}
            disabled={showResults}
            style={{ marginBottom: Spacing[2], alignItems: 'center' }}
          >
            <ImageBackground
              source={
                isSelectedPreVote || isWinner
                  ? highlightImage
                  : require("../../tokenImage/candidatesBoxNew.png")
              }
              resizeMode="contain"
              style={styles.candidateBoxContainer}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionText,
                    isSelectedPreVote && styles.whiteOptionText,
                    isWinner && styles.selectedOptionText,
                  ]}
                >
                  {option.text}
                </Text>
                {showResults && (
                  <Text
                    style={[
                      styles.voteCountText,
                      isWinner && styles.selectedOptionText,
                    ]}
                  >
                    {option.count}표
                  </Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.deadlineText}>{getRemainingTime()}</Text>

      {!showResults && (
        <TouchableOpacity
          style={styles.voteButton}
          onPress={handleVote}
          disabled={selectedOption === null || isCasting}
        >
          {isCasting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Image source={require("../../tokenImage/whiteVoteButton.png")} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 5,
    width: "100%",
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  candidateBoxContainer: {
    width: widthScale(348),
    height: 40,
    justifyContent: "center",
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  optionText: {
    color: ColorTokens.Unselected,
    ...Typography.boldMedium,
    fontSize: 12,
  },
  voteCountText: {
    color: ColorTokens.Unselected,
    ...Typography.boldMedium,
    fontSize: 12,
  },
  selectedOptionText: {
    color: ColorTokens.Point,
  },
  // 투표하기 전 내가 선택한 항목(하얀 테두리 박스)의 텍스트 색
  whiteOptionText: {
    color: "#FFFFFF",
  },
  deadlineText: {
    color: ColorTokens.Typography,
    textAlign: "right",
    ...Typography.boldSmall,
    marginTop: Spacing[1],
    marginRight: Spacing[6],
    marginBottom: 10,
  },
  voteButton: {
    paddingVertical: 10,
    alignItems: "center",
    width: 146,
    alignSelf: "center",
  },
});

export default PostVote;
