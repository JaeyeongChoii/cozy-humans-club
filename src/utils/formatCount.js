// 게시물 반응 수(좋아요/댓글/인용)를 X·인스타 방식으로 축약해서 보여주는 함수
// - 0 ~ 999          : 숫자 그대로 (예: 27, 999)
// - 1,000 ~ 999,999  : 소수점 1자리 + K, 끝자리가 .0이면 소수점 생략 (예: 1.2K, 4.7K, 2K)
// - 1,000,000 이상   : 소수점 1자리 + M, 끝자리가 .0이면 소수점 생략 (예: 1.2M)
// 반올림이 아니라 버림(내림) 처리 → 1,299는 1.3K가 아니라 1.2K
export function formatCount(value) {
  const num = Number(value);

  // 숫자가 아니면 "0" 처리 (방어 코드)
  if (!Number.isFinite(num)) return "0";
  // 1,000 미만은 정수 그대로
  if (num < 1000) return String(Math.floor(num));

  // 소수점 1자리까지 '버림'해서 "1.2K" 형태로 만드는 내부 함수.
  // 부동소수점 오차를 피하려고 (num * 10 / divisor)를 정수 연산으로 처리한다.
  const format = (divisor, suffix) => {
    const tenths = Math.floor((num * 10) / divisor); // 소수 첫째자리까지의 정수값 (예: 1299 → 12)
    const whole = Math.floor(tenths / 10); // 정수부 (예: 12 → 1)
    const decimal = tenths % 10; // 소수 첫째자리 (예: 12 → 2)
    const text = decimal === 0 ? String(whole) : `${whole}.${decimal}`; // .0이면 소수점 생략
    return `${text}${suffix}`;
  };

  if (num < 1000000) return format(1000, "K"); // 천 단위
  return format(1000000, "M"); // 백만 단위
}
