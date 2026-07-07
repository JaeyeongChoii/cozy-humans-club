import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import CachedImage from "./common/CachedImage";
import { Radius } from "../design/Radius";

const ProfileMainHeader = ({
  imageUrl,
  onProfileImagePress,
  rightContent,
  children,
  placeholder,
}) => {
  return (
    <View style={styles.profileMainContainer}>
      <View style={styles.profileHeaderContainer}>
        <TouchableOpacity onPress={onProfileImagePress}>
          <CachedImage
            source={imageUrl}
            style={styles.profileImage}
            placeholder={placeholder}
            resizeWidth={200}
          />
        </TouchableOpacity>
        {rightContent}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  profileMainContainer: {
    marginHorizontal: 8,
    marginTop: 10,
    marginBottom: 0,
  },
  profileHeaderContainer: {
    flexDirection: "row",
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: Radius.round,
  },
});

export default ProfileMainHeader;
