import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const Shortcut = () => {
  const navigation = useNavigation();

    const handleDialoguePress = () => {
    navigation.navigate("Dialogue");
  };

  const handleLogInPress = () => {
    navigation.navigate("Main");
  };

  const handleSplashPress = () => {
    navigation.navigate("Splash");
  };
  const handleLabPress = () => {
    navigation.navigate("Lab");
  };

  return (
    <View style={{ backgroundColor: "gray" }}>
      <TouchableOpacity onPress={handleDialoguePress}>
        <View
          style={{
            marginTop: 100,
            left: 100,
            width: 100,
            heihgt: 100,
            fontSize: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
            }}
          >
            다이얼 로그
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogInPress}>
        <View
          style={{
            left: 100,
            width: 100,
            heihgt: 100,
            marginTop: 40,
            fontSize: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
            }}
          >
            홈으로
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSplashPress}>
        <View
          style={{
            width: 100,
            left: 100,
            heihgt: 100,
            marginTop: 40,
            fontSize: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
            }}
          >
            로그인
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLabPress}>
        <View
          style={{
            width: 100,
            left: 100,
            heihgt: 100,
            marginTop: 40,
          }}
        >
          <Text
            style={{
              fontSize: 20,
            }}
          >
            실험실
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Shortcut;

const styles = StyleSheet.create({});
