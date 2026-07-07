// 컴포넌트
// JSON문자열과 title 문자를 받아서 체크 선택란을 만듦
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";
import { Typography } from "../design/Typography";
import { Spacing } from "../design/Spacing";
import CatMessageBox from "./CatMessageBox";
import { heightScale } from "../utils/scale";
import { CATBOX_SETTING_HEIGHT } from "../design/token/constantsTokens";

const SettingCheck = ({
  data = [],
  title = "",
  selectedReason = null,
  style,
  onSelectReason = () => { },
}) => {
  const renderItem = ({ item }) => {
    const isSelected = selectedReason === item.id;
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onSelectReason(item.id)}
      >
        <Image
          source={
            isSelected
              ? require("../../assets/button/check_image_activated.png")
              : require("../../assets/button/check_image.png")
          }
          style={styles.checkIcon}
        />
        <Text style={styles.itemText}>{item.text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CatMessageBox
        message={title}
        style={{
          top: CATBOX_SETTING_HEIGHT
        }}
      />
      <View style={[styles.listContainer, style]}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    position: "absolute",
    top: CATBOX_SETTING_HEIGHT + heightScale(180),
    width: "100%",
  },
  tltle: {
    color: ColorTokens.Point,
    ...Typography.boldLarge,

  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing[5] + 4,
    marginHorizontal: 20,
  },
  checkIcon: {
    // PNG에 투명 여백(4/5)을 추가해 보이는 크기 24pt 유지를 위해 박스는 30
    width: 30,
    height: 30,
    marginRight: Spacing[4],
  },
  itemText: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
});

export default SettingCheck;
