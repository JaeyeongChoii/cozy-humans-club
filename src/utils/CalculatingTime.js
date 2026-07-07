// 올린 시간을 간단하게 보게 만드는 함수

export function CalculatingTime(second) {
  let message = "";

  // 시간 단위별 초 정의
  const MINUTE_IN_SECONDS = 60;
  const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60; // 3,600초
  const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24; // 86,400초
  const MONTH_IN_SECONDS = DAY_IN_SECONDS * 30; // 평균 1개월 (30일 기준) = 2,592,000초
  const YEAR_IN_SECONDS = DAY_IN_SECONDS * 365; // 평균 1년 (365일 기준) = 31,536,000초

  // 무조건 판별함
  switch (true) {
    case second < MINUTE_IN_SECONDS: // 60초 미만
      message = "방금 전";
      break;
    case second < HOUR_IN_SECONDS: // 1시간 (3600초) 미만
      const minutes = Math.floor(second / MINUTE_IN_SECONDS);
      message = `${minutes}분 전`;
      break;
    case second < DAY_IN_SECONDS: // 1일 (86400초) 미만
      const hours = Math.floor(second / HOUR_IN_SECONDS);
      message = `${hours}시간 전`;
      break;
    case second < MONTH_IN_SECONDS: // 1개월 (평균 30일) 미만
      const days = Math.floor(second / DAY_IN_SECONDS);
      message = `${days}일 전`;
      break;
    case second < YEAR_IN_SECONDS: // 1년 (평균 365일) 미만
      const months = Math.floor(second / MONTH_IN_SECONDS);
      message = `${months}개월 전`;
      break;
    default: // 1년 이상
      const years = Math.floor(second / YEAR_IN_SECONDS);
      message = `${years}년 전`;
      break;
  }

  return message;
}

// "과거로 부터 흐른 초"를 파라미터로 받아서 현재 시간 기준 과거 날짜(YYYY.MM.DD)로 반환하는 함수
export function ConvertSecondsToDate(secondsAgo) {
  // 현재 시간의 밀리초(ms)에서 흐른 시간의 밀리초(seconds * 1000)를 뺌
  const targetDate = new Date(Date.now() - secondsAgo * 1000);

  const year = targetDate.getFullYear();
  // month와 day가 한 자리 수일 경우 앞에 '0'을 붙여 2자리로 만듦
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
