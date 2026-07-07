// 온보딩
import React, { useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

// 사용자 정의 변수
import { ColorTokens } from "../../design/token/ColorTokens";
import { heightScale } from "../../utils/scale";
import { CHECK_BUTTON_SIZE, ONBOARDING_CLUBRULE_HEIGHT } from "../../design/token/constantsTokens";
import ClubRule from "../Setting/ClubRule";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import NextBar from "../NextBar";

const ShowClubRule = ({ onActivationChange, embeddedNextBar }) => {
  const [isChecked, setIsChecked] = React.useState(false);
  const [hasScrolled, setHasScrolled] = React.useState(false);

  //컴포넌트가 처음 마운트될 때 한 번만 실행
  useEffect(() => {
    onActivationChange(false);
  }, []);

  const handleCheck = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onActivationChange(newState);
  };

  const handleScroll = (event) => {
    const isAwayFromTop = event.nativeEvent.contentOffset.y > 0;
    setHasScrolled((previous) =>
      previous === isAwayFromTop ? previous : isAwayFromTop
    );
  };

  return (
    <>
      <View
        style={{
          height: ONBOARDING_CLUBRULE_HEIGHT,  // 보여지는 영역 높이 조절
          overflow: 'hidden',
          marginTop: heightScale(152),
        }}
      >
        {hasScrolled ? (
          <View
            pointerEvents="none"
            style={styles.scrollStartIndicator}
          />
        ) : null}
        <ClubRule
          style={{
            marginTop: 0,
            height: '100%',
          }}
          isOnboarding={true}
          onScroll={handleScroll}
        >
          <TouchableOpacity
            onPress={handleCheck}
            hitSlop={10}
            style={{ width: '100%' }}
          >
            {/* 확인 버튼을 스크롤 끝에 배치 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: "center",
                justifyContent: "flex-end",
                width: '100%',
                marginTop: Spacing[10],
                marginBottom: heightScale(0), // 마지막 여백 넉넉히 확보
              }}
            >
              <Text
                style={{
                  paddingLeft: 10,
                  color: ColorTokens.Point,
                  ...Typography.boldMedium,
                  height: CHECK_BUTTON_SIZE,
                  lineHeight: CHECK_BUTTON_SIZE,
                  marginRight: Spacing[2],
                  textAlign: "center",
                  textAlignVertical: "center",
                }}
              >
                꼼꼼히 읽었으며, 이에 동의합니다
              </Text>

              <Image
                source={
                  isChecked
                    ?
                    require("../../../assets/button/check_image_activated.png")
                    :
                    require("../../../assets/button/check_image.png")
                }
                style={{
                  width: CHECK_BUTTON_SIZE,
                  height: CHECK_BUTTON_SIZE,
                  resizeMode: "contain",
                }}
              />

            </View>
          </TouchableOpacity>
          {embeddedNextBar ? (
            <View style={styles.embeddedNextBarContainer}>
              <NextBar
                {...embeddedNextBar}
                style={styles.embeddedNextBar}
              />
            </View>
          ) : null}
        </ClubRule>
      </View>
    </>
  );
};

export default ShowClubRule;

const styles = StyleSheet.create({
  scrollStartIndicator: {
    position: "absolute",
    top: 0,
    left: Spacing[5],
    right: Spacing[5],
    zIndex: 10,
    height: 0.8,
    backgroundColor: ColorTokens.InnerBox2,
  },
  embeddedNextBarContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: Spacing[10],
    marginBottom: heightScale(98),
  },
  embeddedNextBar: {
    position: "relative",
    top: undefined,
  },
});
