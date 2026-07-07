import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
// 아이콘이 있다면 import, 없다면 텍스트나 기본 도형으로 대체 (여기서는 텍스트로 가정하거나 이미지 사용)
// import { PlayIcon } from "../assets/icons"; 

import { Video, ResizeMode } from "expo-av";
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Asset } from 'expo-asset'; // require 대신 import 사용

import { MEDIA_RATIO } from "../design/token/constantsTokens";
import { Spacing } from "../design/Spacing";

// 시간 포맷팅 함수
const formatDuration = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const VideoThumbnail = ({ video, style, onPress, onLoad }) => {
    const [duration, setDuration] = React.useState(null);
    const [thumbnail, setThumbnail] = React.useState(null);

    React.useEffect(() => {
        const generateThumbnail = async () => {
            try {
                // video.source가 require()인 경우 처리가 필요할 수 있음. 
                // expo-video-thumbnails는 주로 URI를 기대함.
                // 로컬 asset의 경우 Asset.fromModule로 변환 필요
                const asset = Asset.fromModule(video.source);
                await asset.downloadAsync();

                // 1초(1000ms) 지점의 썸네일 추출
                const { uri, width, height } = await VideoThumbnails.getThumbnailAsync(
                    asset.localUri || asset.uri,
                    { time: 1000 }
                );
                setThumbnail(uri);
                if (onLoad && width && height) {
                    onLoad({ width, height });
                }
            } catch (e) {
                console.warn(e);
            }
        };

        generateThumbnail();
    }, [video.source]);

    return (
        <TouchableOpacity
            onPress={() => onPress && onPress(video)}
            activeOpacity={0.8}
            style={[style, styles.videoPlaceholder]}
        >
            {thumbnail ? (
                <Image
                    source={{ uri: thumbnail }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]} />
            )}

            {/* duration을 얻기 위해 숨겨진 Video 컴포넌트 사용 (Thumbnail API는 duration 반환 안함) */}
            <Video
                style={{ width: 0, height: 0 }}
                source={video.source}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted={true}
                onLoad={(status) => {
                    setDuration(formatDuration(status.durationMillis));
                }}
            />

            {/* 오버레이 아이콘 및 시간 */}
            <View style={StyleSheet.absoluteFill}>
                <Text style={{ color: 'white', position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -10 }}>▶</Text>
                {duration && <Text style={styles.durationText}>{duration}</Text>}
            </View>
        </TouchableOpacity>
    );
};

const PostVideo = ({ videos, onVideoPress }) => {
    // 단일 비디오의 경우, 로드된 메타데이터를 기반으로 스타일을 결정하기 위해 상태 사용
    const [videoRatio, setVideoRatio] = React.useState(null);

    if (!videos || videos.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* 1개 영상 처리 */}
            {videos.length === 1 && (() => {
                const video = videos[0];

                // 1. width/height가 있으면 우선 사용 (하위 호환)
                // 2. 없으면 videoRatio 상태 사용
                let ratio = videoRatio;

                if (video.width && video.height) {
                    ratio = video.width / video.height;
                }

                let videoStyle = styles.bigVideoStyle;

                if (ratio) {
                    if (ratio >= MEDIA_RATIO.VIDEO.WIDE_THRESHOLD) {
                        // Wide
                        videoStyle = { width: "100%", aspectRatio: ratio, height: undefined };
                    } else if (ratio < MEDIA_RATIO.VIDEO.TALL_THRESHOLD) {
                        // Tall
                        const tallRatio = Math.max(ratio, 0.75); // 비디오도 일단 3:4 제한 유지
                        videoStyle = { width: "100%", aspectRatio: tallRatio, height: undefined };
                    } else {
                        // Square
                        videoStyle = { width: "100%", aspectRatio: 1, height: undefined };
                    }
                } else {
                    // 비율을 아직 모를 때는 기본값 (Skeleton 또는 기본 정사각형)
                    videoStyle = { width: "100%", aspectRatio: 1, height: undefined };
                }

                return (
                    <View style={{ width: "100%" }}>
                        <VideoThumbnail
                            video={video}
                            style={videoStyle}
                            onPress={onVideoPress}
                            onLoad={(naturalSize) => {
                                if (naturalSize.width && naturalSize.height) {
                                    setVideoRatio(naturalSize.width / naturalSize.height);
                                }
                            }}
                        />
                    </View>
                );
            })()}
        </View>
    );
};

export default PostVideo;

const styles = StyleSheet.create({
    container: {
        position: "relative",
        marginTop: Spacing[3],
        marginHorizontal: Spacing[2],
    },
    bigVideoStyle: {
        width: "100%",
        aspectRatio: 1, // 높이 300 대신 기본 1:1 비율로 시작 (사진과 동일)
        backgroundColor: ColorTokens.Unselected,
        borderRadius: 3,
    },
    videoPlaceholder: {
        backgroundColor: ColorTokens.Unselected,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 3,
        overflow: 'hidden', // 내부 이미지가 삐져나오지 않도록 추가
    },
    durationText: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 4,
        borderRadius: 2,
    }
});
