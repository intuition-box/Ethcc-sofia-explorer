/**
 * Scrape EthCC[9] agenda and speakers from ethcc.io
 * Usage: npx playwright test scrape_ethcc.ts
 * Or: npx ts-node scrape_ethcc.ts (if playwright is available globally)
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://ethcc.io";
const AGENDA_URL = `${BASE_URL}/ethcc-9/agenda`;
const OUT_DIR = path.join(__dirname, "bdd");

interface Speaker {
  name: string;
  slug: string;
  organization: string;
  imageUrl: string;
  talks: string[];
}

interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  stage: string;
  track: string;
  type: string;
  description: string;
  speakers: { name: string; slug: string; organization: string }[];
}

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // ─── Scrape agenda ───────────────────────────────────
  console.log("Loading agenda page...");
  await page.goto(AGENDA_URL, { waitUntil: "networkidle", timeout: 60000 });

  // Wait for session cards to render
  await page.waitForTimeout(3000);

  // Get all dates available
  const dates = await page.evaluate(() => {
    const buttons = document.querySelectorAll("button, [role='tab']");
    const datePattern = /\b(MAR|APR)\s+(\d{1,2})\b/i;
    const found: string[] = [];
    buttons.forEach((btn) => {
      const match = btn.textContent?.match(datePattern);
      if (match) {
        const month = match[1].toUpperCase() === "MAR" ? "03" : "04";
        const day = match[2].padStart(2, "0");
        found.push(`2026-${month}-${day}`);
      }
    });
    return [...new Set(found)];
  });

  console.log(`Found dates: ${dates.join(", ")}`);

  const allSessions: Session[] = [];
  const speakerMap = new Map<string, Speaker>();

  // Click each day tab and scrape sessions
  for (const date of dates) {
    const month = date.slice(5, 7) === "03" ? "MAR" : "APR";
    const day = parseInt(date.slice(8));
    const label = `${month} ${day}`;

    console.log(`Clicking day: ${label}...`);

    // Click the day tab
    const dayBtn = await page.$(`button:has-text("${label}"), [role='tab']:has-text("${label}")`);
    if (dayBtn) {
      await dayBtn.click();
      await page.waitForTimeout(2000);
    }

    // Extract all session cards for this day
    const sessions = await page.evaluate((currentDate: string) => {
      const results: any[] = [];

      // Find all session-like elements (cards with time, title, speaker info)
      const cards = document.querySelectorAll(
        "[class*='session'], [class*='event'], [class*='card'], [class*='talk'], [class*='slot']"
      );

      if (cards.length === 0) {
        // Fallback: try to find structured content
        const allDivs = document.querySelectorAll("div");
        allDivs.forEach((div) => {
          const text = div.textContent || "";
          const hasTime = /\d{1,2}:\d{2}\s*(AM|PM)?/i.test(text);
          const hasStage = /(Monroe|Taylor|Burton|Hepburn|Kelly|Redford|Grant|Chaplin|Idea Vault)/i.test(text);
          if (hasTime && hasStage && text.length < 2000 && text.length > 30) {
            // This might be a session card
            const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
            const stageMatch = text.match(/(Monroe|Taylor|Burton|Hepburn|Kelly|Redford|Grant|Chaplin|Idea Vault)/i);
            if (timeMatch && stageMatch) {
              results.push({
                text: text.trim().slice(0, 500),
                startTime: timeMatch[1],
                endTime: timeMatch[2],
                stage: stageMatch[1],
                date: currentDate,
              });
            }
          }
        });
      }

      return results;
    }, date);

    console.log(`  ${label}: found ${sessions.length} raw entries`);
  }

  // Alternative approach: extract ALL visible text content structured by the DOM
  console.log("\nExtracting all structured content...");

  const structuredData = await page.evaluate(() => {
    // Get all text nodes that might be session info
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const texts: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = (node.textContent || "").trim();
      if (text.length > 3 && text.length < 300) {
        texts.push(text);
      }
    }
    return texts;
  });

  console.log(`Extracted ${structuredData.length} text nodes`);

  // Extract from the page's __NEXT_DATA__ or similar
  const nextData = await page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    if (el) return el.textContent;
    return null;
  });

  if (nextData) {
    console.log("Found __NEXT_DATA__!");
    fs.writeFileSync(path.join(OUT_DIR, "ethcc_next_data.json"), nextData);
  }

  // Try intercepting network requests for data
  console.log("\nReloading with network interception...");
  const dataResponses: any[] = [];

  page.on("response", async (response) => {
    const url = response.url();
    if (
      url.includes("firestore") ||
      url.includes("api") ||
      url.includes("graphql") ||
      url.includes(".json")
    ) {
      try {
        const body = await response.text();
        if (body.length > 100) {
          dataResponses.push({ url, size: body.length, sample: body.slice(0, 200) });
        }
      } catch {}
    }
  });

  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(5000);

  console.log(`Captured ${dataResponses.length} data responses`);
  for (const r of dataResponses) {
    console.log(`  ${r.url.slice(0, 80)}... (${r.size} bytes)`);
  }

  // Save all captured data
  fs.writeFileSync(
    path.join(OUT_DIR, "ethcc_network_data.json"),
    JSON.stringify(dataResponses, null, 2)
  );

  // Save all extracted text for manual parsing
  fs.writeFileSync(
    path.join(OUT_DIR, "ethcc_page_texts.json"),
    JSON.stringify(structuredData, null, 2)
  );

  console.log("\n--- Summary ---");
  console.log(`Dates: ${dates.join(", ")}`);
  console.log(`Text nodes: ${structuredData.length}`);
  console.log(`Network data captures: ${dataResponses.length}`);
  console.log(`Output saved to ${OUT_DIR}/ethcc_*.json`);

  await browser.close();
}

main().catch(console.error);
