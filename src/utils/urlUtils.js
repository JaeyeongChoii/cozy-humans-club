/**
 * 텍스트에서 첫 번째 URL을 추출합니다.
 * @param {string} text 
 * @returns {string|null} 추출된 URL 또는 null
 */
export const extractFirstUrl = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
};
