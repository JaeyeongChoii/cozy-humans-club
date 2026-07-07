export function calculatingPopular(like, commentCount, quotoCount, viewCount) {
    return (like * 3) + (commentCount * 5) + (quotoCount * 5) + (viewCount / 10)
}