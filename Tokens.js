import { Platform, StyleSheet } from "react-native";
import { ColorTokens } from "./src/design/token/ColorTokens";
import { SCREEN_WIDTH, widthScale } from "./src/utils/scale";
import { Spacing } from "./src/design/Spacing";
import { Typography } from "./src/design/Typography";
import { Radius } from "./src/design/Radius";
import { STROKE_WIDTH } from "./src/design/token/constantsTokens";

const Tokens = StyleSheet.create({
  meatball: {
    width: 18,
    height: 4,
    zIndex: 100,
  },
  profile_ex: {
    ...Typography.paraSmall,
    color: ColorTokens.Unselected,
  },
  nickname: {
    color: ColorTokens.Typography,
    ...Typography.boldMedium,
    opacity: 0.8,
  },
  talk_category: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
  likenumber: {
    color: ColorTokens.Typography,
    textAlign: "center",
    ...Typography.boldMedium,
    paddingTop: 1, //숫자 높이 조절
    marginLeft: 2,
  },
  posttext: {
    ...Typography.paraMedium,
    color: ColorTokens.Typography,
    marginRight: 8,
    marginTop: Spacing[3],
  },
  menu: {
    //더보기 버튼을 눌렀을 때 나오는 메뉴 스타일
    position: "absolute",
    top: 40, // 버튼 아래에 위치하게 조절
    right: 0,
    backgroundColor: ColorTokens.Background2,
    borderRadius: Radius.sm,
    width: 130,
    zIndex: 101, //버튼이 가장 앞에서 보이도록 함.
    marginRight: Platform.select({ ios: 0, android: Spacing[4] }),
  },
  menuItem: {
    color: ColorTokens.Typography,
    textAlign: "center",
    ...Typography.boldMedium,
    zIndex: 100,
  },
  topBar: {
    position: "absolute",
    flexDirection: "row", //가로로 컴포넌트를 배치
    alignItems: "center", //자식 요소들을 중앙 정렬
    justifyContent: "space-between", // 자식 요소들 사이에 최대한의 간격을 둠
    marginTop: Spacing[9],
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[4],
    borderColor: ColorTokens.Warning,
    borderWidth: 2,
  },
  cancel_import_Text: {
    ...Typography.boldMedium,
    color: ColorTokens.Unselected,
  },
  dropdown: {
    //드롭다운 버튼에 대한 속성
    flexDirection: "row",
    alignItems: "center",
    gap: 4.4,
  },
  dropdownText: {
    color: ColorTokens.Typography,
    ...Typography.boldMedium,
  },
  inputtext: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
  quotedContainer: {
    padding: 8,
    marginTop: 20,
    borderColor: ColorTokens.Stroke,
    borderRadius: 3,
    borderWidth: STROKE_WIDTH,
  },
  votebox: {
    backgroundColor: ColorTokens.InnerBox,
    borderRadius: 5,
    borderWidth: STROKE_WIDTH,
    borderColor: ColorTokens.Stroke,
    alignSelf: "center",
    width: SCREEN_WIDTH * 0.95,
    marginTop: 12,
  },
  followbutton: {
    width: 60,
    height: 30,
  },
});

export default Tokens;
