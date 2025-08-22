import { updateNode } from "./api/index.js";
import {
  getFileContent,
  deleteExistingNode,
  createNewNode,
} from "./services/index.js";
import {
  setSelectedNode,
  subscribeSelection,
  openTab as storeOpenTab,
  closeTab as storeCloseTab,
  activateTab as storeActivateTab,
  updateTabNode as storeUpdateTabNode,
  getActiveTabId as storeGetActiveTabId,
  getOpenTabs as storeGetOpenTabs,
} from "./store/index.js";

import { File, Tree } from "./controllers/index.js";
import { Header, Tabs } from "./ui/index.js";
import { Node } from "./types/domain.js";

class Main {
  selectedNode: Node | null = null;
  openTabs = new Map();
  activeTabId = null;
  treeContainer: HTMLElement;
  contentElement: HTMLElement;
  tabsContainer: HTMLElement;
  descriptionInput: HTMLInputElement | null = null;
  uploadInput: HTMLInputElement | null = null;
  tree: Tree;
  file: File;
  tabs: Tabs;
  header: Header | null = null;

  constructor() {
    this.treeContainer = document.getElementById("file-tree") as HTMLElement;
    this.contentElement = document.getElementById(
      "file-content"
    ) as HTMLElement;
    this.tabsContainer = document.getElementById("tabs") as HTMLElement;
    this.descriptionInput = document.getElementById(
      "description-input"
    ) as HTMLInputElement;
    this.uploadInput = document.getElementById(
      "upload-file"
    ) as HTMLInputElement;

    this.tree = new Tree(this.treeContainer, {
      onFileOpen: (node) => this.openFileInTab(node),
    });

    this.file = new File(
      this.contentElement,
      this.descriptionInput,
      this.uploadInput,
      this.refreshTree.bind(this)
    );

    this.tabs = new Tabs(this.tabsContainer, {
      onActivate: (fileId) => this.activateTab(fileId),
      onClose: (fileId) => this.closeTab(fileId),
    });
  }

  handleSelectionChange(node: Node | null) {
    this.selectedNode = node;
    if (node) this.file.updateEditDescriptionButton(node);
  }

  init() {
    this.tree.load();
    this.file.setup(() => this.selectedNode);

    subscribeSelection(this.handleSelectionChange.bind(this));
    this.file.showPlaceholder("Выберите файл");

    document.addEventListener("DOMContentLoaded", () => {
      document.addEventListener("tree:selection-cleared", () => {
        this.handleSelectionChange(null);
        setSelectedNode(null);
      });
      this.header = new Header({
        onAddFolder: this.handleAddFolder.bind(this),
        onDeleteFolder: this.handleDeleteFolder.bind(this),
        onDownloadFile: this.handleDownloadFile.bind(this),
        onDeleteFile: this.handleDeleteFile.bind(this),
        onRenameFile: this.handleRenameFile.bind(this),
      });
      if (this.header && typeof this.header.mount === "function") {
        this.header.mount();
      }
    });

    this.tabs.mount();
  }

  async handleAddFolder() {
    const parent =
      this.selectedNode && this.selectedNode.type === "folder"
        ? this.selectedNode
        : null;
    const name = prompt("Имя новой папки:");
    if (name) {
      const node: Pick<Node, "name" | "type" | "parentId" | "id"> = {
        name,
        type: "folder",
        id: "",
        parentId: null,
      };
      if (parent) node.parentId = parent.id;
      const newNode = await createNewNode(node);
      this.tree.addNodeToTree(newNode, parent ? parent.id : null);
    }
  }

  async handleDeleteFolder() {
    const node = this.selectedNode;
    if (!node || node.type !== "folder") {
      alert("Выберите папку для удаления");
      return;
    }
    if (confirm(`Удалить папку ${node.name}?`)) {
      const collectDescendants = (parentId: string): Node[] => {
        const stack: string[] = [parentId];
        const result: Node[] = [];
        while (stack.length > 0) {
          const currentId = stack.pop();
          if (!currentId) continue;
          const children = this.tree.findChildren(currentId);
          for (const child of children) {
            result.push(child);
            stack.push(child.id);
          }
        }
        return result;
      };

      const descendants = collectDescendants(node.id).filter(
        (n) => n && n.type === "file"
      );

      for (const fileNode of descendants) {
        try {
          this.file.invalidateCache(fileNode.id);
        } catch (_) {}
        this.closeTab(fileNode.id);
      }

      await deleteExistingNode(node.id);
      this.tree.removeNodeFromTree(node.id);

      const nextActiveId = storeGetActiveTabId();
      if (nextActiveId != null) {
        this.activateTab(nextActiveId);
      } else {
        this.selectedNode = null;
        const codeElement = this.contentElement?.querySelector("code");
        if (codeElement) {
          codeElement.textContent = "";
          codeElement.className = "";
        }
        if (this.descriptionInput) {
          this.descriptionInput.value = "";
        }
        delete this.contentElement?.dataset.node;
        this.handleSelectionChange(null);
      }
    }
  }

  openFileInTab(node: Node) {
    storeOpenTab(node);
    if (node && node.id) {
      this.activateTab(node.id);
    }
  }

  activateTab(fileId: string) {
    if (!storeGetOpenTabs().has(fileId)) return;
    storeActivateTab(fileId);
    const node = storeGetOpenTabs().get(fileId);
    this.selectNodeInTree(node);
    this.file.display(node);
    setSelectedNode(node);
  }

  closeTab(fileId: string) {
    storeCloseTab(fileId);
    const nextActiveId = storeGetActiveTabId();
    if (nextActiveId == null) {
      this.file.showPlaceholder("Выберите файл");
      this.treeContainer
        .querySelectorAll(".node-label.selected")
        .forEach((el) => el.classList.remove("selected"));
      setSelectedNode(null);
      return;
    }
    this.activateTab(nextActiveId);
  }

  selectNodeInTree(node: Node) {
    if (!node) return;
    this.treeContainer
      .querySelectorAll(".node-label.selected")
      .forEach((el) => el.classList.remove("selected"));

    const li = this.treeContainer.querySelector(`li[data-id='${node.id}']`);
    if (li) {
      const label = li.querySelector(".node-label") || li;
      label.classList.add("selected");

      let parentLi = li.parentElement && li.parentElement.closest("li.folder");
      while (parentLi) {
        parentLi.classList.remove("closed");
        parentLi.classList.add("open");
        const ul = parentLi.querySelector("ul");
        if (ul) ul.style.display = "block";
        parentLi =
          parentLi.parentElement && parentLi.parentElement.closest("li.folder");
      }

      if (typeof li.scrollIntoView === "function") {
        li.scrollIntoView({ block: "nearest" });
      }
    }
  }

  handleDownloadFile() {
    const node = this.selectedNode;
    if (!node || node.type !== "file") {
      alert("Выберите файл для скачивания");
      return;
    }
    getFileContent(node.id).then(async ({ content }) => {
      const blob = new Blob([content || ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async handleDeleteFile() {
    const node = this.selectedNode;
    if (!node || node.type !== "file") {
      alert("Выберите файл для удаления");
      return;
    }
    if (confirm(`Удалить файл ${node.name}?`)) {
      try {
        await deleteExistingNode(node.id);
        this.file.invalidateCache(node.id);
        this.tree.removeNodeFromTree(node.id);
        this.closeTab(node.id);
        this.selectedNode = null;
        const codeElement = this.contentElement?.querySelector("code");
        if (codeElement) {
          codeElement.textContent = "";
          codeElement.className = "";
        }
        if (this.descriptionInput) {
          this.descriptionInput.value = "";
        }
        delete this.contentElement?.dataset.node;
        this.handleSelectionChange(null);
      } catch (error: any) {
        alert("Ошибка при удалении файла: " + error.message);
      }
    }
  }

  async handleRenameFile() {
    const node = this.selectedNode;
    if (!node) {
      alert("Выберите файл или папку для переименования");
      return;
    }
    const newName = prompt("Новое имя:", node.name);
    if (newName) {
      if (node.type === "file") {
        const trimmed = newName.trim();
        const lastDot = trimmed.lastIndexOf(".");
        const hasExtension = lastDot !== -1 && lastDot < trimmed.length - 1;
        if (!hasExtension) {
          alert(
            "Укажите имя файла с расширением (например: name.txt или .env)"
          );
          return;
        }
      }
      const updated = await updateNode(node.id, {
        name: newName,
        type: node.type,
      });

      const li = this.treeContainer.querySelector(`li[data-id='${node.id}']`);
      if (li) {
        const label = li.querySelector(".node-label");
        if (label) label.textContent = updated.name || newName;
      }
      const tabEl = this.tabsContainer.querySelector(
        `.tab[data-id='${node.id}'] .tab-title`
      );
      if (tabEl) tabEl.textContent = updated.name || newName;
      if (this.openTabs.has(node.id)) {
        const current = this.openTabs.get(node.id);
        this.openTabs.set(node.id, {
          ...current,
          name: updated.name || newName,
        });
      }
    }
  }

  refreshTree(event: any) {
    if (event && event.action === "add_node") {
      const { node, parentId } = event;
      this.tree.addNodeToTree(node, parentId || null);
      return;
    }
    if (event && event.action === "update_node") {
      const updated = event.node;
      storeUpdateTabNode(updated);
      const tabTitle = this.tabsContainer.querySelector(
        `.tab[data-id='${updated.id}'] .tab-title`
      );
      if (tabTitle && updated.name) tabTitle.textContent = updated.name;
      const li = this.treeContainer.querySelector(
        `li[data-id='${updated.id}']`
      );
      if (li) {
        let tooltip = li.querySelector(".tooltip") as HTMLElement;
        if (tooltip) {
          tooltip.textContent = updated.description || "";
        } else if (updated.description) {
          tooltip = document.createElement("span");
          tooltip.className = "tooltip";
          tooltip.textContent = updated.description;
          li.appendChild(tooltip);

          li.addEventListener(
            "mouseover",
            () => (tooltip.style.visibility = "visible")
          );
          li.addEventListener(
            "mouseout",
            () => (tooltip.style.visibility = "hidden")
          );
        }
      }
      if (this.selectedNode && this.selectedNode.id === updated.id) {
        this.selectedNode = { ...this.selectedNode, ...updated };
        this.handleSelectionChange(this.selectedNode);
      }
      if (this.activeTabId === updated.id) {
        const codeElement = this.contentElement?.querySelector("code");
        this.contentElement.dataset.node = JSON.stringify(updated);
        if (this.descriptionInput) {
          this.descriptionInput.value = updated.description || "";
        }

        if (
          typeof window !== "undefined" &&
          "Prism" in window &&
          (window as any).Prism &&
          (window as any).Prism.highlightElement &&
          codeElement
        ) {
          (window as any).Prism.highlightElement(codeElement);
        }
      }
      return;
    }
  }
}

export default Main;

const app = new Main();
app.init();
