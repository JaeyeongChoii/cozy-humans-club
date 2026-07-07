import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/BaseURL";
import { THEME } from "../design/token/constantsTokens";

const normalizeCommentMedia = (item) => {
    const inferMediaType = (uri = "") => {
        const lower = String(uri).toLowerCase();
        if (/\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/.test(lower)) return "video";
        return "image";
    };

    if (Array.isArray(item?.media) && item.media.length > 0) {
        return item.media.map((m) => {
            if (typeof m === "string") return { type: inferMediaType(m), source: { uri: m } };
            if (m?.type && m?.source) return m;
            if (m?.uri) return { type: inferMediaType(m.uri), source: { uri: m.uri } };
            return null;
        }).filter(Boolean);
    }

    const photos = [];
    const photoFields = ['photo', 'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5'];
    photoFields.forEach(field => {
        if (item[field] && typeof item[field] === "string" && item[field].trim() !== "") {
            const splitPhotos = item[field].split(',').map(s => s.trim()).filter(Boolean);
            photos.push(...splitPhotos);
        }
    });

    if (photos.length > 0) {
        return photos.map(p => {
            const uri = String(p).startsWith("http")
                ? p
                : `https://jamdeeptalk.com/files/${p}`;
            return { type: inferMediaType(uri), source: { uri } };
        });
    }

    if (item?.images && Array.isArray(item.images)) {
        return item.images.map(p => {
            const uri = String(p).startsWith("http") ? p : `https://jamdeeptalk.com/files/${p}`;
            return { type: inferMediaType(uri), source: { uri } };
        });
    }

    return [];
};

export const commentApi = {
    /**
     * 댓글 목록 조회
     * @param {string} postType 'JAM' | 'JIN'
     * @param {number} postId 게시글 ID
     * @param {string} sort 'latest' | 'popular'
     */
    fetchComments: async (postType, postId, sort = 'latest') => {
        try {
            const idToken = await AsyncStorage.getItem("id_token");
            // JAM -> 0 (talk), JIN -> 1 (think), COMMENT -> 2 (댓글의 답글)
            const isComment = postType === THEME.COMMENT ||
                postType?.toLowerCase() === 'comment';
            const isJin = postType === THEME.JIN ||
                postType?.toLowerCase() === 'jin' ||
                postType === 'Jin-Talk' ||
                postType === 'think';
            const type = isComment ? 2 : (isJin ? 1 : 0);
            const sortValue = sort === 'popular' ? 'popular' : 'latest';
            const url = `${BASE_URL}/comment?type=${type}&post_num=${postId}&sort=${sortValue}`;

            // console.log(`[commentApi] fetchComments request (type: ${postType}->${type}, id: ${postId}):`, url);

            const options = {
                method: "GET",
                headers: {
                    ...(idToken && { "Authorization": `Bearer ${idToken}` }),
                },
            };

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorBody = await response.text();
                // 404(대상 글/댓글이 없거나 아직 (대)댓글이 없음)는 정상 상황 → 에러 대신 빈 목록 처리
                if (response.status === 404) {
                    console.log(`[commentApi] fetchComments: 404 (댓글 없음) -> 빈 목록 처리. URL: ${url}`);
                    return { success: true, comment_count: 0, comments: [] };
                }
                console.error(`[commentApi] fetchComments Error (Status: ${response.status}):`, errorBody, `Requested URL: ${url}`);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                console.warn(`[commentApi] fetchComments failed:`, data.message);
                return { success: false, comments: [] };
            }

            if (data.comments && data.comments.length > 0) {
                // <RULE[p-test.md]> 첫 번째 댓글의 필드 구조를 출력하여 백엔드 컬럼명 변경 확인
                const sample = data.comments[0];
                console.log(`[commentApi] fetchComments field check - likes: ${sample.likes}, like: ${sample.like}, bookmarks: ${sample.bookmarks}, bookmark: ${sample.bookmark}`);
                // 대댓글 개수 필드명 확인용 (어느 키로 오는지 보고 매핑 확정)
                console.log(`[commentApi] fetchComments comment-count check - comment: ${sample.comment}, comment_count: ${sample.comment_count}, comment_num: ${sample.comment_num}`);
            }

            // UI에서 사용하는 형식으로 매핑
            const mappedComments = (data.comments || []).map(item => {
                // ISO 8601 -> 초로 변환 (경과 시간 계산용)
                let elapsedSeconds = 0;
                if (item.timestamp) {
                    const postDate = new Date(item.timestamp);
                    const now = new Date();
                    elapsedSeconds = Math.floor((now - postDate) / 1000);
                }

                // 대댓글 개수: 백엔드가 신규로 내려주는 reply_count를 우선 사용 (서버 컬럼명 후보 모두 대응)
                const replyCount = item.reply_count ?? item.reply_num ?? item.replies_count ?? null;

                const normalizedMedia = normalizeCommentMedia(item);
                console.log("[commentApi][mappedCommentMedia]", {
                    comment_id: item.comment_id,
                    raw_photo: item.photo,
                    raw_media: item.media,
                    normalizedMedia,
                });

                return {
                    id: item.comment_id,
                    usercode: item.user_id,
                    name: item.nickname || item.user_id || "익명",
                    profileImage: item.profile_image ? { uri: `https://jamdeeptalk.com/files/profile/${item.profile_image}` } : null,
                    posttext: item.subject || "",
                    // likes와 like 모두 허용하여 백엔드 컬럼명 변경 대응
                    like: item.like !== undefined ? item.like : (item.likes || 0),
                    quote_num: item.quote_num || item.quotes || 0,
                    bookmark: item.bookmark !== undefined ? item.bookmark : (item.bookmarks || 0),
                    timestamp: elapsedSeconds,
                    popularity: item.popularity || 0,
                    // 대댓글 개수 (글세부 댓글 목록에서 댓글 아이콘 옆 숫자 표시용)
                    // 신규 reply_count가 있으면 우선 사용, 없으면 기존 후보 필드로 폴백
                    comment: replyCount !== null ? replyCount : (item.comment ?? item.comment_count ?? item.comment_num ?? (Array.isArray(item.comments) ? item.comments.length : 0)),
                    reply_count: replyCount !== null ? replyCount : 0,
                    // 백엔드 필드명이 is_like임이 확인되어 다시 적용 (is_liked -> is_like)
                    isLiked: item.is_like !== undefined ? !!item.is_like : !!item.is_liked,
                    isBookmarked: item.is_bookmark !== undefined ? !!item.is_bookmark : false,
                    isFollowed: item.is_follow !== undefined ? !!item.is_follow : false,
                    postType: postType, // 인용 시 사용하기 위해 추가 (현재 게시글의 타입)
                    quote: item.quote || null,
                    quoteType: item.quote_type || null,
                    // 이어서 게시: draft=1이면 '이어서 게시' 댓글 (정렬/라벨에 사용)
                    draft: item.draft !== undefined ? Number(item.draft) : 0,
                    // 원 게시자가 작성한 댓글인지 여부 (백엔드 is_post_writer)
                    isPostWriter: item.is_post_writer !== undefined ? !!item.is_post_writer : false,
                    // 현재 유저 활동 플래그: 댓글의 경우 '댓글 아이콘'은 대댓글을 의미하므로 isReplied 사용
                    isReplied: item.is_reply !== undefined ? !!item.is_reply : false,
                    isQuoted: item.is_quote !== undefined ? !!item.is_quote : false,
                    media: normalizedMedia,
                    // 투표 관련 필드 추가
                    hasVote: !!(
                        item.vote_1 ||
                        item.is_vote ||
                        item.vote_id ||
                        item.has_vote ||
                        item.vote // vote 필드 자체가 존재하면 true
                    ),
                    voteId: item.vote || null,
                };
            });

            return {
                success: true,
                comment_count: data.comment_count || 0,
                comments: mappedComments
            };

        } catch (error) {
            console.error(`[commentApi] fetchComments Exception:`, error);
            throw error;
        }
    },

    /**
     * 댓글 등록
     * @param {number} postId 게시글 ID
     * @param {string} postType 'JAM' | 'JIN'
     * @param {string} subject 댓글 내용
     */
    createComment: async (postId, postType, subjectOrFormData) => {
        try {
            const idToken = await AsyncStorage.getItem("id_token");
            const url = `${BASE_URL}/comment`;

            let body;
            let headers = {
                "Accept": "application/json",
                ...(idToken && { "Authorization": `Bearer ${idToken}` }),
            };

            if (subjectOrFormData instanceof FormData) {
                body = subjectOrFormData;
                console.log(`[commentApi] createComment sending FormData...`);
            } else if (subjectOrFormData && typeof subjectOrFormData === "object") {
                body = JSON.stringify(subjectOrFormData);
                headers["Content-Type"] = "application/json";
                console.log(`[commentApi] createComment sending JSON:`, body);
            } else {
                const isJin = postType === THEME.JIN || postType === 'Jin-Talk' || postType === 'think';
                const isComment = postType === THEME.COMMENT || postType === 'comment';
                const typeValue = isComment ? 2 : (isJin ? 1 : 0);

                body = JSON.stringify({
                    type: typeValue,
                    post_num: postId,
                    subject: subjectOrFormData
                });
                headers["Content-Type"] = "application/json";
                console.log(`[commentApi] createComment sending String wrapping:`, body);
            }

            const options = {
                method: "POST",
                headers: headers,
                body: body
            };

            const response = await fetch(url, options);
            console.log(`[commentApi] createComment response status:`, response.status);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[commentApi] createComment ERROR (status: ${response.status}):`, errorBody);
                console.error(`[commentApi] createComment ERROR body (parsed attempt):`, (() => { try { return JSON.parse(errorBody); } catch { return errorBody; } })());
                return { success: false, message: `서버 에러: ${response.status} - ${errorBody.substring(0, 200)}` };
            }

            const data = await response.json();
            return {
                success: data.success,
                message: data.message || (data.success ? "댓글 등록 성공" : "댓글 등록 실패")
            };

        } catch (error) {
            console.error(`[commentApi] createComment EXCEPTION:`, error);
            throw error;
        }
    },

    /**
     * 댓글 삭제
     * @param {number} commentId 댓글 ID
     */
    deleteComment: async (commentId) => {
        try {
            const idToken = await AsyncStorage.getItem("id_token");
            const url = `${BASE_URL}/comment/${commentId}`;

            const options = {
                method: "DELETE",
                headers: {
                    ...(idToken && { "Authorization": `Bearer ${idToken}` }),
                },
            };

            // console.log(`[commentApi] deleteComment request :`, url);
            const response = await fetch(url, options);
            // console.log(`[commentApi] deleteComment status:`, response.status);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[commentApi] deleteComment Error Body:`, errorBody);
                return { success: false, message: `API Error: ${response.status}` };
            }

            const data = await response.json();
            return {
                success: data.success,
                message: data.message || (data.success ? "댓글이 삭제되었습니다." : "댓글 삭제에 실패했습니다.")
            };

        } catch (error) {
            console.error(`[commentApi] deleteComment Exception:`, error);
            throw error;
        }
    },

    /**
     * 댓글 좋아요 토글 (기존 increase/decrease를 대체하는 통합 API)
     * @param {number} commentId 댓글 ID
     */
    toggleCommentLike: async (commentId) => {
        try {
            const idToken = await AsyncStorage.getItem("id_token");
            const url = `${BASE_URL}/like/${commentId}`;

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(idToken && { "Authorization": `Bearer ${idToken}` }),
                },
                body: JSON.stringify({
                    type: 2 // 댓글 타입 (2: comment)
                })
            };

            console.log(`[commentApi] toggleCommentLike REQUEST: POST ${url}`, options.body);

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[commentApi] toggleCommentLike ERROR (Status: ${response.status}):`, errorBody);
                return { success: false, message: `API Error: ${response.status}` };
            }

            const data = await response.json();
            console.log(`[commentApi] toggleCommentLike SUCCESS:`, data);
            return data;

        } catch (error) {
            console.error(`[commentApi] toggleCommentLike EXCEPTION:`, error);
            return { success: false, message: "서버 오류" };
        }
    },

    /**
     * @deprecated POST /like/:id (type:2) 사용 권장
     * 댓글 좋아요 증가
     */
    increaseCommentLike: async (commentId) => {
        return commentApi.toggleCommentLike(commentId);
    },

    /**
     * @deprecated POST /like/:id (type:2) 사용 권장
     * 댓글 좋아요 감소
     */
    decreaseCommentLike: async (commentId) => {
        return commentApi.toggleCommentLike(commentId);
    },

    /**
     * 댓글 상세 조회
     * @param {number} commentId 댓글 ID
     */
    fetchCommentDetail: async (commentId, page = 0) => {
        try {
            const idToken = await AsyncStorage.getItem("id_token");
            // /show/comment/:id 는 deprecated. 최신 API인 /comment/:id 사용
            const url = `${BASE_URL}/comment/${commentId}?page=${page}`;

            console.log(`[commentApi] fetchCommentDetail REQUEST: ${url}`);

            const options = {
                method: "GET",
                headers: {
                    "accept": "application/json",
                    ...(idToken && { "Authorization": `Bearer ${idToken}` }),
                },
            };

            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[commentApi] fetchCommentDetail ERROR: ${response.status}`, errorText);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[commentApi] fetchCommentDetail SUCCESS. page: ${page}`);
            const item = data.comment || data[0] || data;

            if (!item) {
                throw new Error("Comment data not found");
            }

            let elapsedSeconds = 0;
            if (item.timestamp) {
                const postDate = new Date(item.timestamp);
                const now = new Date();
                elapsedSeconds = Math.floor((now - postDate) / 1000);
            }

            // <RULE[p-test.md]> 데이터 구조 확인 로그
            console.log(`[commentApi] fetchCommentDetail field check - likes: ${item.likes}, like: ${item.like}`);

            return {
                id: item.comment_id || item.id,
                usercode: item.user_id,
                name: item.nickname || item.user_id || "익명",
                // 신규 /comment/:id 응답은 profile_image 대신 image 필드로 내려옴 (둘 다 허용)
                profileImage: (item.profile_image || item.image) ? { uri: `https://jamdeeptalk.com/files/profile/${item.profile_image || item.image}` } : null,
                posttext: item.subject || item.content || "",
                // likes와 like 모두 허용
                like: item.like !== undefined ? item.like : (item.likes || 0),
                quote_num: item.quote_num || item.quotes || 0,
                bookmark: item.bookmark !== undefined ? item.bookmark : (item.bookmarks || 0),
                timestamp: elapsedSeconds,
                is_comment: true,
                // 대댓글 개수 (신규 reply_count 필드)
                reply_count: item.reply_count ?? item.reply_num ?? item.replies_count ?? 0,
                comment: item.reply_count ?? item.reply_num ?? item.replies_count ?? item.comment ?? item.comment_count ?? item.comment_num ?? 0,
                isLiked: !!(item.is_like || item.is_liked || item.isLiked),
                isBookmarked: item.is_bookmark !== undefined ? !!item.is_bookmark : false,
                isFollowed: item.is_follow !== undefined ? !!item.is_follow : false,
                postType: THEME.COMMENT,
                draft: item.draft !== undefined ? Number(item.draft) : 0,
                isPostWriter: item.is_post_writer !== undefined ? !!item.is_post_writer : false,
                isReplied: item.is_reply !== undefined ? !!item.is_reply : false,
                isQuoted: item.is_quote !== undefined ? !!item.is_quote : false,
                media: normalizeCommentMedia(item),
                // 투표 관련 필드 추가
                hasVote: !!(
                    item.vote_1 ||
                    item.is_vote ||
                    item.vote_id ||
                    item.has_vote ||
                    (item.vote && typeof item.vote !== "object")
                ),
                voteId: item.vote || null,
            };
        } catch (error) {
            console.error(`[commentApi] fetchCommentDetail Exception:`, error);
            throw error;
        }
    }
};
