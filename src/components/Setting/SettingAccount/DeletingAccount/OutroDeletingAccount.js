// 설정,계정삭제
// 계정삭제가 완료한뒤 나오는 고양이 화면
// DeletingAccountFrame에 소속됨
// 순서 : IntroDeletingAccount -> CheckDeleteReason -> WritingDetailReason -> DeletingOfTermsAndConditions -> OutroDeletingAccount

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import DialogueView from "../../../DialogueView";
import { checkIsSmallDialogue } from "../../../../utils/dialogueUtils";

const OutroDeletingAccount = ({ onNextStep }) => {
    const [step, setStep] = useState(0);

    const scripts = [
        "탈퇴 절차가 모두 완료되었어.",
        "너같은 인간을 지켜볼 수 있어서, 행복했어.\n나중에 클럽에서 다시 하고 싶은 이야기가 생기면 언제든 편하게 들러줘.",
        "그때까지 나는 이곳을 더욱 더 안전하고 아늑한 이야기 공간으로 가꾸고 있을게.",
        "그러면, 또 만나자!",
    ];
    
    const isSmallDialogue = checkIsSmallDialogue(scripts[step]);

    const handlePress = () => {
        if (step < scripts.length - 1) {
            setStep(step + 1);
        } else {
            // 마지막 단계 끝나면 Splash로 이동 (부모에서 처리하거나 여기서 직접 이동)
            // DeletingAccountFrame.js의 handleNextStep을 호출하면 거기서 Splash로 이동시킴
            onNextStep();
        }
    };

    return (
        <View style={styles.container}>
            <DialogueView
                text={scripts[step]}
                onPress={handlePress}
                imageAddress={require("../../../../../assets/image/dialogueImage4.png")}
                isSmall={isSmallDialogue}
            />
        </View>
    );
};

export default OutroDeletingAccount;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
