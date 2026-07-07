import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Popup/Toast';

const ToastContext = createContext({
    showToast: () => { },
    hideToast: () => { },
});

export const ToastProvider = ({ children }) => {
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        pointMessage: '',
        message: '',
        duration: 1500,
        withOverlay: false,
    });

    const showToast = useCallback(({ pointMessage, message, duration = 1500, withOverlay = false }) => {
        setToastConfig({
            visible: true,
            pointMessage,
            message,
            duration,
            withOverlay,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToastConfig((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast
                visible={toastConfig.visible}
                pointMessage={toastConfig.pointMessage}
                message={toastConfig.message}
                duration={toastConfig.duration}
                withOverlay={toastConfig.withOverlay}
                onDismiss={hideToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
