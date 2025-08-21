import fs from "fs";
import path from "path";

export async function writeJsonAtomic(targetPath: string, data: any) {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.${path.basename(targetPath)}.tmp`);
  const json = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(tmp, json, "utf-8");
  await fs.promises.rename(tmp, targetPath);
}
