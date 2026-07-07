import React from "react";
import { View, Image, TouchableOpacity, Alert, StyleSheet } from "react-native";
import CachedImage from "./common/CachedImage";
import { MEDIA_RATIO } from "../design/token/constantsTokens";
import { ColorTokens } from "../design/token/ColorTokens";

const PostImage = ({ images, onImagePress }) => {
    if (!images || images.length === 0) return null;

    return (
        <View style={styles.imagesContainer}>
            {/* 1장 */}
            {images.length === 1 && (() => {
                const img = images[0];

                // static asset(require)인 경우와 일반 객체인 경우 모두 처리
                let width, height;

                if (typeof img === 'number') {
                    // static asset
                    const source = Image.resolveAssetSource(img);
                    if (source) {
                        width = source.width;
                        height = source.height;
                    }
                } else {
                    // object (uri, width, height)
                    width = img.width;
                    height = img.height;
                }

                let imageStyle = styles.bigImageStyle; // 기본값 (fallback)

                if (width && height) {
                    const ratio = width / height;
                    if (ratio >= MEDIA_RATIO.IMAGE.WIDE_THRESHOLD) {
                        // Wide
                        imageStyle = { width: "100%", aspectRatio: ratio, height: undefined };
                    } else if (ratio < MEDIA_RATIO.IMAGE.TALL_THRESHOLD) {
                        // Tall
                        // 너무 길쭉한 이미지는 3:4 비율(0.75)로 제한
                        const tallRatio = Math.max(ratio, MEDIA_RATIO.IMAGE.MIN_TALL_RATIO);
                        imageStyle = { width: "100%", aspectRatio: tallRatio, height: undefined };
                    } else {
                        // Square (0.9 ~ 1.1)
                        imageStyle = { width: "100%", aspectRatio: 1, height: undefined };
                    }
                }


                return (
                    <View style={{ width: "100%" }}>
                        <TouchableOpacity onPress={() => onImagePress(img)}>
                            <CachedImage source={img} style={imageStyle} resizeMode="cover" resizeWidth={800} />
                        </TouchableOpacity>
                    </View>
                );
            })()}

            {/* 2장 (가로 나란히) */}
            {images.length === 2 && (
                <>
                    <TouchableOpacity
                        onPress={() => onImagePress(images[0])}
                        style={styles.halfWidth}
                    >
                        <CachedImage source={images[0]} style={styles.middleImageStyle} resizeWidth={400} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onImagePress(images[1])}
                        style={styles.halfWidth}
                    >
                        <CachedImage source={images[1]} style={styles.middleImageStyle} resizeWidth={400} />
                    </TouchableOpacity>
                </>
            )}

            {/* 3장 (왼쪽 큰 이미지 + 오른쪽 2개) */}
            {images.length === 3 && (
                <>
                    <View style={styles.halfWidth}>
                        <TouchableOpacity onPress={() => onImagePress(images[0])}>
                            <CachedImage source={images[0]} style={styles.bigImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <TouchableOpacity onPress={() => onImagePress(images[1])}>
                            <CachedImage source={images[1]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onImagePress(images[2])}>
                            <CachedImage source={images[2]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* 4장 (2 x 2 형태) */}
            {images.length === 4 && (
                <>
                    <View style={styles.halfWidth}>
                        <TouchableOpacity onPress={() => onImagePress(images[0])}>
                            <CachedImage source={images[0]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onImagePress(images[1])}>
                            <CachedImage source={images[1]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <TouchableOpacity onPress={() => onImagePress(images[2])}>
                            <CachedImage source={images[2]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onImagePress(images[3])}>
                            <CachedImage source={images[3]} style={styles.middleImageStyle} resizeWidth={400} />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

export default PostImage;

const styles = StyleSheet.create({
    imagesContainer: {
        position: "relative",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: ColorTokens.Black,
        marginVertical: 10,
    },
    halfWidth: {
        width: "49.5%",
        gap: 4,
    },
    bigImageStyle: {
        width: "100%",
        height: 300,
    },
    middleImageStyle: {
        width: "100%",
        height: 148,
    },
});
