import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ColorTokens } from '../../design/token/ColorTokens';
import {
    DYNAMIC_LABEL_SIDE_WIDTH
} from '../../design/token/constantsTokens';
import { Typography } from '../../design/Typography';
import CachedImage from '../common/CachedImage';

const DYNAMIC_BUTTON_HEIGHT = 28;

/**
 * 텍스트 길이에 따라 가로 길이가 유동적으로 변하는 라벨 컴포넌트입니다.
 * 좌/우측에 특수한 테두리 이미지가 있고, 중앙에는 텍스트 길이에 맞춰 늘어나는 배경이 있습니다.
 * 
 * @param {string} text - 라벨에 표시할 텍스트
 */
const DynamicButton = ({ text, disabled = false, isPoint2 = false }) => {
    return (
        <View
            style={styles.labelContainer}
            needsOffscreenAlphaCompositing={Platform.OS === 'android'}
            renderToHardwareTextureAndroid={Platform.OS === 'android'}
        >
            {/* 좌측 이미지 (고정 너비) */}
            <CachedImage
                source={
                    disabled
                        ?
                        require('../../../assets/button/PointButtonDisabledLeft.png')
                        : isPoint2
                        ?
                        require('../../../assets/button/Point2ButtonLeft.png')
                        :
                        require('../../../assets/button/PointButtonLeft.png')
                }
                style={styles.leftImage}
                resizeMode="contain"
            />

            {/* 중앙 텍스트 영역 (가변 너비) */}
            <View style={[
                styles.middleContainer,
                disabled ?
                    {
                        backgroundColor: ColorTokens.Unselected,
                    }
                    :
                    {
                        backgroundColor: isPoint2 ? ColorTokens.Point2 : ColorTokens.Point,
                    }
            ]}>
                <Text style={styles.labelText}>{text}</Text>
            </View>

            {/* 우측 이미지 (고정 너비) */}
            <CachedImage
                source={
                    disabled
                        ?
                        require('../../../assets/button/PointButtonDisabledRight.png')
                        : isPoint2
                        ?
                        require('../../../assets/button/Point2ButtonRight.png')
                        :
                        require('../../../assets/button/PointButtonRight.png')
                }
                style={styles.rightImage}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: DYNAMIC_BUTTON_HEIGHT,
    },
    leftImage: {
        width: DYNAMIC_LABEL_SIDE_WIDTH,
        height: DYNAMIC_BUTTON_HEIGHT,
    },
    rightImage: {
        width: DYNAMIC_LABEL_SIDE_WIDTH,
        height: DYNAMIC_BUTTON_HEIGHT,
    },
    middleContainer: {
        height: DYNAMIC_BUTTON_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: -1,

        paddingHorizontal: 2, // 필요시 패딩 추가
    },
    labelText: {
        ...Typography.boldMedium,
        color: ColorTokens.PureBlack,
        // 안드로이드에서 텍스트 수직 정렬 미세 조정
        marginBottom: Platform.OS === 'android' ? 0 : 0,
    },
});

export default DynamicButton;
