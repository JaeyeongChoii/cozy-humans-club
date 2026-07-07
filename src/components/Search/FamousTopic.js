import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { ColorTokens } from "../../design/token/ColorTokens";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";

// 하드 코딩용 인기주제
const fakeTopic = [
  { id: 1, text: "괴담 타래" },
  { id: 2, text: "고민" },
  { id: 3, text: "플라스틱 빨대" },
  { id: 4, text: "베라" },
  { id: 5, text: "장미우산" },
];

const FamousTopic = () => {
  return (
    <View style={styles.container}>
      {/* 실시간 주제 안내 컨테이너 */}
      <View style={styles.header}>
        <Text style={styles.title}>
          공간에 이야기가 더 많아지면,{"\n"}실시간 인기 주제가 추가될 예정이예요.
        </Text>
        <Image
          source={require("../../../assets/image/catRightHand_1.png")}
          style={styles.catImage}
        />
      </View>

      {/* 인기 주제 목록 */}
      <View style={styles.listContainer}>
        {fakeTopic.map((item) => (
          <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.item}>
              <Text style={styles.itemNumber}>{item.id}. </Text>
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default FamousTopic;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[5],
    marginTop: Spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: ColorTokens.Point,
    ...Typography.boldMedium,
    marginRight: Spacing[2],
  },
  catImage: {
    resizeMode: "contain",
  },
  listContainer: {
    marginTop: Spacing[6],
  },
  itemWrapper: {
    marginBottom: Spacing[6],
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing[3],
  },
  itemNumber: {
    color: ColorTokens.Unselected, 
    ...Typography.paraMedium,
    marginRight: Spacing[1],
  },
  itemText: {
    color: ColorTokens.Unselected,
    ...Typography.paraMedium,
  },
  divider: {
    height: 0.5,
    backgroundColor: ColorTokens.Stroke,
  },
});