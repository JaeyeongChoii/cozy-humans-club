// package.json에 "type": "module"이 있어 .js는 ESM으로 취급되므로 babel 설정은 .cjs로 둔다.
//
// 주의: Expo의 @expo/metro-config는 babel 설정 파일로 .babelrc/.babelrc.js/babel.config.js만
// 인식한다(.cjs는 인식 못 함). 그래서 .cjs를 쓰면 Expo가 "설정 없음"으로 보고 babel-preset-expo를
// 자동으로 추가한다. 여기서 preset을 또 넣으면 JSX 변환이 중복돼 "Duplicate __self prop" 에러가
// 나므로, preset은 넣지 않고 production용 console 제거 플러그인만 얹는다.
module.exports = function (api) {
  api.cache(true);
  return {
    env: {
      // 릴리즈(production/preview) 빌드에서만 console 호출 제거 (console.error는 유지).
      // dev 빌드에서는 로그를 그대로 남긴다.
      production: {
        plugins: [["transform-remove-console", { exclude: ["error"] }]],
      },
    },
  };
};
