import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

export async function ensureUploadsDir() {
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveBufferToFile(
  id: string,
  originalname: string,
  buffer: Buffer
) {
  await ensureUploadsDir();
  const safeName = `${id}__${originalname}`;
  const filePath = path.join(UPLOADS_DIR, safeName);
  await fs.promises.writeFile(filePath, buffer);
  return { path: filePath, name: originalname };
}

export async function readFileContent(filePath: string) {
  return fs.promises.readFile(filePath, "utf-8");
}

export async function deleteFileIfExists(filePath: string) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (_) {}
}
