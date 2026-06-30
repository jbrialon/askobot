import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PATCH_FILE = join(import.meta.dirname, "../../db/patch.json");

export interface PatchData {
  urlFr: string;
  urlEn: string;
  content?: string | undefined;
  updatedAt: string;
}

let cached: PatchData | null = null;

function load(): PatchData | null {
  if (cached) return cached;
  try {
    const raw = readFileSync(PATCH_FILE, "utf-8");
    cached = JSON.parse(raw) as PatchData;
    return cached;
  } catch {
    return null;
  }
}

export function getPatchContent(): string | null {
  return load()?.content ?? null;
}

export function getPatchData(): PatchData | null {
  return load();
}

export function setPatchUrls(urlFr: string, urlEn: string): PatchData {
  const existing = load();
  const data: PatchData = { urlFr, urlEn, content: existing?.content, updatedAt: new Date().toISOString() };
  writeFileSync(PATCH_FILE, JSON.stringify(data, null, 2), "utf-8");
  cached = data;
  return data;
}

export function setPatchContent(content: string): PatchData {
  const existing = load();
  if (!existing) throw new Error("No patch URL set. Use setPatchUrls() first.");
  const data: PatchData = { ...existing, content, updatedAt: new Date().toISOString() };
  writeFileSync(PATCH_FILE, JSON.stringify(data, null, 2), "utf-8");
  cached = data;
  return data;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await import("dotenv/config");

  const args = process.argv.slice(2);
  const action = args[0];

  if (action === "set" && args[1] && args[2]) {
    const data = setPatchUrls(args[1], args[2]);
    console.log("Patch URLs saved:", { urlFr: data.urlFr, urlEn: data.urlEn });
  } else if (action === "get") {
    const data = getPatchData();
    console.log(data ?? "No patch URL set.");
  } else if (action === "crawl") {
    const patchData = getPatchData();
    if (!patchData?.urlFr || !patchData?.urlEn) {
      console.log("No patch URLs set. Use: node app/utils/patch-store.ts set <url>");
      process.exit(1);
    }
    import("./patch-crawler.ts").then(async ({ crawlAndSummarize }) => {
      console.log(`Crawling FR: ${patchData.urlFr}\nCrawling EN: ${patchData.urlEn}`);
      const content = await crawlAndSummarize(patchData.urlFr, patchData.urlEn);
      setPatchContent(content);
      console.log("Patch content saved:\n", content);
    });
  } else {
    console.log(
      "Usage:\n  node app/utils/patch-store.ts set <url_fr> <url_en>\n  node app/utils/patch-store.ts get\n  node app/utils/patch-store.ts crawl",
    );
  }
}
