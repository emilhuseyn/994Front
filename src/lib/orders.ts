// Shared order/payment status labels + UI badge tones.
// Mirrors the enums from ECommerce.Domain.Enums.

export const ORDER_STATUS = {
  Pending: 0,
  Confirmed: 1,
  Preparing: 2,
  Shipped: 3,
  Delivered: 4,
  Cancelled: 5,
} as const;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  [ORDER_STATUS.Pending]: 'Gözləyir',
  [ORDER_STATUS.Confirmed]: 'Təsdiqlənib',
  [ORDER_STATUS.Preparing]: 'Hazırlanır',
  [ORDER_STATUS.Shipped]: 'Göndərilib',
  [ORDER_STATUS.Delivered]: 'Çatdırılıb',
  [ORDER_STATUS.Cancelled]: 'Ləğv edilib',
};

export const ORDER_STATUS_TONE: Record<OrderStatusValue, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  [ORDER_STATUS.Pending]: 'warning',
  [ORDER_STATUS.Confirmed]: 'info',
  [ORDER_STATUS.Preparing]: 'info',
  [ORDER_STATUS.Shipped]: 'info',
  [ORDER_STATUS.Delivered]: 'success',
  [ORDER_STATUS.Cancelled]: 'danger',
};

export const PAYMENT_STATUS = {
  Pending: 0,
  Paid: 1,
  Failed: 2,
  Refunded: 3,
} as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusValue, string> = {
  [PAYMENT_STATUS.Pending]: 'Gözləyir',
  [PAYMENT_STATUS.Paid]: 'Ödənilib',
  [PAYMENT_STATUS.Failed]: 'Uğursuz',
  [PAYMENT_STATUS.Refunded]: 'Geri qaytarılıb',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatusValue, 'warning' | 'success' | 'danger' | 'neutral'> = {
  [PAYMENT_STATUS.Pending]: 'warning',
  [PAYMENT_STATUS.Paid]: 'success',
  [PAYMENT_STATUS.Failed]: 'danger',
  [PAYMENT_STATUS.Refunded]: 'neutral',
};

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: 'Nağd',
  1: 'Kart',
  2: 'Onlayn',
};
