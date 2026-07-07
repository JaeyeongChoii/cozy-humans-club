import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IntroSequence from '../components/Intro/IntroSequence';

const Dialogue = () => {
    const navigation = useNavigation();

    const handleComplete = () => {
        // 대화가 끝나면 가입 시작 화면(OnboardingScreen)으로 이동
        navigation.replace("OnboardingScreen");
    };

    return (
        <View style={styles.container}>
            <IntroSequence onComplete={handleComplete} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default Dialogue;
