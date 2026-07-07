// 포스트
// 미트볼 버튼을 눌렀을때 나오는 선택지들
import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Image, Text, Pressable, Modal, Dimensions, StyleSheet } from "react-native";
import Tokens from "../../Tokens";
import { useMoreMenu, useMoreMenuActiveId } from "./MoreMenuContext";
import { ColorTokens } from "../design/token/ColorTokens";

/**
 * 더보기(미트볼) 메뉴 컴포넌트
 * 유지보수와 재사용성을 위해 내부 분기(type 등)를 제거하고, 오직 부모 컴포넌트가 전달해주는 options 배열에 의존하여 메뉴를 렌더링합니다.
 *
 * @param {Object} props
 * @param {boolean} [props.hideTrigger=false] - 미트볼 트리거 숨김 여부
 * @param {Object} [props.overrideMenuStyle] - 메뉴 팝업 창(View) 자체의 스타일을 덮어쓸 때 사용
 */
const MoreMenu = ({
  menuId,
  options = [], // 기본적으로 빈 배열을 받아 에러 방지
  hideTrigger = false,
  overrideMenuStyle,
  dismissOnScroll = false, // true면 네이티브 Modal 대신 루트 오버레이로 띄워 스크롤로 닫히게 함
  ...restProps
}) => {
  // console.log("[MoreMenu Render] menuId:", menuId, "| options count:", options?.length, "| other props:", restProps);
  const { openMenu, closeMenu, showOverlayMenu } = useMoreMenu();
  const activeMenuId = useMoreMenuActiveId();
  const showMenu = activeMenuId === menuId && menuId !== undefined;

  const triggerRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  // Modal을 사용할지 여부. hideTrigger가 참이면 부모의 상대 위치를 의존할 가능성이 높으므로 Modal을 사용하지 않습니다.
  // dismissOnScroll 모드에서는 Modal/인라인 대신 루트 오버레이 호스트로 위임한다.
  const useModal = !hideTrigger && !dismissOnScroll;

  const handleToggle = () => {
    // console.log("showMenu:", showMenu, "menuId:", menuId);
    if (showMenu) {
      closeMenu();
    } else {
      if (menuId) {
        // 트리거가 보이는 메뉴는 화면 좌표 기준으로 위치를 계산한다 (Modal/오버레이 공통).
        if ((useModal || dismissOnScroll) && triggerRef.current) {
          triggerRef.current.measureInWindow((x, y, width, height) => {
            const screenWidth = Dimensions.get('window').width;
            const screenHeight = Dimensions.get('window').height;
            const rightPos = screenWidth - x - width;

            let verticalPos = {};
            if (y > screenHeight / 2) {
              // 화면 하단 50%에 위치: 메뉴를 버튼 위로 올림
              verticalPos = { bottom: screenHeight - y };
            } else {
              // 화면 상단 50%에 위치: 메뉴를 버튼 아래로 내림
              verticalPos = { top: y + height };
            }

            if (dismissOnScroll) {
              // 루트 오버레이 호스트에 위임 (스크롤로 닫힘)
              showOverlayMenu({
                menuId,
                position: { ...verticalPos, right: rightPos },
                options,
              });
            } else {
              setMenuPos({ ...verticalPos, right: rightPos });
              openMenu(menuId);
            }
          });
        } else {
          openMenu(menuId);
        }
      } else {
        // console.log("menuId가 없습니다! (falsy)");
      }
    }
  };

  const renderMenuContent = () => (
    <>
      {/* 메뉴 외부 터치 시 닫기 위한 Backdrop */}
      <Pressable
        style={
          useModal
            ? StyleSheet.absoluteFillObject
            : {
                position: "absolute",
                top: -3000,
                left: -3000,
                right: -3000,
                bottom: -3000,
                zIndex: 90,
                backgroundColor: "transparent",
              }
        }
        onPress={closeMenu}
      />
      <View
        style={[
          Tokens.menu,
          {
            height: 50 * options.length, // 버튼 개수에 따라 유동적으로 변함
          },
          useModal 
            ? { 
                top: menuPos.bottom !== undefined ? undefined : menuPos.top, 
                bottom: menuPos.bottom, 
                right: menuPos.right 
              } 
            : {},
          overrideMenuStyle,
        ]}
      >
        {options.map((item, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                closeMenu();
                item.onPress?.();
              }}
            >
              <Text
                style={[
                  Tokens.menuItem,
                  item.color ? { color: item.color } : null,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>

            {/* 마지막 버튼이 아닐 경우에만 구분선(디바이더) 추가 */}
            {index < options.length - 1 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: ColorTokens.InnerBox2,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </>
  );

  return (
    <View>
      {!hideTrigger && (
        <TouchableOpacity
          ref={triggerRef}
          style={{
            paddingRight: 18,
            height: 40, // 원하는 높이
            width: 40, // 원하는 너비 (필요에 따라 설정)
            justifyContent: "center", // 수직 가운데 정렬
            alignItems: "center", // 수평 가운데 정렬
          }}
          onPress={handleToggle}
        >
          <Image
            source={require("../../tokenImage/meatball.png")}
            style={Tokens.meatball}
          />
        </TouchableOpacity>
      )}
      {/*
        신고/차단/무시를 누르면 메뉴가 false가 되어 사라짐.
        dismissOnScroll 모드는 루트 오버레이 호스트가 그리므로 여기서는 렌더하지 않는다.
        */}
      {!dismissOnScroll && showMenu && options.length > 0 && (
        useModal ? (
          <Modal transparent={true} visible={showMenu} animationType="none" onRequestClose={closeMenu}>
            {renderMenuContent()}
          </Modal>
        ) : (
          renderMenuContent()
        )
      )}
    </View>
  );
};
export default MoreMenu;
