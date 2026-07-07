import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { ColorTokens } from '../../design/token/ColorTokens';
import {
    DYNAMIC_LABEL_HEIGHT,
    DYNAMIC_LABEL_SIDE_WIDTH,
    DYNAMIC_LABEL_FONT_SIZE,
    DYNAMIC_LABEL_BORDER_WIDTH
} from '../../design/token/constantsTokens';
import { Typography } from '../../design/Typography';

/**
 * 텍스트 길이에 따라 가로 길이가 유동적으로 변하는 라벨 컴포넌트입니다.
 * 좌/우측에 특수한 테두리 이미지가 있고, 중앙에는 텍스트 길이에 맞춰 늘어나는 배경이 있습니다.
 * 
 * @param {string} text - 라벨에 표시할 텍스트
 */
const DynamicLabel = ({ text }) => {
    return (
        <View style={styles.labelContainer}>
            {/* 좌측 이미지 (고정 너비) */}
            <Image
                source={require('../../../tokenImage/writeCategoryLeft.png')}
                style={styles.leftImage}
                resizeMode="contain"
            />

            {/* 중앙 텍스트 영역 (가변 너비) */}
            <View style={styles.middleContainer}>
                <Text style={styles.labelText}>{text}</Text>
            </View>

            {/* 우측 이미지 (고정 너비) */}
            <Image
                source={require('../../../tokenImage/writeCategoryRight.png')}
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
        height: DYNAMIC_LABEL_HEIGHT,
    },
    leftImage: {
        width: DYNAMIC_LABEL_SIDE_WIDTH,
        height: DYNAMIC_LABEL_HEIGHT,
    },
    rightImage: {
        width: DYNAMIC_LABEL_SIDE_WIDTH,
        height: DYNAMIC_LABEL_HEIGHT,
        transform: [{ translateX: -DYNAMIC_LABEL_BORDER_WIDTH * 2 }],
    },
    middleContainer: {
        height: DYNAMIC_LABEL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: ColorTokens.Point,
        borderTopWidth: DYNAMIC_LABEL_BORDER_WIDTH,
        borderBottomWidth: DYNAMIC_LABEL_BORDER_WIDTH,

        paddingHorizontal: 0, // 필요시 패딩 추가
        transform: [{ translateX: -DYNAMIC_LABEL_BORDER_WIDTH }],
    },
    labelText: {
        ...Typography.boldMedium,
        color: ColorTokens.Point,
        // 안드로이드에서 텍스트 수직 정렬 미세 조정
        marginBottom: Platform.OS === 'android' ? 0 : 0,
    },
});

export default DynamicLabel;
