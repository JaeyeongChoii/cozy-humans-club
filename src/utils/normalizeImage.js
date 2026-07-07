// 이미지 EXIF orientation(회전) 정규화 유틸
//
// [문제] 스마트폰 카메라는 픽셀을 가로로 저장하고 "90도 회전해서 보여줘"라는
// EXIF orientation 태그만 붙인다. 갤러리/사진앱은 이 태그를 읽어 올바르게 보여주지만,
// 원본 파일을 그대로 업로드하면 EXIF를 무시하는 뷰어/서버에서 90도 돌아간 채로 보인다.
//
// [해결] ImageManipulator로 한 번 재인코딩하면 EXIF 회전값이 실제 픽셀에 반영되고
// 메타데이터는 제거되므로, 어떤 뷰어에서도 올바른 방향으로 표시된다.
import * as ImageManipulator from "expo-image-manipulator";

/**
 * ImagePicker asset 한 개의 방향을 정규화한다.
 * - image: 재인코딩(회전 baked-in, EXIF 제거)해 uri/width/height를 교체
 * - video 또는 실패 시: 원본 그대로 반환 (업로드가 막히지 않도록)
 *
 * @param {{uri:string,type?:string,width?:number,height?:number,duration?:number}} asset
 * @returns {Promise<object>} 정규화된 asset
 */
export const normalizeImageOrientation = async (asset) => {
  // 동영상은 회전 이슈 대상이 아니므로 그대로 둔다.
  if (!asset?.uri || asset.type === "video") return asset;

  try {
    // 액션 없이 통과만 해도 orientation이 픽셀에 반영된다.
    const result = await ImageManipulator.manipulateAsync(asset.uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return {
      ...asset,
      uri: result.uri,
      width: result.width ?? asset.width,
      height: result.height ?? asset.height,
    };
  } catch (e) {
    console.warn("[normalizeImageOrientation] 정규화 실패, 원본 사용:", e);
    return asset;
  }
};

/**
 * ImagePicker asset 배열 전체를 병렬로 정규화한다.
 * @param {Array} assets
 * @returns {Promise<Array>}
 */
export const normalizeImageAssets = async (assets = []) =>
  Promise.all(assets.map((a) => normalizeImageOrientation(a)));
