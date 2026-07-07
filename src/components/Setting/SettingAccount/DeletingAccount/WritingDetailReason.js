// 설정,계정삭제
// 계정삭제 이유를 적음
// DeletingAccountFrame에 소속됨
// 순서 : IntroDeletingAccount -> CheckDeleteReason -> WritingDetailReason -> DeletingOfTermsAndConditions -> OutroDeletingAccount

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import WritingExplain from "../../../WritingExplain";
import ScreenLayout from "../../../ScreenLayout";
import { Typography } from "../../../../design/Typography";

const WritingDetailReason = ({ onNextStep, navigation, onPreviousStep }) => {
  const [reasonText, setReasonText] = useState("");

  return (
    <ScreenLayout
      onBack={onPreviousStep}
      showNextBar={true}
      nextBarProps={{
        onPress: onNextStep,
        disabled: false, // 선택 사항이라면 항상 활성화, 필수라면 길이 체크
        message: "확인하기",
      }}
      contentStyle={styles.contentContainer}
      keyboardResponsiveContent={true}
    >
      <WritingExplain
        title={
          "괜찮다면, 조금 더 자세히 설명해줄 수 있어?\n\n클럽에 있는 멤버들이 너와 똑같은 불편함을 겪지 않을꺼야."
        }
        text={reasonText}
        onChangeText={setReasonText}
        placeholder="내용을 입력해주세요"
        highlightWords={{
          "클럽에 있는 멤버들이 너와 똑같은 불편함을 겪지 않을꺼야.": {
            ...Typography.paraSmall,
          },
        }}
      />
    </ScreenLayout>
  );
};

export default WritingDetailReason;

const styles = StyleSheet.create({
  contentContainer: {
    marginTop: 60,
  },
});
