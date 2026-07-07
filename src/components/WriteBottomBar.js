import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { Spacing } from "../design/Spacing";
import { Typography } from "../design/Typography";

const WriteBottomBar = ({
    handleAddPhoto,
    handleToggleVote,
    blockImageSave,
    setBlockImageSave,
    currentTextLength,
    textCountColor,
    relayPostButtonState,
    handleRelayPress,
    isImageFull,
    isVoteActive,
    isImageExisting,
    isPostbottom = false,
    isPhotoLimitReached = false,
    isVoteLimitReached = false,
}) => {
    const photoDisabled = isImageFull || isPhotoLimitReached;
    // 글 존재 여부에 따라 버튼 눌림 여부 결정
    // relayPostButtonState가 true일 때만 TouchableOpacity로 동작
    const UploadButtonWrapper = relayPostButtonState ? TouchableOpacity : View;

    return (
        <View style={!isPostbottom
            ? { marginBottom: 8 } // Write.js 전용 (SafeAreaView가 하단 인셋 처리 → 추가 마진 불필요)
            :
            {}}>
            {/* 바텀 탭 */}
            <View style={styles.bottomTapContainer}>
                <View style={styles.bottomTap}>
                    {/* 사진 아이콘, 투표 아이콘 */}
                    <View style={styles.bottomTapDetailContainer}>
                        <TouchableOpacity onPress={handleAddPhoto} activeOpacity={0.2}>
                            <Image
                                source={
                                    photoDisabled
                                        ? require("../../tokenImage/imageImport.png")
                                        : require("../../tokenImage/activeImageImport.png")
                                }
                                style={[styles.imageIcon, {
                                    marginLeft: isPostbottom ?
                                    0
                                    :
                                    Spacing[5],  // Write.js 전용
                                    opacity: photoDisabled ? 0.4 : 1,
                                }]}
                            />
                        </TouchableOpacity>

                        {/* 투표 아이콘 */}
                        <TouchableOpacity onPress={handleToggleVote} activeOpacity={0.2}>
                            <Image
                                source={
                                    isVoteActive
                                        ? require("../../tokenImage/vote.png")
                                        : require("../../tokenImage/activeVote.png")
                                }
                                style={[styles.voteIcon, {
                                    marginLeft: isPostbottom ?
                                    Spacing[5]
                                    :
                                    Spacing[6], // Write.js 전용
                                    opacity: isVoteLimitReached ? 0.4 : 1,
                                }]}
                            />
                        </TouchableOpacity>

                        {/* 사진 블락 버튼 */}
                        {isImageExisting && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <TouchableOpacity onPress={() => setBlockImageSave((p) => !p)}>
                                    <Image
                                        source={
                                            blockImageSave
                                                ? require("../../assets/button/check_image_activated.png")
                                                : require("../../assets/button/check_image.png")
                                        }
                                        style={styles.imageBlockIcon}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                                <Text style={styles.imageBlockText}>사진 저장 블락하기</Text>
                            </View>
                        )}
                    </View>

                    {/* 글자 수 표시 추가 부분 */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: Spacing[6],
                        }}
                    >
                        <Text
                            style={{
                                ...Typography.boldMedium,

                                color: textCountColor, // 300 넘으면 Warning 색
                            }}
                        >
                            {currentTextLength}
                        </Text>

                        {isPostbottom ? (
                            <TouchableOpacity
                                onPress={handleRelayPress}
                                disabled={!relayPostButtonState}
                            >
                                <Image
                                    style={styles.commentUpload}
                                    resizeMode="contain"
                                    source={
                                        relayPostButtonState
                                            ? require("../../tokenImage/uploadButton.png")
                                            : require("../../tokenImage/uploadButtonDisabled.png")
                                    }
                                />
                            </TouchableOpacity>
                        ) : (
                            /* 이어서 게시하기 */
                            <UploadButtonWrapper
                                {...(relayPostButtonState && {
                                    onPress: handleRelayPress,
                                })}
                            >
                                <Image
                                    style={styles.relayUpload}
                                    source={
                                        relayPostButtonState
                                            ? require("../../tokenImage/activePlusButton.png")
                                            : require("../../tokenImage/plusButton.png")
                                    }
                                />
                            </UploadButtonWrapper>
                        )}

                    </View>
                </View>
            </View>
        </View>
    );
};

export default WriteBottomBar;

const styles = StyleSheet.create({
    bottomTapContainer: {
        backgroundColor: ColorTokens.Black,
    },
    bottomTap: {
        justifyContent: "space-between",
        alignItems: "center", // 가로 중앙에 정렬
        paddingHorizontal: Spacing[2],
        marginBottom: Spacing[0],
        flexDirection: "row",
    },
    bottomTapDetailContainer: {
        flexDirection: "row",
        alignItems: "center", // 가로 중앙에 정렬
    },
    imageIcon: {
        width: 22,
        height: 22,
    },
    voteIcon: {

        width: 22,
        height: 28,
    },
    imageBlockIcon: {
        marginLeft: Spacing[5],
        // PNG에 투명 여백(4/5)을 추가해 보이는 크기 24pt 유지를 위해 박스는 30
        width: 30,
        height: 30,
    },
    imageBlockText: {
        marginLeft: Spacing[2],
        ...Typography.boldSmall,
        fontFamily: "NeoDunggeunmoPro",
        color: ColorTokens.Typography,
    },
    relayUpload: {
        width: 24,
        height: 24,
    },
    // 댓글 전송 버튼(가로형 업로드 버튼) - uploadButton@2x(132x64) 비율 유지
    commentUpload: {
        width: 62,
        height: 30,
    },
});
