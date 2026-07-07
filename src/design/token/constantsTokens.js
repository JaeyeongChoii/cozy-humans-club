import { Platform } from "react-native";
import {
  heightScale,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  widthScale,
} from "../../utils/scale";
import { Spacing } from "../Spacing";
import { ColorTokens } from "./ColorTokens";

// message_content 상수
export const MESSAGE_CONTENT_WIDTH = widthScale(367);

// next_bar 상수
export const NEXT_BAR_TOP = Platform.OS === "android" ? 
  SCREEN_HEIGHT - heightScale(98) - heightScale(98)
  :
  SCREEN_HEIGHT - heightScale(50) - heightScale(98); // '다음으로' 버튼의 위치
export const NEXT_BAR_TOP_IN_SETTING = Platform.OS === "android" ? 
  SCREEN_HEIGHT - heightScale(98) - heightScale(98)
  :
  SCREEN_HEIGHT - heightScale(50) - heightScale(98); // '다음으로' 버튼의 위치
export const NEXT_BAR_WIDTH = 287; // '다음으로' 버튼 길이들
export const NEXT_BAR_HEIGHT = 50;

//CatMessageBox
export const CATBOX_SETTING_HEIGHT = -35 + 150; // 세팅에서의 CatMessageBox 위치

// textInput 상수
export const TEXT_INPUT_TOP = SCREEN_HEIGHT / 2;
export const TEXT_INPUT_WIDTH = widthScale(361);
export const TEXT_INPUT_HEIGHT = 50;

// textInput의 윤곽선 색깔
export const DEFAULT_OUTLINE_COLOR = "transparent";
export const RED_OUTLINE_COLOR = ColorTokens.Warning;

// 글자 색깔
export const DEFAULT_TEXT_COLOR = ColorTokens.Unselected;

// Popup 상수
export const POPUP_CONTAINER_WIDTH = widthScale(330);
export const POPUP_CONTAINER_HEIGHT = heightScale(220);
export const POPUP_MAIN_HEIGHT = heightScale(150);
export const POPUP_BUTTON_HEIGHT = heightScale(70);

// 글자 크기
export const DEFAULT_FONT_SIZE = 12;

// 이메일 글자 최대 길이
export const EMAIL_MAX_LENGTH = 40;

// ID 글자 최대 길이
export const ID_MAX_LENGTH = 50;

// check_button 상수
// 아이콘 PNG에 사방 투명 여백(4/5 비율)을 추가했으므로, 보이는 글리프 크기 24pt를 유지하려면 박스는 30(=24*5/4)
export const CHECK_BUTTON_SIZE = 30;

// bottomSheet 상수
export const BOTTOM_SHEET_START = SCREEN_HEIGHT * 0.07; // 바텀시트 시작 위치
export const BOTTOM_SHEET_SUBTITLE_HEIGHT = 55; // 부제 높이
export const BOTTOM_SHEET_HEIGHT =
  SCREEN_HEIGHT - BOTTOM_SHEET_START - BOTTOM_SHEET_SUBTITLE_HEIGHT - 30; // 실질적으로 보는 공간, 70으로 아래 여유공간을 만들어 둠

// post 상수
export const defaultPostUpperMarginTop = Spacing[3];

// 길게 누르는 조건 0.5초
export const LONG_PRESS_TIME = 500;

// 최소 버튼 인식 공간
export const MIN_TOUCHABLE_LENGTH = 40;

// 탭 바 높이
export const TAB_BAR_HEIGHT = Platform.select({ ios: 70, android: 65 });

// 스트로크(구분선·테두리) 굵기 — iOS는 0.5, Android는 1로 일괄 통일
export const STROKE_WIDTH = Platform.select({ ios: 0.5, android: 1 });

// 테마
export const THEME = {
  // ALL, Jam, Jin
  //ALL: "All",
  JAM: "자유", //자유
  JIN: "진지",  // 진지
  // 최신순, 인기순
  LAST: "최신순",
  POPULAR: "인기순",
  COMMENT: "comment",
};

// 미디어 비율 상수
export const MEDIA_RATIO = {
  IMAGE: {
    WIDE_THRESHOLD: 1.1, // 1.1 이상이면 Wide
    TALL_THRESHOLD: 0.9, // 0.9 미만이면 Tall
    MIN_TALL_RATIO: 0.75, // Tall 최소 비율 (3:4)
  },
  VIDEO: {
    WIDE_THRESHOLD: 1.1,
    TALL_THRESHOLD: 0.9,
    RATIO_2_1: 2,
    RATIO_4_3: 1.3333,
  }
};

// Dynamic Label 상수 (Lab.js)
export const DYNAMIC_LABEL_HEIGHT = 30;
export const DYNAMIC_LABEL_SIDE_WIDTH = 9;
export const DYNAMIC_LABEL_FONT_SIZE = 10.5;
export const DYNAMIC_LABEL_BORDER_WIDTH = 2;
// Dynamic Label 선택지
export const DYNAMIC_LABEL_0_NONE = "원하는 답변 유형 (선택)";
export const DYNAMIC_LABEL_1_EMPATHY = "공감하는 사람";
export const DYNAMIC_LABEL_2_ADVISE = "조언이 필요";
export const DYNAMIC_LABEL_3_EXPLAIN = "설명해줄 사람";
export const DYNAMIC_LABEL_4_OTHER = "다른 관점이 궁금";

// 온보딛용 클럽 룰 스크린 높이
export const ONBOARDING_CLUBRULE_HEIGHT = SCREEN_HEIGHT - heightScale(200);
// 설정용 클럽 룰 스크린 높이
export const SETTING_CLUBRULE_HEIGHT = heightScale(600);
