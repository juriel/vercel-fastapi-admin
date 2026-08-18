export type ToastType = 'success' | 'error'

export interface ToastDetail {
  message: string
  type: ToastType
}

export const TOAST_EVENT = 'aixa-toast'

function emit(message: string, type: ToastType) {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, type } }))
}

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error: (message: string) => emit(message, 'error'),
}
