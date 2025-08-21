import { Node } from "../types/domain.js";

const subscribers = new Set();

let selectedNode: Node | null = null;

export function getSelectedNode() {
  return selectedNode;
}

export function setSelectedNode(node: Node | null) {
  selectedNode = node || null;
  subscribers.forEach((cb) => {
    try {
      if (typeof cb === "function") {
        cb(selectedNode);
      }
    } catch (_) {}
  });
}

export function subscribeSelection(callback: (node: Node | null) => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}
