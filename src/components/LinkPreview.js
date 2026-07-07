import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from "react-native";
import CachedImage from "./common/CachedImage";
import { ColorTokens } from "../design/token/ColorTokens";
import { STROKE_WIDTH } from "../design/token/constantsTokens";
import { widthScale, heightScale } from "../utils/scale";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";

const LinkPreview = ({ url }) => {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageWidth, setImageWidth] = useState(widthScale(90)); // 기본 너비

    useEffect(() => {
        if (!url) return;

        const fetchMetadata = async () => {
            setLoading(true);
            try {
                // 유튜브 링크 처리
                if (url.includes("youtube.com") || url.includes("youtu.be")) {
                    const videoId = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
                    if (videoId) {
                        // 고화질 썸네일 시도 (레터박스 없는 버전)
                        const imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                        const ytResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
                        const ytData = await ytResponse.json();

                        setMetadata({
                            title: ytData?.title || url,
                            image: imageUrl, // 고화질 이미지 우선 사용
                            url: url
                        });
                        setLoading(false);
                        return;
                    }
                }

                // 일반 링크 및 네이버 블로그 통합 처리 (Direct Scraping)
                let fetchUrl = url;
                // 네이버 블로그 모바일 주소 변환 (파싱 용이성)
                if (url.includes("blog.naver.com")) {
                    fetchUrl = url.replace("://blog.naver", "://m.blog.naver");
                }

                const response = await fetch(fetchUrl);
                const html = await response.text();

                // 1. 타이틀 추출 (og:title -> title 태그)
                let extractedTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                    html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                    html.match(/<title>([^<]+)<\/title>/i)?.[1];

                // 2. 이미지 추출 우선순위
                let extractedImage = null;

                // (1) 네이버 블로그 본문 이미지 (postfiles.pstatic.net) - High Quality
                const contentImageMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']*postfiles\.pstatic\.net[^"']*)["']/i);
                if (contentImageMatch && contentImageMatch[1]) {
                    extractedImage = contentImageMatch[1];
                }

                // (2) og:image - Metadata
                if (!extractedImage) {
                    extractedImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
                }

                // (3) 본문 첫 번째 이미지 - Fallback
                if (!extractedImage) {
                    const firstImgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
                    if (firstImgMatch && firstImgMatch[1]) {
                        extractedImage = firstImgMatch[1];
                    }
                }

                // 상대 경로 처리 (extractedImage가 '/'로 시작하는 경우)
                if (extractedImage && extractedImage.startsWith("/")) {
                    const urlObj = new URL(fetchUrl);
                    extractedImage = `${urlObj.protocol}//${urlObj.host}${extractedImage}`;
                }

                // 타이틀 정제 및 메타데이터 설정
                if (extractedTitle) {
                    const cleanTitle = extractedTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

                    setMetadata({
                        title: cleanTitle.trim(),
                        image: extractedImage,
                        url: url
                    });
                } else {
                    setMetadata({
                        title: url,
                        url: url
                    });
                }
            } catch (error) {
                console.error("Link Preview fetch error:", error);
                // 에러 시 최소한 URL이라도 노출
                setMetadata({
                    title: url,
                    url: url
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url]);

    // 이미지 크기 계산 로직 제거 (고정 너비 사용을 위해)


    if (!url) return null;

    const handlePress = () => {
        Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator color={ColorTokens.Point} />
                <Text style={styles.loadingText}>정보를 가져오는 중...</Text>
            </View>
        );
    }

    if (!metadata) return null;

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.container}
            activeOpacity={0.7}
        >
            {metadata.image ? (
                <CachedImage
                    source={{ uri: metadata.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.image, { backgroundColor: ColorTokens.InnerBox2 }]} />
            )}
            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {metadata.title || "미리보기를 불러올 수 없습니다"}
                </Text>
                <Text style={styles.url} numberOfLines={1}>
                    {url}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default LinkPreview;

const styles = StyleSheet.create({
    container: {
        backgroundColor: ColorTokens.InnerBox,
        borderRadius: 8,
        borderWidth: STROKE_WIDTH,
        borderColor: ColorTokens.Stroke,
        marginTop: Spacing[5],
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "stretch", // center -> stretch로 변경하여 높이 가득 채움
        width: "100%",
    },
    loadingContainer: {
        padding: 20,
        justifyContent: "center",
        alignItems: "center", // 로딩 시에는 중앙 정렬
    },
    loadingText: {
        ...Typography.paraMedium,
        color: ColorTokens.Unselected,
        marginLeft: 10,
    },
    image: {
        width: widthScale(90),
        height: "100%",
        minHeight: heightScale(82),
        backgroundColor: "transparent",
    },
    textContainer: {
        flex: 1,
        padding: Spacing[2],
        justifyContent: "center",
    },
    title: {
        ...Typography.boldMedium,
        color: ColorTokens.Typography,
        marginBottom: Spacing[2],
    },
    url: {
        ...Typography.paraSmall,
        color: ColorTokens.Unselected,
    },
});
