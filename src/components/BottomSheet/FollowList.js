import React, { useContext, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import GlobalScrollView from "../GlobalScrollView";
import { ColorTokens } from "../../design/token/ColorTokens";
import PostUserInfo from "../PostUserInfo";
import { BottomSheetContext } from "../BottomSheetFrame/BottomSheetContext";
import { BOTTOM_SHEET_START, BOTTOM_SHEET_SUBTITLE_HEIGHT, STROKE_WIDTH } from "../../design/token/constantsTokens";
import { postApi } from "../../api/postApi";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import DynamicButton from "../DynamicButton";
import { BASE_URL } from "../../constants/BaseURL";
import { SCREEN_HEIGHT } from "../../utils/scale";

const defaultProfileImage = require("../../../tokenImage/defaultProfileImage.png");

const getProfileImageSource = (image) => {
    if (typeof image === "number" || (typeof image === "object" && image?.uri)) {
        return image;
    }

    if (typeof image === "string" && image.trim() !== "") {
        return { uri: `${BASE_URL}/files/profile/${image.trim()}` };
    }

    return defaultProfileImage;
};

const normalizeFollowState = (value) => value === true || value === 1;

const FollowListItem = ({ data, onClose, initialIsFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(normalizeFollowState(initialIsFollowing));

    useEffect(() => {
        setIsFollowing(normalizeFollowState(initialIsFollowing));
    }, [initialIsFollowing]);

    const handleToggleFollow = async () => {
        try {
            const toggleResult = await postApi.toggleFollowButton(data.user_id);
            setIsFollowing(normalizeFollowState(toggleResult));
        } catch (error) {
            console.error("[FollowList] follow toggle failed:", error);
        }
    };

    return (
        <View style={styles.listGap}>
            <View style={styles.listDetailContainer}>
                <PostUserInfo
                    name={data.nickname}
                    profileImage={getProfileImageSource(data.image)}
                    userCode={data.user_id}
                    timeStamp={""}
                    onClose={onClose}
                    style={styles.userInfo}
                />

                {/* 팔로우/팔로잉 버튼 */}
                <TouchableOpacity
                    style={styles.followButtonTouchable}
                    onPress={handleToggleFollow}
                    activeOpacity={1}
                >
                    <DynamicButton
                        text={isFollowing ? "팔로잉" : "팔로우"}
                        disabled={isFollowing}
                        isPoint2={false}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const FollowList = ({ onClose, userIdText }) => {
    const sheetContext = useContext(BottomSheetContext);
    const [activeTab, setActiveTab] = useState("following");
    const [followingList, setFollowingList] = useState([]);
    const [followerList, setFollowerList] = useState([]);

    useEffect(() => {
        if (!userIdText) return;

        const fetchFollowing = async () => {
            const data = await postApi.fetchFollowList(userIdText);
            if (data) {
                setFollowingList(data);
            }
        };

        const fetchFollower = async () => {
            const data = await postApi.fetchFollowerList(userIdText);
            if (data) {
                setFollowerList(data);
            }
        };

        fetchFollowing();
        fetchFollower();
    }, [userIdText]);

    const list = activeTab === "following" ? followingList : followerList;
    const emptyText = activeTab === "following"
        ? "아직 팔로잉 된 사람이 없어"
        : "아직 팔로우된 사람이 없어";

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab("following")}
                >
                    <Text style={[styles.tabText, activeTab === "following" && styles.activeTabText]}>
                        팔로잉
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab("follower")}
                >
                    <Text style={[styles.tabText, activeTab === "follower" && styles.activeTabText]}>
                        팔로워
                    </Text>
                </TouchableOpacity>
            </View>

            <GlobalScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContentContainer,
                    list.length === 0 && styles.emptyListContentContainer,
                ]}
                onScroll={sheetContext?.handleScroll}
                scrollEventThrottle={16}
            >
                {list.length === 0 ? (
                    <View style={[styles.emptyContainer, { top: SCREEN_HEIGHT / 2 - BOTTOM_SHEET_SUBTITLE_HEIGHT - BOTTOM_SHEET_START }]}>
                        <Text style={styles.emptyText}>
                            {emptyText}
                        </Text>
                    </View>
                ) : (
                    list.map((data, idx) => (
                        <FollowListItem
                            key={`${activeTab}-${data.user_id || idx}`}
                            data={data}
                            onClose={onClose}
                            initialIsFollowing={activeTab === "following" ? true : data.is_follow}
                        />
                    ))
                )}
            </GlobalScrollView>
        </View>
    );
};

export default FollowList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: "row",
        height: BOTTOM_SHEET_SUBTITLE_HEIGHT,
    },
    tabButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    tabText: {
        color: ColorTokens.Unselected,
        ...Typography.boldMedium,
    },
    activeTabText: {
        color: ColorTokens.Point,
    },
    listArea: {
        flex: 1,
    },
    listContentContainer: {
        paddingBottom: 70,
    },
    emptyListContentContainer: {
        alignItems: "center",
    },
    emptyContainer: {
        justifyContent: "center",
    },
    emptyText: {
        color: ColorTokens.Unselected,
        ...Typography.boldMedium,
    },
    listGap: {
        borderTopWidth: STROKE_WIDTH,
        borderBottomWidth: STROKE_WIDTH,
        borderColor: ColorTokens.Stroke,
        height: 67,
    },
    listDetailContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 2,
        paddingHorizontal: Spacing[2],
    },
    userInfo: {
        flex: 1,
        width: 0,
        marginRight: Spacing[2],
    },
    followButtonTouchable: {
        flexShrink: 0,
        alignSelf: "flex-start",
        marginTop: Spacing[3] + 5,
    },
});
