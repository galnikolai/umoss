import { updateNode } from "../api/index.js";
import {
  getFileContent,
  getCachedFileContent,
  uploadNewFile,
  invalidateFileCache,
  clearFileCache,
} from "../services/index.js";
import { FileView } from "../ui/index.js";
import { Node } from "../types/domain.js";

export class File {
  modalBg: HTMLElement | null = null;
  modalInput: HTMLInputElement | null = null;
  modalOk: HTMLElement | null = null;
  modalCancel: HTMLElement | null = null;
  editDescriptionBtn: HTMLButtonElement | null = null;
  contentElement: HTMLElement;
  descriptionInput: HTMLInputElement;
  uploadInput: HTMLInputElement;
  refreshCallback: (data: any) => void;
  view: FileView;
  getSelectedNode: () => Node | null = () => null;
  hideModal: () => void = () => {
    if (this.modalBg) this.modalBg.style.display = "none";
  };
  showModal: (data: {
    file: File | null;
    parentId: string | null | undefined;
    description: string;
    editId: string | null | undefined;
    name: string | null | undefined;
    type: string | null | undefined;
  }) => void = () => {};

  _modalState = {
    file: null as File | null,
    parentId: null as string | null,
    editId: null as string | null,
    nodeName: null as string | null,
    nodeType: null as "file" | "folder" | null,
  };

  constructor(
    contentElement: HTMLElement,
    descriptionInput: HTMLElement,
    uploadInput: HTMLElement,
    refreshCallback: (data: any) => void
  ) {
    this.contentElement = contentElement;
    this.descriptionInput = descriptionInput as HTMLInputElement;
    this.uploadInput = uploadInput as HTMLInputElement;
    this.refreshCallback = refreshCallback;
    this.view = new FileView(this.contentElement);
  }

  static cache = new Map();

  setup(getSelectedNode: () => any | null) {
    this.getSelectedNode = getSelectedNode;
    this.modalBg = document.getElementById("modal-bg");
    this.modalInput = document.getElementById(
      "modal-description-input"
    ) as HTMLInputElement;
    this.modalOk = document.getElementById("modal-description-ok");
    this.modalCancel = document.getElementById("modal-description-cancel");

    const hideModal = () => {
      if (this.modalBg) this.modalBg.style.display = "none";
      this._modalState = {
        file: null,
        parentId: null,
        editId: null,
        nodeName: null,
        nodeType: null,
      };
    };

    this.hideModal = hideModal;

    this.showModal = ({ file, parentId, description, editId, name, type }) => {
      this._modalState.file = file || null;
      this._modalState.parentId = parentId || null;
      this._modalState.editId = editId || null;
      this._modalState.nodeName = name || null;
      this._modalState.nodeType =
        type === "file" || type === "folder" ? type : null;
      if (this.modalInput) this.modalInput.value = description || "";
      if (this.modalOk)
        this.modalOk.textContent = editId ? "Сохранить" : "Загрузить";
      if (this.modalBg) this.modalBg.style.display = "flex";
      if (this.modalInput && typeof this.modalInput.focus === "function") {
        this.modalInput.focus();
      }
    };

    if (this.modalCancel) this.modalCancel.onclick = hideModal;
    if (this.modalBg)
      this.modalBg.onclick = (e) => {
        if (e.target === this.modalBg) hideModal();
      };

    if (this.modalOk)
      this.modalOk.onclick = async () => {
        if (this._modalState.editId) {
          const updated = await updateNode(this._modalState.editId, {
            name: this._modalState.nodeName || "",
            type: this._modalState.nodeType || "file",
            description: this.modalInput ? this.modalInput.value : "",
          });
          if (typeof this.refreshCallback === "function") {
            this.refreshCallback({ action: "update_node", node: updated });
          }
          hideModal();
          return;
        }
        if (!this._modalState.file) return;
        const created = await uploadNewFile({
          file: this._modalState.file as any,
          parentId: this._modalState.parentId || "",
          description: this.modalInput ? this.modalInput.value : "",
        });
        if (typeof this.refreshCallback === "function") {
          this.refreshCallback({
            action: "add_node",
            node: created,
            parentId: this._modalState.parentId,
          });
        }
        hideModal();
      };

    if (this.uploadInput)
      this.uploadInput.addEventListener("change", async (e) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length) {
          const file: any = input.files[0];
          let parentId = null;
          const selected =
            typeof this.getSelectedNode === "function"
              ? this.getSelectedNode()
              : null;
          if (selected && selected.type === "folder") parentId = selected.id;
          this.showModal({
            file,
            parentId,
            description: "",
            editId: "",
            name: "",
            type: "",
          });
          input.value = "";
        }
      });

    this.editDescriptionBtn = document.getElementById(
      "edit-description"
    ) as HTMLButtonElement;
    if (this.editDescriptionBtn) this.editDescriptionBtn.style.display = "none";
  }

  async display(node: Node) {
    this.view.renderCode({ content: "", language: "text" });

    let cached = getCachedFileContent(node.id) || File.cache.get(node.id);
    let content, language;
    if (cached) {
      ({ content, language } = cached);
    } else {
      const data = await getFileContent(node.id);
      content = data.content;
      language = data.language;
      File.cache.set(node.id, { content, language });
    }
    this.view.renderCode({ content, language });
    if (this.descriptionInput) {
      this.descriptionInput.value = node.description || "";
    }
    this.contentElement.dataset.node = JSON.stringify(node);
  }

  showPlaceholder(message = "Выберите файл") {
    this.view.showPlaceholder(message);
  }

  invalidateCache(fileId: string) {
    invalidateFileCache(fileId);
    return File.cache.delete(fileId);
  }

  clearCache() {
    clearFileCache();
    return File.cache.clear();
  }

  updateEditDescriptionButton(node: Node) {
    const btn: HTMLButtonElement | null = this.editDescriptionBtn;
    if (!btn) return;
    if (node && node.type === "file") {
      btn.style.display = "inline-block";
      btn.onclick = () => {
        this.showModal({
          file: null,
          parentId: null,
          description: node.description,
          editId: node.id,
          name: node.name,
          type: node.type,
        });
      };
    } else {
      btn.style.display = "none";
      btn.onclick = null;
    }
  }
}

export default File;
