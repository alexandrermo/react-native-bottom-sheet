import React, { memo } from 'react';
import { View } from 'react-native';
import { styles } from './styles';
import type { BottomSheetBackgroundProps } from './types';

const BottomSheetBackgroundComponent = ({
  pointerEvents,
  style,
  accessible = false,
  importantForAccessibility = "no"
}: BottomSheetBackgroundProps) => (
  <View
    pointerEvents={pointerEvents}
    style={[styles.background, style]}
    accessible={accessible}
    importantForAccessibility={importantForAccessibility}
  />
);

export const BottomSheetBackground = memo(BottomSheetBackgroundComponent);
BottomSheetBackground.displayName = 'BottomSheetBackground';
