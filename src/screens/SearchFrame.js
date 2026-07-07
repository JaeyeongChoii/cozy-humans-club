import React, { useRef, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorTokens } from "../design/token/ColorTokens";
import { THEME, STROKE_WIDTH } from "../design/token/constantsTokens";
import { useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../queries/useSearch";
import SetTheme from "../components/SetTheme";
import { SearchTabTypes } from "../constants/SearchTabTypes";
import { calculatingPopular } from "../utils/CalculatingPopular";
import SearchMain from "../components/Search/SearchMain";
import SearchList from "../components/Search/SearchList";
import FamousTopic from "../components/Search/FamousTopic";
import { Spacing } from "../design/Spacing";
import { Typography } from "../design/Typography";
import { Radius } from "../design/Radius";
import { widthScale } from "../utils/scale";
import { useMoreMenu } from "../components/MoreMenuContext";

const SEARCH_MAX_LENGTH = 300;
const SEARCH_PLACEHOLDER =
  "\uC5B4\uB5A4 \uC774\uC57C\uAE30\uAC00 \uAD81\uAE08\uD55C\uAC00?";
const themeModalHeight = 265;

const SearchFrame = ({ onHostBottomSheet }) => {
  const { closeMenu } = useMoreMenu();
  const navigation = useNavigation();

  // 상위 탭 네비게이터(Material Top Tabs)의 가로 스와이프 토글.
  // 입력창 포커스 중엔 탭 스와이프를 꺼야 페이저가 가로 제스처를 가로채지 않고
  // TextInput 내부 가로 스크롤(스와이프)·탭 커서 이동이 정상 동작한다.
  const setTabSwipeEnabled = useCallback(
    (enabled) => navigation.setOptions({ swipeEnabled: enabled }),
    [navigation],
  );
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTab, setSelectedTab] = useState(SearchTabTypes.ALL);
  const [searchHistory, setSearchHistory] = useState([]);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState(THEME.LAST);
  const [followState, setFollowState] = useState({});

  const [showResult, setShowResult] = useState(false); // 검색 결과를 보여줄지 여부
  const [isFocused, setIsFocused] = useState(false); // 검색창 포커스 여부
  // 실제로 검색을 실행하는 '확정된' 키워드. 입력 중인 searchKeyword와 분리해서
  // 키 입력마다 재요청되지 않게 한다(제출/탭 변경 시에만 쿼리 키가 바뀐다).
  const [committedKeyword, setCommittedKeyword] = useState("");

  // 검색 결과는 ['search', tab, keyword] 공유 캐시에서 온다. 탭 변경 시 쿼리 키가 바뀌어 자동 재요청된다.
  const queryClient = useQueryClient();
  const {
    data: searchResults = [],
    isFetching: isLoading,
    refetch: refetchSearch,
  } = useSearch(selectedTab, committedKeyword, showResult);

  // 현재 탭/키워드의 검색 결과 캐시에서 일치하는 글을 부분 갱신한다(좋아요/북마크 등).
  const handleUpdatePost = (updatedData) => {
    queryClient.setQueryData(["search", selectedTab, committedKeyword], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((post) =>
        post.id === updatedData.id && post.postType === updatedData.postType
          ? { ...post, ...updatedData }
          : post,
      );
    });
  };

  // 좋아요/북마크/삭제는 공유 RQ 캐시(postCacheSync)로 직접 반영되므로 post_updated 수신 불필요.

  const translateY = useRef(new Animated.Value(350)).current;

  const openModal = () => {
    setSortModalVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 350,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSortModalVisible(false));
  };

  const handleSearch = (keyword) => {
    const trimmed = keyword.trim();

    if (!trimmed) {
      setSearchModalVisible(false);
      return;
    }

    // 300자를 초과하면 검색 실행하지 않음(안내문구와 동일한 raw 길이 기준).
    // 300자 이하로 내려오면 이 가드가 통과되어 자동으로 검색이 복구된다.
    if (keyword.length > SEARCH_MAX_LENGTH) return;

    setSearchKeyword(keyword);
    setSearchModalVisible(false);
    setShowResult(true); // 검색 결과 모드로 전환
    setCommittedKeyword(trimmed); // 확정 키워드 설정 → useSearch가 자동 실행

    setSearchHistory((prev) => [
      keyword,
      ...prev.filter((item) => item !== keyword),
    ]);
  };

  const removeHistory = (keyword) => {
    setSearchHistory((prev) => prev.filter((item) => item !== keyword));
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    setIsFocused(false);
    setSearchModalVisible(false);
    setTabSwipeEnabled(true); // 취소 시 탭 스와이프 복구(blur 미발생 대비)
  };

  const sortPosts = (posts) => {
    if (!posts || !Array.isArray(posts)) return [];

    if (sortOption === THEME.LAST) {
      return [...posts].sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOption === THEME.POPULAR) {
      return [...posts].sort(
        (a, b) =>
          calculatingPopular(b.like, b.comment, b.quote, b.viewCount ?? 0) -
          calculatingPopular(a.like, a.comment, a.quote, a.viewCount ?? 0),
      );
    }
    return posts;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]} onTouchStart={closeMenu}>
      {/* 검색 바 영역 (기존 모달 안에 있던 UI를 밖으로 배치) */}
      <View style={styles.textBarAndCancelContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={SEARCH_PLACEHOLDER}
            placeholderTextColor={ColorTokens.Unselected}
            selectionColor={ColorTokens.Typography}
            underlineColorAndroid="transparent"
            value={searchKeyword}
            onChangeText={(text) => {
              setSearchKeyword(text);
              if (!text.trim()) setShowResult(false);
            }}
            onFocus={() => {
              setIsFocused(true);
              setSearchModalVisible(true);
              setTabSwipeEnabled(false); // 포커스 중 탭 스와이프 차단 → 입력창 가로 스크롤 복구
            }}
            onBlur={() => {
              setIsFocused(false);
              setTabSwipeEnabled(true); // 포커스 해제 시 탭 스와이프 복구
            }}
            onSubmitEditing={() => handleSearch(searchKeyword)}
            // 300자 초과 시엔 검색 키를 눌러도 키보드가 닫히지 않고 그대로 유지된다
            // (검색 차단 상태). 300자 이하면 제출 시 기존처럼 키보드가 닫힌다.
            blurOnSubmit={searchKeyword.length <= SEARCH_MAX_LENGTH}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            multiline={false}
          />
          {searchKeyword.length > 0 && isFocused && (
            <TouchableOpacity
              onPress={() => {
                setSearchKeyword("");
                setShowResult(false);
              }}
              style={styles.clearButton}
              hitSlop={10}
            >
              <Image
                source={require("../../tokenImage/CircleDeleteButton.png")}
                style={styles.clearButtonImage}
              />
            </TouchableOpacity>
          )}
        </View>
        {isFocused && (
          <TouchableOpacity onPress={handleCancel} hitSlop={24}>
            <Text style={styles.cancelButton}>취소</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 글자수 초과 안내문구 (초과 시에만 검색바 바로 아래에 표시) */}
      {searchKeyword.length > SEARCH_MAX_LENGTH && (
        <Text style={styles.exceedLengthMessage}>
          300자 이내로 입력해야 한다던데..
        </Text>
      )}

      {/* 조건부 렌더링: 검색 기록(SearchList), 초기 화면(FamousTopic), 또는 검색 결과(SearchMain) */}
      {searchModalVisible ? (
        <SearchList
          searchHistory={searchHistory}
          setSearchHistory={setSearchHistory}
          handleSearch={handleSearch}
          removeHistory={removeHistory}
        />
      ) : showResult ? (
        <SearchMain
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          sortOption={sortOption}
          openModal={openModal}
          isLoading={isLoading}
          posts={searchResults}
          handleUpdatePost={handleUpdatePost}
          refetchSearch={refetchSearch}
          onHostBottomSheet={onHostBottomSheet}
          followState={followState}
          setFollowState={setFollowState}
          sortPosts={sortPosts}
        />
      ) : (
        <FamousTopic />
      )}

      {/* 정렬 옵션 선택 모달 */}
      <SetTheme
        isVisible={sortModalVisible}
        onClose={closeModal}
        selectedTheme={sortOption}
        setTheme={setSortOption}
        translateY={translateY}
        textGroup={[THEME.LAST, THEME.POPULAR]}
        themeModalHeight={themeModalHeight}
      />
    </SafeAreaView>
  );
};

export default SearchFrame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorTokens.Background,
    paddingTop: 90,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    backgroundColor: ColorTokens.InnerBox,
    borderWidth: STROKE_WIDTH,
    borderColor: ColorTokens.Stroke,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: ColorTokens.Typography,
    fontFamily: "Galmuri",
    fontSize: 12,
    // Android는 lineHeight 22로 세로 중앙(기존 동작 유지).
    // iOS는 lineHeight를 주면 placeholder가 위로 치우치므로 미지정.
    ...Platform.select({ android: { lineHeight: 22 } }),
    paddingVertical: 0,
    paddingLeft: 0,
    paddingRight: 28,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  exceedLengthMessage: {
    ...Typography.paraSmall,
    color: ColorTokens.Warning,
    paddingHorizontal: Spacing[4],
    marginTop: -Spacing[1],
    marginBottom: Spacing[2],
  },
  clearButton: {
    position: "absolute",
    right: 8, // ← 이 값으로 좌우 조절 (작을수록 오른쪽)
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonImage: {
    width: 15,
    height: 15,
  },
  textBarAndCancelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // 카테고리 탭이 검색바와 구분선 사이 중앙에 오도록 하단 간격(20px)에 맞춤
    // (marginBottom 12 + searchTab marginTop 8 = 20 = searchTab marginBottom 8 + divider marginTop 12)
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2],
  },
  cancelButton: {
    color: ColorTokens.Typography,
    ...Typography.boldMedium,
  },
});
