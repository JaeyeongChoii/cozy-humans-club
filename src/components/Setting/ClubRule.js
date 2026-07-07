import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import { heightScale, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../utils/scale";
import { Spacing } from "../../design/Spacing";
import { Typography } from "../../design/Typography";
import HighlightText from "../HighlightText";
import { ONBOARDING_CLUBRULE_HEIGHT, SETTING_CLUBRULE_HEIGHT } from "../../design/token/constantsTokens";

// 데이터 정의
const ruleTitles = [
    {
        id: 1,
        text: "코지 휴먼즈 클럽만의 가치"
    },
    {
        id: 2,
        text: "멤버라면 지켜야 할 규칙"
    },
]

const rulesData = [
    {
        id: 1,
        title: "클럽 안에서는 모두가 친구",
        text: "공간 안에 있는 인간들은 모두 동등한 멤버로서 존재합니다. 멤버 서로는 바쁜 현생에서 잠시 벗어나 서로의 이야기를 들어주는 친구같은 존재가 되어줍니다.",
        highlightMap: {
            "멤버": {
                color: ColorTokens.Point,
            },
            "친구": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 2,
        title: "멤버라면 모두가 동등하게 안전한 공간",
        text: "멤버 개인의 다양성과 소수자성이 억압받지 않으며, 무분별한 비하나 비방, 욕설의 대상이 되지 않습니다. 가령 성별, 성적 지향, 인종, 장애 등 개인의 정체성을 이유로 모욕적인 언사를 하는 멤버는 즉시 제재됩니다..",
        highlightMap: {
            "다양성과 소수자성": {
                color: ColorTokens.Point,
            },
            "무분별한 비하나 비방, 욕설": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 3,
        title: "다른 멤버와의 갈등 상황에서 지켜야 할 규칙",
        text: "코지 휴먼즈 클럽은 누가 맞고 틀리냐를 가리는 논쟁을 하는 공간이 아닙니다. 바쁜 일상에서 잠시 벗어나 개인적인 이야기를 털어놓는 곳인 만큼, 다른 멤버를 향한 공개적인 비난이나 저격은 허용되지 않습니다.",
        highlightMap: {
            "논쟁을 하는 공간": {
                color: ColorTokens.Point,
            },
            "공개적인 비난이나 저격": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 4,
        title: " ",
        text: "특정 멤버의 게시물이 불편하다면 뮤트하기 또는 차단하기 기능을 이용해 주세요. 차단 시 해당 멤버와 서로의 게시물 및 프로필이 노출되지 않습니다.",
        highlightMap: {
            "뮤트하기": {
                color: ColorTokens.Point,
            },
            "차단하기": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 5,
        title: " ",
        text: "다른 멤버의 게시물이 공동의 피해를 줄 수 있거나 규칙을 위반한다고 판단될 경우, 언쟁에 참여하지 말고 바로 제보해 주세요. 해당 제보를 토대로 운영진이 검토 후 필요한 조치를 빠르게 진행할 것입니다.",
        highlightMap: {
            "언쟁에 참여하지 말고": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 6,
        title: " ",
        text: "다음 행위는 금지됩니다.\n특정 멤버를 공개적으로 조롱하거나 비난하는 행위\n특정 멤버의 게시물을 인용해 반박하거나 공개적으로 망신을 주는 행위\n다른 멤버들의 동조를 유도하는 행위\n특정 멤버를 집단적으로 배제하거나 압박하는 행위\n댓글 및 인용을 통해 감정적인 언쟁을 이어가는 행위",
        highlightMap: {
            "금지": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 7,
        title: "멤버의 안전을 위협하는 행위는 제재",
        text: "가치관이나 이념을 타인에게 강요하는 행위, 다른 멤버에게 해를 가하려는 행위, 불법적인 활동은 허용되지 않습니다. 공간 내 불법적인 활동 또는 게시물이 확인될 경우 관계 법령에 따라 수사기관에 신고하거나 협조합니다.",
        highlightMap: {
            "강요": {
                color: ColorTokens.Point,
            },
            "해를 가하려는": {
                color: ColorTokens.Point,
            },
            "불법적인 ": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 8,
        title: " ",
        text: "반복적으로 갈등을 유발하는 행위\n다른 멤버들이 위축감을 느낄 수 있는 행위\n특정 가치관이나 이념을 강요하는 행위\n다른 멤버에게 해를 가하거나 위협하는 행위\n불법적인 활동 또는 게시물 게시",
        highlightMap: {
            "제보하기": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 9,
        title: "상업적 홍보 및 자동화 계정은 금지",
        text: "상업적 목적의 홍보 활동을 상습적으로 하는 계정은 제재됩니다. (멤버 개인적인 자랑은 가능) 또한 AI를 이용한 자동화 계정은 영구 제재됩니다.",
        highlightMap: {
            "상업적 목적": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 10,
        title: "명시된 규칙 외에도 운영진은 상황을 판단해 조치할 수 있습니다",
        text: "공간의 안정성을 해친다고 판단하는 경우 운영진이 즉시 게시물 삭제, 반려 또는 기타 조치가 이루어질 수 있습니다.",
        highlightMap: {
            "공간의 안정성": {
                color: ColorTokens.Point,
            },
            "삭제, 반려": {
                color: ColorTokens.Point,
            },
        },
    },
    {
        id: 11,
        title: " ",
        text: "다음과 같은 경우가 이에 해당합니다.\n공간 전체의 분위기를 해치는 게시물\n다른 멤버들이 불쾌감을 느낄 수 있는 게시물\n반복적으로 갈등을 유발하는 게시물",
        highlightMap: {
            "제보하기": {
                color: ColorTokens.Point,
            },
        },
    },
];

const ClubRule = ({ children, style, isOnboarding = false, onScroll }) => {
    const renderRuleTitle = (ruleTitle) => {
        if (!ruleTitle) {
            return null;
        }

        return (
            <Text
                style={{
                    color: ColorTokens.Point2,
                    ...Typography.headingLarge,
                    marginTop: ruleTitle.id === 2 ? Spacing[14] : 0,
                }}
            >
                {ruleTitle.text}
            </Text>
        );
    };

    const getRuleTitleBeforeNotice = (noticeId) => {
        if (noticeId === 1) {
            return ruleTitles.find((ruleTitle) => ruleTitle.id === 1);
        }

        if (noticeId === 3) {
            return ruleTitles.find((ruleTitle) => ruleTitle.id === 2);
        }

        return null;
    };

    const renderNoticeContent = (notice) => {
        const { text } = notice;
        const shouldRenderBullets = [6, 8, 11].includes(notice.id);

        if (shouldRenderBullets) {
            const lines = text.split("\n").filter((line) => line.trim().length > 0);
            const hasIntroLine = [6, 11].includes(notice.id);
            const introLine = hasIntroLine ? lines[0] : null;
            const bulletLines = hasIntroLine ? lines.slice(1) : lines;

            return (
                <View>
                    {introLine ? (
                        <HighlightText
                            style={{
                                color: ColorTokens.Typography,
                                ...Typography.paraMedium,
                                marginBottom: Spacing[1],
                            }}
                            message={introLine}
                            highlightMap={notice.highlightMap}
                        />
                    ) : null}
                    {bulletLines.map((line, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                width: SCREEN_WIDTH - Spacing[5] * 2,
                                alignItems: "flex-start",
                            }}
                        >
                            <Text
                                style={{
                                    color: ColorTokens.Typography,
                                    ...Typography.paraMedium,
                                    marginRight: Spacing[1],
                                }}
                            >
                                •
                            </Text>
                            <HighlightText
                                style={{
                                    color: ColorTokens.Typography,
                                    ...Typography.paraMedium,
                                    flex: 1,
                                }}
                                message={line}
                                highlightMap={notice.highlightMap}
                            />
                        </View>
                    ))}
                </View>
            );
        }

        if (text.includes("\n")) {
            return (
                <View>
                    {text.split("\n").map((line, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                width: SCREEN_WIDTH - Spacing[5] * 2,
                            }}
                        >
                            <HighlightText
                                style={{
                                    color: ColorTokens.Typography,
                                    ...Typography.paraMedium,
                                    flex: 1,
                                }}
                                message={line}
                                highlightMap={notice.highlightMap}
                            />
                        </View>
                    ))}
                </View>
            );
        }
        return (
            <HighlightText
                style={{
                    color: ColorTokens.Typography,
                    ...Typography.paraMedium,
                }}
                message={text}
                highlightMap={notice.highlightMap}
            />
        );
    };

    return (
        <View
            style={{
                maxWidth: SCREEN_WIDTH,
                height: isOnboarding ?
                    ONBOARDING_CLUBRULE_HEIGHT
                    :
                    SETTING_CLUBRULE_HEIGHT,
                marginHorizontal: Spacing[5],
                marginTop: heightScale(200),
                ...style, // 외부 스타일 병합
            }}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingLeft: 0,
                    alignItems: "flex-start",
                }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                nestedScrollEnabled={true}
            >
                <Text
                    style={{
                        width: "100%",
                        color: ColorTokens.Typography,
                        ...Typography.headingXLarge,
                        textAlign: "center",
                        marginBottom: Spacing[14],
                    }}
                >
                    클럽 규칙
                </Text>
                {rulesData.map((notice) => (
                    <React.Fragment key={notice.id}>
                        {renderRuleTitle(getRuleTitleBeforeNotice(notice.id))}
                        <View style={{ marginBottom: 0, }}>
                            {notice.title ? (
                                <Text
                                    style={{
                                        color: ColorTokens.Point,
                                        ...Typography.headingMedium,
                                        marginTop: notice.title === " " ? Spacing[0] : Spacing[11],   // 단락별 거리
                                        marginBottom: Spacing[6], // 제목과 그 내용의 사이
                                    }}
                                >
                                    {notice.title}
                                </Text>
                            ) : null}
                            {renderNoticeContent(notice)}
                        </View>
                    </React.Fragment>
                ))}
                {/* 외부에서 전달받은 하단 콘텐츠 (예: 확인 버튼) 렌더링 */}
                {children}
            </ScrollView>
        </View>
    );
};

export default ClubRule;
