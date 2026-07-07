import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ColorTokens } from "../../design/token/ColorTokens";
import { heightScale, SCREEN_WIDTH } from "../../utils/scale";
import { Spacing } from "../../design/Spacing";
import { Typography } from "../../design/Typography";
import DynamicButton from "../DynamicButton";
import HighlightText from "../HighlightText/index.js";
import { SETTING_CLUBRULE_HEIGHT } from "../../design/token/constantsTokens.js";

// 데이터 정의
const termsData = [
  {
    id: 1,
    title: "",
    text: "본 약관은 코지 휴먼즈 클럽(이하 “회사”)이 제공하는 소셜미디어 서비스 “코지 휴먼즈 클럽(COZY HUMANS' CLUB)”의 이용과 관련하여 회사와 멤버 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.",
  },
  {
    id: 2,
    title: "제 1조 목적",
    text: "본 약관은 회사가 제공하는 서비스의 이용 조건 및 절차, 멤버와 회사의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
  },
  {
    id: 3,
    title: "제 2조 정의",
    text: "“코지 휴먼즈 클럽”이란 회사가 제공하는 웹·모바일 기반 소셜미디어 플랫폼을 말합니다.\n“멤버”이란 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.\n“게시물”이란 멤버가 서비스에 게시한 텍스트, 이미지, 영상 등 일체의 콘텐츠를 말합니다.\n“운영자”란 회사로부터 서비스 운영 권한을 부여받은 자를 말합니다.\n“서비스”란 회사가 제공하는 코지 휴먼즈 클럽 플랫폼 및 그 부수 기능 일체를 말합니다.\n“계정”이란 멤버 식별 및 서비스 이용을 위하여 부여되는 정보 일체를 말합니다.\n“이용계약”이란 멤버가 본 약관에 동의하고 회사가 이를 승인함으로써 성립하는 계약을 말합니다.\n“클럽 규칙”이란 멤버의 게시물 및 활동에 대한 허용·제재 기준을 정한 회사의 운영 기준을 말합니다.",
  },
  {
    id: 4,
    title: "제3조 약관의 효력 및 변경",
    text: "본 약관은 멤버에게 적용됩니다.\n회사는 약관을 변경할 경우 시행일 7일 전부터 제13조에 따른 방법으로 통지합니다. 다만 멤버에게 불리한 변경의 경우 30일 전 통지합니다.\n멤버가 변경된 약관에 동의하지 않는 경우 이용계약을 해지할 수 있으며, 변경 이후에도 서비스를 계속 이용하는 경우 변경에 동의한 것으로 봅니다.",
  },
  {
    id: 5,
    title: "제4조 회원가입 및 연령 제한",
    text: "서비스는 만 14세 이상만 가입할 수 있습니다.\n회사는 입력된 생년월일 정보를 기준으로 연령을 확인합니다.\n허위 정보 입력 시 이용 제한이 있을 수 있습니다.",
  },
  {
    id: 6,
    title: "제5조 제공되는 서비스",
    text: "회사는 다음의 서비스를 제공합니다.\n게시물의 작성, 열람, 수정 및 삭제\n게시물에 대한 댓글 작성\n기타 회사가 제공하는 부수 서비스",
  },
  {
    id: 7,
    title: "제6조 멤버의 의무",
    text: "멤버는 다음 행위를 해서는 안 됩니다.\n타인의 권리 또는 개인정보 침해\n불법, 차별, 혐오, 모욕 행위\n상업적 광고 또는 홍보 행위\n자동화된 계정 또는 활동을 통한 서비스 방해 행위\n서비스의 안전성과 신뢰를 현저히 훼손하는 행위",
  },
  {
    id: 8,
    title: "제7조 게시물의 관리",
    text: "게시물의 저작권은 멤버에게 귀속됩니다.\n회사는 서비스 운영을 위하여 게시물을 저장, 전송, 전시할 수 있습니다.\n회사는 약관 또는 가이드라인 위반 시 게시물을 삭제하거나 접근을 제한할 수 있습니다.",
  },
  {
    id: 9,
    title: "제8조 신고 및 제재",
    text: "본 약관은 멤버에게 적용됩니다.\n회사는 약관을 변경할 경우 시행일 7일 전부터 제13조에 따른 방법으로 통지합니다. 다만 멤버에게 불리한 변경의 경우 30일 전 통지합니다.\n멤버가 변경된 약관에 동의하지 않는 경우 이용계약을 해지할 수 있으며, 변경 이후에도 서비스를 계속 이용하는 경우 변경에 동의한 것으로 봅니다.",
  },
  {
    id: 10,
    title: "제9조 회원 탈퇴",
    text: "멤버는 언제든지 탈퇴할 수 있으며, 관련 정보는 개인정보처리방침에 따릅니다.",
  },
  {
    id: 11,
    title: "제10조 서비스 변경 및 중단",
    text: "회사는 서비스를 변경 또는 중단할 수 있습니다.\n불가항력 시 사후 고지할 수 있습니다.\n베타 서비스의 경우 일부 오류가 있을 수 있으며 책임이 제한됩니다.",
  },
  {
    id: 12,
    title: "제11조 면책",
    text: "회사는 법령이 허용하는 범위 내에서 책임을 부담하지 않습니다.",
  },
  {
    id: 13,
    title: "제12조 준거법 및 관할",
    text: "본 약관은 대한민국 법령에 따르며, 분쟁은 관계 법령이 정하는 관할 법원에 따릅니다.",
  },
  {
    id: 14,
    title: "제13조 통지",
    text: "회사는 통지를 서비스 내 공지, 앱 알림, 이메일 등으로 할 수 있습니다.",
  },
];

const privacyData = [
  {
    id: 1,
    title: "",
    text: '코지 휴먼즈 클럽(이하 "회사")는 『개인정보 보호법』 및 관련 법령에 따라 이용자의 개인정보를 보호하고 권익을 보호하기 위하여 다음과 같은 개인정보처리방침을 수립·공개합니다.',
  },
  {
    id: 2,
    title: "제1조 수집하는 개인정보 항목",
    text: "회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.\n1. 회원가입 시: 이메일, 비밀번호, 닉네임, 생년월일(만 14세 이상 여부 확인 목적)\n2. 선택 입력 시: 프로필 이미지, 자기소개\n3. 서비스 이용 과정에서 자동 수집:\n• 접속 정보(접속 IP, 접속 일시)\n• 기기 정보(OS, 앱 버전, 단말기 모델)\n• 이용 기록(이용 내역, 활동 빈도, 신고 및 제재 이력, 부정 이용 기록)\n• 기술적 로그(오류·장애 분석 목적)\n※ 본 서비스는 만 14세 이상만 가입이 가능합니다.",
  },
  {
    id: 3,
    title: "제2조 개인정보 수집 및 이용 목적",
    text: "회사는 수집한 개인정보를 다음 목적에 한하여 이용합니다.\n1. 멤버 식별 및 본인 인증\n2. 서비스 제공 및 기능 운영\n3. 부정 이용 방지 및 서비스 안정성 확보\n4. 고객문의 및 민원 처리\n5. 마케팅 및 이벤트 정보 제공 (선택 동의 시)\n6. 법령상 의무 이행\n7. 분쟁 대응 및 운영 기록 관리\n8. 서비스 품질 개선 및 이용 지표 분석",
  },
  {
    id: 4,
    title: "제3조 개인정보 보유 및 이용 기간",
    text: "1. 원칙적으로 개인정보는 수집·이용 목적 달성 시 즉시 파기합니다.\n2. 다음의 정보는 관련 법령에 따라 일정 기간 보존됩니다.\n• 계약 및 결제 기록: 5년\n• 분쟁 처리 및 대응 기록: 3년\n3. 회원 탈퇴 시 개인정보는 탈퇴 요청일로부터 7일 후 파기됩니다.\n4. 법적 분쟁 또는 수사 목적 자료는 해당 절차 종료 시까지 보관될 수 있습니다.",
  },
  {
    id: 5,
    title: "제4조 개인정보의 제3자 제공",
    text: "회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따른 요청이 있는 경우는 예외로 합니다.",
  },
  {
    id: 6,
    title: "제5조 개인정보 처리의 위탁",
    text: "회사는 현재 개인정보 처리 업무를 외부에 위탁하지 않습니다. 향후 위탁이 발생할 경우 관련 법령에 따라 사전에 고지합니다.",
  },
  {
    id: 7,
    title: "제6조 이용자의 권리 및 행사방법",
    text: "1. 이용자는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지 요청을 할 수 있습니다.\n2. 회사는 본인 확인 후 최대 10일 이내에 처리하며, 복잡한 요청의 경우 최대 14일까지 소요될 수 있고 그 사유를 통지합니다.",
  },
  {
    id: 8,
    title: "제7조 (개인정보의 파기절차 및 방법)",
    text: "1. 전자적 파일 형태는 복구 불가능한 방식으로 삭제합니다.\n2. 종이 문서는 분쇄 또는 소각 처리합니다.",
  },
  {
    id: 9,
    title: "제8조 자동 수집 정보",
    text: "회사는 서비스 제공을 위하여 앱 내 저장소, 세션 식별자 등 유사 기술을 사용할 수 있습니다.",
  },
  {
    id: 10,
    title: "제9조 개인정보 보호책임자 및 문의처",
    text: "• 개인정보 보호 전담팀: 코지 휴먼즈 클럽 운영팀\n• 이메일: cozyhumansclub@gmail.com",
  },
  {
    id: 11,
    title: "제10조 게시물 및 운영 기록 관리",
    text: "1. 멤버가 작성한 게시물은 탈퇴 시 삭제됩니다.\n2. 신고 및 제재 이력은 분쟁 대응 및 법령 준수를 위해 일정 기간 보관될 수 있습니다.",
  },
  {
    id: 12,
    title: "제11조 안전성 확보조치",
    text: "회사는 개인정보의 안전성을 확보하기 위하여 접근 권한 관리, 암호화, 접속 기록 보관, 보안 점검 및 물리적 보호조치를 시행합니다.",
  },
  {
    id: 13,
    title: "제12조 개정 및 고지",
    text: "1. 본 방침은 법령 또는 내부 정책에 따라 변경될 수 있으며, 시행일 7일 전부터 서비스 내 공지사항 또는 알림을 통해 고지합니다.\n2. 멤버에게 불리한 변경의 경우 30일 전 고지합니다.",
  },
];

const licenseData = [
  {
    id: 1,
    title: "",
    text: "• BoldDungGeunMo Regular — Public Domain (same as original)",
  },
  {
    id: 2,
    title: "",
    text: "• Galmuri14 — SIL Open Font License 1.1",
  },
  {
    id: 3,
    title: "",
    text: "• DotGothic16 — SIL Open Font License 1.1",
  },
  {
    id: 4,
    title: "",
    text: "• Copyright © 2017-2024, Eunbin Jeong (Dalgona.) <project-neodgm@dalgona.dev>\nwith reserved font name \"Neo둥근모 Pro\" and \"NeoDunggeunmo Pro\".",
  },
];

const SettingDetailView = () => {
  const route = useRoute();
  const { detailType } = route.params || {};

  let currentData = [];
  let screenTitle = "";
  let detailLink = "";

  if (detailType === 0) {
    currentData = termsData;
    screenTitle = "이용약관";
    detailLink = "";
  } else if (detailType === 1) {
    currentData = privacyData;
    screenTitle = "개인정보 처리방침";
    detailLink = "";
  } else if (detailType === 2) {
    currentData = licenseData;
    screenTitle = "폰트 라이선스";
    detailLink = "https://github.com/neodgm/neodgm-pro/blob/main/LICENSE.txt";
  }

  const renderNoticeContent = (notice) => {
    const { id, text } = notice;

    // 이용약관(Type 0)의 ID 6, 7번은 첫 줄 번호 제외하고 나머지 목록화
    if (detailType === 0 && (id === 6 || id === 7) && text.includes("\n")) {
      const lines = text.split("\n");
      const header = lines[0];
      const body = lines.slice(1);

      return (
        <View>
          <Text style={[styles.headerText, detailType === 2 && Typography.boldMedium]}>{header}</Text>
          {body.map((line, index) => (
            <View key={index} style={styles.contentRow}>
              <Text
                style={[
                  styles.contentText,
                  id === 6 ? styles.bulletMargin6 : styles.bulletMargin4,
                  detailType === 2 && Typography.boldMedium,
                ]}
              >
                {id === 6 ? "•" : `${index + 1}.`}
              </Text>
              <Text style={[styles.contentText, styles.flex1, detailType === 2 && Typography.boldMedium]}>{line}</Text>
            </View>
          ))}
        </View>
      );
    }

    // 개인정보 처리방침(Type 1): 글머리 기호(•) 또는 일반 텍스트 혼합
    if (detailType === 1 && text.includes("\n")) {
      return (
        <View>
          {text.split("\n").map((line, index) => {
            const trimLine = line.trim();
            const isBullet = trimLine.startsWith("•");
            const isNumber = /^\d+\./.test(trimLine);

            let header = "";
            let content = trimLine;

            if (isBullet) {
              header = "•";
              content = trimLine.replace("•", "").trim();
            } else if (isNumber) {
              const dotIndex = trimLine.indexOf(".");
              header = trimLine.substring(0, dotIndex + 1);
              content = trimLine.substring(dotIndex + 1).trim();
            }

            if (!isBullet && !isNumber) {
              return (
                <View key={index} style={styles.contentFullWidth}>
                  <HighlightText
                    message={line}
                    highlightMap={{
                      "회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.": {
                        ...Typography.boldMedium
                      },
                      "회사는 수집한 개인정보를 다음 목적에 한하여 이용합니다.": {
                        ...Typography.boldMedium
                      },
                    }}
                    style={[styles.contentText, detailType === 2 && Typography.boldMedium]}
                  />
                </View>
              );
            }

            return (
              <View
                key={index}
                style={[styles.contentRow, { marginLeft: isBullet ? 14 : 0 }]}
              >
                <Text style={[styles.headerBullet, detailType === 2 && Typography.boldMedium]}>{header}</Text>
                <Text style={[styles.contentText, styles.flex1, detailType === 2 && Typography.boldMedium]}>
                  {content}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    if (detailType === 2 && id === 4 && text.includes("\n")) {
      const lines = text.split("\n");
      const firstLine = lines[0].replace(/^\s*•\s*/, "");
      const body = [firstLine, ...lines.slice(1)];

      return (
        <View style={styles.contentRow}>
          <Text style={[styles.headerBullet, Typography.boldMedium]}>•</Text>
          <View style={styles.flex1}>
            {body.map((line, index) => (
              <Text key={index} style={[styles.contentText, Typography.boldMedium]}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      );
    }

    if (text.includes("\n")) {
      return (
        <View>
          {text.split("\n").map((line, index) => (
            <View key={index} style={styles.contentRow}>
              <Text style={[styles.contentNumber, detailType === 2 && Typography.boldMedium]}>{index + 1}.</Text>
              <Text style={[styles.contentText, styles.flex1, detailType === 2 && Typography.boldMedium]}>{line}</Text>
            </View>
          ))}
        </View>
      );
    }
    return <Text style={[styles.contentText, detailType === 2 && Typography.boldMedium]}>{text}</Text>;
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          marginBottom: detailType === 2 ? Spacing[7] : Spacing[5],
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: 'center',
        }}
      >
        <Text style={styles.screenTitle}>{screenTitle}</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() =>
            Linking.openURL(detailLink)
          }
        >
          {detailType === 2 &&
            <DynamicButton text="자세히" isPoint2={true}/>
          }

        </TouchableOpacity>
      </View>


      {/* 스크롤 부분 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {currentData.map((notice) => (
          <View key={notice.id} style={styles.itemContainer}>
            {notice.title ? (
              <Text style={styles.itemTitle}>{notice.title}</Text>
            ) : null}

            {/* 텍스트 렌더링 (줄바꿈 시 자동 번호 매기기) */}
            {renderNoticeContent(notice)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SettingDetailView;

const styles = StyleSheet.create({
  container: {
    maxWidth: SCREEN_WIDTH * 0.92,
    height: SETTING_CLUBRULE_HEIGHT,
    marginLeft: Spacing[5],
    marginTop: heightScale(200),
  },
  screenTitle: {
    color: ColorTokens.Point2,
    ...Typography.headingXLarge,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
    alignItems: "flex-start",
  },
  itemContainer: {
    marginBottom: 0,
  },
  itemTitle: {
    color: ColorTokens.Point,
    ...Typography.headingLarge,
    marginTop: Spacing[7],
    marginBottom: Spacing[5],
  },
  headerText: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
  contentRow: {
    flexDirection: "row",
    marginBottom: 2,
    width: SCREEN_WIDTH * 0.92 - Spacing[5],
  },
  contentText: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
  },
  flex1: {
    flex: 1,
  },
  bulletMargin6: {
    marginRight: 6,
  },
  bulletMargin4: {
    marginRight: 4,
  },
  contentFullWidth: {
    marginBottom: 2,
    width: SCREEN_WIDTH * 0.92 - Spacing[5],
  },
  headerBullet: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    marginRight: 6,
  },
  contentNumber: {
    color: ColorTokens.Typography,
    ...Typography.paraMedium,
    marginRight: 4,
  },
});
