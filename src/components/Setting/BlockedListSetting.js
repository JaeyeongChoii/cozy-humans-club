// 설정
// 차단한 사람들의 정보가 보임
import React, { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
// 사용자 선언 변수
import { heightScale, SCREEN_WIDTH, widthScale } from "../../utils/scale";
import { ColorTokens } from "../../design/token/ColorTokens";
import Popup2Button from "../Popup2Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/BaseURL";

import { useToast } from "../../components/ToastContext"; // useToast import
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import { Radius } from "../../design/Radius";
import DynamicButton from "../DynamicButton";
import { postApi } from "../../api/postApi";
import CachedImage from "../common/CachedImage";

const BlockedListSetting = () => {
  const { showToast } = useToast(); // useToast hook
  const navigation = useNavigation(); // navigation hook 추가
  const [activeTab, setActiveTab] = useState("blocked");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("block");
  const [blockedList, setBlockedList] = useState([]);
  const [mutedList, setMutedList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // 선택된 유저 상태 추가


  // 진행이 완료되면 리스트를 리프레시함
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const blocked = await postApi.pullBlockList();
          if (blocked) setBlockedList(blocked);

          const muted = await postApi.pullMuteList();
          if (muted) setMutedList(muted);
        } catch (error) {
          console.error("[BlockedListSetting] fetchData Error:", error);
        }
      };
      fetchData();
    }, [])
  );

  // 현재 활성화된 탭에 따라 보여줄 사용자 목록을 결정
  // blocked와 muted
  const usersToShow = activeTab === "blocked" ? blockedList : mutedList;

  const modalMessageMap = {
    block: "정말 이 멤버의 차단을 해제할래?",
    mute: "정말 이 멤버의 뮤트를 해제할래?",
  };

  const cancelButtonTextMap = {
    block: "뒤로가기",
    mute: "뒤로가기",
  };

  const confirmButtonTextMap = {
    block: "확정하기",
    mute: "확정하기",
  };

  // 차단/뮤트 해제 하기
  const handleConfirm = async () => {
    if (!selectedUser) return;

    const targetId = selectedUser.blocked_user_id;

    try {
      const idToken = await AsyncStorage.getItem("id_token");
      if (!idToken) return;

      let url = "";
      let successMessage = "";

      if (modalType === "block") {
        url = `${BASE_URL}/profile/block`;
        successMessage = "차단이 해제되었습니다.";
      } else if (modalType === "mute") {
        url = `${BASE_URL}/profile/mute`;
        successMessage = "뮤트가 해제되었습니다.";
      }

      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          target_id: targetId,
        }),
      };
      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      if (response.ok) {
        // 성공 시 리스트 갱신 및 토스트 출력
        if (modalType === "block") {
          const updated = await postApi.pullBlockList();
          if (updated) setBlockedList(updated);
        } else {
          const updated = await postApi.pullMuteList();
          if (updated) setMutedList(updated);
        }
        showToast({ message: successMessage, withOverlay: true });
      } else {
        console.error(`Failed to un${modalType} user`);
      }
    } catch (error) {
      console.error(`${modalType} Unblock/Unmute Error:`, error);
    } finally {
      setModalVisible(false);
      setSelectedUser(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* 탭 버튼 영역 */}
      <View style={styles.tabButtonContainer}>
        <TouchableOpacity
          style={styles.tabButtonTouchable}
          onPress={() => setActiveTab("blocked")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "blocked"
                    ? ColorTokens.Point
                    : ColorTokens.Unselected,
              },
            ]}
          >
            차단한 유저
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButtonTouchable}
          onPress={() => setActiveTab("muted")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "muted"
                    ? ColorTokens.Point
                    : ColorTokens.Unselected,
              },
            ]}
          >
            뮤트한 유저
          </Text>
        </TouchableOpacity>
      </View>

      {/* 구분선 */}
      <View style={styles.horizonLine} />
      {/* 메인 사용자 목록 */}
      {usersToShow && usersToShow.length > 0 ? (
        <View style={styles.userListContainer}>
          {usersToShow.map((user, index) => (
            <View key={user.blocked_user_id || index} style={styles.userDetailContainer}>
              {/* 프로필 이미지와 계정 정보를 묶어서 클릭 시 프로필 이동 */}
              <TouchableOpacity
                style={styles.userInfoContainer}
                onPress={() => {
                  navigation.navigate("Userprofile", {
                    usercode: user.user_id,
                  });
                }}
              >
                {/* 프로필 이미지 */}
                <CachedImage
                  source={
                    user.image
                      ? { uri: `${BASE_URL}/files/profile/${user.image}` }
                      : null
                  }
                  style={styles.imageStyle}
                  placeholder={require("../../../tokenImage/defaultProfileImage.png")}
                  resizeWidth={200}
                />
                {/* 계정 정보 */}
                <View style={styles.nicknameAndId}>
                  <Text style={styles.userNicknameText}>{user.nickname || "알 수 없음"}</Text>
                  <Text style={styles.userIdText}>@{user.user_id}</Text>
                </View>
              </TouchableOpacity>

              {/* 차단중 / 뮤트중 버튼 (오른쪽에 유지) */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setSelectedUser(user); // 선택된 유저 설정
                  setModalType(user.state); // block or mute
                  setModalVisible(true);
                }}
              >
                {/* 차단 해제 버튼 */}
                {activeTab === "blocked" && (
                  <DynamicButton text={"차단중"} disabled={true} isPoint2={false} />
                )}
                {/* 뮤트 해제 버튼 */}
                {activeTab === "muted" && (
                  <DynamicButton text={"뮤트중"} disabled={true} isPoint2={false} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: heightScale(220),
          }}
        >
          <Text style={styles.noUserText}>
            {activeTab === "blocked"
              ? "차단한 멤버가 아직 없구만!"
              : "뮤트한 멤버가 아직 없구만!"}
          </Text>
        </View>
      )}
      {/* 모달 */}
      <Popup2Button
        onRequestClose={() => setModalVisible(false)}
        leftOnPress={() => setModalVisible(false)}
        rightOnPress={handleConfirm}
        visible={modalVisible}
        mainText={modalMessageMap[modalType]}
        leftText={cancelButtonTextMap[modalType]}
        rightText={confirmButtonTextMap[modalType]}
        // highlightMap={{
        //   [modalMessageMap[modalType]]: {
        //     ...Typography.boldMedium,
        //   }
        // }}
      />
    </View>
  );
};

export default BlockedListSetting;

const styles = StyleSheet.create({
  container: {
    // 레이아웃 속성
    flex: 1,
    //위치 조정
    marginTop: heightScale(170),
  },
  tabButtonContainer: {
    // 위치 조정
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabButtonTouchable: {
    // 위치 조정
    paddingVertical: Spacing[4],
    width: SCREEN_WIDTH / 2,
  },
  tabText: {
    // 폰트 조정
    ...Typography.headingMedium,
    textAlign: "center",
  },
  horizonLine: {
    borderColor: ColorTokens.InnerBox2,
    width: SCREEN_WIDTH,
    borderWidth: 0.5,
    marginTop: Spacing[1],
  },
  userListContainer: {
    marginTop: Spacing[4],
    marginLeft: Spacing[2],
    marginRight: Spacing[1],
  },
  userDetailContainer: {
    // 위치 조정
    marginBottom: Spacing[6], // 각 유저 항목 간 간격
    // 레이아웃 속성
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageStyle: {
    // 색상 조정
    backgroundColor: ColorTokens.Typography,
    // 위치 조정
    marginRight: Spacing[2],
    // 레이아웃 속성
    width: 43,
    height: 43,
    borderRadius: Radius.round,
  },
  nicknameAndId: {
    flex: 1,
    gap: Spacing[1],
  },
  userNicknameText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldSmall,
  },
  userIdText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 폰트 조정
    ...Typography.paraSmall,
  },
  noUserText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 폰트 조정
    ...Typography.paraMedium,
    textAlign: "center",
  },
});
