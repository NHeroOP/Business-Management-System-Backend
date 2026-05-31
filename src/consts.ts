export const VERIFICATION_EMAIL_TEMPLATE_ID =
  "4f0a1478-bd3f-491a-a176-a5872a80c678";


export const BUSINESS_ROLE = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type BusinessRole = (typeof BUSINESS_ROLE)[keyof typeof BUSINESS_ROLE];


export const PRODUCT_TYPE = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
} as const;

export type ProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];


export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];


export const PAYMENT_METHOD = {
  CASH: "CASH",
  UPI: "UPI",
  BANK: "BANK",
  CARD: "CARD",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];


export const PAYMENT_STATUS = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
