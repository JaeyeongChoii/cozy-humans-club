// 온보딩
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";

// 외부 이미지
import checkImage from "../../../assets/button/check_image.png";
import activatedCheckImage from "../../../assets/button/check_image_activated.png";

// 사용자 정의 변수
import { ColorTokens } from "../../design/token/ColorTokens";
import { SCREEN_WIDTH, heightScale, widthScale } from "../../utils/scale";
import { CHECK_BUTTON_SIZE } from "../../design/token/constantsTokens";
import { BASE_URL } from "../../constants/BaseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Spacing } from "../../design/Spacing";
import { Typography } from "../../design/Typography";

const agreements = [
  {
    id: 0,
    text: "만 14세 이상입니다.",
    opacity_text: "(필수)",
    small_text: "",
  },
  {
    id: 1,
    text: "서비스 이용약관",
    opacity_text: "(필수)",
    small_text: "",
  },
  {
    id: 2,
    text: "개인정보 수집 및 이용동의",
    opacity_text: "(필수)",
    small_text: "",
  },
  {
    id: 3,
    text: "활동 알림",
    opacity_text: "(선택)",
    small_text: "팔로우, 다른 유저의 언급 등",
  },
  {
    id: 4,
    text: "서비스 알림",
    opacity_text: "(선택)",
    small_text: "서비스내 이벤트, 새로운 소식등등",
  },
];

const CheckList = ({ onActivationChange, onValidate }) => {
  // 각 동의 항목의 체크 상태를 관리하는 상태 (초기값은 모두 false)
  const [checkedAgreements, setCheckedAgreements] = useState(() => {
    const initialState = {};
    agreements.forEach((item) => {
      initialState[item.id] = false;
    });
    return initialState;
  });

  // "모두 동의" 버튼의 체크 상태를 관리하는 상태
  const [allAgreementsChecked, setAllAgreementsChecked] = useState(false);

  // 개별 동의 항목의 체크 상태가 변경될 때 "모두 동의" 상태를 업데이트
  useEffect(() => {
    const allChecked = agreements.every((item) => checkedAgreements[item.id]);
    setAllAgreementsChecked(allChecked);
  }, [checkedAgreements]);

  // 필수 동의 항목들이 모두 체크되었는지 확인하여 상위 컴포넌트에 활성화 상태 전달
  useEffect(() => {
    const requiredAgreements = agreements.filter(
      (item) => item.opacity_text === "(필수)"
    );
    const allRequiredChecked = requiredAgreements.every(
      (item) => checkedAgreements[item.id]
    );
    onActivationChange(allRequiredChecked);
  }, [checkedAgreements, onActivationChange]);

  // 알림 설정 서버 전송 함수
  const submitAlarmSettings = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const idToken = await AsyncStorage.getItem("id_token");

      const reqData = {
        id: idToken,
        service: checkedAgreements[4], // 서비스 알림
        market: true, // 마케팅 알림은 true로 고정
        user: checkedAgreements[3], // 활동 알림
      };

      await AsyncStorage.setItem("notification_settings", JSON.stringify(reqData));

      const url = `${BASE_URL}/profile/alram`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reqData),
      };

      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);

      const resData = await response.json();
      console.log(`${url} response body :`, JSON.stringify(resData, null, 2));

      return true; // 성공 여부와 관계없이 다음 단계로 진행
    } catch (error) {
      console.error("Alarm API Error:", error);
      return true; // 에러 발생해도 다음 단계로 진행
    }
  };

  // 상위 컴포넌트에 검증 함수 전달
  useEffect(() => {
    if (onValidate) {
      onValidate(submitAlarmSettings);
    }
  }, [onValidate, checkedAgreements]); // checkedAgreements가 바뀔 때마다 함수가 재생성될 필요는 없지만, 클로저 문제 방지를 위해 의존성 추가 고려. 
  // 하지만 여기서는 submitAlarmSettings가 checkedAgreements를 직접 참조하므로 
  // submitAlarmSettings를 useCallback으로 감싸거나, useEffect 안에서 정의하여 최신 state를 가져오게 해야 함.
  // 위 구현에서는 submitAlarmSettings가 매 렌더링마다 새로 생성되므로 onValidate도 계속 호출됨.
  // 최적화를 위해 submitAlarmSettings는 useCallback이나 ref를 사용하는 것이 좋음.
  // 일단 기능 구현 우선으로 진행하겠습니다.

  // 개별 동의 항목의 체크 상태를 토글하는 함수
  const toggleAgreement = (id) => {
    setCheckedAgreements((prev) => ({
      ...prev,
      [id]: !prev[id], // 현재 상태를 반전
    }));
  };

  // "모두 동의" 버튼을 눌렀을 때 모든 동의 항목의 상태를 일괄 변경하는 함수
  const toggleAllAgreements = () => {
    const newAllCheckedStatus = !allAgreementsChecked; // 현재 "모두 동의" 상태를 반전
    const newCheckedAgreements = {};
    agreements.forEach((item) => {
      newCheckedAgreements[item.id] = newAllCheckedStatus; // 모든 항목을 새로운 상태로 설정
    });
    setCheckedAgreements(newCheckedAgreements);
    setAllAgreementsChecked(newAllCheckedStatus);
  };

  return (
    <>
      <View style={styles.container}>
        {/* 모두 동의 */}
        <View style={styles.checkAllContainer}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
            hitSlop={10}
            onPress={toggleAllAgreements}
          >
            <Image
              source={allAgreementsChecked ? activatedCheckImage : checkImage}
              style={styles.checkButtonStyle}
            />
            <Text style={styles.checkAllText}>모두 동의</Text>
          </TouchableOpacity>
        </View>
        {/* 구분선 */}
        <View style={styles.line} />
        {/* 소형 체크란 */}
        {agreements.map((aggrement) => (
          <TouchableOpacity
            key={aggrement.id}
            style={[
              styles.checkSoloAndTextContainer,
              {
                marginBottom: aggrement.id === 3
                ?
                Spacing[4]  // 선택 버튼들의 사이
                :
                Spacing[5], // 버튼과 버튼 사이
                flexDirection: "row",
                alignItems: "flex-start",
              },
            ]}
            hitSlop={10}
            onPress={() => toggleAgreement(aggrement.id)}
          >
            <Image
              source={
                checkedAgreements[aggrement.id]
                  ? activatedCheckImage
                  : checkImage
              }
              style={styles.checkButtonStyle}
            />

            <View style={{ flex: 1, paddingTop: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.checkSoloText}>{aggrement.text}</Text>
                {aggrement.opacity_text ? (
                  <Text style={styles.checkSoloOpacityText}>
                    {aggrement.opacity_text}
                  </Text>
                ) : null}
              </View>

              {aggrement.small_text ? (
                <Text style={styles.checkSoloSmallText}>
                  {aggrement.small_text}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

export default CheckList;

const styles = StyleSheet.create({
  container: {
    // 위치 조정
    top: heightScale(259), // 해당 컴포넌트의 시작 위치
    marginHorizontal: Spacing[5],
  },
  checkAllContainer: {
    // 위치 조정
    paddingBottom: Spacing[4], // 모두 동의와 선의 간격
    // 레이아웃 속성
    flexDirection: "row", // 자식들을 가로로 정렬
    alignItems: "center", // 세로축을 중앙에 정렬
  },
  checkAllText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldLarge,
  },
  line: {
    // 색상 조정
    backgroundColor: ColorTokens.InnerBox2,
    // 위치 조정
    marginBottom: Spacing[3], // 선과 소형 체크란과의 간격
    // 레이아웃 속성
    width: SCREEN_WIDTH - Spacing[5] * 2,
    // 얇은 가로선
    height: 1,
  },
  checkSoloContainer: {
    // 위치 조정
    // 레이아웃 속성
    flexDirection: "column", // 자식들을 세로로 정렬
  },
  checkSoloAndTextContainer: {
    // 레이아웃 속성
  },
  checkButtonStyle: {
    // 레이아웃 속성
    width: CHECK_BUTTON_SIZE,
    height: CHECK_BUTTON_SIZE,
    marginRight: Spacing[3],
  },
  checkSoloText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.paraMedium,
    // 위치 조정
    paddingRight: Spacing[2], // 설명과 (text)의 거리
  },
  checkSoloOpacityText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 폰트 조정
    ...Typography.paraMedium,
    // 레이아웃 속성
  },
  checkSoloSmallText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 폰트 조정
    ...Typography.paraSmall,
    // 위치 조정
    // marginLeft: 35, // 이제 부모 View(flex:1)에서 관리하므로 불필요
    // 레이아웃 속성
  },
});
