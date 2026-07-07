// 스크린샷 차단 기능
import React, { useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import Toast from './Popup/Toast';

const ScreenshotProtection = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // 안드로이드: 스크린샷 캡처 방지 (블랙 스크린 처리)
        const preventCapture = async () => {
            // await ScreenCapture.preventScreenCaptureAsync(); // 캡처 방지
            await ScreenCapture.allowScreenCaptureAsync(); // 임시 허용 (주석 처리)
        };
        preventCapture();

        // 스크린샷 감지 리스너 (공통)
        const subscription = ScreenCapture.addScreenshotListener(() => {
            setVisible(true);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <Toast
            visible={visible}
            pointMessage={'[코지의 마법]'}
            message={'공간안에서 캡쳐는 막혀있다는 사실!'}
            withOverlay={true}
            onDismiss={() => setVisible(false)}
        />
    );
};

export default ScreenshotProtection;
