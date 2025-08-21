import fs from "fs";
import path from "path";
import { writeJsonAtomic } from "../lib/fsAtomic.js";
import { Node, File } from "../types/domain.js";

const DATA_PATH = path.join(__dirname, "..", "data.json");

let data = { nodes: [], files: [] };

export async function load() {
  try {
    const content = await fs.promises.readFile(DATA_PATH, "utf-8");
    data = JSON.parse(content);
  } catch (e) {
    data = { nodes: [], files: [] };
  }
}

export async function save() {
  await writeJsonAtomic(DATA_PATH, data);
}

export function getData(): { nodes: Node[]; files: File[] } {
  return data;
}
