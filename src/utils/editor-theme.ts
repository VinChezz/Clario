export class EditorThemeManager {
  private isDark: boolean;
  private observer: MutationObserver | null = null;

  constructor(isDark: boolean) {
    this.isDark = isDark;
  }

  applyTheme() {
    this.updateTheme(this.isDark);
    this.setupObserver();
  }

  updateTheme(isDark: boolean) {
    this.isDark = isDark;

    const editorElement = document.getElementById("editorjs");
    if (!editorElement) return;

    const editorWrapper = editorElement.closest(".codex-editor");
    if (!editorWrapper) return;

    if (isDark) {
      editorWrapper.classList.add("dark-theme");
      document.body.classList.add("dark-editor");

      this.applyDarkModeStyles();
    } else {
      editorWrapper.classList.remove("dark-theme");
      document.body.classList.remove("dark-editor");
      this.removeDarkModeStyles();
    }
  }

  private applyDarkModeStyles() {
    const styleId = "editorjs-dark-theme-styles";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .dark-theme .ce-toolbar__plus,
      .dark-theme .ce-toolbar__settings-btn {
        background: #2a2a2d !important;
        border-color: #3a3a3d !important;
        color: #e0e0e0 !important;
      }

      .dark-theme .ce-inline-toolbar {
        background: #252528 !important;
        border-color: #2a2a2d !important;
      }

      .dark-theme .ce-inline-tool {
        color: #e0e0e0 !important;
      }

      .dark-theme .ce-settings {
        background: #252528 !important;
        border-color: #2a2a2d !important;
      }
    `;
  }

  private removeDarkModeStyles() {
    const styleElement = document.getElementById("editorjs-dark-theme-styles");
    if (styleElement) {
      styleElement.remove();
    }
  }

  private setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains("ce-inline-toolbar") ||
                node.classList.contains("ce-popover") ||
                node.classList.contains("ce-settings")
              ) {
                if (this.isDark) {
                  node.classList.add("dark-theme");
                }
              }
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.removeDarkModeStyles();
  }
}
