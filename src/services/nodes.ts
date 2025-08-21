import {
  fetchTree,
  fetchChildren,
  createNode,
  updateNode,
  deleteNode,
} from "../api/index.js";
import { Node } from "../types/domain.js";

let rootNodesCache: Node[] | null = null;

export async function getRootNodes() {
  if (rootNodesCache) return rootNodesCache;
  rootNodesCache = await fetchTree();
  return rootNodesCache;
}

export async function getChildrenNodes(parentId: string) {
  return fetchChildren(parentId);
}

export async function createNewNode(
  payload: Pick<Node, "name" | "type" | "parentId">
) {
  const node = await createNode(payload);
  if (!payload.parentId) rootNodesCache = null;
  return node;
}

export async function updateExistingNode(id: string, updates: Node) {
  const node = await updateNode(id, updates);
  return node;
}

export async function deleteExistingNode(id: string) {
  await deleteNode(id);
}

export function clearNodesCache() {
  rootNodesCache = null;
}
