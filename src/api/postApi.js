// 게시글과 관련된 api
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/BaseURL";
import { FieldMapping } from "../utils/FieldMapping";
import { THEME } from "../design/token/constantsTokens";

export const postApi = {
  /**
   * 홈 화면 게시글 목록 조회
   * @param {string} type 'Jin-Talk' | 'Jam-Talk'
   */
  fetchHomePosts: async (type, page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/home/${type}?page=${page}`;

      /*
      */

      const options = {
        method: "GET",
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        // <RULE[p-test.md]> 백엔드 문제 가능성 제시
        const errorText = await response.text();
        console.error(
          `[postApi] fetchHomePosts Error (${type}) Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`[postApi][MultiImageCheck] fetchHomePosts 첫번째 아이템 데이터:`, JSON.stringify(data[0]));
      }
      return FieldMapping(data, type);
    } catch (error) {
      console.error(`[postApi] fetchHomePosts Error (${type}):`, error);
      throw error;
    }
  },

  // 고유 id를 이용한 회원 정보 조회
  // { 이메일, 유저 id, 닉네임 }
  fetchAccountInfo: async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      //console.log("[AccountManagement] Using idToken:", idToken ? `${idToken.substring(0, 15)}...` : "null");

      if (!idToken) return;

      const url = `${BASE_URL}/profile/account_info`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      };

      //console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      // console.log(`${url} response :`, response.status);
      const text = await response.text();
      // console.log(`${url} response body :`, text);

      if (response.ok) {
        const data = text ? JSON.parse(text) : {};
        // console.log("Account info fetched FULL DATA:", JSON.stringify(data, null, 2)); // 구조 확인용

        if (data?.user_id) {
          await AsyncStorage.setItem("user_id", data.user_id);
        }

        return {
          currentEmail: data?.email ?? null,
          currentUser_id: data?.user_id ?? null,
          currentNickname: data?.nickname ?? null,
          currentId: data?.id ?? null,
        };
      } else {
        console.error("Failed to fetch account info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  },

  // 해당 유저 Id에 대한 정보 가져오기
  // { 고유 id, 닉네임, 유저 id, image, 상태메세지 }
  fetchProfileInfo: async (userIdText) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/profile/info`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({
          user_id: userIdText,
        }),
      };

      // console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);

      console.log(`${url} response :`, response.status);
      const text = await response.text();
      // console.log(`${url} response body :`, text);

      if (response.status === 403) {
        return {
          profileBlocked: true,
          status: response.status,
          message: text,
        };
      }

      if (response.ok) {
        const data = text ? JSON.parse(text) : {};
        console.log("fetchProfileInfo res FULL DATA:", JSON.stringify(data, null, 2)); // 구조 확인용

        const imageUrl =
          data?.image && data.image.trim() !== ""
            ? { uri: `https://jamdeeptalk.com/files/profile/${data.image}` }
            : require("../../tokenImage/defaultProfileImage.png");

        return {
          currentId: data?.id ?? null,
          currentNickname: data?.nickname ?? null,
          currentUser_id: data?.user_id ?? null,
          currentImage: imageUrl,
          currentStatusMessage: data?.status_message ?? "",
          currentHideFollowList: data?.hide_follow_list ?? null,
          currentFollowCount: data?.follow_count ?? null,
          currentFollowerCount: data?.follower_count ?? null,
          blocked:
            data?.blocked === true ||
            data?.blocked === "true" ||
            data?.blocked === 1 ||
            data?.blocked === "1",
          profileBlocked: false,
        };
      } else {
        console.error("Failed to fetch account info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  },

  // 마이페이지 좋아요한 목록들
  fetchLikeList: async () => {
    return await postApi._fetchMypageList("like");
  },

  // 마이페이지 북마크 리스트
  fetchBookmarkList: async () => {
    return await postApi._fetchMypageList("mylist");
  },

  fetchCommentList: async (page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/comment/list`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          page,
        }),
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postApi] fetchCommentList Error Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.comments || data?.data || [];

      return FieldMapping(list, THEME.COMMENT);
    } catch (error) {
      console.error("fetchCommentList error:", error);
      return [];
    }
  },

  fetchQuoteList: async (page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/useractivity/quote_list`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          page,
        }),
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postApi] fetchQuoteList Error Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.quotes || data?.data || [];

      return FieldMapping(list, THEME.JAM);
    } catch (error) {
      console.error("fetchQuoteList error:", error);
      return [];
    }
  },

  // talk_num으로 특정 게시물을 가져오는 함수
  fetchPostDetail: async (postType, id) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      // 홈 API와 달리 삭제/상세는 소문자 jin-talk, jam-talk 사용
      // '진지'나 'Jin-Talk' 등의 값이 들어올 수 있으므로 정확히 판별
      const isJin =
        postType === THEME.JIN ||
        postType?.toLowerCase() === "jin" ||
        postType === "Jin-Talk";
      const typePath = isJin ? "jin-talk" : "jam-talk";
      const url = `${BASE_URL}/${typePath}/${id}`;

      const options = {
        method: "GET",
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      };

      // console.log(`[postApi] Detail request :`, url);
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      let responseData = await response.json();

      //  console.log(`fetchPostDetail (all items):`, JSON.stringify(responseData, null, 2));

      // 데이터 추출 (배열, 중첩 객체 처리)
      let item = responseData;
      if (Array.isArray(item)) {
        item = item[0];
      } else if (item && item.post) {
        item = item.post;
      } else if (item && item.data) {
        item = item.data;
      }

      if (!item) throw new Error("Post data not found in response");

      // ISO 8601 -> 초로 변환
      let elapsedSeconds = 0;
      if (item.timestamp) {
        const postDate = new Date(item.timestamp);
        const now = new Date();
        elapsedSeconds = Math.floor((now - postDate) / 1000);
      }

      return {
        id: item.talk_num || item.think_num || id,
        name: String(item.nickname || ""),
        usercode: item.user_id || null,
        writer_id: item.writer_id || null,
        profileImage: item.profile_image
          ? {
            uri: `https://jamdeeptalk.com/files/profile/${item.profile_image}`,
          }
          : null,
        timestamp: elapsedSeconds || null,
        posttext: item.subject || item.content || null,
        header: item.header || null,
        label: item.header || null,
        like: item.like ?? null,
        comment: (() => {
          const count =
            item.comment !== undefined
              ? item.comment
              : item.comment_count !== undefined
                ? item.comment_count
                : item.comments !== undefined
                  ? item.comments
                  : 0;
          return Number(count) || 0;
        })(),
        view: item.views ?? item.view ?? null,
        bookmark: item.mylist ?? item.bookmark ?? null,
        media: (() => {
          const photos = [];
          const photoFields = ['photo', 'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5'];
          photoFields.forEach(field => {
            if (item[field] && typeof item[field] === "string" && item[field].trim() !== "") {
              const splitPhotos = item[field].split(',').map(s => s.trim()).filter(Boolean);
              photos.push(...splitPhotos);
            }
          });

          if (photos.length > 0) {
            return photos.map(p => ({
              type: "image",
              source: { uri: String(p).startsWith("http") ? p : `https://jamdeeptalk.com/files/${p}` }
            }));
          }
          if (item.images && Array.isArray(item.images)) {
            return item.images.map(p => ({
              type: "image",
              source: { uri: String(p).startsWith("http") ? p : `https://jamdeeptalk.com/files/${p}` }
            }));
          }
          return item.media || null;
        })(),
        quote_num: item.quote_num ?? null,
        reported: !!item.reported,
        quote: item.quote
          ? typeof item.quote === "object"
            ? {
              ...item.quote,
              postType:
                item.quote_type === "comment" || item.quote_type === 2
                  ? THEME.COMMENT
                  : item.quote_type === 1
                    ? THEME.JIN
                    : THEME.JAM,
            }
            : {
              id: item.quote,
              postType:
                item.quote_type === "comment" || item.quote_type === 2
                  ? THEME.COMMENT
                  : item.quote_type === 1
                    ? THEME.JIN
                    : THEME.JAM,
            }
          : null,
        isLiked: item.is_like !== undefined ? !!item.is_like : !!item.isLiked,
        isBookmarked:
          item.is_bookmark !== undefined ? !!item.is_bookmark : !!item.mylist,
        // 현재 유저의 활동 플래그 (댓글/인용/대댓글 작성 여부)
        isCommented: !!item.is_comment,
        isQuoted: !!item.is_quote,
        isReplied: !!item.is_reply,
        // quote 필드가 있으면 재귀적으로 매핑하거나, ID인 경우 ID 객체 생성
        isFollowed: item.is_follow !== undefined ? !!item.is_follow : false,
        postType: isJin ? THEME.JIN : THEME.JAM,
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
      console.error(`[postApi] fetchPostDetail Error (ID: ${id}):`, error);
      throw error;
    }
  },

  // 특정 유저 게시물을 불러오는 함수
  fetchUserPost: async (userIdText, fetchType) => {
    try {
      console.log(userIdText);
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/useractivity`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: userIdText,
          type: fetchType,
        }),
      };
      // console.log(`[${url}] request :`, userIdText, fetchType);
      const response = await fetch(url, options);
      // console.log(`[${url}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      // console.log(`[postApi] fetchUserPost [${fetchType}] 응답 데이터 개수:`, resData?.length);
      if (resData?.length > 0) {
        // <RULE[p-test.md]> 백엔드에서 준 데이터 구조 확인을 위한 로그
        // console.log(`[postApi] fetchUserPost [${fetchType}] 데이터 샘플:`, JSON.stringify(resData.slice(0, 1), null, 2));
        // console.log(`[postApi] fetchUserPost [${fetchType}] 첫번째 아이템 상태 - is_like: ${resData[0].is_like}, is_bookmark: ${resData[0].is_bookmark}`);
      }

      // 백엔드 필드를 프론트엔드 필드로 변환
      const mappingType =
        fetchType === "comment"
          ? THEME.COMMENT
          : fetchType === "think"
            ? "Jin-Talk"
            : "Jam-Talk";
      return FieldMapping(resData, mappingType);
    } catch (error) {
      console.error("fetchUserPost error:", error);
      return [];
    }
  },

  /**
   * 게시글 삭제
   * @param {string} postType 'JIN' | 'JAM'
   * @param {number} id 게시글 ID
   */
  deletePost: async (postType, id) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");

      // postType에 따라 엔드포인트 분기
      const isJin =
        postType === THEME.JIN ||
        postType === "Jin-Talk" ||
        postType === 1 ||
        postType === "1";
      const typePath = isJin ? "jin-talk" : "jam-talk";
      const url = `${BASE_URL}/${typePath}/${id}`;

      console.log(`[postApi] Attempting DELETE on [${typePath}] ID: ${id}`);

      const options = {
        method: "DELETE",
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      };

      console.log(`[postApi] deletePost REQUEST: DELETE ${url}`);
      console.log(`[postApi] deletePost HEADERS:`, JSON.stringify(options.headers, null, 2));

      const response = await fetch(url, options);
      console.log(`[postApi] deletePost RESPONSE STATUS: ${response.status}`);

      let responseData = {};
      try {
        const text = await response.text();
        if (text) {
          responseData = JSON.parse(text);
          console.log(`[postApi] deletePost RESPONSE BODY:`, JSON.stringify(responseData));
        }
      } catch (error) {
        console.log(`[postApi] No JSON response body for DELETE`);
      }

      if (response.ok) {
        return { success: true, quote_num: responseData.quote_num ?? null };
      } else {
        // <RULE[p-test.md]> 서버 에러(500 등) 발생 시 명확하게 실패 반환
        return {
          success: false,
          status: response.status,
          message: responseData.message || "서버 오류가 발생했어."
        };
      }
    } catch (error) {
      console.error(`[postApi] deletePost EXCEPTION (ID: ${id}):`, error);
      // <RULE[p-test.md]> 오류 원인 분석을 위한 상세 정보 제공
      if (error.message.includes("Network request failed")) {
        console.warn("[postApi] 네트워크 연결 실패. 서버가 꺼져있거나 접근할 수 없는 상태입니다.");
      }
      return { success: false, error: error.message };
    }
  },

  /**
   * 게시글 생성
   * @param {FormData} formData
   */
  createPost: async (formData) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/write`;

      const options = {
        method: "POST",
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
          // Content-Type should NOT be set manually for FormData in RN
        },
        body: formData,
      };

      // console.log(`[postApi] Create request URL:`, url);
      // console.log(`[postApi] Create request options:`, JSON.stringify({
      //     method: options.method,
      //     headers: options.headers,
      //     // Do not stringify formData
      // }, null, 2));

      const response = await fetch(url, options);

      // console.log(`[postApi] Create response status:`, response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[postApi] Create error body:`, errorText);
        // 404일 경우 도움말 출력
        if (response.status === 404) {
          console.warn(
            `[postApi] 404 Not Found: Check if the endpoint ${url} is correct.`,
          );
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
        data: data, // 전체 데이터(ID 등) 반환
      };
    } catch (error) {
      console.error(`[postApi] createPost Error:`, error);
      throw error;
    }
  },

  // 팔로우한 명단을 가져오는 함수
  fetchFollowList: async (userIdText) => {
    return await postApi._fetchShowFollow("follow", userIdText);
  },

  // 팔로잉한 명단을 가져오는 함수
  fetchFollowerList: async (userIdText) => {
    return await postApi._fetchShowFollow("follower", userIdText);
  },

  /**
   * 게시물의 좋아요 현황 (좋아요 누른 명단) 조회
   * @param {number|string} postId 게시글 ID
   * @param {string} postType '자유' | '진지' (또는 THEME.JAM | THEME.JIN)
   * @param {number} page 페이지 번호
   */
  fetchLikeListForPost: async (postId, postType, page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      // postType에 따라 free 또는 serious 경로 결정
      const isJin =
        postType === THEME.JIN ||
        postType === "Jin-Talk" ||
        postType === "1" ||
        postType === 1 ||
        postType === "진지";
      const typePath = isJin ? "serious" : "free";
      const timestamp = new Date().getTime();
      const url = `${BASE_URL}/show/like/${typePath}/${postId}?page=${page}&t=${timestamp}`;

      console.log(
        `[postApi] fetchLikeListForPost REQUEST: ${url} (hasToken: ${!!idToken})`,
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          accept: "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      });

      console.log(
        `[postApi] fetchLikeListForPost RESPONSE STATUS: ${response.status}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[postApi] fetchLikeListForPost ERROR BODY:`, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // <RULE[p-test.md]> 백엔드 응답이 실제 DB와 맞는지 대조하기 위한 로그
      // console.log(`[postApi] fetchLikeListForPost ACTUAL DATA:`, JSON.stringify(data));
      // 응답이 배열인지 확인
      if (!Array.isArray(data)) {
        console.warn(
          "[postApi] Like list response is NOT an array. Backend check required.",
          data,
        );
      } else {
        // console.log(`[postApi] fetchLikeListForPost SUCCESS: ${data.length} users fetched`);
      }

      return data; // res: [{nickname, user_id, image}]
    } catch (error) {
      console.error(`[postApi] fetchLikeListForPost EXCEPTION:`, error);
      throw error;
    }
  },

  /**
   * 게시물의 인용 현황 (인용한 명단) 조회
   * @param {number|string} postId 게시글 ID
   * @param {string} postType '자유' | '진지'
   * @param {number} page 페이지 번호 (0-indexed)
   */
  fetchQuotesListForPost: async (postId, postType, page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const isJin =
        postType === THEME.JIN ||
        postType === "Jin-Talk" ||
        postType === "1" ||
        postType === 1 ||
        postType === "진지";
      const typePath = isJin ? "serious" : "free";
      const url = `${BASE_URL}/show/quotes/${typePath}/${postId}?page=${page}`;

      console.log(`[postApi] fetchQuotesListForPost REQUEST: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postApi] fetchQuotesListForPost ERROR: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `[postApi] fetchQuotesListForPost SUCCESS: ${data.length} items`,
        JSON.stringify(data),
      );
      return data;
    } catch (error) {
      console.error(`[postApi] fetchQuotesListForPost EXCEPTION:`, error);
      throw error;
    }
  },

  // 좋아요 토글
  toggleLike: async (postId, postType) => {
    return await postApi._handleActivity("like", postId, postType);
  },
  // 북마크 토글
  toggleBookmark: async (postId, postType) => {
    return await postApi._handleActivity("mylist", postId, postType);
  },

  toggleFollowButton: async (userIdText) => {
    try {
      const url = `${BASE_URL}/follow/${userIdText}`;
      const idToken = await AsyncStorage.getItem("id_token");

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      };

      const response = await fetch(url, options);
      // console.log(`[${url}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      // console.log(`[/${url}] complete response:`, resData); // { msg: string, success: bool}

      return resData?.msg === "팔로우 완료" ? 1 : 0;
    } catch (error) {
      console.error("toggleFollowButton error:", error);
      return [];
    }
  },

  // 해당 유저와 팔로우 여부 반환
  checkIsFollow: async (userIdText) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");

      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      };

      const url = `${BASE_URL}/follow/is_follow?user_id=${userIdText}`;
      const response = await fetch(url, options);
      // console.log(`[${url}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      // console.log(`[${url}] complete response:`, resData); // { mutal : bool }

      return resData.mutal;
    } catch (error) {
      console.error("checkIsFollow error:", error);
      return [];
    }
  },

  // 닉네임 변경하기
  changeingNickname: async (idText, nameText) => {
    try {
      const url = `${BASE_URL}/profile/nickname/register`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: idText,
          nickname: nameText,
        }),
      };
      // console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      console.log(`${url} response :`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // { message: string }
      return data.message === "닉네임 업데이트 성공";
    } catch (error) {
      console.error("changeingID API Error:", error);
      throw error;
    }
  },

  // 상태메세지 변경하기
  changeStatusMsg: async (statusMsg) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");

      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          msg: statusMsg,
        }),
      };

      const url = `${BASE_URL}/profile/status_msg`;
      // console.log(`[/${url}] request :`, statusMsg);
      const response = await fetch(url, options);
      // console.log(`[/${url}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      // console.log(`[/${url}] complete response:`, resData); // {success:bool, msg: string(if success == 0)}

      return resData;
    } catch (error) {
      console.error("fetchStatusMsg error:", error);
      return [];
    }
  },

  updateHideFollowList: async (hide) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/profile/hide_follow_list`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          hide: Boolean(hide),
        }),
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postApi] updateHideFollowList Error Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("updateHideFollowList res:", {
        success: data?.success,
        hide_follow_list: data?.hide_follow_list,
        message: data?.message,
      });

      return data;
    } catch (error) {
      console.error("updateHideFollowList error:", error);
      throw error;
    }
  },

  // 검색 리스트 가져오기
  // req: { id: string, type: string[talk, think, user], searchparam: string }
  search: async (type, searchParam, page = 0) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      let userId = await AsyncStorage.getItem("user_id");

      // userId가 없는 경우 fetchAccountInfo 호출하여 시도
      if (!userId && idToken) {
        const accountInfo = await postApi.fetchAccountInfo();
        userId = accountInfo?.currentUser_id;
      }

      const url = `${BASE_URL}/search`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({
          user_id: userId || "", // id를 user_id로 변경 시도
          type: type, // "talk", "think", "user"
          searchparam: searchParam,
          page: page,
        }),
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[postApi] search ERROR: ${response.status}`, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (type === "user") {
        // user 타입은 별도 매핑 없이 반환하거나 필요시 가공
        return data.map((user) => ({
          name: user.nickname || "",
          usercode: user.user_id || "",
          profileImage: user.profile_image
            ? {
              uri: `https://jamdeeptalk.com/files/profile/${user.profile_image}`,
            }
            : null,
          statusMessage: user.status_message || "",
          isFollowed: user.is_follow !== undefined ? !!user.is_follow : false,
        }));
      } else {
        // talk, think 타입은 FieldMapping 사용
        const mappingType = type === "talk" ? "Jam-Talk" : "Jin-Talk";

        return FieldMapping(data, mappingType);
      }
    } catch (error) {
      console.error(`[postApi] search Error (${type}):`, error);
      return [];
    }
  },

  // 차단 목록 가져오기
  pullBlockList: async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      if (!idToken) return;

      const url = `${BASE_URL}/profile/block/list`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      };

      //   console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      //   console.log(`${url} response :`, response.status);

      const data = await response.json();
      //   console.log(`${url} response body :`, JSON.stringify(data, null, 2));

      if (response.ok) {
        // API 응답 구조를 컴포넌트에서 사용하는 구조로 변환
        // state: 'block' 추가
        const formattedData = data.map((item) => ({
          ...item,
          state: "block",
        }));
        return formattedData;
      }
    } catch (error) {
      console.error("pullBlockList Error:", error);
    }
  },

  // 뮤트 목록 가져오기 (기존 로직 유지하되 state 연결)
  pullMuteList: async () => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      if (!idToken) return;

      const url = `${BASE_URL}/profile/mute/list`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      };
      //   console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      //   console.log(`${url} response :`, response.status);
      const data = await response.json();
      //   console.log(`${url} response body :`, JSON.stringify(data, null, 2));

      if (response.ok) {
        // 뮤트 리스트도 동일하게 처리
        const formattedData = data.map((item) => ({
          ...item,
          state: "mute",
        }));
        return formattedData;
      }
    } catch (error) {
      console.error("pullMuteList Error:", error);
    }
  },

  /**
   * FCM 토큰 등록
   * @param {string} type 'android' | 'ios'
   * @param {string} token FCM Token
   */
  registerFcmToken: async (type, token) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/fcm/token`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({
          type: type,
          token: token,
        }),
      };

      console.log(`[postApi] registerFcmToken REQUEST: ${url}`, options.body);

      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postApi] registerFcmToken Error Status: ${response.status}`,
          errorText,
        );
        return { success: false, status: response.status, message: errorText };
      }

      const data = await response.json();
      console.log(`[postApi] registerFcmToken SUCCESS:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`[postApi] registerFcmToken EXCEPTION:`, error);
      throw error;
    }
  },

  // 아이디 중복 확인
  isIdDuplicate: async (idText) => {
    try {
      const url = `${BASE_URL}/profile/id_check`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: idText }),
      };
      console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      console.log(`${url} response :`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // { duplicated: boolean }

      return Boolean(data?.duplicated);
    } catch (error) {
      console.error("ID Check API Error:", error);
      throw error; // 에러를 상위(handleComplete)로 전파하여 네트워크 에러 처리하도록 함
    }
  },

  // 이메일 중복 확인
  isEmailDuplicate: async (emailText) => {
    try {
      const url = `${BASE_URL}/oauth/duple_mail_check`; // Added slash
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mail: emailText }),
      };
      //   console.log(`${url} request :`, JSON.stringify(options, null, 2));

      const response = await fetch(url, options);
      // console.log(`${url} response :`, response.status);

      if (!response.ok) {
        // throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return Boolean(data?.duple);
    } catch (error) {
      console.error("Email Check API Error:", error);
      throw error;
    }
  },

  /*
    *
    *
    내수용 코드
    *
    *
    */
  // /home에서 좋아요, 북마크 관련 함수
  _handleActivity: async (endPoint, postId, selectedTabText) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/${endPoint}/${postId}`;

      // jam_talk은 0, jin_talk은 1로 전달
      let tabId = selectedTabText === THEME.JAM ? 0 : 1;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: tabId,
        }),
      };

      // console.log(`[/${endPoint}/${postId}] request :`, url, tabId);
      const response = await fetch(url, options);
      // console.log(`[/${endPoint}/${postId}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      // console.log(`[postApi] _handleActivity [${endPoint}/${postId}] response body:`, JSON.stringify(resData));

      return resData;
    } catch (error) {
      console.error("_handleActivity error:", error);
      return [];
    }
  },

  // 마이페이지에서 사용
  _fetchMypageList: async (endPoint) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");

      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      };

      // 0번(JAM), 1번(JIN) 요청 URL
      const urlJam = `${BASE_URL}/${endPoint}/list?type=0`;
      const urlJin = `${BASE_URL}/${endPoint}/list?type=1`;

      // Promise.all을 통해 두 요청을 동시에(병렬로) 보냄
      const [responseJam, responseJin] = await Promise.all([
        fetch(urlJam, options),
        fetch(urlJin, options),
      ]);
      if (!responseJam.ok || !responseJin.ok) {
        throw new Error(
          `API Error: JAM(${responseJam.status}), JIN(${responseJin.status})`,
        );
      }
      const resDataJam = await responseJam.json();
      const resDataJin = await responseJin.json();
      // console.log(`[postApi] _fetchMypageList [${endPoint}] JAM raw sample:`, JSON.stringify(resDataJam?.[0], null, 2));
      // console.log(`[postApi] _fetchMypageList [${endPoint}] JIN raw sample:`, JSON.stringify(resDataJin?.[0], null, 2));

      // <RULE[p-test.md]> 백엔드 데이터 확인 로그 (성공적으로 파악 완료하여 주석 처리)
      
            // console.log(`[postApi] _fetchMypageList [${endPoint}] JAM 응답 개수: ${resDataJam?.length}, JIN 응답 개수: ${resDataJin?.length}`);
            // if (resDataJam?.length > 0) {
            //     console.log(`[postApi] _fetchMypageList [${endPoint}] JAM 샘플 상태 - is_like: ${resDataJam[0].is_like}, is_bookmark: ${resDataJam[0].is_bookmark}`);
            // }
            // if (resDataJin?.length > 0) {
            //     console.log(`[postApi] _fetchMypageList [${endPoint}] JIN 샘플 상태 - is_like: ${resDataJin[0].is_like}, is_bookmark: ${resDataJin[0].is_bookmark}`);
            // }
      

      // <RULE[p-test.md]> 백엔드에서 is_like, is_bookmark를 직접 내려주므로 더이상 수동으로 주입하지 않음
      const mappedJam = FieldMapping(resDataJam, THEME.JAM);
      const mappedJin = FieldMapping(resDataJin, THEME.JIN);
      // console.log(`[postApi] _fetchMypageList [${endPoint}] JAM mapped sample:`, JSON.stringify(mappedJam?.[0], null, 2));
      // console.log(`[postApi] _fetchMypageList [${endPoint}] JIN mapped sample:`, JSON.stringify(mappedJin?.[0], null, 2));

      // 두 배열을 하나로 (Spread 문법 사용)
      const combinedList = [...(mappedJam || []), ...(mappedJin || [])];
      return combinedList;
    } catch (error) {
      console.error("_fetchMypageList error:", error);
      return [];
    }
  },

  // 팔로우, 팔로잉 리스트에 사용
  _fetchShowFollow: async (endPoint, userIdText) => {
    try {
      const url = `${BASE_URL}/show/${endPoint}/${userIdText}`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };
      // console.log(`[/${url}] request`);
      const response = await fetch(url, options);
      // console.log(`[/${url}] response status:`, response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resData = await response.json();
      console.log(
        `[${url}] complete response:`,
        JSON.stringify(resData, null, 2),
      );  // 구조 확인용
      
      // [{
      // nickname:string
      // user_id: string
      // image: string
      // is_follow: bool (if : endPoint === follower)
      // },
      // ]

      return resData;
    } catch (error) {
      console.error(`_fetchShowFollow ${endPoint} error:`, error);
      return [];
    }
  },

  /**
   * 투표 정보 조회
   * @param {number|string} id 게시글 ID
   */
  fetchVote: async (id) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/vote/${id}`;

      console.log(`[postApi] fetchVote REQUEST: ${url}`);

      const options = {
        method: "GET",
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        // <RULE[p-test.md]> 백엔드 문제 가능성 로그
        const errorText = await response.text();
        console.warn(
          `[postApi] fetchVote Error (ID: ${id}) Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      /*
      console.log(
        `[postApi] fetchVote SUCCESS (ID: ${id}):`,
        JSON.stringify(data),
      );
      */
      return data;
    } catch (error) {
      console.error(`[postApi] fetchVote EXCEPTION (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * 투표하기
   * @param {number|string} id 게시글 ID
   * @param {number} choice 선택한 항목 번호 (1~6)
   */
  castVote: async (id, choice) => {
    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const url = `${BASE_URL}/vote/${id}`;

      console.log(`[postApi] castVote REQUEST: ${url}, choice: ${choice}`);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({ choice }),
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        // <RULE[p-test.md]> 백엔드 문제 가능성 로그
        const errorText = await response.text();
        console.error(
          `[postApi] castVote Error (ID: ${id}) Status: ${response.status}`,
          errorText,
        );
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `[postApi] castVote SUCCESS (ID: ${id}):`,
        JSON.stringify(data),
      );
      return data;
    } catch (error) {
      console.error(`[postApi] castVote EXCEPTION (ID: ${id}):`, error);
      throw error;
    }
  },

  submitReport: async ({ postId, postType, category, reportType, reason }) => {
    const idToken = await AsyncStorage.getItem("id_token");
    const url = `${BASE_URL}/report`;
    const body = {
      ...(postId !== undefined && postId !== null && { post_id: postId }),
      ...(postType && { post_type: postType }),
      category,
      report_type: reportType,
      ...(reason?.trim() && { reason: reason.trim() }),
    };

    console.log(
      "[postApi] submitReport REQUEST:\n",
      JSON.stringify(
        {
          url,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken ? "Bearer [TOKEN]" : "없음",
          },
          body,
        },
        null,
        2,
      ),
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(
      "[postApi] submitReport RESPONSE:\n",
      JSON.stringify(
        {
          status: response.status,
          ok: response.ok,
          body: responseText,
        },
        null,
        2,
      ),
    );

    let responseData = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { msg: responseText };
    }

    if (!response.ok || responseData?.success === 0) {
      const error = new Error(
        responseData?.msg || `Report API Error: ${response.status}`,
      );
      error.status = response.status;
      error.responseData = responseData;
      throw error;
    }

    return responseData;
  },
};
