import { Node } from "../types/domain.js";

const openTabsMap = new Map(); // id -> node
let activeTabId: string | null = null;
const subscribers = new Set();

function notify() {
  const snapshot = {
    openTabs: new Map(openTabsMap),
    activeTabId,
  };
  subscribers.forEach((cb) => {
    try {
      if (typeof cb === "function") {
        cb(snapshot);
      }
    } catch (_) {}
  });
}

export function subscribeTabs(callback: (snapshot: any) => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function openTab(node: Node) {
  if (!node || !node.id) return;
  openTabsMap.set(node.id, node);
  activeTabId = node.id;
  notify();
}

export function closeTab(fileId: string) {
  if (!openTabsMap.has(fileId)) return;
  openTabsMap.delete(fileId);
  if (activeTabId === fileId) {
    const remainingIds = Array.from(openTabsMap.keys());
    activeTabId = remainingIds.length
      ? remainingIds[remainingIds.length - 1]
      : null;
  }
  notify();
}

export function activateTab(fileId: string) {
  if (!openTabsMap.has(fileId)) return;
  activeTabId = fileId;
  notify();
}

export function updateTabNode(updated: Node) {
  if (!updated || !updated.id) return;
  if (openTabsMap.has(updated.id)) {
    const current = openTabsMap.get(updated.id);
    openTabsMap.set(updated.id, { ...current, ...updated });
    notify();
  }
}

export function getActiveTabId() {
  return activeTabId;
}

export function getOpenTabs() {
  return openTabsMap;
}
