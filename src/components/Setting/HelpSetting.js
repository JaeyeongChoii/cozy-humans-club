// 설정
// 고객지원
import {
  Keyboard,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ColorTokens } from "../../design/token/ColorTokens";
import { SCREEN_WIDTH, heightScale, widthScale } from "../../utils/scale";
import BackButton from "../BackButton";
import ScreenLayout from "../ScreenLayout";
import SettingCheck from "../SettingCheck";
import ReportExplain from "../Report/ReportExplain";
import DialogueView from "../DialogueView";
import ReportTargetInput from "../Report/ReportTargetInput";
import ReportAccepted from "../Report/ReportAccepted";
import { useToast } from "../ToastContext";
import { Typography } from "../../design/Typography";
import { Spacing } from "../../design/Spacing";
import { postApi } from "../../api/postApi";

const ERROR_REASONS = [
  { id: 1, text: "앱이 멈추거나 꺼졌어" },
  { id: 2, text: "화면이 늦게 뜨거나 안 열려" },
  { id: 3, text: "버튼을 눌렀는데 기대한 대로 작동하지 않았어" },
  { id: 4, text: "화면이 이상하게 보여" },
  { id: 5, text: "기타" },
];

const REPORT_REASONS = [
  { id: 1, text: "지속적인 괴롭힘이나 공격이 있어" },
  { id: 2, text: "혐오·차별적인 말이나 행동이 있어" },
  { id: 3, text: "성적으로 불편하거나 원치 않는 표현이 있어" },
  { id: 4, text: "위협적이거나 위험해 보여" },
  { id: 5, text: "사기·피싱·의심스러운 시도가 있어" },
  { id: 6, text: "스팸 또는 반복적인 도배 같아" },
  { id: 7, text: "기타" },
];

const FEEDBACK_REASONS = [
  { id: 1, text: "기능에 대한 제안이 있어" },
  { id: 2, text: "쓰면서 불편한 점이 있었어" },
  { id: 3, text: "표현이나 운영 정책에 대해 의견이 있어" },
  { id: 4, text: "기타" },
];

const CATEGORY_LABELS = {
  error: "오류가 있어요",
  report: "유저를 신고하고 싶어요",
  feedback: "클럽을 위해 피드백 하고 싶어요",
  objection: "처분에 대해 이의를 제기하고 싶어요",
  etc: "기타",
};

const menuItems = [
  {
    id: 0,
    category: "error",
    text: CATEGORY_LABELS.error,
  },
  {
    id: 1,
    category: "report",
    text: CATEGORY_LABELS.report,
  },
  {
    id: 2,
    category: "feedback",
    text: CATEGORY_LABELS.feedback,
  },
  {
    id: 3,
    category: "objection",
    text: CATEGORY_LABELS.objection,
  },
  {
    id: 4,
    category: "etc",
    text: CATEGORY_LABELS.etc,
  },
];

const HelpSetting = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();

  const [showMenu, setShowMenu] = useState(false);
  const [step, setStep] = useState(0);
  // Step 정의:
  // [Report]: 1(Input) -> 2(Check) -> 3(Explain) -> 4(Accepted) -> 5(Thanks & Bye)
  // [Others]: 1(Check) -> 2(Explain) -> 3(Thanks & Bye)
  // [Etc]: 2(Explain) -> 3(Thanks & Bye)

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [description, setDescription] = useState("");
  const [reportTarget, setReportTarget] = useState("");
  const [isReportTargetSelected, setIsReportTargetSelected] = useState(false);
  const [selectedReportAction, setSelectedReportAction] = useState(null);
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReport = selectedCategory === "report";
  const isObjection = selectedCategory === "objection";
  const isPostReport =
    route.params?.reportSource === "post" &&
    route.params?.postId != null &&
    route.params?.postType;

  const getSelectedReasonText = () => {
    const reasons =
      selectedCategory === "error"
        ? ERROR_REASONS
        : selectedCategory === "feedback"
          ? FEEDBACK_REASONS
          : selectedCategory === "report"
            ? REPORT_REASONS
            : [];

    return reasons.find((reason) => reason.id === selectedOption)?.text;
  };

  const submitReport = async () => {
    const selectedReasonText = getSelectedReasonText();
    const categoryLabel = isPostReport
      ? "게시물신고"
      : CATEGORY_LABELS[selectedCategory];
    const category = selectedReasonText || categoryLabel;

    setIsSubmitting(true);
    try {
      await postApi.submitReport({
        ...(isPostReport && {
          postId: route.params.postId,
          postType: route.params.postType,
        }),
        // TODO: 유저 검색 API가 연결되면 아래 API 필드가 전달되도록 추가한다.
        // post_id: reportTarget (postApi 호출 시 postId)
        // post_type: "user" (postApi 호출 시 postType)
        category,
        reportType: categoryLabel,
        reason: description,
      });
      return true;
    } catch (error) {
      console.error("Report submission failed:", error);

      if (
        isPostReport &&
        error?.status === 409 &&
        error?.message === "이미 신고한 게시글입니다."
      ) {
        showToast({
          message: "이미 신고한 게시글이야!",
          withOverlay: true,
        });
        navigation.navigate("Main", { screen: "Home" });
        return false;
      }

      showToast({
        message: "제보를 전송하지 못했어. 다시 시도해줘.",
        withOverlay: true,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 단계별 버튼 활성화 체크
  useEffect(() => {
    if (step === 1) {
      if (isReport) {
        setIsNextDisabled(!isReportTargetSelected);
      } else if (
        selectedCategory === "error" ||
        selectedCategory === "feedback"
      ) {
        setIsNextDisabled(!selectedOption);
      } else {
        setIsNextDisabled(false);
      }
    } else if (step === 2) {
      if (isReport) {
        setIsNextDisabled(!selectedOption);
      } else {
        setIsNextDisabled(description.length === 0);
      }
    } else if (step === 3) {
      if (isReport) {
        setIsNextDisabled(description.length === 0);
      } else if (isObjection) {
        setIsNextDisabled(description.length === 0);
      }
    } else if (step === 4) {
      if (isReport) {
        // 완료 단계: 액션을 선택해야 넘어갈 수 있음
        setIsNextDisabled(!selectedReportAction);
      }
    }
  }, [
    step,
    selectedCategory,
    selectedOption,
    description,
    reportTarget,
    isReportTargetSelected,
    selectedReportAction,
  ]);

  const handleMenuClick = (item) => {
    setSelectedCategory(item.category);
    setStep(item.category === "etc" ? 2 : 1);
    setShowMenu(false);
  };

  const resetToCategoryMenu = () => {
    setStep(0);
    setShowMenu(true);
    setSelectedCategory(null);
    setSelectedOption(null);
    setDescription("");
    setReportTarget("");
    setIsReportTargetSelected(false);
    setSelectedReportAction(null);
  };

  const handleChangeReportTarget = (targetId) => {
    setReportTarget(targetId);
    setIsReportTargetSelected(false);
  };

  const handleSelectReportTarget = (targetId) => {
    setReportTarget(targetId);
    setIsReportTargetSelected(true);
  };

  const handleBack = (options) => {
    const skipKeyboardDismiss = options?.skipKeyboardDismiss === true;

    if (!skipKeyboardDismiss && Keyboard.isVisible()) {
      let didContinue = false;
      let fallbackTimer;
      let keyboardSubscription;

      const continueAfterKeyboard = () => {
        if (didContinue) return;
        didContinue = true;
        keyboardSubscription?.remove();
        if (fallbackTimer) clearTimeout(fallbackTimer);
        handleBack({ skipKeyboardDismiss: true });
      };

      keyboardSubscription = Keyboard.addListener(
        "keyboardDidHide",
        continueAfterKeyboard,
      );
      fallbackTimer = setTimeout(continueAfterKeyboard, 400);
      Keyboard.dismiss();
      return;
    }

    const fromExternal =
      route.params?.category === "report" &&
      (route.params?.targetId || isPostReport);

    if (step === 1) {
      resetToCategoryMenu();
    } else if (step === 2) {
      if (fromExternal) {
        navigation.goBack();
      } else if (isObjection) {
        resetToCategoryMenu();
      } else if (selectedCategory === "etc") {
        resetToCategoryMenu();
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      if (isReport) {
        setStep(2);
      } else if (isObjection) {
        resetToCategoryMenu();
      }
    } else if (step === 4) {
      if (isReport) {
        setStep(3); // ReportAccepted -> ReportExplain
      } else {
        setStep(3); // Bye -> Thanks
      }
    } else if (step === 5) {
      if (isReport) {
        setStep(4); // Thanks -> ReportAccepted
      }
    } else if (step === 6) {
      if (isReport) {
        setStep(5); // Bye -> Thanks
      }
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (isReport) {
        setStep(3);
      } else if (isObjection) {
        setStep(3);
      } else {
        if (await submitReport()) setStep(3);
      }
    } else if (step === 3) {
      if (isReport) {
        console.log(
          `제출 [${selectedCategory}]:`,
          reportTarget,
          selectedOption,
          description,
        );
        setStep(4);
      } else if (isObjection) {
        if (await submitReport()) setStep(4);
      }
    } else if (step === 4) {
      if (isReport) {
        console.log("Selected Action:", selectedReportAction);
        // ReportAccepted -> Thanks (Step 5)
        // 토스트는 여기서 출력하지 않고 마지막에 출력
        if (await submitReport()) setStep(5);
      }
    }
  };

  const getNextBarMessage = () => {
    if (isReport) {
      if (step === 4) return "확인하기";
      if (step === 1) return "이 계정이야";
      return step === 3 ? "제출하기" : "확인하기";
    }
    return step === 2 || step === 3 ? "제출하기" : "확인하기";
  };

  const showScreenLayout =
    (isReport && step <= 4) ||
    (isObjection && step === 3) ||
    (!isReport && !isObjection && step <= 2 && step > 0);

  if (isObjection && step <= 2) {
    return (
      <DialogueView
        text={
          step === 1
            ? "우선 우리가 이러한 처분을 내린건 현재 공간안에 있는 클럽 멤버 모두의 안전과 편안함을 위해서 내린 운영진의 결정이야. "
            : "하지만 그 안에서 이해가 안될 수 있는 부분도 존재한다고 생각해."
        }
        onPress={() => setStep(step + 1)}
        imageAddress={require("../../../assets/image/dialogueImage4.png")}
      />
    );
  }

  if (showScreenLayout) {
    return (
      <ScreenLayout
        onBack={handleBack}
        hideBackButton={step === 4}
        containerStyle={styles.screenLayoutContainer}
        contentStyle={styles.screenLayoutContent}
        nextBarProps={{
          onPress: handleNext,
          disabled: isNextDisabled || isSubmitting,
          message: getNextBarMessage(),
        }}
      >
        {step === 1 && isReport && (
          <ReportTargetInput
            targetId={reportTarget}
            onChangeTargetId={handleChangeReportTarget}
            onSelectTargetId={handleSelectReportTarget}
          />
        )}
        {step === 1 && !isReport && !isObjection && (
          <SettingCheck
            data={
              selectedCategory === "error" ? ERROR_REASONS : FEEDBACK_REASONS
            }
            title={
              selectedCategory === "feedback"
                ? "어떤 이야기가 하고 싶어?"
                : "어떤 문제가 있었어?"
            }
            selectedReason={selectedOption}
            onSelectReason={setSelectedOption}
            style={{}}
          />
        )}

        {step === 2 && isReport && (
          <SettingCheck
            data={REPORT_REASONS}
            title="어떤 문제가 있었어?"
            selectedReason={selectedOption}
            onSelectReason={setSelectedOption}
          />
        )}
        {step === 2 && !isReport && !isObjection && (
          <ReportExplain
            description={description}
            onChangeDescription={setDescription}
            title={
              selectedCategory === "etc"
                ? "하고싶은 이야기를 자유롭게 해줘!"
                : "조금 더 자세히 설명 해줄 수 있어?\n\n그러면 내가 문제를 더 빠르게 해결 할 수 있을거야."
            }
            highlightWords={{
              "그러면 내가 문제를 더 빠르게 해결 할 수 있을거야.": {
                ...Typography.paraSmall,
              },
            }}
          />
        )}

        {step === 3 && isObjection && (
          <ReportExplain
            description={description}
            onChangeDescription={setDescription}
            title="편하게 너가 운영진에게 전달하고 실은 내용을 적어줘."
          />
        )}

        {step === 3 && isReport && (
          <ReportExplain
            description={description}
            onChangeDescription={setDescription}
            title={
              "조금 더 자세히 설명 해줄 수 있어?\n\n그러면 내가 문제를 더 빠르게 해결 할 수 있을거야."
            }
            highlightWords={{
              "그러면 내가 문제를 더 빠르게 해결 할 수 있을거야.": {
                ...Typography.paraSmall,
              },
            }}
          />
        )}

        {step === 4 && isReport && (
          <ReportAccepted
            selectedAction={selectedReportAction}
            onSelectAction={setSelectedReportAction}
          />
        )}
      </ScreenLayout>
    );
  }

  // 감사 인사 및 종료 (Report: 5, Others: 3)
  if (
    (isReport && step === 5) ||
    (isObjection && step === 4) ||
    (!isReport && !isObjection && step === 3)
  ) {
    return (
      <DialogueView
        text={
          "신경써서 이야기 해줘서 고마워.\n덕분에 모두가 편안하고 안전한 환경에서 머물 수\n있을꺼야."
        }
        onPress={() => {
          if (isReport) {
            setStep(6);
          } else if (isObjection) {
            setStep(5);
          } else {
            setStep(4);
          }
        }}
        imageAddress={require("../../../assets/image/smileImage.png")}
      />
    );
  }

  // 최종 감사 인사 및 종료 (Report: 6, Others: 4)
  if (
    (isReport && step === 6) ||
    (isObjection && step === 5) ||
    (!isReport && !isObjection && step === 4)
  ) {
    return (
      <DialogueView
        text={"언제든 이야기 싶은게 있으면 또 방문해줘!"}
        onPress={() => {
          if (isReport) {
            // 종료 직전 토스트 출력
            if (selectedReportAction === "mute") {
              showToast({
                message: "해당 멤버가 뮤트되었습니다.",
                withOverlay: true,
              });
            } else if (selectedReportAction === "block") {
              showToast({
                message: "해당 멤버가 차단되었습니다.",
                withOverlay: true,
              });
            }
          }
          navigation.goBack();
        }}
        imageAddress={require("../../../assets/image/smileImage.png")}
      />
    );
  }

  // 메뉴 화면
  if (showMenu) {
    return (
      <SafeAreaView
        style={styles.menuContainer}
        edges={Platform.OS === "android" ? ["top", "left", "right"] : undefined}
      >
        <BackButton
          onPress={() => {
            setShowMenu(false);
            setIsReturning(true);
          }}
        />

        <View style={styles.settingListContainer}>
          {menuItems.map((item) => (
            <View
              key={item.id}
              style={{
                paddingBottom: 35,
              }}
            >
              <TouchableOpacity
                style={styles.settingTouchable}
                key={item.id}
                onPress={() => handleMenuClick(item)}
              >
                <Text style={styles.settingText}>{item.text}</Text>
                <Image
                  source={require("../../../assets/button/RightDirection.png")}
                  style={styles.nextButton}
                />
              </TouchableOpacity>
              <View style={styles.line} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // 초기 화면
  return (
    <DialogueView
      text={
        isReturning
          ? "만나서 반가웠어.\n또 하고싶은 말이 생기면 언제든 방문해줘!"
          : "내 사무실에 온걸 환영해!\n내가 어떤걸 도와주면 좋을까?"
      }
      onPress={() => {
        if (isReturning) {
          navigation.goBack();
          return;
        }

        if (route.params && route.params.category === "report") {
          const { targetId } = route.params;
          setSelectedCategory("report");
          if (isPostReport) {
            setStep(2);
          } else if (targetId) {
            setReportTarget(targetId);
            setStep(2);
          } else {
            setStep(1);
          }
        } else {
          setShowMenu(true);
        }
      }}
      imageAddress={require("../../../assets/image/dialogueImage4.png")}
    />
  );
};

export default HelpSetting;

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: ColorTokens.Background2,
    paddingBottom: Platform.select({ android: Spacing[0] }),
  },
  screenLayoutContainer: {
    paddingBottom: Platform.select({ android: Spacing[0] }),
  },
  screenLayoutContent: {
    position: "relative",
    top: 0,
    width: "100%",
    height: "auto",
    flex: 1,
    alignSelf: "stretch",
  },
  settingListContainer: {
    top: heightScale(223),
    left: (SCREEN_WIDTH - widthScale(359)) / 2,
  },
  settingTouchable: {
    paddingBottom: Spacing[1],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingText: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    ...Typography.boldMedium,
    // 위치 조정
    marginLeft: Spacing[5],
  },
  nextButton: {
    // 색상 조정
    color: ColorTokens.Typography,
    // 폰트 조정
    fontSize: 25,
    // 위치 조정
    left: -(SCREEN_WIDTH - widthScale(359)) / 2 - 20, // line의 width길이를 제외한 남은공간 동일하게 부여 + 20 패딩
  },
  line: {
    backgroundColor: ColorTokens.Typography,
    width: widthScale(359),
    height: 1,
    opacity: 0.2,
  },
});
