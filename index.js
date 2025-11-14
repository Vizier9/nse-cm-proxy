const express = require("express");
const playwright = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

// Convert month number to NSE month abbreviation
function getMonthName(mm) {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return months[parseInt(mm, 10) - 1];
}

// Parse date formats like DD-MM-YYYY, DDMMYYYY, 13/11/2024 etc.
function normalizeDate(raw) {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    return {
      dd: digits.slice(0,2),
      mm: digits.slice(2,4),
      yyyy: digits.slice(4,8)
    };
  }

  const parts = raw.split(/[-\/\.]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return {
      dd: parts[0].padStart(2,'0'),
      mm: parts[1].padStart(2,'0'),
      yyyy: parts[2]
    };
  }

  return null;
}

app.get("/", async (req, res) => {
  const raw = req.query.date || req.query.d || "";
  const nd = normalizeDate(raw);

  if (!nd) {
    return res.status(400).send("Bad date format. Use ?date=DD-MM-YYYY or ?date=DDMMYYYY");
  }

  const { dd, mm, yyyy } = nd;
  const mon = getMonthName(mm);
  const filename = `cm${dd}${mm}${yyyy}bhav.csv.zip`;
  const url = `https://www.nseindia.com/content/historical/EQUITIES/${yyyy}/${mon}/${filename}`;

  let browser;

  try {
    browser = await playwright.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      locale: "en-US"
    });

    const page = await context.newPage();

    // Visit homepage first to set cookies (NSE blocks direct requests)
    await page.goto("https://www.nseindia.com/", { waitUntil: "networkidle" });

    // Now fetch the bhavcopy
    const response = await page.goto(url, { waitUntil: "networkidle" });

    if (!response || response.status() !== 200) {
      const status = response ? response.status() : 500;
      await browser.close();
      return res.status(502).send(`Upstream returned HTTP ${status} for URL: ${url}`);
    }

    const body = await response.body();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(body);

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).send("Internal Server Error: " + err.message);
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
  }
});

app.listen(PORT, () => {
  console.log(`NSE CM Proxy running on port ${PORT}`);
});
