// 온보딩
import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";

import { heightScale, SCREEN_WIDTH, widthScale } from "../../utils/scale";
import { ColorTokens } from "../../design/token/ColorTokens";

// 데이터 임포트
import { TutorialText } from "./TutorialText";
import CatMessageBox from "../CatMessageBox";

// 고양이 발 이미지
import catPawImage from "../../../tokenImage/catPaw.png";

// TutorialText에서 7번 이후 데이터를 튜토리얼 모달용 메시지로 사용
const tutorialMessages = TutorialText.filter((item) => item.id >= 7);

const TutorialModal = ({ visible, onClose }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const touchXRef = useRef(null);

  // 왼쪽 터치 영역 비율 (예: 왼쪽 50%)
  const LEFT_ZONE_RATIO = 0.5;

  // 고양이 발 위치 매핑
  const PAW_POSITIONS = {
    JAM: { top: heightScale(171), left: widthScale(22) },
    JIN: { top: heightScale(171), left: widthScale(116) },
  };

  const handleNextText = () => {
    //  다음 인덱스로 이동
    if (currentMessageIndex < tutorialMessages.length - 1) {
      setCurrentMessageIndex((prevIndex) => prevIndex + 1);
    } else {
      // 마지막 메세지 인경우, 모달을 닫기
      onClose();
    }
  };

  const handlePreviousText = () => {
    if (currentMessageIndex > 0) {
      setCurrentMessageIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleFullScreenPress = () => {
    const x = touchXRef.current ?? SCREEN_WIDTH / 2; // 터치 위치(없으면 중앙으로)
    const leftThreshold = SCREEN_WIDTH * LEFT_ZONE_RATIO;

    if (x < leftThreshold) {
      // 왼쪽 영역을 터치했고, 첫 번째 메시지가 아닐 때만 이전 메시지로 이동
      handlePreviousText();
    } else {
      // 그 외의 경우 (오른쪽 영역 터치 또는 왼쪽 터치이나 첫 메시지)
      handleNextText();
    }
    // 사용 후 초기화
    touchXRef.current = null;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true} // 배경 투명 설정
      visible={visible}
      onRequestClose={onClose} // 뒤로가기 버튼 처리
    >
      {/* 어두운 반투명 배경 */}
      <View style={styles.modalBackground}>
        {/* 전체 영역 터치 감지 */}
        <Pressable
          style={styles.fullScreenTouchArea} // 화면 전체를 덮도록 스타일 적용 필요
          onPressIn={(e) => {
            touchXRef.current = e.nativeEvent.locationX;
          }}
          onPress={handleFullScreenPress} // 터치 핸들러
        >
          <CatMessageBox
            message={tutorialMessages[currentMessageIndex].text}
            highlightWords={tutorialMessages[currentMessageIndex].highlightMap}
            isSmall={currentMessageIndex === 0}
            style={{
              top: heightScale(354)
            }}
          />

          {/* 고양이 발 표시 (해당하는 경우만) */}
          {tutorialMessages[currentMessageIndex].catPaw && 
           PAW_POSITIONS[tutorialMessages[currentMessageIndex].catPaw] && (
            <Image
              source={catPawImage}
              style={[
                styles.catPaw,
                {
                  top: PAW_POSITIONS[tutorialMessages[currentMessageIndex].catPaw].top,
                  left: PAW_POSITIONS[tutorialMessages[currentMessageIndex].catPaw].left,
                }
              ]}
            />
          )}
        </Pressable>
      </View>
    </Modal>
  );
};

export default TutorialModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: ColorTokens.ModalBackground, // 어두운 반투명 배경
  },
  fullScreenTouchArea: {
    flex: 1, // Modal 배경 전체를 터치 영역으로 만듦
    width: "100%",
    height: "100%",
    alignItems: "center", // 내부의 CatMessageBox를 중앙에 배치
  },
  catPaw: {
    position: "absolute",
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
});
