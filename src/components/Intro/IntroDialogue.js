import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { ColorTokens } from '../../design/token/ColorTokens';
import { SCREEN_WIDTH, SCREEN_HEIGHT, heightScale, widthScale } from '../../utils/scale';
import { Typography } from '../../design/Typography';

const IntroDialogue = ({ text, isSmall }) => {
    if (!text) return null;

    return (
        <View style={styles.container}>
            <ImageBackground
                source={
                    isSmall
                        ?
                        require("../../../assets/image/diologueSmall.png")
                        :
                        require("../../../assets/image/diologue.png")
                }
                style={[styles.dialogueBox, {
                    minHeight: isSmall ?  82 : 105, // 최소 높이 설정
                }]}
                resizeMode="stretch"
            >
                <Text style={styles.text}>{text}</Text>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 69,
        alignItems: 'center',
    },
    dialogueBox: {
        width: widthScale(352), // 좌우 여백 고려
        padding: 20,
        justifyContent: 'center',
    },
    text: {
        color: ColorTokens.Typography,
        ...Typography.paraMedium,
        textAlign: 'left', // 텍스트 좌측 정렬
    }
});

export default IntroDialogue;
