import path from "node:path";
import fs from "node:fs/promises";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import type { PopulatedDoc } from "mongoose";

import type { IInvoice } from "./Invoice.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { INVOICE_SENT_EMAIL_TEMPLATE_ID } from "@/consts.js";


export const createPdf = async (
  invoice: PopulatedDoc<IInvoice>
): Promise<Uint8Array<ArrayBufferLike>> => {
    const templatePath = path.join(
    process.cwd(),
    "src/modules/invoice/templates/invoice.hbs",
  );

  const source = await fs.readFile(
    templatePath,
    "utf-8",
  );
  const template = Handlebars.compile(source);

  const html = template(invoice);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return pdf;
  } catch (error) {
    throw new ApiError(
      500,
      error instanceof Error ? error.message : "Failed to generate PDF",
      [],
      error instanceof Error ? error.stack : undefined,
    );
  } finally {
    await browser.close();
  }
}