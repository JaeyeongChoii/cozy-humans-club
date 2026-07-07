import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import CachedImage from "./common/CachedImage";
import { ColorTokens } from "../design/token/ColorTokens";
import { Video, ResizeMode } from "expo-av";
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Asset } from "expo-asset";
import PostVideo from "./PostVideo";
import { MEDIA_RATIO } from "../design/token/constantsTokens";
import { getMediaType } from "../utils/mediaUtils";
import { Spacing } from "../design/Spacing";

// 시간 포맷팅 함수
const formatDuration = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// 개별 미디어 항목을 렌더링하는 헬퍼 함수
const MediaItem = React.memo(({ item, style, onPress }) => {
    if (item.type === 'video') {
        const [duration, setDuration] = React.useState(null);
        const [thumbnail, setThumbnail] = React.useState(null);

        React.useEffect(() => {
            const generateThumbnail = async () => {
                try {
                    const asset = Asset.fromModule(item.source);
                    await asset.downloadAsync();

                    const { uri } = await VideoThumbnails.getThumbnailAsync(
                        asset.localUri || asset.uri,
                        { time: 1000 }
                    );
                    setThumbnail(uri);
                } catch (e) {
                    console.warn("Thumbnail generation failed", e);
                }
            };

            generateThumbnail();
        }, [item.source]);

        // 비디오 미리보기 렌더링
        return (
            <TouchableOpacity
                style={[style, { overflow: 'hidden', backgroundColor: 'black' }]}
                onPress={() => onPress(item)}
                activeOpacity={0.8}
            >
                {thumbnail ? (
                    <CachedImage
                        source={{ uri: thumbnail }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        resizeWidth={400}
                    />
                ) : (
                    <View style={[{ width: '100%', height: '100%', backgroundColor: 'black' }]} />
                )}

                <Video
                    style={{ width: 0, height: 0 }}
                    source={item.source}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted={true}
                    onLoad={(status) => setDuration(formatDuration(status.durationMillis))}
                />
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: 'white' }}>▶</Text>
                    {duration && <Text style={styles.durationText}>{duration}</Text>}
                </View>
            </TouchableOpacity>
        );
    } else {
        // 이미지 렌더링
        // item.source는 이미지 소스입니다 (require 또는 uri)
        return (
            <TouchableOpacity
                style={style}
                onPress={() => onPress(item)}
                activeOpacity={0.8}
            >
                <CachedImage source={item.source} style={[{ width: '100%', height: '100%' }]} resizeMode="cover" resizeWidth={400} />
            </TouchableOpacity>
        );
    }
});

const PostMedia = ({ media, onMediaPress }) => {
    // media가 변경될 때만 items를 다시 계산
    const items = React.useMemo(() => {
        if (!media || media.length === 0) return [];

        return media.map(item => {
            let source;
            let type;

            if (item.source) {
                source = item.source;
                type = item.type;
            } else {
                source = item;
            }

            if (!type) {
                type = getMediaType(source);
            }

            return { type, source };
        });
    }, [media]);

    if (!items || items.length === 0) return null;

    const count = items.length;

    // 1개일 때
    if (count === 1) {
        const item = items[0];

        if (item.type === 'video') {
            return <PostVideo videos={[item]} onVideoPress={onMediaPress} />;
        } else {
            return (
                <View style={styles.outerContainer}>
                    <View style={styles.gridContainer}>
                        <TouchableOpacity onPress={() => onMediaPress(item)} activeOpacity={0.8} style={{ width: "100%", height: "100%" }}>
                            <CachedImage source={item.source} style={styles.fullImageStyle} resizeMode="cover" resizeWidth={800} />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    }

    // 2개 항목
    if (count === 2) {
        return (
            <View style={styles.outerContainer}>
                <View style={styles.gridContainer}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", height: "100%" }}>
                        <MediaItem item={items[0]} style={styles.gridHalfWide} onPress={onMediaPress} />
                        <MediaItem item={items[1]} style={styles.gridHalfWide} onPress={onMediaPress} />
                    </View>
                </View>
            </View>
        );
    }

    // 3개 항목
    if (count === 3) {
        return (
            <View style={styles.outerContainer}>
                <View style={styles.gridContainer}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", height: "100%" }}>
                        <MediaItem item={items[0]} style={styles.gridHalfWide} onPress={onMediaPress} />
                        <View style={{ width: "49.5%", height: "100%", justifyContent: "space-between" }}>
                            <MediaItem item={items[1]} style={styles.gridHalfTall} onPress={onMediaPress} />
                            <MediaItem item={items[2]} style={styles.gridHalfTall} onPress={onMediaPress} />
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // 4개 항목
    if (count === 4) {
        return (
            <View style={styles.outerContainer}>
                <View style={styles.gridContainer}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", height: "49.5%" }}>
                        <MediaItem item={items[0]} style={styles.gridQuarter} onPress={onMediaPress} />
                        <MediaItem item={items[1]} style={styles.gridQuarter} onPress={onMediaPress} />
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", height: "49.5%" }}>
                        <MediaItem item={items[2]} style={styles.gridQuarter} onPress={onMediaPress} />
                        <MediaItem item={items[3]} style={styles.gridQuarter} onPress={onMediaPress} />
                    </View>
                </View>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    outerContainer: {
        marginTop: Spacing[3],
        paddingHorizontal: Spacing[2],
        width: "100%", // 화면 꽉 채우되 padding으로 양쪽 대칭 여백 생성
    },
    gridContainer: {
        width: "100%", // outerContainer의 패딩 안쪽 공간을 100% 채움
        aspectRatio: 4 / 3, // 전체 바운딩 박스를 가로 4 : 세로 3 로 고정
        overflow: "hidden", // borderRadius와 함께 외곽 모서리만 클리핑
        justifyContent: "space-between", // 4장일 때 위아래 요소 사이에 빈 공간(여백) 분배
        borderRadius: 3,
    },
    fullImageStyle: {
        width: "100%",
        height: "100%",
        borderRadius: 3,
    },
    gridHalfWide: {
        width: "49.5%",
        height: "100%",
    },
    gridHalfTall: {
        width: "100%",
        height: "49.5%",
    },
    gridQuarter: {
        width: "49.5%",
        height: "100%",
    },
    durationText: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
        backgroundColor: ColorTokens.ModalBackground,
        paddingHorizontal: 4,
        borderRadius: 2,
    }
});

// 가능한 한 PostImage.js와 정확히 일치하도록 스타일 재정의

export default PostMedia;
