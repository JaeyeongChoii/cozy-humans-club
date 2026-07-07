import { ColorTokens } from "../../design/token/ColorTokens";

//Todo: 글자 수에 따라 컨테이너 박스가 조절되게끔 바꾸기
export const TutorialText = [
    {
        id: 1,
        text: "좋아! 이제 모든 절차가 완료되었어.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 2,
        text: "자! 그럼 이제 입장하러 같이 가볼까!",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 3,
        text: null,
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 4,
        text: null,
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 5,
        text: "이 곳이 클럽 내부에 들어가는 입장문 앞이야.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 6,
        text: "이제 들어가기 전에, 내가 마지막으로 몇 가지\n중요한 정보를 알려주도록 할게!",
        highlightMap: {
        },
        catPaw: null,
    },
    // 여기서부터 Home.js로 이동
    {
        id: 7,
        text: "코지 휴먼즈 클럽의 공간은 [자유]와 [진지]\n총 두 개의 공간이 존재해.",
        highlightMap: {
            "자유": {
                color: ColorTokens.Point,
            },
            "진지": {
                color: ColorTokens.Point2,
            }
        },
        catPaw: null,
    },
    {
        id: 8,
        text: "다른 멤버들이 나의 글을 어떤 태도로 읽어주기를\n바라는지에 따라 공간을 나누어 놓았어.",
        highlightMap: {
            "태도": {
                color: ColorTokens.Point,
            },
        },
        catPaw: null,
    },
    {
        id: 9,
        text: "현재 있는 공간은 자유라고 해.",
        highlightMap: {
            "자유": {
                color: ColorTokens.Point,
            },
        },
        catPaw: "JAM",
    },
    {
        id: 10,
        text: "당장 생각나는 나의 생각, 내가 좋아하는 이야기.\n정리되지 않은 낙서 같은 생각들까지.\n다른 멤버들과 공유하고 싶다면 무엇이든 다 좋아!",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 11,
        text: "다른 하나의 공간은 진지라고 해.",
        highlightMap: {
            "진지": {
                color: ColorTokens.Point2,
            },
        },
        catPaw: "JIN",
    },
    {
        id: 12,
        text: "여기서 ‘진지’란, 이 공간에 올라오는 멤버의\n글을 진지하게 읽어주는 태도를 뜻해.",
        highlightMap: {
            "진지": {
                color: ColorTokens.Point2,
            },
            "진지하게 읽어주는 태도": {
                color: ColorTokens.Point2,
            },
        },
        catPaw: null,
    },
    {
        id: 13,
        text: "다른 멤버가 진지하게 조언을 해주고, 진지하게\n생각을 나누고 싶을 때. 진심 어린 감정을\n나눌 수 있는 따뜻한 공간이라구!",
        highlightMap: {
            "진지": {
                color: ColorTokens.Point2,
            },
            "따뜻한 공간": {
                color: ColorTokens.Point2,
            },
        },
        catPaw: null,
    },
    {
        id: 14,
        text: "너의 현재의 기분에 따라서 각각 두 개의 공간을 즐\n기면, 코지 휴먼즈 클럽이 더 재미있게 느껴질 거야!",
        highlightMap: {
        },
    },
    {
        id: 15,
        text: "마지막으로 처음 운영 규칙에도 소개된 것처럼,\n현재 클럽은 나에게 고용된 인간들이 관리하고 있어.",
        highlightMap: {
            "인간": {
                color: ColorTokens.Point2,
            },
        },
        catPaw: null,
    },
    {
        id: 16,
        text: "따라서, 자동으로 규칙에 어긋나는 게시물이 삭제\n되지는않기 때문에 클럽을 안전하게 지키기 위해서\n너의 도움이 필요할 때도 있다구.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 17,
        text: "만약 네가 규칙을 어기는 게시물이나 유저를 발견했다면,",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 18,
        text: "주저하지 말고 바로 제보해 주거나 내 집무실을 방문\n해서 나에게 알려주면 고마울 것 같아.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 19,
        text: "참고로 나는 항상 내 집무실에 상주하면서, 너와 같이\n클럽에 들어오고 싶은 인간들을 데리고 오고 있어.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 20,
        text: "그러니 나에게 하고 싶은 말이 있으면, 언제든\n설정 → [코지의 사무실 방문하기]로 찾아오면 돼.",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 21,
        text: "심심할 때도 찾아와도 되지만, 내 사무실에 있는 푸딩\n냉장고는 절대 내 허락 없이 손대지 말라구!",
        highlightMap: {
        },
        catPaw: null,
    },
    {
        id: 22,
        text: "그럼 나는 이만 다시 사무실로 돌아갈 테니,\n이제부터 클럽을 자유롭게 즐겨봐!",
        highlightMap: {
        },
        catPaw: null,
    },
]