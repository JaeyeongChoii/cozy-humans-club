import {
  THEME,
  DYNAMIC_LABEL_0_NONE,
  DYNAMIC_LABEL_1_EMPATHY,
  DYNAMIC_LABEL_2_ADVISE,
  DYNAMIC_LABEL_3_EXPLAIN,
  DYNAMIC_LABEL_4_OTHER
} from "../design/token/constantsTokens";

const JamPostData = [
  //게시물의 내용
  {
    name: "혼잣말",
    timestamp: 1,
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    like: 8,
    comment: 24,
    view: 22,
    quote: 23,
    bookmark: 20,
    isLiked: false,
    isRelay: true,
    posttext: `혼혈왕자가 
여자라는 헤르미와
남자라는 해리의 말다툼이 너무 좋아~ ㅠ
언제나 여자였기에 차별받고 상처받았을 헤르미온느의 말에 그저 아니라고 말하는게 아니라 같이 상처 받는게 ㅠㅠ
https://velog.io/jeep_chief_14/%EB%A7%81%ED%81%AC-%EC%8D%B8%EB%84%A4%EC%9D%BC%EC%9D%84-%EB%A7%8C%EB%93%A4%EC%96%B4%EB%B3%B4%EC%9E%90-With.-OpenGraph`,
    media: [
      { source: require("../../tokenImage/image1.png") },
      { source: require("../../tokenImage/image2.png") },
    ],
    postType: THEME.JAM,
    imageBlocked: true,
    label: DYNAMIC_LABEL_1_EMPATHY,
  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 31535999,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 13,
    comment: 1,
    view: 2,
    quote: 5,
    bookmark: 20,
    isLiked: false,
    isRelay: true,
    posttext: `근데 교빵이 성격 진짜 좋나보네 나도 친구한테 들었어
성격좋고 착하다고 이걸 어떻게 아냐면 3년전에 내친구가 구교환이랑 일을했고 친필사인을 받아다준다했는데 나는 관심이없어서 그당시에 구교환팬이던 트친한테 받아다줬고.`,
    media: [{ source: require("../../tokenImage/image3.png") }],
    postType: THEME.JAM,
    imageBlocked: false,
    label: DYNAMIC_LABEL_2_ADVISE,

  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 2222,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 13,
    comment: 1,
    view: 22,
    quote: 5,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `근데 교빵이 성격 진짜 좋나보네 나도 친구한테 들었어
성격좋고 착하다고 이걸 어떻게 아냐면 3년전에 내친구가 구교환이랑 일을했고 친필사인을 받아다준다했는데 나는 관심이없어서 그당시에 구교환팬이던 트친한테 받아다줬고.`,
    media: [
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
    ],
    postType: THEME.JAM,
    imageBlocked: true,
    label: DYNAMIC_LABEL_3_EXPLAIN,

  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 9012345,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 13,
    comment: 1,
    view: 22,
    quote: 5,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `근데 교빵이 성격 진짜 좋나보네 나도 친구한테 들었어
성격좋고 착하다고 이걸 어떻게 아냐면 3년전에 내친구가 구교환이랑 일을했고 친필사인을 받아다준다했는데 나는 관심이없어서 그당시에 구교환팬이던 트친한테 받아다줬고.`,
    media: [
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
    ],
    postType: THEME.JAM,
    imageBlocked: false,
    label: DYNAMIC_LABEL_4_OTHER,

  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 41535999,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 13,
    comment: 1,
    view: 2,
    quote: 5,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `근데 교빵이 성격 진짜 좋나보네 나도 친구한테 들었어
성격좋고 착하다고 이걸 어떻게 아냐면 3년전에 내친구가 구교환이랑 일을했고 친필사인을 받아다준다했는데 나는 관심이없어서 그당시에 구교환팬이던 트친한테 받아다줬고.`,
    media: [
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
      { source: require("../../tokenImage/image3.png") },
    ],
    postType: THEME.JAM,
    imageBlocked: true,
    label: DYNAMIC_LABEL_1_EMPATHY,

  },
];

const JinPostData = [
  {
    name: "개발자 솔람",
    timestamp: 123456,
    profileImage: require("../../tokenImage/profile_solam.png"),
    usercode: "Solam_IT",
    like: 0,
    comment: 0,
    view: 0,
    quote: 0,
    bookmark: 0,
    isLiked: false,
    isRelay: false,
    posttext: `여러분은 보통 번아웃이 올 때 어떤식으로 극복하시나요?`,
    media: [{ source: require("../../tokenImage/eveningImage.png") }],
    postType: THEME.JIN,
    vote: {
      options: [
        { id: 1, text: "놀기", count: 2 },
        { id: 2, text: "쉬기", count: 1 }
      ],
      deadline: "2일 23시간 1분 남음",
    },
    imageBlocked: true,
    label: DYNAMIC_LABEL_3_EXPLAIN,

  },
  {
    name: "개발자 솔람",
    timestamp: 123456,
    profileImage: require("../../tokenImage/profile_solam.png"),
    usercode: "Solam_IT",
    like: 232,
    comment: 232,
    view: 22,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    isRelay: true,
    posttext: `IT기업들은 점점 더 막강해져만 가는데 정작 개발자 개개인들은 약해져만 간다. 자신의 신념을 지키는 건 고사하고 최소한의 자존감과 생존을 위한 선택지마저도 줄어간다.
개발자의 개성과 창의성이 느껴지는 프로덕트도 점차 찾기 힘들고, 단지 몇개뿐인 글로벌 IT 서비스만이 세계를 독점하고 있다.
`,
    media: [{ source: require("../../tokenImage/testHeightImage.png") }],
    postType: THEME.JIN,
    imageBlocked: true,
    label: DYNAMIC_LABEL_4_OTHER,

  },
  {
    name: "혼잣말",
    timestamp: 15678901,
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    like: 232,
    comment: 232,
    view: 30,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `여러분은 보통 번아웃이 올 때 어떤 식으로 극복하시나요?`,
    media: [],
    postType: THEME.JIN,
    imageBlocked: false,
    label: DYNAMIC_LABEL_2_ADVISE,

  },
  {
    name: "Better time",
    timestamp: 6543210,
    profileImage: require("../../tokenImage/profile_bettertime.png"),
    usercode: "better_time",
    like: 232,
    comment: 232,
    view: 41,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `인간관계에선 이것만 기억하세요

1. 말이 안 통하는 사람을 굳이 이해시키려고 하지 마세요.
2. 나를 함부로 대하는 사람에게 시간 낭비하지 마세요.
3. 일방적으로 희생하는 관계는 빨리 끊으세요.
4. 노력해도 멀어진다면 그냥 그만큼의 인연일 뿐입니다.
5. 모든 사람에게 좋은 사람이 될 필요 없습니다.
6. 모든 사람에게 좋은 사람이 될 필요 없습니다.
7. 모든 사람에게 좋은 사람이 될 필요 없습니다.
8. 모든 사람에게 좋은 사람이 될 필요 없습니다.
9. 모든 사람에게 좋은 사람이 될 필요 없습니다.
`,
    media: [
      { source: require("../../tokenImage/videoSmall.mp4") }, // 2:1
    ],
    postType: THEME.JIN,
    imageBlocked: true,
    label: DYNAMIC_LABEL_3_EXPLAIN,
  },

  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 31535999,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 232,
    comment: 232,
    view: 5,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    isRelay: false,
    posttext: `인간관계에선 이것만 기억하세요

1. 말이 안 통하는 사람을 굳이 이해시키려고 하지 마세요.
2. 나를 함부로 대하는 사람에게 시간 낭비하지 마세요.
3. 일방적으로 희생하는 관계는 빨리 끊으세요.
4. 노력해도 멀어진다면 그냥 그만큼의 인연일 뿐입니다.
5. 모든 사람에게 좋은 사람이 될 필요 없습니다.`,
    media: [
      {
        source: require("../../tokenImage/videoSquare.mp4"),
      }
    ],
    postType: THEME.JIN,
    imageBlocked: false,
    label: DYNAMIC_LABEL_1_EMPATHY,
  },
  {
    name: "비디오 테스트",
    timestamp: 31536000,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Video_Tester",
    like: 10,
    comment: 5,
    view: 100,
    quote: 2,
    bookmark: 5,
    isLiked: false,
    isRelay: false,
    posttext: `비디오 비율 및 순서 테스트
1. Small (2:1) - Video
2. Wide (4:3) - Video
3. Square (1:1) - Video`,
    // images, videos 대신 media 사용 (순서 보장을 위해)
    media: [
      { source: require("../../tokenImage/videoSmall.mp4") }, // 2:1
      { source: require("../../tokenImage/videoWide.mp4") },  // 4:3
      { source: require("../../tokenImage/videoSquare.mp4") }, // 1:1
    ],
    postType: THEME.JIN,
    imageBlocked: false,
    label: DYNAMIC_LABEL_0_NONE,
  },
  {
    name: "혼합 미디어 테스트",
    timestamp: 31536001,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Video_Tester",
    like: 10,
    comment: 5,
    view: 100,
    quote: 2,
    bookmark: 5,
    isLiked: false,
    isRelay: false,
    posttext: `혼합 미디어 순서 테스트
1. 이미지 (image1)
2. 비디오 (Square)
3. 이미지 (eveningImage)`,
    media: [
      { source: require("../../tokenImage/image1.png") },
      { source: require("../../tokenImage/videoSquare.mp4") },
      { source: require("../../tokenImage/eveningImage.png") },
    ],
    postType: THEME.JIN,
    imageBlocked: false,
    label: DYNAMIC_LABEL_4_OTHER,
  },
];

const CommentData = [
  {
    name: "개발자 솔람",
    timestamp: 12345678,
    profileImage: require("../../tokenImage/profile_solam.png"),
    usercode: "Solam_IT",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: `IT기업들은 점점 더 막강해져만 가는데 정작 개발자 개개인들은 약해져만 간다. 자신의 신념을 지키는 건 고사하고 최소한의 자존감과 생존을 위한 선택지마저도 줄어간다.
개발자의 개성과 창의성이 느껴지는 프로덕트도 점차 찾기 힘들고, 단지 몇개뿐인 글로벌 IT 서비스만이 세계를 독점하고 있다.
`,
    media: [],
  },
  {
    name: "혼잣말",
    timestamp: 25678901,
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: `댓글 1빠`,
    media: [],
  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 25678901,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: `여러분은 보통 번아웃이 올 때 어떤 식으로 극복하시나요?`,
    media: [],
  },
];

const UserData = [
  {
    name: "꽁꽁 얼어붙은 한강위",
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    message: "세상에 있는 모든 문제에 대해서 이야기 하는 것을 좋아합니다.",
    following: 31,
    follower: 130,
  },
  {
    name: "혼잣말",
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    message: "강아지입니다.",
    following: 82,
    follower: 82,
  },
  {
    name: "Better time",
    profileImage: require("../../tokenImage/profile_bettertime.png"),
    usercode: "better_time",
    message: "상태메시지",
    following: 52,
    follower: 52,
  },
];

const QuoteData = [
  {
    name: "개발자 솔람",
    timestamp: 12345678,
    profileImage: require("../../tokenImage/profile_solam.png"),
    usercode: "Solam_IT",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: "인용 1",
    media: [],
  },
  {
    name: "혼잣말",
    timestamp: 25678901,
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: "인용 2",
    media: [],
  },
  {
    name: "꽁꽁 얼어붙은 한강위",
    timestamp: 25678901,
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    like: 232,
    comment: 232,
    quote: 232,
    bookmark: 20,
    isLiked: false,
    posttext: "인용 3",
    media: [],
  },
];

const AlertsData = [
  {
    name: "꽁꽁 얼어붙은 한강위",
    profileImage: require("../../tokenImage/cat.jpeg"),
    usercode: "Can_onthe_hanriver",
    timestamp: 2,
    alertMessage: "누군가가 너의 글을 인용했어!",
    quotoState : true,
    quotoMessage: "text",
  },
  {
    name: "혼잣말",
    profileImage: require("../../tokenImage/puppy.png"),
    usercode: "catonthekitchen",
    timestamp: 2,
    alertMessage: "안녕하세요.",
    quotoState: false,
    quotoMessage: null,
  },
];

export default { JamPostData, JinPostData, CommentData, UserData, AlertsData, QuoteData };
