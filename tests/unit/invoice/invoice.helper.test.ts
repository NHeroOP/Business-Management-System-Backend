import { calculateInvoiceTotals } from "@/modules/invoice/invoice.helper.js";
import type { IInvoiceItem } from "@/modules/invoice/Invoice.model.js";
import { faker } from "@faker-js/faker";
import { describe, it, expect } from "vitest";

const item = (total: number): IInvoiceItem => ({
  name: faker.commerce.productName(),
  quantity: faker.number.int({ min: 1, max: 10 }),
  price: faker.number.float({ min: 1, max: 100 }),
  total,
});

describe("calculateInvoiceTotal", () => {
  describe("with valid items, discount & tax", () => {
    it("should calculate subtotal & total correctly", () => { 
      const items = [item(100), item(200)];
      const { subtotal, total } = calculateInvoiceTotals({ items, discount: 10, tax: 5 });
      expect(subtotal).toBe(300);
      expect(total).toBe(285);
    })
  })

  describe("with valid items, no discount & no tax", () => {
    it("should calculate subtotal & total correctly", () => { 
      const items = [item(100), item(200)];
      const { subtotal, total } = calculateInvoiceTotals({ items });
      expect(subtotal).toBe(300);
      expect(total).toBe(300);
    })
  })

  describe("with valid items, discount & no tax", () => {
    it("should calculate subtotal & total correctly", () => { 
      const items = [item(100), item(200)];
      const { subtotal, total } = calculateInvoiceTotals({ items, discount: 50 });
      expect(subtotal).toBe(300);
      expect(total).toBe(150);
    })
  })
})