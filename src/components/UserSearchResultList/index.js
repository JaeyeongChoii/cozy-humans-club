import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { postApi } from "../../api/postApi";
import SearchedUserList from "../SearchedUserList";

const normalizeSearchParam = (value) => String(value || "").replace(/^@/, "").trim();

const UserSearchResultList = ({
  keyword,
  onSelectUser,
  listStyle,
  contentContainerStyle,
  minLength = 1,
  keyboardShouldPersistTaps = "handled",
  virtualized = true,
  maxResults,
  scrollable = false,
  selectOnPressIn = true,
}) => {
  const [users, setUsers] = useState([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const searchParam = normalizeSearchParam(keyword);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (searchParam.length < minLength) {
      setUsers([]);
      return;
    }

    postApi
      .search("user", searchParam, 0)
      .then((results) => {
        if (requestIdRef.current !== requestId) return;
        setUsers(Array.isArray(results) ? results : []);
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) return;
        console.error("[UserSearchResultList] user search failed:", error);
        setUsers([]);
      });
  }, [keyword, minLength]);

  const renderUser = (item) => (
    <SearchedUserList
      nickname={item.name}
      userId={`@${item.usercode}`}
      profileImage={item.profileImage}
      onPress={selectOnPressIn ? undefined : () => onSelectUser?.(item)}
      onPressIn={selectOnPressIn ? () => onSelectUser?.(item) : undefined}
    />
  );

  const visibleUsers = maxResults ? users.slice(0, maxResults) : users;

  if (!virtualized) {
    const content = (
      visibleUsers.map((item, index) => (
        <React.Fragment key={item.usercode || String(index)}>
          {renderUser(item)}
        </React.Fragment>
      ))
    );

    if (scrollable) {
      return (
        <ScrollView
          style={listStyle}
          contentContainerStyle={[styles.listContent, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {content}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.listContent, listStyle, contentContainerStyle]}>
        {content}
      </View>
    );
  }

  return (
    <FlatList
      data={visibleUsers}
      renderItem={({ item }) => renderUser(item)}
      keyExtractor={(item, index) => item.usercode || String(index)}
      showsVerticalScrollIndicator={true}
      style={listStyle}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 0,
  },
});

export default UserSearchResultList;
