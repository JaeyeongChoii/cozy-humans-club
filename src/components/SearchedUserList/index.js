import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ColorTokens } from '../../design/token/ColorTokens';
import { Typography } from '../../design/Typography';
import { Spacing } from '../../design/Spacing';
import { Radius } from '../../design/Radius';
import CachedImage from '../common/CachedImage';

export default function SearchedUserList({ nickname, userId, profileImage, onPress, onPressIn }) {
    return (
        <TouchableOpacity
            style={styles.userItem}
            onPress={onPress}
            onPressIn={onPressIn}
            activeOpacity={0.8}
        >
            <CachedImage
                source={profileImage || require("../../../tokenImage/defaultProfileImage.png")}
                style={styles.profileCircle}
                placeholder={require("../../../tokenImage/defaultProfileImage.png")}
                resizeWidth={200}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{nickname}</Text>
                <Text style={styles.userId}>{userId}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing[3],
    },
    profileCircle: {
        width: 40,
        height: 40,
        borderRadius: Radius.round,
        marginRight: Spacing[5],
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: ColorTokens.Typography,
        ...Typography.boldSmall,
    },
    userId: {
        color: ColorTokens.Typography,
        ...Typography.paraSmall,
    },
});
