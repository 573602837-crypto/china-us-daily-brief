import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const dataRoot = path.join(process.cwd(), "data");

export function getDataPath(...segments: string[]): string {
  return path.join(dataRoot, ...segments);
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function listJsonDates(directory: "articles" | "runs"): Promise<string[]> {
  const dirPath = getDataPath(directory);

  try {
    const entries = await readdir(dirPath);
    return entries
      .filter((entry) => /^\d{4}-\d{2}-\d{2}\.json$/.test(entry))
      .map((entry) => entry.replace(/\.json$/, ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
