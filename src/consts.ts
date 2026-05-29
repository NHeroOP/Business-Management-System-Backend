export const VERIFICATION_EMAIL_TEMPLATE_ID = "4f0a1478-bd3f-491a-a176-a5872a80c678";
export type ROLE_ENUM = "OWNER" | "ADMIN" | "EMPLOYEE";
export enum Business_Roles {
  OWNER = "OWNER",
  ADMIN= "ADMIN",
  EMPLOYEE= "EMPLOYEE"
};
export type PRODUCT_TYPE_ENUM = "PRODUCT" | "SERVICE";
export enum Product_Type {
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE"
}

export type INVOICE_STATUS_ENUM = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED"
}