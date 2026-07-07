import { StyleSheet } from "react-native";

/*
userUnacceptedText: {
    // 색상 조정
    color: ColorTokens.Unselected,
    // 위치 조정
    marginTop: Spacing[8],
    ...Typography.headingMedium, ->  이런 식으로 사용
  },


   <Text style={[Typography.headingMedium, styles.userUnacceptedText]}> ->  이런 식으로 사용
          현재 입장문이 닫혀 있어요.
        </Text>
 */

export const Typography = StyleSheet.create({
  // Heading
  headingXLarge: {
    fontFamily: "BoldDunggeunmo",
    fontSize: 20,
    includeFontPadding: false,
  },
  headingLarge: {
    fontFamily: "BoldDunggeunmo",
    fontSize: 16,
    includeFontPadding: false,
  },
  headingMedium: {
    fontFamily: "BoldDunggeunmo",
    fontSize: 12,
    includeFontPadding: false,
  },
  headingSmall: {
    fontFamily: "BoldDunggeunmo",
    fontSize: 10,
    includeFontPadding: false,
  },

  //Bold
  boldLarge: {
    fontFamily: "NeoDunggeunmoPro",
    fontSize: 16,
    lineHeight: 29,
    includeFontPadding: false,
  },
  boldMedium: {
    fontFamily: "NeoDunggeunmoPro",
    fontSize: 12,
    lineHeight: 22,
    includeFontPadding: false,
  },
  boldSmall: {
    fontFamily: "NeoDunggeunmoPro",
    fontSize: 10,
    lineHeight: 18,
    includeFontPadding: false,
  },
  boldXSmall: {
    fontFamily: "NeoDunggeunmoPro",
    fontSize: 8,
    lineHeight: 14,
    includeFontPadding: false,
  },
  boldXLarge: {
    fontFamily: "NeoDunggeunmoPro",
    fontSize: 20,
    lineHeight: 36,
    includeFontPadding: false,
  },

  //Paragraph
  paraLarge: {
    fontFamily: "Galmuri",
    fontSize: 16,
    lineHeight: 29,
    includeFontPadding: false,
  },
  paraMedium: {
    fontFamily: "Galmuri",
    fontSize: 12,
    lineHeight: 22,
    includeFontPadding: false,
  },
  paraSmall: {
    fontFamily: "Galmuri",
    fontSize: 10,
    lineHeight: 18,
    includeFontPadding: false,
  },
  paraXSmall: {
    fontFamily: "Galmuri",
    fontSize: 8,
    lineHeight: 14,
    includeFontPadding: false,
  },
});
