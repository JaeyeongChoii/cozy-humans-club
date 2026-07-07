import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Tokens from '../../Tokens';
import { ColorTokens } from '../design/token/ColorTokens';

// Context 생성
// - MoreMenuContext: 자주 바뀌지 않는 값(액션 함수 + currentUserCode). value를 memoize하여
//   미트볼 토글(open/close)이 일어나도 이 context를 구독하는 무거운 컴포넌트(Posts 등)가
//   재렌더되지 않게 한다.
// - MoreMenuActiveContext: 토글마다 바뀌는 activeMenuId만 분리. 이 값을 실제로 쓰는 건
//   MoreMenu 트리거뿐이므로, 토글 시 재렌더 범위를 MoreMenu 트리거와 루트 오버레이로 최소화한다.
export const MoreMenuContext = createContext({
    currentUserCode: null,
    openMenu: () => { },
    closeMenu: () => { },
    setCurrentUserCode: () => { },
    showOverlayMenu: () => { },
});

const MoreMenuActiveContext = createContext(null);

// Provider 생성
export const MoreMenuProvider = ({ children }) => {
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [currentUserCode, setCurrentUserCode] = useState(null);
    // 루트 오버레이로 띄우는 메뉴(스크롤로 닫히는 모드). null이면 표시 안 함.
    // { menuId, position: {top?, bottom?, right}, options: [{label, onPress, color}] }
    const [overlayMenu, setOverlayMenu] = useState(null);

    const openMenu = useCallback((id) => {
        setActiveMenuId(id);
    }, []);

    const closeMenu = useCallback(() => {
        setActiveMenuId(null);
        setOverlayMenu(null);
    }, []);

    // 루트 오버레이 메뉴 등록 (Moremenu의 host 모드에서 호출)
    const showOverlayMenu = useCallback((payload) => {
        setOverlayMenu(payload);
        setActiveMenuId(payload.menuId);
    }, []);

    // 액션 함수들은 useCallback으로 안정적이므로, value는 currentUserCode가 바뀔 때만 새로 생성된다.
    // → activeMenuId/overlayMenu가 바뀌어도(미트볼 토글) 이 context 구독자는 재렌더되지 않는다.
    const contextValue = useMemo(() => ({
        currentUserCode,
        openMenu,
        closeMenu,
        setCurrentUserCode,
        showOverlayMenu,
    }), [currentUserCode, openMenu, closeMenu, showOverlayMenu]);

    return (
        <MoreMenuContext.Provider value={contextValue}>
            <MoreMenuActiveContext.Provider value={activeMenuId}>
                {children}

                {/*
                  루트 오버레이 호스트.
                  컨테이너는 pointerEvents="box-none"이라 메뉴 박스(자식)를 제외한 영역은
                  터치가 그대로 아래 리스트로 통과된다. 덕분에 메뉴가 열린 상태에서도
                  스크롤이 막히지 않고, 스크롤 시작 시점에 closeMenu가 호출되어
                  "스크롤하면 바로 닫히면서 그대로 스크롤"이 가능해진다.
                */}
                {overlayMenu && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
                        <View
                            style={[
                                Tokens.menu,
                                { height: 50 * overlayMenu.options.length },
                                {
                                    top: overlayMenu.position.bottom !== undefined ? undefined : overlayMenu.position.top,
                                    bottom: overlayMenu.position.bottom,
                                    right: overlayMenu.position.right,
                                    // 안드로이드: 바텀시트(elevation:10)보다 위에 그려지도록 높은 elevation 부여
                                    zIndex: 9999,
                                    elevation: 9999,
                                },
                            ]}
                        >
                            {overlayMenu.options.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Pressable
                                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => {
                                            closeMenu();
                                            item.onPress?.();
                                        }}
                                    >
                                        <Text style={[Tokens.menuItem, item.color ? { color: item.color } : null]}>
                                            {item.label}
                                        </Text>
                                    </Pressable>

                                    {index < overlayMenu.options.length - 1 && (
                                        <View style={{ height: 1, backgroundColor: ColorTokens.InnerBox2 }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                )}
            </MoreMenuActiveContext.Provider>
        </MoreMenuContext.Provider>
    );
};

// Custom Hook
export const useMoreMenu = () => useContext(MoreMenuContext);
// activeMenuId만 필요한 곳(MoreMenu 트리거)에서 사용. 토글 시 재렌더 범위를 좁힌다.
export const useMoreMenuActiveId = () => useContext(MoreMenuActiveContext);
