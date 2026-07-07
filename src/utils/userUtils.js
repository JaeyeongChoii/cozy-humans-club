/**
 * 사용자 정보 및 게시물 소유권 관련 유틸리티
 */

import { THEME } from "../design/token/constantsTokens";

const getReportPostType = (postType) => {
    if ([THEME.JAM, "Jam-Talk", "talk", 0, "0"].includes(postType)) return "talk";
    if ([THEME.JIN, "Jin-Talk", "think", 1, "1"].includes(postType)) return "think";
    return null;
};

export const checkIsMyPost = (postUserCode, currentUserCode) => {
    if (!postUserCode || !currentUserCode) return false;

    const normalize = (code) => String(code).replace(/^@/, "").trim().toLowerCase();

    return normalize(postUserCode) === normalize(currentUserCode);
};

export const generateMoreMenuProps = ({
    data,
    currentUserCode,
    menuId,
    targetName,
    isMuted = false,
    isBlocked = false,
    onBlock,
    onMute,
    onCopy,
    onDelete,
    onReport,
    navigation,
    dismissOnScroll = false, // true면 미트볼 메뉴를 스크롤로 닫히는 루트 오버레이로 띄움
}) => {
    const isMyPost = checkIsMyPost(data?.usercode, currentUserCode);
    const targetId = targetName || data?.name || "unknown";
    const reportPostType = getReportPostType(data?.postType);
    const isComment = data?.postType === THEME.COMMENT || data?.is_comment;

    const options = [];

    if (isMyPost) {
        options.push({ label: "복사하기", onPress: onCopy });
        options.push({ label: "반응 뮤트하기", onPress: onMute });
        options.push({ label: "삭제하기", onPress: onDelete });
    } else {
        if (isBlocked) {
            options.push({ label: "차단해제하기", onPress: onBlock });
        } else if (isMuted) {
            options.push({ label: "뮤트해제하기", onPress: onMute });
        } else {
            options.push({ label: "뮤트하기", onPress: onMute });
            options.push({ label: "차단하기", onPress: onBlock });
        }

        // 댓글 신고는 API 연동 범위가 정해질 때 추가한다.
        if (!isComment) {
            options.push({
                label: "제보하기",
                onPress: () => {
                    const postId = Number(data?.id);
                    const isPostReport = reportPostType && Number.isInteger(postId);

                    navigation?.navigate("SettingFrame", {
                        screenName: "HelpSetting",
                        category: "report",
                        ...(isPostReport
                            ? {
                                reportSource: "post",
                                postId,
                                postType: reportPostType,
                            }
                            : { targetId }),
                    });
                    onReport?.();
                },
            });
        }
    }

    return {
        menuId,
        options,
        dismissOnScroll,
    };
};
