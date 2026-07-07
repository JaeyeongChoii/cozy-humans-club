import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";

import { heightScale, SCREEN_WIDTH, widthScale } from "../../utils/scale";
import WheelPicker from "./WheelPicker";
import { ColorTokens } from "../../design/token/ColorTokens";
import NextBar from "../NextBar";
import { Spacing } from "../../design/Spacing";

const pickerHeight = heightScale(300);
const ITEM_HEIGHT = 50;

export default function DeeptalkPicker({
  visible,
  initialFirst = 2025,
  initialSecond = 1,
  initialThird = 1,
  initialFirstText,
  initialSecondText,
  initialThirdText,
  data1,
  data2,
  data3,
  onClose,
  onConfirm,
  message = "저는 이 날 태어났어요",
  style,
  accentColor = ColorTokens.Point2,
  // true면 피커 바깥(위쪽) 영역을 터치/스크롤하면 확인 없이 닫힌다.
  dismissOnBackdropPress = false,
}) {
  const currentYear = new Date().getFullYear();

  // Date 모드용 데이터 (기존 로직)
  const years = useMemo(
    () => Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i),
    [currentYear]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const initYearIndex = Math.max(
    0,
    (data1 || years).indexOf(initialFirst)
  );
  const initMonthIndex = Math.max(
    0,
    (data2 || months).indexOf(initialSecond)
  );
  const initDayIndex = Math.max(0, (data3 ? initialThird : initialThird - 1));

  const [selectedYearIndex, setSelectedYearIndex] = useState(initYearIndex);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initMonthIndex);
  const [selectedDayIndex, setSelectedDayIndex] = useState(initDayIndex);

  // 현재 선택된 값 (Date 모드에서는 년/월)
  const col1Value = (data1 || years)[selectedYearIndex];
  const col2Value = (data2 || months)[selectedMonthIndex];

  // Date 모드일 때만 days 동적 계산
  const dateDays = useMemo(() => {
    if (data1 || data2 || data3) return []; // Custom 모드면 빈 배열 (사용 안 함)
    const y = col1Value || 2025;
    const m = col2Value || 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [col1Value, col2Value, data1, data2, data3]);

  // 최종 사용할 데이터 소스
  const finalData1 = data1 || years;
  const finalData2 = data2 || months;
  const finalData3 = data3 || dateDays;

  // 인덱스 범위 체크 (Date 모드에서 월이 바뀌어 일수가 줄어들 때 등)
  useEffect(() => {
    if (selectedDayIndex >= finalData3.length) {
      setSelectedDayIndex(Math.max(0, finalData3.length - 1));
    }
  }, [finalData3.length, selectedDayIndex]);

  // 열릴 때마다 초기값 반영
  useEffect(() => {
    if (!visible) return;

    // 초기값 인덱스 재계산
    const newInitYearIndex = Math.max(0, finalData1.indexOf(initialFirst));
    const newInitMonthIndex = Math.max(0, finalData2.indexOf(initialSecond));

    // Custom 모드와 Date 모드에서의 3번째 컬럼 인덱스 처리 차이 확인 (Date는 1일부터라 -1 했었음)
    // Custom 모드(data3 존재)는 값 자체가 인덱스와 매핑되거나 indexOf로 찾음. 
    // 여기서는 일단 단순화: 
    // data3가 있으면: indexOf 사용 (값 매칭)
    // data3가 없으면(Date): initialThird - 1 (1일 -> 인덱스 0)
    let newInitDayIndex;
    if (data3) {
      newInitDayIndex = Math.max(0, data3.indexOf(initialThird));
    } else {
      newInitDayIndex = Math.max(0, initialThird - 1);
    }

    setSelectedYearIndex(newInitYearIndex);
    setSelectedMonthIndex(newInitMonthIndex);
    setSelectedDayIndex(newInitDayIndex);
  }, [visible, initialFirst, initialSecond, initialThird]);

  if (!visible) return null;

  const handleConfirm = () => {
    const val1 = finalData1[selectedYearIndex];
    const val2 = finalData2[selectedMonthIndex];
    const val3 = finalData3[selectedDayIndex];
    onConfirm?.(val1, val2, val3); // 인자 순서대로 전달 (year/month/day OR custom1/2/3)
    onClose?.();
  };

  return (
    <>
      {/* 피커 바깥 영역 터치(=스크롤 시작 포함) 시 확인 없이 닫기.
          투명 백드롭이 콘텐츠를 덮으므로, 열려 있는 동안 바깥을 건드리면 즉시 사라진다. */}
      {dismissOnBackdropPress && (
        <Pressable style={styles.backdrop} onPress={onClose} />
      )}
      <View style={[styles.sheetContainer, style]}>
        <View style={styles.sheetBg}>
        <View style={styles.pickerRow}>
          <WheelPicker
            data={finalData1}
            selectedIndex={selectedYearIndex}
            onValueChange={setSelectedYearIndex}
            unit={initialFirstText}
            accentColor={accentColor}
          />
          <WheelPicker
            data={finalData2}
            selectedIndex={selectedMonthIndex}
            onValueChange={setSelectedMonthIndex}
            unit={initialSecondText}
            accentColor={accentColor}
          />
          <WheelPicker
            data={finalData3}
            selectedIndex={selectedDayIndex}
            onValueChange={setSelectedDayIndex}
            unit={initialThirdText}
            accentColor={accentColor}
          />
        </View>
      </View>

      <NextBar
        onPress={handleConfirm}
        activeColor={accentColor}
        message={message}
        style={{
          top: undefined,
          bottom: 40,
          zIndex: 1000,
          alignSelf: "center",
        }}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // 피커 위쪽 전체를 덮는 투명 백드롭. 화면을 어둡게 하지 않고 바깥 터치만 가로챈다.
  // sheetContainer(zIndex 999)보다 낮은 998로 두어 피커/확인 버튼은 그대로 눌린다.
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    bottom: Platform.select({ ios: Spacing[0], android: 51 }),
    width: SCREEN_WIDTH,
    height: pickerHeight,
    zIndex: 999,
  },
  sheetBg: {
    flex: 1,
    backgroundColor: ColorTokens.InnerBox2,
    alignItems: "center",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    height: ITEM_HEIGHT * 3,
    paddingHorizontal: 40,
    marginVertical: Spacing[6], 
  },
});
