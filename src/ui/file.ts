export class FileView {
  contentElement: HTMLElement;
  constructor(contentElement: HTMLElement) {
    this.contentElement = contentElement;
  }

  showPlaceholder(message = "Выберите файл") {
    let placeholder = this.contentElement.querySelector(
      ".file-placeholder"
    ) as HTMLElement;
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "file-placeholder";
      placeholder.textContent = message;
      this.contentElement.appendChild(placeholder);
    } else {
      placeholder.textContent = message;
    }
    const pre = this.contentElement.querySelector("pre");
    if (pre) pre.style.display = "none";
    placeholder.style.display = "flex";
  }

  renderCode({ content, language }: { content: string; language: string }) {
    const placeholder: HTMLElement | null =
      this.contentElement.querySelector(".file-placeholder");
    if (placeholder) placeholder.style.display = "none";
    const pre = this.contentElement.querySelector("pre");
    if (pre) pre.style.display = "block";
    const codeElement = this.contentElement.querySelector("code");
    if (!codeElement) return;
    codeElement.textContent = content || "";
    codeElement.className = `language-${language || "text"}`;
    if (
      typeof window !== "undefined" &&
      "Prism" in window &&
      (window as any).Prism &&
      (window as any).Prism.highlightElement
    ) {
      (window as any).Prism.highlightElement(codeElement);
    }
  }
}

export default FileView;
