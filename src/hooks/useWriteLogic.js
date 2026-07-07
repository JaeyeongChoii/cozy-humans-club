import { useReducer } from "react";
import { Alert } from "react-native";
import { ColorTokens } from "../design/token/ColorTokens";

export const MAX_TEXT_LENGTH = 300; // 공백 제외 최대 글자수
export const MAX_LINE_COUNT = 20; // 화면에 보이는(자동 줄바꿈 포함) 최대 줄 수
const MAX_IMAGES = 4; // 최대 이미지 수 제한

const initialInputId = Date.now();

// 초기 상태
export const initialState = {
    inputs: [
        {
            id: initialInputId,
            // 글
            text: "",
            // 화면에 보이는 줄 수 (Write.js의 onTextLayout이 SET_LINE_COUNT로 갱신)
            lineCount: 0,
            // 투표
            vote: {
                showVote: false,
                candidates: ["", ""],
                selectedPeriod: { day: 3, hour: 0, minute: 0 },
                isPeriodModalVisible: false,
            },
            // 이미지 URI 저장
            images: [],
        },
    ],
    focusedInputId: initialInputId, // 포커싱 되어있는 id 추적

    // '새 블록에 포커스하라'는 일회성 신호.
    // ADD_INPUT 때만 새 블록 id로 세팅되고, 실제 focus()를 준 직후 CONSUME_FOCUS로 비운다.
    // focusedInputId(탭 이동마다 바뀜)와 분리해, 포커스가 새 블록에 딱 한 번만 적용되게 한다.
    pendingFocusId: initialInputId,

    isTextExpanded: false,
    relayPostButtonState: false,
};

// Reducer 함수
function reducer(state, action) {
    switch (action.type) {
        // 글 입력
        case "UPDATE_TEXT": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id ? { ...input, text: action.text } : input
            );
            const lastInput = newInputs[newInputs.length - 1];
            return {
                ...state,
                inputs: newInputs,
                relayPostButtonState: lastInput.text.trim().length > 0,
            };
        }

        // 화면에 보이는 줄 수 갱신 (onTextLayout에서 호출)
        case "SET_LINE_COUNT": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? { ...input, lineCount: action.lineCount }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 이어쓰기 추가
        case "ADD_INPUT": {
            const newInputId = Date.now();
            return {
                ...state,
                inputs: [
                    ...state.inputs,
                    {
                        id: newInputId,
                        text: "",
                        lineCount: 0,
                        vote: {
                            showVote: false,
                            candidates: ["", ""],
                            selectedPeriod: { day: 3, hour: 0, minute: 0 },
                            isPeriodModalVisible: false,
                        },
                        images: [], // 새 input에는 빈 이미지 배열
                    },
                ],
                focusedInputId: newInputId, // 새로 생성된 인풋으로 포커스 설정
                pendingFocusId: newInputId, // 새 블록에 일회성 포커스 신호
                relayPostButtonState: false,
            };
        }

        // 일회성 포커스 신호 소비 (focus()를 준 직후 호출 → 재포커스 방지)
        case "CONSUME_FOCUS":
            return { ...state, pendingFocusId: null };

        // 이어쓰기 삭제
        case "REMOVE_INPUT": {
            // 첫 번째 인풋은 삭제 불가 (UI에서 막겠지만 로직에서도 처리)
            if (state.inputs.length <= 1) return state;

            const newInputs = state.inputs.filter((input) => input.id !== action.id);
            return {
                ...state,
                inputs: newInputs,
                focusedInputId: null, // 삭제 후 포커스 초기화 (필요시 조정)
            };
        }

        // 포커싱 되어있는 id 추적
        case "SET_FOCUSED_INPUT":
            return { ...state, focusedInputId: action.id };
        // 포커싱 취소
        case "CLEAR_FOCUSED_INPUT":
            return { ...state, focusedInputId: null };

        // ==================== 투표 관련 ====================
        case "TOGGLE_VOTE": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        vote: { ...input.vote, showVote: !input.vote.showVote },
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 후보 추가
        case "ADD_CANDIDATE": {
            const newInputs = state.inputs.map((input) => {
                if (input.id !== action.id) return input;
                if (input.vote.candidates.length >= 4) {
                    Alert.alert("알림", "최대 4개까지만 선택할 수 있습니다.");
                    return input;
                }
                return {
                    ...input,
                    vote: {
                        ...input.vote,
                        candidates: [...input.vote.candidates, ""],
                    },
                };
            });
            return { ...state, inputs: newInputs };
        }

        // 후보 이름 수정
        case "UPDATE_CANDIDATE": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        vote: {
                            ...input.vote,
                            candidates: input.vote.candidates.map((c, i) =>
                                i === action.index ? action.text : c
                            ),
                        },
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 후보 삭제
        case "REMOVE_CANDIDATE": {
            const newInputs = state.inputs.map((input) => {
                if (input.id !== action.id) return input;
                if (action.index < 2) return input;
                return {
                    ...input,
                    vote: {
                        ...input.vote,
                        candidates: input.vote.candidates.filter(
                            (_, i) => i !== action.index
                        ),
                    },
                };
            });
            return { ...state, inputs: newInputs };
        }

        // 기간 설정 모달 열기
        case "OPEN_PERIOD_MODAL": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        vote: { ...input.vote, isPeriodModalVisible: true },
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 기간 설정 모달 닫기
        case "CLOSE_PERIOD_MODAL": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        vote: { ...input.vote, isPeriodModalVisible: false },
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 기간 설정
        case "SET_PERIOD": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        vote: {
                            ...input.vote,
                            selectedPeriod: {
                                day: action.day,
                                hour: action.hour,
                                minute: action.minute,
                            },
                        },
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // ==================== 이미지 관련 ====================
        // 이미지 추가
        case "ADD_IMAGES": {
            const newInputs = state.inputs.map((input) => {
                if (input.id !== action.id) return input;

                const combined = [...input.images, ...action.newImages];
                if (combined.length > MAX_IMAGES) {
                    Alert.alert("알림", `최대 ${MAX_IMAGES}장까지만 선택할 수 있습니다.`);
                }

                return {
                    ...input,
                    images: combined.slice(0, MAX_IMAGES),
                };
            });

            return { ...state, inputs: newInputs };
        }

        // 이미지 삭제
        case "REMOVE_IMAGE": {
            const newInputs = state.inputs.map((input) =>
                input.id === action.id
                    ? {
                        ...input,
                        images: input.images.filter((_, i) => i !== action.index),
                    }
                    : input
            );
            return { ...state, inputs: newInputs };
        }

        // 초기화 (RESET)
        case "RESET": {
            return initialState;
        }

        default:
            return state;
    }
}

const useWriteLogic = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // ==================== 파생 상태 계산 (Derived State) ====================

    // 마지막 인풋창 추적
    const lastInput = state.inputs[state.inputs.length - 1];

    // 현재 포커스된 인풋 또는 마지막 인풋 찾기
    const targetInput = state.focusedInputId
        ? state.inputs.find(i => i.id === state.focusedInputId) || lastInput
        : lastInput;

    // 이미지 수 계산 (반드시 targetInput이 정의된 후 계산)
    const imageCount = targetInput?.images?.length ?? 0;

    // 공백 제외 글자수 (타겟 인풋 기준)
    const currentTextLength = (targetInput?.text ?? "").replace(/\s+/g, "").length;

    // 글자 색상 설정 (300자 초과 시 Warning 색상)
    // currentTextLength + 1 (즉, MAX_TEXT_LENGTH + 1) 일 때부터 변경
    const textCountColor =
        currentTextLength > MAX_TEXT_LENGTH
            ? ColorTokens.Warning
            : ColorTokens.Unselected;

    // 현재 기간 설정 모달이 열려 있는 input 찾기
    const currentInputWithModal = state.inputs.find(
        (input) => input?.vote?.isPeriodModalVisible
    );

    // 투표가 설정된 경우, 생성된 모든 항목이 입력되었는지 확인
    const isVoteValid = !lastInput?.vote?.showVote || (
        lastInput.vote.candidates.every(candidate => candidate && candidate.trim().length > 0)
    );

    // 모든 인풋이 MAX_TEXT_LENGTH 이내인지 확인
    const isAllTextWithinLimit = state.inputs.every(
        (input) => (input?.text ?? "").replace(/\s+/g, "").length <= MAX_TEXT_LENGTH
    );

    // 모든 인풋이 MAX_LINE_COUNT(20줄) 이내인지 확인
    const isAllLinesWithinLimit = state.inputs.every(
        (input) => (input?.lineCount ?? 0) <= MAX_LINE_COUNT
    );

    // 글자/줄 제한을 하나라도 초과했는지 (게시 버튼 비활성화용 통합 플래그)
    const isWithinAllLimits = isAllTextWithinLimit && isAllLinesWithinLimit;

    // 글 존재 여부 및 투표 유효성 확인 (게시하기 버튼 활성화용)
    const hasText = Boolean(lastInput?.text && lastInput.text.trim().length > 0);
    const hasAnyImage = state.inputs.some(input => (input.images?.length ?? 0) > 0);
    const isVoteActiveAndValid = Boolean(lastInput?.vote?.showVote) &&
        lastInput.vote.candidates.every(c => c && c.trim().length > 0);

    const isExistingText = Boolean(
        isWithinAllLimits && isVoteValid && (hasText || hasAnyImage || isVoteActiveAndValid)
    );

    // 이어서 게시하기 버튼 활성화 여부
    // 게시하기(isExistingText)와 달리, '마지막 블록' 기준으로만 본다.
    // (isExistingText는 다른 블록에 이미지만 있어도 hasAnyImage로 true가 되어버림)
    // → 마지막 블록에 글자가 있거나, 유효한 투표(켜져 있고 모든 후보가 채워짐)가 있으면 활성화.
    //   따라서 글 없이 투표만 작성해도 이어서 게시가 가능하다.
    // → + 로 새 빈 블록을 추가한 직후엔 글자도 투표도 없어 비활성화되므로,
    //   이전 블록이 비어있는 채로 빈 블록을 연속으로 쌓는 것을 막는다.
    const relayPostButtonState = Boolean(
        isWithinAllLimits && isVoteValid && (hasText || isVoteActiveAndValid)
    );

    // 바텀바 아이콘 상태 계산
    const isImageFull = imageCount >= MAX_IMAGES;
    const isVoteActive = targetInput?.vote?.showVote ?? false;

    // 사진 추가시 (전체 인풋 중 하나라도 이미지가 있으면 true)
    const isImageExisting = state.inputs.some((input) => (input?.images?.length ?? 0) > 0);

    return {
        state,
        dispatch,
        // 파생 값들
        lastInput,
        currentTextLength,
        textCountColor,
        currentInputWithModal,
        isExistingText,
        relayPostButtonState,
        isImageFull,
        isVoteActive,
        isImageExisting,
    };
};

export default useWriteLogic;
