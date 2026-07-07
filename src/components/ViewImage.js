import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  View,
  Dimensions,
} from "react-native";
import { Asset } from "expo-asset";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

import ViewMediaFrame from "./ViewMediaFrame";
import { Spacing } from "../design/Spacing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const ViewImage = ({ visible, onClose, images = [], initialIndex = 0, blockImageSave, meatballVisible = true }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible && images.length > 0) {
      setCurrentIndex(initialIndex);
      // Modal 마운트 후 ScrollView 레이아웃이 준비될 때까지 대기
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * initialIndex, animated: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, initialIndex]);

  const handleSaveImage = async () => {
    const imageAddress = images[currentIndex];
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "앨범 접근 권한을 허용해주세요.");
        throw new Error("Permission denied");
      }

      const sourceUri = imageAddress?.uri || imageAddress;
      let fileUri;

      if (typeof sourceUri === "string") {
        if (sourceUri.startsWith("http")) {
          const fileName = sourceUri.split("/").pop().split("?")[0] || "image.jpg";
          const dest = FileSystem.cacheDirectory + fileName;
          const { uri } = await FileSystem.downloadAsync(sourceUri, dest);
          fileUri = uri;
        } else {
          fileUri = sourceUri;
        }
      } else {
        const asset = Asset.fromModule(sourceUri);
        await asset.downloadAsync();
        fileUri = asset.localUri || asset.uri;
      }

      const mediaAsset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("MyApp", mediaAsset, false);
      return true;
    } catch (error) {
      Alert.alert("오류", "사진 저장에 실패했습니다.");
      throw error;
    }
  };

  const handleScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / SCREEN_WIDTH);
    if (idx >= 0 && idx < images.length) {
      setCurrentIndex(idx);
    }
  }, [images.length]);

  return (
    <ViewMediaFrame
      visible={visible}
      onClose={onClose}
      onSave={handleSaveImage}
      blockSave={blockImageSave}
      meatballVisible={meatballVisible}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 0 }}
      >
        {images.map((item, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={item} style={styles.image} resizeMode="contain" resizeMethod="resize" />
          </View>
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <View key={i} style={styles.dotSlot}>
              <Image
                source={
                  i === currentIndex
                    ? require("../../tokenImage/activeractanglepoint.png")
                    : require("../../tokenImage/rectanglepoint.png")
                }
                style={i === currentIndex ? styles.activeDotImage : styles.dotImage}
                resizeMode="stretch"
              />
            </View>
          ))}
        </View>
      )}
    </ViewMediaFrame>
  );
};

export default ViewImage;

const styles = StyleSheet.create({
  scrollView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    flexGrow: 0,
    flexShrink: 0,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: "center",
    alignItems: "center",
    // 홈 피드(PostMedia)의 좌우 패딩(Spacing[2]=8)과 동일하게 맞춰 이질감 제거
    paddingHorizontal: Spacing[2],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  // 활성/비활성 전환 시 레이아웃이 흔들리지 않도록, 각 점이 차지하는 자리를
  // 가장 넓은 활성 막대 너비(18)로 고정하고 그 안에서 가운데 정렬한다.
  dotSlot: {
    width: 14,
    height: 7,
    marginHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  dotImage: {
    width: 7,
    height: 7,
  },
  activeDotImage: {
    width: 7,
    height: 7,
  },
});
