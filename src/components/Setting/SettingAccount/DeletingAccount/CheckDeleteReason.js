// 설정, 계정삭제
// 계정삭제의 간단한 이유를 체크
// DeletingAccountFrame에 소속됨
// 순서 : IntroDeletingAccount -> CheckDeleteReason -> WritingDetailReason -> DeletingOfTermsAndConditions -> OutroDeletingAccount
import React, { useState } from "react";
import { StyleSheet } from "react-native";

// 컴포넌트
import SettingCheck from "../../../SettingCheck";
import ScreenLayout from "../../../ScreenLayout";

const reasons = [
    { id: 0, text: "앱 사용이 어렵거나 불편해" },
    { id: 1, text: "충분히 안전하다고 느껴지지 않아" },
    { id: 2, text: "대화 분위기가 나와 맞지 않아" },
    { id: 3, text: "기능이 기대에 비해 부족해" },
    { id: 4, text: "기타" },
];

const CheckDeleteReason = ({ onNextStep, navigation, onPreviousStep }) => {
    const [selectedReasonId, setSelectedReasonId] = useState(null);

    const handleReasonSelect = (id) => {
        setSelectedReasonId(id);
    };

    return (
        <ScreenLayout
            onBack={onPreviousStep}
            showNextBar={true}
            nextBarProps={{
                onPress: onNextStep,
                disabled: selectedReasonId === null,
                message: "확인하기",
            }}
            contentStyle={styles.contentContainer}
        >
            <SettingCheck
                title="혹시 떠나려는 이유를 알려줄 수 있어?"
                data={reasons}
                selectedReason={selectedReasonId}
                onSelectReason={handleReasonSelect}
            />
        </ScreenLayout>
    );
};

export default CheckDeleteReason;

const styles = StyleSheet.create({
    contentContainer: {
        marginTop: 60, // SettingCheck 내부에서 패딩 처리됨 (혹은 필요시 조정)
    },
});
