import { registry } from "./registry.js";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import "./zod-openapi.js";
import "@/modules/auth/auth.docs.js";
import "@/modules/user/user.docs.js";
import "@/modules/business/business.docs.js";
import "@/modules/business-member/business-member.docs.js";
import "@/modules/client/client.docs.js";
import "@/modules/product/product.docs.js";
import "@/modules/invoice/invoice.docs.js";
import "@/modules/payment/payment.docs.js";
import "@/modules/analytics/analytics.docs.js";


export const openApiSpec = () => {
  const generator = new OpenApiGeneratorV3(
    registry.definitions
  );

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Multi Tenant Business Management API",
      version: "1.0.0",
      description: "Open-source multi tenant business management platform with clients, products, invoices, payments, analytics, PDF generation and email automation.",
    },

    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local Development",
      },
      {
        url: "https://nhero-business-management.up.railway.app/api/v1",
        description: "Production Server",
      }
    ],
  });
};