// 특정 문구를 하이라이팅 함
import { Text } from "react-native";

export default function HighlightText({
  message = "",
  highlightMap = "",
  style,
  /*
  highlightMap={{
            42: {
              color: ColorTokens.Point,
            },
          }}
            식으로 사용
  */
  
}) {
  // 특정 단어에 스타일을 적용하는 함수
  const renderStyledText = (message, highlightMap) => {
    const parts = [];
    let currentText = message;

    // highlightMap이 없거나 비어있는 경우 원본 텍스트 반환
    if (!highlightMap || Object.keys(highlightMap).length === 0) {
      return [message];
    }

    // highlightMap에 있는 모든 단어를 찾기 위한 정규식 생성
    // 특수문자가 포함될 수 있으므로 이스케이프 처리
    const wordsToFind = Object.keys(highlightMap)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const regex = new RegExp(`(${wordsToFind})`, "g");

    let match;
    let lastIndex = 0;

    while ((match = regex.exec(currentText)) !== null) {
      const matchedWord = match[1];
      const startIndex = match.index;

      // 매칭된 단어 이전의 일반 텍스트 추가
      if (startIndex > lastIndex) {
        parts.push(currentText.substring(lastIndex, startIndex));
      }

      // 매칭된 단어에 특정 색상 스타일 적용하여 추가
      parts.push(
        <Text key={`highlight-${startIndex}`} style={highlightMap[matchedWord]}>
          {matchedWord}
        </Text>
      );

      lastIndex = startIndex + matchedWord.length;
    }

    // 마지막 매칭 이후의 남은 일반 텍스트 추가
    if (lastIndex < currentText.length) {
      parts.push(currentText.substring(lastIndex));
    }

    return parts;
  };

  return <Text style={style}>{renderStyledText(message, highlightMap)}</Text>;
}
