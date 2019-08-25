import { ComponentType, ReactNode, ComponentClass } from 'react';
import { SnackbarOrigin } from '@material-ui/core/Snackbar';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type SnackVariantType = 'error' | 'warning' | 'info' | 'success';

export type EnqueueSnackFunc = (snack: Snack) => Snack['key'] | null;
export type CloseSnackFunc = (key: Snack['key']) => void;

export interface SnackNodeArgs {
  key: Snack['key'];
  classes: any; // todo type
  closeSnack: () => void;
}

export interface Snack {
  key?: string | number;
  variant?: SnackVariantType;
  message: string | ReactNode;
  persist?: boolean;
  content?: ReactNode | ((args: SnackNodeArgs) => ReactNode);
  action?: ReactNode | ((args: SnackNodeArgs) => ReactNode);
}

export interface SnackOptions {
  maxSnacks?: number;
  autoHideDuration?: number;
  anchorOrigin?: SnackbarOrigin;
  preventDuplicates?: boolean;
  action?: Snack['action'];
}

export type OnEnterFuncType = (key: Snack['key']) => void;
export type OnCloseFuncType = (key: Snack['key'], reason: string) => void;
export type OnExtitedFuncType = (key: Snack['key']) => void;

export interface SnackProviderProps {
  options?: SnackOptions;
  onEnter?: OnEnterFuncType;
  onClose?: OnCloseFuncType;
  onExited?: OnCloseFuncType;
}

export const SnackProvider: ComponentType<SnackProviderProps>;

export interface WithSnacksProps {
  enqueueSnack: EnqueueSnackFunc;
  closeSnack: CloseSnackFunc;
}

export function withSnacks<T extends WithSnacksProps>(
  component: ComponentType<T>,
): ComponentClass<Omit<T, keyof WithSnacksProps>>;

export function useSnacks(): [EnqueueSnackFunc, CloseSnackFunc];
