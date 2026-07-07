import { Image, StyleSheet, View } from "react-native";

const ProfileRefreshIndicator = ({ refreshing }) => (
  <View style={[styles.container, !refreshing && styles.hidden]}>
    {refreshing && (
      <Image
        source={require("../../tokenImage/animation_512px.gif")}
        style={styles.image}
      />
    )}
  </View>
);

export default ProfileRefreshIndicator;

const styles = StyleSheet.create({
  container: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    height: 0,
    overflow: "hidden",
  },
  image: {
    width: 80,
    height: 80,
  },
});
