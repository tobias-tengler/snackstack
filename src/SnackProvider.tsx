import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { SnackContext, SnackContextType } from './contexts/SnackContext';
import { SnackItem } from './SnackItem';
import { KeyedItems, useStore } from './hooks/useStore';
import { useQueue } from './hooks/useQueue';
import { Slide, SnackbarOrigin, SnackbarProps } from '@material-ui/core';
import { getTransitionDirection } from './helpers';
import { MergedSnack, Snack, SnackId } from './types/snack';
import { CloseReason } from './types/closeReason';

type OptionsType = Pick<SnackbarProps, 'anchorOrigin' | 'TransitionProps'> &
  Pick<Snack, 'action' | 'autoHideDuration' | 'persist'> & {
    maxSnacks?: number;
    spacing?: number;
    preventDuplicates?: boolean;
    TransitionComponent?(anchorOrigin: SnackbarOrigin): SnackbarProps['TransitionComponent'];
  };

interface ComponentProps extends OptionsType {}

const SlideTransition: OptionsType['TransitionComponent'] = anchorOrigin => props => (
  <Slide {...props} direction={getTransitionDirection(anchorOrigin)} />
);

function getOffset(index: number, ids: SnackId[], items: KeyedItems<SnackId, MergedSnack>, spacing: number) {
  // todo: this start-bound should be configurable
  let offset = 20;

  if (index === 0) return offset;

  for (let i = 0; i < index; i++) {
    if (i === index) break;

    const snackId = ids[i];
    const snack = items[snackId];

    if (!snack) {
      console.warn(`Active Snack with id '${snackId}' could not be found`);

      continue;
    }

    offset += snack.height + spacing;
  }

  return offset;
}

const defaultAnchorOrigin: OptionsType['anchorOrigin'] = {
  horizontal: 'left',
  vertical: 'bottom',
};

export const SnackProvider: FC<ComponentProps> = props => {
  // todo: this should be a call to getDefaultOptions
  const {
    anchorOrigin = defaultAnchorOrigin,
    persist = false,
    action,
    autoHideDuration = 2500,
    maxSnacks = 3,
    spacing = 12,
    preventDuplicates = false,
    TransitionComponent = SlideTransition,
    TransitionProps,
  } = props;

  const store = useStore<SnackId, MergedSnack>(item => item.id);

  const handleFullQueue = (activeItemIds: SnackId[]) => {
    const persistedSnacks = store.ids.reduce(
      (acc: number, cur) => acc + (store.items[cur].autoHideDuration == undefined ? 1 : 0),
      0
    );

    if (persistedSnacks >= maxSnacks) {
      handleClose(activeItemIds[0])('forced');
    }
  };

  const { enque, dequeue, remove, activeIds } = useQueue(store, maxSnacks, handleFullQueue);

  // todo: dequeue should only happen after transition delay to prevent the notifications from overlapping
  useEffect(dequeue, [store.ids]);

  const enqueueSnack: SnackContextType['enqueueSnack'] = snack => {
    if (!snack || !snack.message) return null;

    if (preventDuplicates) {
      if (store.ids.some(id => store.items[id].message === snack.message)) return null;
    }

    if (snack.id && store.ids.some(id => id === snack.id)) {
      console.warn('Snack with same id has already been enqued', { snack });

      return null;
    }

    // todo: this should be a separate merge-utility
    let computedAutoHideDuration = snack.autoHideDuration;

    if (snack.persist || (snack.persist == undefined && persist)) {
      computedAutoHideDuration = undefined;
    } else if (computedAutoHideDuration == undefined) {
      computedAutoHideDuration = autoHideDuration;
    }

    const mergedSnack: MergedSnack = {
      id: snack.id ?? new Date().getTime() + Math.random(),
      open: true,
      height: 48,
      message: snack.message,
      dynamicHeight: !!snack.dynamicHeight,
      autoHideDuration: autoHideDuration,
      action: snack.action == undefined ? action : snack.action,
    };

    enque(mergedSnack);

    return mergedSnack.id;
  };

  const handleClose = useCallback(
    (id: SnackId) => (reason: CloseReason) => {
      if (reason === 'clickaway') return;

      store.update(id, { open: false });
    },
    []
  );

  const handleExited = useCallback(
    (id: SnackId) => () => {
      remove(id);
    },
    []
  );

  const handleSetHeight = useCallback(
    (id: SnackId) => (height: number) => {
      store.update(id, { height: height });
    },
    []
  );

  const closeSnack: SnackContextType['closeSnack'] = id => {
    handleClose(id)('manually');
  };

  const MemoTransitionComponent = useMemo(() => TransitionComponent(anchorOrigin), [anchorOrigin]);

  let enableAutoHide = true;

  return (
    <SnackContext.Provider value={{ closeSnack, enqueueSnack, updateSnack: store.update }}>
      {props.children}

      {activeIds.map((id, index) => {
        const snack = store.items[id];

        const offset = getOffset(index, activeIds, store.items, spacing);

        if (index > 0 && store.items[activeIds[index - 1]]?.autoHideDuration != undefined) enableAutoHide = false;

        return (
          <SnackItem
            index={index}
            key={snack.id}
            anchorOrigin={anchorOrigin}
            TransitionComponent={MemoTransitionComponent}
            TransitionProps={TransitionProps}
            snack={snack}
            offset={offset}
            enableAutoHide={enableAutoHide}
            onClose={handleClose(id)}
            onExited={handleExited(id)}
            onSetHeight={handleSetHeight(id)}
          />
        );
      })}
    </SnackContext.Provider>
  );
};
