import { Image } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * 미디어 소스의 타입을 감지합니다.
 * @param {number|object|string} source - require()된 모듈 ID 또는 { uri: string } 또는 uri 문자열
 * @returns {'image' | 'video'} 미디어 타입 (디폴트는 'image')
 */
export const getMediaType = (source) => {
    let uri = '';
    let ext = '';

    if (typeof source === 'number') {
        // expo-asset을 사용하여 모듈 메타데이터 접근
        const asset = Asset.fromModule(source);
        if (asset) {
            // asset.type은 보통 확장자(mp4, jpg 등)를 반환함
            if (asset.type) {
                ext = asset.type.toLowerCase();
            }
            if (asset.uri) {
                uri = asset.uri;
            }
        }
    } else if (typeof source === 'object' && source.uri) {
        uri = source.uri;
    } else if (typeof source === 'string') {
        uri = source;
    }

    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v'];

    // 1. asset.type으로 확인
    if (ext && videoExtensions.includes(ext)) {
        return 'video';
    }

    // 2. URI 확장자로 확인
    if (uri) {
        // 쿼리 스트링 제거
        const cleanUri = uri.split('?')[0];
        const uriExt = cleanUri.split('.').pop().toLowerCase();

        if (videoExtensions.includes(uriExt)) {
            return 'video';
        }
    }

    return 'image';
};
