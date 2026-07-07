/**
 * 텍스트가 짧은지(줄바꿈이 없는지) 판별하여 작은 말풍선 사용 여부를 결정합니다.
 * @param {string} text - 판별할 대화 텍스트
 * @returns {boolean} - 줄바꿈이 없으면 true, 있으면 false
 */
export const checkIsSmallDialogue = (text) => {
  if (text == null) return false;
  // 1. 줄바꿈이 없고 2. 글자수가 30자 미만인 경우만 작은 말풍선(true)으로 판단
  return !text.includes('\n') && text.length < 30;
};
