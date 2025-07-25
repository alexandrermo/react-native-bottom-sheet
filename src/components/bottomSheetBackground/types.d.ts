import type { ViewProps } from 'react-native';
import type { BottomSheetVariables } from '../../types';
import type { BottomSheetProps } from '../bottomSheet';
export interface BottomSheetBackgroundProps
  extends Pick<ViewProps, 'pointerEvents' | 'style'>,
    BottomSheetVariables {
      accessible?: boolean;
      importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
    }

export type BottomSheetBackgroundContainerProps = Pick<
  BottomSheetProps,
  'backgroundComponent' | 'backgroundStyle'
> &
  BottomSheetBackgroundProps;
