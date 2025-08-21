import {
  subscribeTabs,
  getOpenTabs as storeGetOpenTabs,
  getActiveTabId as storeGetActiveTabId,
} from "../store/index.js";

export class Tabs {
  container: HTMLElement;
  onActivate: (node: any) => void;
  onClose: (node: any) => void;
  unsubscribe: (() => void) | null;
  _prevTabs: Map<string, { name: string }>;
  _prevActive: string | null;

  constructor(
    container: HTMLElement,
    {
      onActivate,
      onClose,
    }: { onActivate: (node: any) => void; onClose: (node: any) => void }
  ) {
    this.container = container;
    this.onActivate = onActivate;
    this.onClose = onClose;
    this.unsubscribe = null;
    this._prevTabs = new Map();
    this._prevActive = null;
  }

  mount() {
    this.unsubscribe = subscribeTabs(() => {
      this.renderIncremental();
    });
    this.renderIncremental(true);
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
    this.container.innerHTML = "";
  }

  renderIncremental(initial = false) {
    if (!this.container) return;
    const nextTabs = storeGetOpenTabs();

    for (const prevId of this._prevTabs.keys()) {
      if (!nextTabs.has(prevId)) {
        const el = this.container.querySelector(`.tab[data-id='${prevId}']`);
        if (el) el.remove();
        this._prevTabs.delete(prevId);
      }
    }

    for (const [fileId, node] of nextTabs.entries()) {
      if (!this._prevTabs.has(fileId)) {
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.setAttribute("data-id", String(fileId));

        const title = document.createElement("span");
        title.className = "tab-title";
        title.textContent = node.name;
        tab.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.className = "tab-close";
        closeBtn.type = "button";
        closeBtn.textContent = "×";
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (typeof this.onClose === "function") this.onClose(fileId);
        });
        tab.appendChild(closeBtn);

        tab.addEventListener("click", () => {
          if (typeof this.onActivate === "function") this.onActivate(fileId);
        });

        this.container.appendChild(tab);
      } else {
        const prev = this._prevTabs.get(fileId);
        if (prev && prev.name !== node.name) {
          const titleEl = this.container.querySelector(
            `.tab[data-id='${fileId}'] .tab-title`
          );
          if (titleEl) titleEl.textContent = node.name;
        }
      }
      this._prevTabs.set(fileId, { name: node.name });
    }

    const nextActive = storeGetActiveTabId();
    if (initial || this._prevActive !== nextActive) {
      const tabs = this.container.querySelectorAll(".tab");
      tabs.forEach((el) => el.classList.remove("active"));
      if (nextActive != null) {
        const active = this.container.querySelector(
          `.tab[data-id='${nextActive}']`
        );
        if (active) active.classList.add("active");
      }
      this._prevActive = nextActive;
    }
  }
}

export default Tabs;
