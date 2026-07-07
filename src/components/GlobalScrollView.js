import React, { forwardRef, useContext } from 'react';
import { ScrollView } from 'react-native';
import { BottomSheetContext } from './BottomSheetFrame/BottomSheetContext';

const GlobalScrollView = forwardRef((props, ref) => {
    const sheetContext = useContext(BottomSheetContext);
    const scrollEnabled = sheetContext?.scrollEnabled ?? true;

    return (
        <ScrollView
            ref={ref}
            indicatorStyle="white"
            scrollEnabled={scrollEnabled}
            {...props}
        />
    );
});

export default GlobalScrollView;
