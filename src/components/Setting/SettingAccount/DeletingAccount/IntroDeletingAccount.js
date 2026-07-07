// 설정,계정삭제
// 처음에 보여지는 고양이 화면
// DeletingAccountFrame에 소속됨
// 순서 : IntroDeletingAccount -> CheckDeleteReason -> WritingDetailReason -> DeletingOfTermsAndConditions -> OutroDeletingAccount
import React, { useState } from "react";
import DialogueView from "../../../DialogueView";

const IntroDeletingAccount = ({ onNextStep }) => {
    const [step, setStep] = useState(0);

    const scripts = [
        "반가워.\n클럽에서 나가고 싶어서 방문해줬구나?",
        "클럽에 계시는 동안 내가 충분하게 도와주지 못한 것 같아서, 마음이 무겁네...",
        "우선 나가길 마음먹은 만큼,\n지금 바로 탈퇴 절차 도와줄께.",
    ];

    const handlePress = () => {
        if (step < scripts.length - 1) {
            setStep(step + 1);
        } else {
            onNextStep();
        }
    };

    return (
        <DialogueView
            text={scripts[step]}
            onPress={handlePress}
            imageAddress={require("../../../../../assets/image/dialogueImage4.png")}
        />
    );
};

export default IntroDeletingAccount;
