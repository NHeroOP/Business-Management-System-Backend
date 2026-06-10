import path from "node:path";
import fs from "node:fs/promises";
import Handlebars from "handlebars";
import puppeteer from "puppeteer-core";
import type { PopulatedDoc } from "mongoose";

import ENV from "@/env.js";
import type { IInvoice } from "./Invoice.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";

const dirName = import.meta.dirname;

export const createPdf = async (
  invoice: PopulatedDoc<IInvoice>,
): Promise<Uint8Array> => {
  const templatePath = path.join(
    dirName,
    "templates/invoice.hbs",
  );

  const source = await fs.readFile(templatePath, "utf-8");
  const template = Handlebars.compile(source);
  const html = template(invoice);

  const browser = await puppeteer.launch({
    executablePath: ENV.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

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
};
