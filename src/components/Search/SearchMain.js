import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import GlobalScrollView from "../GlobalScrollView";
import CachedImage from "../common/CachedImage";
import { ColorTokens } from "../../design/token/ColorTokens";
import { STROKE_WIDTH } from "../../design/token/constantsTokens";
import { SearchTabTypes } from "../../constants/SearchTabTypes";
import Posts from "../Posts";
import Tokens from "../../../Tokens";
import { postApi } from "../../api/postApi";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import DynamicButton from "../DynamicButton";
import { useMoreMenu } from "../MoreMenuContext";
import { SCREEN_WIDTH } from "../../utils/scale";

const SearchMain = ({
    selectedTab,
    setSelectedTab,
    sortOption,
    openModal,
    isLoading,
    posts,
    handleUpdatePost,
    refetchSearch,
    onHostBottomSheet,
    followState,
    setFollowState,
    sortPosts,
}) => {
    const navigation = useNavigation();
    const { currentUserCode, closeMenu } = useMoreMenu();

    const normalize = (code) => code ? String(code).replace(/^@/, '').trim().toLowerCase() : '';
    return (
        <View style={{ flex: 1 }} onTouchStart={closeMenu}>
            {/* 탭 */}
            <View style={styles.stickyTabBarContainer}>
                <View style={styles.tabBarContainer}>
                    {[
                        SearchTabTypes.ALL,
                        SearchTabTypes.JAM,
                        SearchTabTypes.JIN,
                        SearchTabTypes.USER,
                    ].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tabItem}
                        onPress={() => {
                            closeMenu();
                            setSelectedTab(tab);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                {
                                    color: selectedTab === tab
                                        ? tab === SearchTabTypes.JIN
                                            ? ColorTokens.Point2
                                            : ColorTokens.Point
                                        : ColorTokens.Unselected,
                                },
                            ]}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 정렬 버튼 (user 탭이 아닐 때만 출력) */}
            {selectedTab !== SearchTabTypes.USER && (
                <View style={styles.selectedTabContainer}>
                    <TouchableOpacity
                        style={styles.selectedTabTouchable}
                        onPress={() => {
                            closeMenu();
                            openModal();
                        }}
                    >
                        {/* 선택된 옵션 출력 */}
                        <Text style={Tokens.nickname}>{sortOption}</Text>
                        <Image
                            source={require("../../../tokenImage/sort_bottom.png")}
                            style={{ marginLeft: 5 }}
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* 검색 결과 출력 */}
            <GlobalScrollView onScrollBeginDrag={closeMenu}>
                {isLoading && (
                    <ActivityIndicator
                        size="large"
                        color={ColorTokens.Point}
                        style={{ marginTop: 20 }}
                    />
                )}
                {!isLoading && selectedTab !== SearchTabTypes.USER &&
                    sortPosts(posts).map((item) => (
                        <Posts
                            key={`${selectedTab}-${item.id}`}
                            data={item}
                            menuId={`search-${selectedTab}-${item.id}`}
                            onUpdatePost={handleUpdatePost}
                            onRefresh={() => refetchSearch()}
                            onHostBottomSheet={(type, post, options) => {
                                closeMenu();
                                onHostBottomSheet(type, post || item, { ...options, onUpdate: handleUpdatePost });
                            }}
                            showPostTypeLabel={selectedTab === SearchTabTypes.ALL}
                            dismissMenuOnScroll={true}
                        />
                    ))}
                {/* USER 일때 */}
                {selectedTab === SearchTabTypes.USER &&
                    posts.map((user) => {
                        const isFollowed = followState[user.usercode] || false;

                        return (
                            <View key={user.usercode} style={styles.userInfoContainer}>
                                <TouchableOpacity 
                                    style={styles.header}
                                    onPress={() => {
                                        const isMe = normalize(user.usercode) === normalize(currentUserCode);
                                        if (isMe) {
                                            navigation.navigate("Library");
                                        } else {
                                            navigation.navigate("Userprofile", { usercode: user.usercode });
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <CachedImage
                                        source={user.profileImage || require("../../../tokenImage/defaultProfileImage.png")}
                                        style={styles.profileImg}
                                        placeholder={require("../../../tokenImage/defaultProfileImage.png")}
                                        resizeWidth={200}
                                    />
                                    <View>
                                        <Text style={styles.name}>{user.name}</Text>
                                        <Text style={styles.usercode}>@{user.usercode}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={Tokens.followbutton}
                                    activeOpacity={1}
                                    // 팔로우/팔로잉 변경 필요
                                    onPress={async () => {
                                        const result = await postApi.toggleFollowButton(user.usercode);
                                        setFollowState(prev => ({
                                            ...prev,
                                            [user.usercode]: result === 1
                                        }));
                                    }}
                                >
                                    {isFollowed ?
                                    <DynamicButton
                                        text={"팔로잉"}
                                        disabled={true}
                                        isPoint2={false}
                                    />
                                    :
                                    <DynamicButton
                                        text={"팔로우"}
                                        isPoint2={false}
                                    />
                                    }
                                </TouchableOpacity>
                            </View>
                        );
                    })}
            </GlobalScrollView>
        </View>
    );
};

export default SearchMain;

const styles = StyleSheet.create({
    stickyTabBarContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: ColorTokens.Background,
        paddingTop: Spacing[0],
    },
    tabBarContainer: {
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        width: SCREEN_WIDTH,
        height: 46,
        backgroundColor: ColorTokens.Background,
        borderBottomColor: ColorTokens.Stroke,
        borderBottomWidth: STROKE_WIDTH,
    },
    tabItem: {
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
        elevation: 1001,
    },
    tabText: {
        ...Typography.boldMedium,
    },
    selectedTabContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        height: 40,
        marginTop: Spacing[4],
    },
    selectedTabTouchable: {
        flexDirection: "row",
        alignItems: "center",
    },
    userInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginRight: 15,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    profileImg: {
        width: 43,
        height: 43,
        borderRadius: 50,
        marginRight: 10,
    },
    name: {
        color: ColorTokens.Typography,
        ...Typography.boldSmall,
    },
    usercode: {
        color: ColorTokens.Typography,
        ...Typography.paraSmall,
    },
});
