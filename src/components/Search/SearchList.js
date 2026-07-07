// 설정
// 실시간 인기주제
import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import GlobalScrollView from "../GlobalScrollView";
import { ColorTokens } from "../../design/token/ColorTokens";
import { Typography } from "../../design/Typography";
import DynamicButton from "../DynamicButton";
import { Spacing } from "../../design/Spacing";

const SearchList = ({
    searchHistory,
    setSearchHistory,
    handleSearch,
    removeHistory,
}) => {
    return (
        <View style={{ flex: 1, marginHorizontal: Spacing[5], marginTop: Spacing[2]}}>
            {/* 안내 문구 */}
            <View style={styles.noticeContainer}>
                {/* 검색기록이 없을 때 */}
                <View style={styles.noticeAndDeleteContainer}>
                    <Text style={styles.notice}>최근 검색어</Text>
                    <TouchableOpacity
                        onPress={() => setSearchHistory([])}
                        activeOpacity={1}
                    >
                        <DynamicButton
                            text={"모두 지우기"}
                            disabled={true}
                            isPoint2={false}
                        />
                    </TouchableOpacity>
                </View>
                {searchHistory.length === 0 && (
                    <>
                        <Text style={styles.noSearchWord}>
                            궁금한 주제나 유저를 검색해 보세요
                        </Text>
                    </>
                )}
            </View>

            {/* 검색 기록 리스트 */}
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={20} // 키보드 위 여유 공간
                indicatorStyle="white"
            >
                <GlobalScrollView>
                    {searchHistory.map((item, index) => (
                        <View key={index} style={{marginBottom: Spacing[6]}}>
                            <View style={styles.listItem}>
                                {/* 검색어 클릭시 검색 */}
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => handleSearch(item)}
                                >
                                    <Text style={styles.listText}>{item}</Text>
                                </TouchableOpacity>

                                {/* X 버튼 */}
                                <TouchableOpacity
                                    onPress={() => removeHistory(item)}
                                    hitSlop={40}
                                    >
                                    <Image
                                        source={require("../../../tokenImage/GrayCircleDeleteButton.png")}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.divider} />
                        </View>
                    ))}
                </GlobalScrollView>
            </KeyboardAwareScrollView>
        </View>
    );
};

export default SearchList;

const styles = StyleSheet.create({
    noticeContainer: {
    },
    noSearchWord: {
        color: ColorTokens.Unselected,
        ...Typography.boldMedium,
    },
    noticeAndDeleteContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Spacing[6],
    },
    notice: {
        color: ColorTokens.Point,
        ...Typography.boldLarge,
    },
    listItem: {
        paddingBottom: Spacing[2],
        flexDirection: "row",
        alignItems: "center",
    },
    listText: {
        color: ColorTokens.Typography,
        ...Typography.paraMedium,
    },
    divider: {
        height: 0.5,
        backgroundColor: ColorTokens.Stroke,
    },
});
