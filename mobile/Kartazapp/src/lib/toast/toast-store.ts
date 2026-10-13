import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'reward';

export type ToastOptions = {
  variant?: ToastVariant;
  title: string;
  message?: string;
  /** Tempo na tela (ms) até sair sozinho; a barra de timer acompanha. */
  duration?: number;
};

export type Toast = Required<Omit<ToastOptions, 'message'>> & {
  id: number;
  message?: string;
};

const DEFAULT_DURATION = 4000;
/** Máximo de toasts empilhados; o mais antigo sai quando chega um novo. */
const MAX_VISIBLE = 3;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: Toast[]) {
  toasts = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function show({ variant = 'info', title, message, duration = DEFAULT_DURATION }: ToastOptions) {
  const id = nextId++;
  emit([...toasts, { id, variant, title, message, duration }].slice(-MAX_VISIBLE));
  return id;
}

function hide(id: number) {
  emit(toasts.filter((item) => item.id !== id));
}

type ShortcutOptions = Omit<ToastOptions, 'variant' | 'title' | 'message'>;

/**
 * API global do toast (pode ser chamada de qualquer lugar, inclusive fora de componentes):
 * `toast.success('Card Found!', 'Discovered Mbappé in France!')`. Exibido pelo `<ToastHost />`.
 */
export const toast = {
  show,
  hide,
  success: (title: string, message?: string, options?: ShortcutOptions) =>
    show({ ...options, variant: 'success', title, message }),
  error: (title: string, message?: string, options?: ShortcutOptions) =>
    show({ ...options, variant: 'error', title, message }),
  warning: (title: string, message?: string, options?: ShortcutOptions) =>
    show({ ...options, variant: 'warning', title, message }),
  info: (title: string, message?: string, options?: ShortcutOptions) =>
    show({ ...options, variant: 'info', title, message }),
  reward: (title: string, message?: string, options?: ShortcutOptions) =>
    show({ ...options, variant: 'reward', title, message }),
};

/** Lista atual de toasts (para o host). */
export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts);
}
