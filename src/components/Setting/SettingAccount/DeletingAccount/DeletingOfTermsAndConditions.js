// 설정,계정삭제
// 탈퇴후 정책 안내
// DeletingAccountFrame에 소속됨
// 순서 : IntroDeletingAccount -> CheckDeleteReason -> WritingDetailReason -> DeletingOfTermsAndConditions -> OutroDeletingAccount

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

// 외부 이미지
import checkImage from "../../../../../assets/button/check_image.png";
import activatedCheckImage from "../../../../../assets/button/check_image_activated.png";

// 사용자 정의 변수
import { heightScale, SCREEN_WIDTH } from "../../../../utils/scale";
import { ColorTokens } from "../../../../design/token/ColorTokens";
import ScreenLayout from "../../../ScreenLayout";
import { Typography } from "../../../../design/Typography";
import CatMessageBox from "../../../CatMessageBox";
import { Spacing } from "../../../../design/Spacing";

const agreements = [
  { id: 0, text: "해당 아이디로 클럽에 다시 로그인 할 수 없어요." },
  { id: 1, text: "클럽에서 포스팅한 글은 전부 삭제되요." },
  {
    id: 2,
    text: "채팅 메세지, 댓글 등 계정에 저장되지 않은 정보가 다른사람에게 보여질 수 있어요.",
  },
  {
    id: 3,
    text: "탈퇴하기를 하더라도 7일안에 취소할 수 있어. 탈퇴하기를 완료하고 7일 전에 마음이 바뀐다면, 아까 설정 화면에서 탈퇴하기를 다시 눌러주세요.",
  },
];

const DeletingOfTermsAndConditions = ({
  onNextStep,
  navigation,
  onPreviousStep,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckToggle = () => {
    setIsChecked(!isChecked);
  };

  return (
    <ScreenLayout
      onBack={onPreviousStep}
      showNextBar={true}
      nextBarProps={{
        onPress: onNextStep,
        disabled: !isChecked,
        message: "확인하기",
      }}
      contentStyle={styles.contentStyle}
    >
      <CatMessageBox
        message={"아래 내용을 읽고, 마지막 단계를 진행해줘."}
        style={{
          marginTop: 60,
        }}
        />
      <View style={styles.container}>
        <View style={styles.agreementsContainer}>
          {agreements.map((agreement) => (
            <View key={agreement.id} style={styles.agreementDetailContainer}>
              <Text style={styles.bulletIcon}>{"\u2022"}</Text>
              <Text style={styles.agreementText}>{agreement.text}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.checkButtonContainer}>
        <TouchableOpacity
          style={styles.checkButtonDetailContainer}
          onPress={handleCheckToggle}
        >
          <Text style={styles.checkText}>꼼꼼히 읽었으며, 이에 동의합니다</Text>
          <Image
            source={isChecked ? activatedCheckImage : checkImage}
            style={styles.checkButton}
          />
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default DeletingOfTermsAndConditions;

const styles = StyleSheet.create({
  contentStyle: {},
  container: {
    flex: 1,
    marginTop: heightScale(50 + 342),
    marginHorizontal: Spacing[5],
  },
  agreementsContainer: {
    marginBottom: 0,
  },
  agreementDetailContainer: {
    paddingBottom: Spacing[4],
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletIcon: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    paddingRight: Spacing[3],
  },
  agreementText: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  checkButtonContainer: {
    alignItems: "flex-end",
    width: "100%",
    bottom: heightScale(172), //172
    right: Spacing[5],
  },
  checkButtonDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkButton: {
    // PNG에 투명 여백(4/5)을 추가해 보이는 크기 24pt 유지를 위해 박스는 30
    width: 30,
    height: 30,
    marginLeft: Spacing[4],
  },
  checkText: {
    color: ColorTokens.Typography,
    ...Typography.boldMedium,
  },
});
