import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

import { ColorTokens } from "../../design/token/ColorTokens";
import { Typography } from "../../design/Typography";

const ITEM_HEIGHT = 50;

export default function WheelPicker({
  data,
  selectedIndex,
  onValueChange,
  unit,
  accentColor = ColorTokens.Point2,
}) {
  const scrollViewRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!scrollViewRef.current) return;

    scrollViewRef.current.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });

    // 처음 렌더 직후에도 선택 색이 맞도록 scrollY 동기화
    setScrollY(selectedIndex * ITEM_HEIGHT);
  }, [selectedIndex]);

  const handleScroll = (event) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  const handleScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

    onValueChange(clampedIndex);

    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleScrollEndDrag = (event) => {
    const velocityY = Math.abs(event.nativeEvent.velocity?.y || 0);

    if (velocityY < 0.1) {
      handleScrollEnd(event);
    }
  };

  const getItemStyle = (index) => {
    const itemOffset = index * ITEM_HEIGHT;
    const centerOffset = scrollY;
    const distance = Math.abs(itemOffset - centerOffset);
    const isSelected = distance < ITEM_HEIGHT / 3;

    return {
      color: isSelected ? accentColor : ColorTokens.Unselected,
      ...Typography.boldMedium
    };
  };

  return (
    <View style={styles.wheelContainer}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="normal"
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.wheelItem}>
            <Text style={getItemStyle(index)}>
              {item}
              {unit}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    height: ITEM_HEIGHT * 3,
    position: "relative",
    overflow: "hidden",
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
