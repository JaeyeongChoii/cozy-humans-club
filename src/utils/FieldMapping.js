import { THEME } from "../design/token/constantsTokens";

// 백엔드 필드를 프론트엔드 필드로 변환 (매핑)

/*  백엔드에서 받는 필드
    "talk_num" or "think_num": 9,
    "writer_id": 54,
    "header": " ",
    "subject": "아아",
    "reported": 0,
    "timestamp": "2026-02-12T08:01:09.000Z",
    "like": 1,
    "quote": null,
    "comment": 0,
    "mylist": 0,
    "views": 27,
    "photo": null,
    "quote_num": 0,
    "user_id": "wodud123",
    "nickname": "jy1010"
    "profile_image": null
  */
export function mapSingleItem(item, type) {
    if (!item) return null;
    const isCommentType = type === THEME.COMMENT || type === "comment" || type === 2 || type === "2";

    // [DEBUG] 소스 데이터의 인용 정보 확인
    if (item.quote) {
        // console.log(`[FieldMapping] Mapping item with quote: id=${item.talk_num || item.think_num || item.id}, quote_type=${item.quote_type}, type=${typeof item.quote_type}`);
    }

    // ISO 8601 -> 초로 변환 
    let elapsedSeconds = 0;
    if (item.timestamp) {
        const postDate = new Date(item.timestamp);
        const now = new Date();
        elapsedSeconds = Math.floor((now - postDate) / 1000);
    }

    return {
        id: isCommentType ? (item.comment_id || item.id) : (item.talk_num || item.think_num || item.id),   // 잼톡, 진톡, 또는 이미 아이디가 있는 경우
        name: String(item.nickname || ""),
        usercode: item.user_id || item.usercode || null,
        writer_id: item.writer_id || null,
        profileImage: (item.profile_image || item.image) ? { uri: `https://jamdeeptalk.com/files/profile/${item.profile_image || item.image}` } : null,
        timestamp: elapsedSeconds,
        posttext: item.subject || item.content || "",
        header: item.header || "",
        label: item.header || "",
        like: item.like ?? item.likes ?? 0,
        // <RULE[p-test.md]> 댓글 필드 전수 조사 및 매핑
        comment: (() => {
            const possibleFields = ['reply_count', 'comment', 'comment_count', 'comments', 'comment_num', 'count_comment'];
            let foundField = null;
            let count = 0;

            for (const field of possibleFields) {
                if (item[field] !== undefined && item[field] !== null) {
                    foundField = field;
                    // 일부 API는 comments를 "숫자"가 아니라 "배열"로 내려준다.
                    // 이 경우 Number([])는 NaN이 되어 0으로 사라지므로 length를 우선 사용한다.
                    if (field === 'comments' && Array.isArray(item[field])) {
                        count = item[field].length;
                    } else {
                        count = Number(item[field]);
                    }
                    break;
                }
            }

            /*
                        if (count > 0) {
                            console.log(`[FieldMapping] ID: ${item.talk_num || item.think_num || item.id} | Found field: ${foundField} | Value: ${count}`);
                        }
                        */
            return count || 0;
        })(),
        view: item.views || 0,
        bookmark: item.bookmark ?? item.bookmarks ?? item.mylist ?? 0,
        media: (() => {
            const photos = [];
            const photoFields = ['photo', 'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5'];
            photoFields.forEach(field => {
                if (item[field] && typeof item[field] === "string" && item[field].trim() !== "") {
                    // 쉼표로 구분된 문자열도 처리 (혹시 모를 예외 방지)
                    const splitPhotos = item[field].split(',').map(s => s.trim()).filter(Boolean);
                    photos.push(...splitPhotos);
                }
            });

            if (photos.length > 0) {
                return photos.map(p => ({
                    type: 'image',
                    source: { uri: String(p).startsWith("http") ? p : `https://jamdeeptalk.com/files/${p}` }
                }));
            }
            if (item.images && Array.isArray(item.images)) {
                return item.images.map(p => ({
                    type: 'image',
                    source: { uri: String(p).startsWith("http") ? p : `https://jamdeeptalk.com/files/${p}` }
                }));
            }
            return item.media || [];
        })(),
        quote_num: item.quote_num ?? item.quotes ?? 0,
        reported: item.reported || false,
        isFollowed: item.is_follow !== undefined ? !!item.is_follow : false,
        isBookmarked: item.is_bookmark !== undefined ? !!item.is_bookmark : (item.mylist !== undefined ? !!item.mylist : !!item.isBookmarked),
        isLiked: item.is_like !== undefined ? !!item.is_like : (item.isLiked !== undefined ? !!item.isLiked : false),
        is_comment: isCommentType,
        // 백엔드 사용자 활동 플래그: 현재 유저가 이 글에 직접 행동했는지 여부
        // (주의: 위의 is_comment는 '이 아이템이 댓글 타입인가'라는 별개의 의미)
        isCommented: !!item.is_comment, // 내가 이 글에 댓글을 달았는지
        isQuoted: !!item.is_quote,      // 내가 이 글을 인용했는지
        isReplied: !!item.is_reply,     // (댓글) 내가 이 댓글에 대댓글을 달았는지
        parentPostId: isCommentType ? item.post_num : undefined,
        parentPostType: isCommentType ? item.type : undefined,
        // quote 필드가 있으면 재귀적으로 매핑하거나, ID인 경우 ID 객체 생성
        quote: item.quote ? (
            typeof item.quote === 'object'
                ? mapSingleItem(item.quote,
                    (item.quote_type === 'comment' || item.quote_type === 2) ? THEME.COMMENT :
                        (item.quote_type === 1 || item.quote_type === 'Jin-Talk') ? 'Jin-Talk' : 'Jam-Talk'
                )
                : {
                    id: item.quote,
                    postType: (item.quote_type === 'comment' || item.quote_type === 2) ? THEME.COMMENT :
                        (item.quote_type === 1 || item.quote_type === 'Jin-Talk') ? THEME.JIN : THEME.JAM
                }
        ) : null,
        postType: isCommentType ? THEME.COMMENT : (item.think_num ? THEME.JIN : (item.talk_num ? THEME.JAM : ((type === THEME.JIN || type === 'Jin-Talk' || type === 1) ? THEME.JIN : THEME.JAM))),
        hasVote: !!(item.vote_1 || item.is_vote || item.vote_id || item.has_vote || (item.vote && typeof item.vote !== 'object')), // 다양한 투표 플래그 체크
        voteId: item.vote || null, // 백엔드 명세에 따른 투표 전용 ID
    };
}

export function FieldMapping(backendField, type) {
    if (!Array.isArray(backendField)) {
        // 배열이 아니면 단일 아이템으로 처리 시도
        return mapSingleItem(backendField, type);
    }
    return backendField.map(item => mapSingleItem(item, type));
}
