export class ReadmeService {
  static async addReadmeToDocument(
    fileId: string,
    readmeContent: string,
    fileName: string
  ) {
    try {
      const fileRes = await fetch(`/api/files/${fileId}`);
      if (!fileRes.ok) {
        throw new Error(`Failed to fetch document: ${fileRes.statusText}`);
      }

      const fileData = await fileRes.json();

      const readmeNodes = await this.markdownToTiptap(readmeContent);

      let currentContent = { type: "doc", content: [] };
      if (fileData.document && fileData.document !== '""') {
        try {
          currentContent = JSON.parse(fileData.document);
        } catch (e) {
          console.warn("Could not parse existing document, starting fresh");
        }
      }

      const combinedContent = {
        type: "doc",
        content: [...readmeNodes.content, ...(currentContent.content || [])],
      };

      const saveRes = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: JSON.stringify(combinedContent),
        }),
      });

      if (!saveRes.ok) {
        throw new Error(`Failed to save document: ${saveRes.statusText}`);
      }

      return {
        success: true,
        message: "README added successfully",
        data: await saveRes.json(),
      };
    } catch (error: any) {
      console.error("Error adding README:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  private static async markdownToTiptap(markdown: string) {
    const lines = markdown.split("\n");
    const content: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

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
      } else if (line.startsWith("```")) {
        const language = line.substring(3).trim() || "";
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
      } else if (line.startsWith("> ")) {
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
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
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
      } else if (/^\d+\. /.test(line)) {
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
      } else if (line === "---" || line === "***" || line === "___") {
        content.push({ type: "horizontalRule" });
      } else {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: line }],
        });
      }
    }

    return {
      type: "doc",
      content,
    };
  }
}
