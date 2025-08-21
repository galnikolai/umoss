import multer from "multer";
import { getData, save } from "../repositories/dataRepository.js";
import {
  saveBufferToFile,
  readFileContent,
} from "../repositories/fileRepository.js";
import { generateId } from "../lib/id.js";
import { Node } from "../types/domain.js";

export const upload = multer();

export function badRequest(message: string) {
  const err = new Error(message) as any;
  err.status = 400;
  err.code = "BAD_REQUEST";
  return err as Error;
}

export function validateUpload(file: any) {
  if (!file || !file.originalname) throw badRequest("Имя файла обязательно");
  if (!file.buffer) throw badRequest("Файл не передан");
}

export async function handleUpload(req: any, res: any, next: any) {
  try {
    validateUpload(req.file);
    const parentId = req.body.parentId || null;
    const id = generateId();
    const saved = await saveBufferToFile(
      id,
      req.file.originalname,
      req.file.buffer
    );
    const data = getData();
    const node: Node = {
      id,
      name: req.file.originalname,
      type: "file",
      parentId,
      description: req.body.description || "",
    };
    data.nodes.push(node);
    data.files.push({ id, path: saved.path, name: saved.name });
    await save();
    res.json(node);
  } catch (e) {
    next(e);
  }
}

export async function getContent(req: any, res: any, next: any) {
  try {
    const data = getData();
    const file = data.files.find((f) => f.id === req.params.id);
    const node = data.nodes.find((n) => n.id === req.params.id);

    let content = "";

    if (file && typeof file.content === "string") {
      content = file.content;
    } else if (file && typeof file.path === "string" && file.path.length > 0) {
      try {
        content = await readFileContent(file.path);
      } catch (_) {
        content = "";
      }
    } else {
      content = "";
    }

    const language = node?.name?.split(".").pop() || "text";
    res.json({ content, language });
  } catch (e) {
    next(e);
  }
}
