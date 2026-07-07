// 설정
// 이유를 유저가 적는 화면
import React from 'react';
import { StyleSheet, View } from 'react-native';
import WritingExplain from '../WritingExplain';

const ReportExplain = ({ description, onChangeDescription, title = "해당 문제에 대해 설명 해줄 수 있어?", highlightWords }) => {
  return (
    <View style={styles.container}>
      <WritingExplain
        text={description}
        onChangeText={onChangeDescription}
        title={title}
        highlightWords={highlightWords}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ReportExplain;
