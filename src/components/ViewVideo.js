import React from "react";
import {
    StyleSheet,
    View,
    Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Asset } from "expo-asset";
import * as MediaLibrary from "expo-media-library";

import ViewMediaFrame from "./ViewMediaFrame";

const ViewVideo = ({ visible, onClose, videoSource }) => {
    // console.log("[ViewVideo][props]", {
    //     visible,
    //     videoSource,
    //     sourceType: typeof videoSource,
    // });

    const handleSaveVideo = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("권한 필요", "앨범 접근 권한을 허용해주세요.");
                throw new Error("Permission denied");
            }

            // 0. videoSource가 객체({uri: ...}) 형태로 넘어왔을 경우 uri 문자열만 추출
            const sourceUri = videoSource?.uri || videoSource;

            let fileUri;

            // 1. 로컬 파일 URI인 경우
            if (typeof sourceUri === "string") {
                fileUri = sourceUri;
            } else {
                // 2. require()된 로컬 자원
                const asset = Asset.fromModule(sourceUri);
                await asset.downloadAsync();
                fileUri = asset.localUri || asset.uri;
            }

            const mediaAsset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync("MyApp", mediaAsset, false);

            return true;
        } catch (error) {
            console.log("비디오 저장 실패:", error);
            Alert.alert("오류", "동영상 저장에 실패했습니다.");
            throw error;
        }
    };

    return (
        <ViewMediaFrame
            visible={visible}
            onClose={onClose}
            onSave={handleSaveVideo}
            meatballVisible={true}
        >
            <View style={styles.videoContainer}>
                <Video
                    style={styles.video}
                    source={videoSource}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay={visible}
                    onLoad={(status) => {
                        console.log("[ViewVideo][onLoad]", status);
                    }}
                    onReadyForDisplay={(status) => {
                        console.log("[ViewVideo][onReadyForDisplay]", status);
                    }}
                    onError={(error) => {
                        console.error("[ViewVideo][onError]", error);
                    }}
                />
            </View>
        </ViewMediaFrame>
    );
};

export default ViewVideo;

const styles = StyleSheet.create({
    videoContainer: {
        width: "100%",
        height: "80%", // 비율 조정
        justifyContent: "center",
        alignItems: "center",
    },
    video: {
        width: "100%",
        height: "100%",
    },
});
