export class FileUploadService {
  static async addReadmeToDocument(
    fileId: string,
    readmeContent: string,
    fileName: string
  ): Promise<{
    success: boolean;
    error?: string;
    progress?: number;
  }> {
    try {
      const fileResponse = await fetch(`/api/files/${fileId}`);
      const fileData = await fileResponse.json();

      if (!fileData.success) {
        return { success: false, error: "Failed to fetch document" };
      }

      const readmeAsTiptap = this.convertMarkdownToTiptap(
        readmeContent,
        fileName
      );

      let currentContent = { type: "doc", content: [] };
      try {
        if (fileData.file.document && fileData.file.document !== '""') {
          currentContent = JSON.parse(fileData.file.document);
        }
      } catch (e) {
        console.warn("Could not parse document, starting fresh");
      }

      const combinedContent = {
        type: "doc",
        content: [
          ...readmeAsTiptap.content,
          { type: "horizontalRule" },
          ...currentContent.content,
        ],
      };

      const updateResponse = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: JSON.stringify(combinedContent),
        }),
      });

      const updateResult = await updateResponse.json();

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || "Failed to update document",
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("File upload error:", error);
      return { success: false, error: error.message || "An error occurred" };
    }
  }

  private static convertMarkdownToTiptap(
    markdown: string,
    title?: string
  ): any {
    const lines = markdown.split("\n");
    const content: any[] = [];

    if (title) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: title }],
      });
      content.push({
        type: "paragraph",
        content: [],
      });
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("# ")) {
        content.push({
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: line.substring(2).trim() }],
        });
      } else if (line.startsWith("## ")) {
        content.push({
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: line.substring(3).trim() }],
        });
      } else if (line.startsWith("### ")) {
        content.push({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: line.substring(4).trim() }],
        });
      } else if (line.startsWith("#### ")) {
        content.push({
          type: "heading",
          attrs: { level: 4 },
          content: [{ type: "text", text: line.substring(5).trim() }],
        });
      } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const listItems = [];
        while (
          i < lines.length &&
          (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
        ) {
          listItems.push({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: lines[i].trim().substring(2) }],
              },
            ],
          });
          i++;
        }
        i--;
        content.push({
          type: "bulletList",
          content: listItems,
        });
      } else if (/^\d+\. /.test(line.trim())) {
        const listItems = [];
        while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
          listItems.push({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: lines[i].trim().replace(/^\d+\. /, ""),
                  },
                ],
              },
            ],
          });
          i++;
        }
        i--;
        content.push({
          type: "orderedList",
          content: listItems,
        });
      } else if (line.trim().startsWith("```")) {
        const language = line.trim().substring(3).trim() || "";
        i++;
        const codeLines = [];
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        content.push({
          type: "codeBlock",
          attrs: { language },
          content: [{ type: "text", text: codeLines.join("\n") }],
        });
      } else if (line.trim().startsWith("> ")) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith("> ")) {
          quoteLines.push(lines[i].trim().substring(2));
          i++;
        }
        i--;
        content.push({
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: quoteLines.join("\n") }],
            },
          ],
        });
      } else if (
        line.trim() === "---" ||
        line.trim() === "***" ||
        line.trim() === "___"
      ) {
        content.push({ type: "horizontalRule" });
      } else if (line.trim()) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: line }],
        });
      } else {
        content.push({
          type: "paragraph",
          content: [],
        });
      }
    }

    return {
      type: "doc",
      content,
    };
  }
}
