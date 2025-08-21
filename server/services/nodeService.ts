import { getData, save } from "../repositories/dataRepository.js";
import { generateId } from "../lib/id.js";
import { Node } from "../types/domain.js";
import { deleteFileIfExists } from "../repositories/fileRepository.js";

export function validateNode(node: Node) {
  if (!node || typeof node !== "object") throw badRequest("Данные не переданы");
  if (!node.name || typeof node.name !== "string")
    throw badRequest("Поле name обязательно");
  if (!node.type || (node.type !== "file" && node.type !== "folder"))
    throw badRequest("type должен быть 'file' или 'folder'");
  if (node.parentId && typeof node.parentId !== "string")
    throw badRequest("parentId должен быть строкой");
}

export function badRequest(message: string) {
  const err = new Error(message) as any;
  err.status = 400;
  err.code = "BAD_REQUEST";
  return err as Error;
}

export async function listRoot() {
  const data = getData();
  return data.nodes.filter((n) => !n.parentId);
}

export async function listChildren(parentId: string) {
  const data = getData();
  return data.nodes.filter((n) => n.parentId === parentId);
}

export async function createNode(payload: Node) {
  validateNode(payload);
  const data = getData();
  const id = generateId();
  const node = {
    id,
    name: payload.name,
    type: payload.type,
    parentId: payload.parentId,
    description: payload.description,
  };
  data.nodes.push(node);
  await save();
  return node;
}

export async function updateNode(id: string, updates: Node) {
  const data = getData();
  const node = data.nodes.find((n) => n.id === id);
  if (!node) {
    const err = new Error("Узел не найден") as any;
    err.status = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  Object.assign(node, updates);
  await save();
  return node;
}

export async function deleteNode(id: string) {
  const data = getData();
  function collect(id: any): any[] {
    const children = data.nodes.filter((n) => n.parentId === id);
    return children.reduce(
      (acc, c: Node) => acc.concat(c.id, collect(c.id)),
      [] as any[]
    );
  }
  const all = [id, ...collect(id)];
  const filesToDelete = data.files.filter((f) => all.includes(f.id));
  for (const f of filesToDelete) {
    await deleteFileIfExists((f as any).path);
  }

  data.nodes = data.nodes.filter((n) => !all.includes(n.id));
  data.files = data.files.filter((f) => !all.includes(f.id));
  await save();
}
