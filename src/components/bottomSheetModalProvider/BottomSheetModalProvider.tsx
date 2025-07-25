import { PortalProvider } from '@gorhom/portal';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { MODAL_STACK_BEHAVIOR } from '../../constants';
import {
  BottomSheetModalInternalProvider,
  BottomSheetModalProvider,
} from '../../contexts';
import { id } from '../../utilities/id';
import {
  INITIAL_CONTAINER_HEIGHT,
  INITIAL_CONTAINER_OFFSET,
} from '../bottomSheet/constants';
import { BottomSheetHostingContainer } from '../bottomSheetHostingContainer';
import type {
  BottomSheetModalPrivateMethods,
  BottomSheetModalStackBehavior,
} from '../bottomSheetModal';
import type {
  BottomSheetModalProviderProps,
  BottomSheetModalRef,
} from './types';
import { View } from 'react-native';

const BottomSheetModalProviderWrapper = ({
  children,
}: BottomSheetModalProviderProps) => {
  //#region layout variables
  const animatedContainerHeight = useSharedValue(INITIAL_CONTAINER_HEIGHT);
  const animatedContainerOffset = useSharedValue(INITIAL_CONTAINER_OFFSET);
  //#endregion

  //#region variables
  const hostName = useMemo(() => `bottom-sheet-portal-${id()}`, []);
  const sheetsQueueRef = useRef<BottomSheetModalRef[]>([]);
  const [sheetsCount, setSheetsCount] = useState(0);
  //#endregion

  //#region private methods
  const handleMountSheet = useCallback(
    (
      key: string,
      ref: React.RefObject<BottomSheetModalPrivateMethods>,
      stackBehavior: BottomSheetModalStackBehavior
    ) => {
      const _sheetsQueue = sheetsQueueRef.current.slice();
      const sheetIndex = _sheetsQueue.findIndex(item => item.key === key);
      const sheetOnTop = sheetIndex === _sheetsQueue.length - 1;

      /**
       * Exit the method, if sheet is already presented
       * and at the top.
       */
      if (sheetIndex !== -1 && sheetOnTop) {
        return;
      }

      /**
       * Minimize the current sheet if:
       * - it exists.
       * - it is not unmounting.
       * - stack behavior is 'replace'.
       */

      /**
       * Handle switch or replace stack behaviors, if:
       * - a modal is currently presented.
       * - it is not unmounting
       */
      const currentMountedSheet = _sheetsQueue[_sheetsQueue.length - 1];
      if (currentMountedSheet && !currentMountedSheet.willUnmount) {
        if (stackBehavior === MODAL_STACK_BEHAVIOR.replace) {
          currentMountedSheet.ref?.current?.dismiss();
        } else if (stackBehavior === MODAL_STACK_BEHAVIOR.switch) {
          currentMountedSheet.ref?.current?.minimize();
        }
      }

      /**
       * Restore and remove incoming sheet from the queue,
       * if it was registered.
       */
      if (sheetIndex !== -1) {
        _sheetsQueue.splice(sheetIndex, 1);
        ref?.current?.restore();
      }

      _sheetsQueue.push({
        key,
        ref,
        willUnmount: false,
      });
      sheetsQueueRef.current = _sheetsQueue;
      setSheetsCount(_sheetsQueue.length);
    },
    []
  );
  const handleUnmountSheet = useCallback((key: string) => {
    const _sheetsQueue = sheetsQueueRef.current.slice();
    const sheetIndex = _sheetsQueue.findIndex(item => item.key === key);
    const sheetOnTop = sheetIndex === _sheetsQueue.length - 1;

    /**
     * Here we remove the unmounted sheet and update
     * the sheets queue.
     */
    _sheetsQueue.splice(sheetIndex, 1);
    sheetsQueueRef.current = _sheetsQueue;
    setSheetsCount(_sheetsQueue.length);

    /**
     * Here we try to restore previous sheet position if unmounted
     * sheet was on top. This is needed when user dismiss
     * the modal by panning down.
     */
    const hasMinimizedSheet = sheetsQueueRef.current.length > 0;
    const minimizedSheet =
      sheetsQueueRef.current[sheetsQueueRef.current.length - 1];
    if (
      sheetOnTop &&
      hasMinimizedSheet &&
      minimizedSheet &&
      !minimizedSheet.willUnmount
    ) {
      sheetsQueueRef.current[
        sheetsQueueRef.current.length - 1
      ].ref?.current?.restore();
    }
  }, []);
  const handleWillUnmountSheet = useCallback((key: string) => {
    const _sheetsQueue = sheetsQueueRef.current.slice();
    const sheetIndex = _sheetsQueue.findIndex(item => item.key === key);
    const sheetOnTop = sheetIndex === _sheetsQueue.length - 1;

    /**
     * Here we mark the sheet that will unmount,
     * so it won't be restored.
     */
    if (sheetIndex !== -1) {
      _sheetsQueue[sheetIndex].willUnmount = true;
    }

    /**
     * Here we try to restore previous sheet position,
     * This is needed when user dismiss the modal by fire the dismiss action.
     */
    const hasMinimizedSheet = _sheetsQueue.length > 1;
    if (sheetOnTop && hasMinimizedSheet) {
      _sheetsQueue[_sheetsQueue.length - 2].ref?.current?.restore();
    }

    sheetsQueueRef.current = _sheetsQueue;

    setSheetsCount(_sheetsQueue.length);
  }, []);
  //#endregion

  //#region public methods
  const handleDismiss = useCallback((key?: string) => {
    const sheetToBeDismissed = key
      ? sheetsQueueRef.current.find(item => item.key === key)
      : sheetsQueueRef.current[sheetsQueueRef.current.length - 1];
    if (sheetToBeDismissed) {
      sheetToBeDismissed.ref?.current?.dismiss();
      return true;
    }
    return false;
  }, []);
  const handleDismissAll = useCallback(() => {
    sheetsQueueRef.current.map(item => {
      item.ref?.current?.dismiss();
    });
  }, []);
  //#endregion

  //#region context variables
  const externalContextVariables = useMemo(
    () => ({
      dismiss: handleDismiss,
      dismissAll: handleDismissAll,
    }),
    [handleDismiss, handleDismissAll]
  );
  const internalContextVariables = useMemo(
    () => ({
      hostName,
      containerHeight: animatedContainerHeight,
      containerOffset: animatedContainerOffset,
      mountSheet: handleMountSheet,
      unmountSheet: handleUnmountSheet,
      willUnmountSheet: handleWillUnmountSheet,
    }),
    [
      hostName,
      animatedContainerHeight,
      animatedContainerOffset,
      handleMountSheet,
      handleUnmountSheet,
      handleWillUnmountSheet,
    ]
  );
  //#endregion

  const isModalVisible = sheetsQueueRef.current.length > 0;

  //#region renders
  return (
    <BottomSheetModalProvider value={externalContextVariables}>
      <BottomSheetModalInternalProvider value={internalContextVariables}>
        <BottomSheetHostingContainer
          importantForAccessibility={isModalVisible ? "yes" : "no-hide-descendants"}
          containerOffset={animatedContainerOffset}
          containerHeight={animatedContainerHeight}
        />
        <PortalProvider rootHostName={hostName}>
          <View style={{flex: 1}} importantForAccessibility={isModalVisible ? "no-hide-descendants" : "yes"}>
            {children}
          </View>
        </PortalProvider>
      </BottomSheetModalInternalProvider>
    </BottomSheetModalProvider>
  );
  //#endregion
};

export default BottomSheetModalProviderWrapper;
