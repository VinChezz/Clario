interface WhiteboardElement {
  type: string;
  dataUrl?: string;
  [key: string]: any;
}

interface WhiteboardData {
  elements?: WhiteboardElement[];
}

export function calculateFileSize(
  document?: string | null,
  whiteboard?: string | null
): bigint {
  const BASE_WEIGHT = 75 * 1024 * 1024; // 75 MB
  const TEXT_WEIGHT_PER_1000_CHARS = 25 * 1024 * 1024; // 25 MB
  const WHITEBOARD_ELEMENT_WEIGHT = 10 * 1024 * 1024; // 10 MB
  const IMAGE_WEIGHT_MULTIPLIER = 2.5;
  const WHITEBOARD_BASE_WEIGHT = 25 * 1024 * 1024; // 25 MB

  let totalWeight = BASE_WEIGHT;

  if (document && typeof document === "string") {
    const charCount = document.length;
    const thousandsOfChars = Math.ceil(charCount / 1000);
    totalWeight += thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS;

    console.log(
      `📄 Text calculation: ${charCount} chars = ${thousandsOfChars} * 25MB = ${
        thousandsOfChars * 25
      }MB`
    );
  }

  if (whiteboard && typeof whiteboard === "string") {
    try {
      const whiteboardData: WhiteboardData = JSON.parse(whiteboard);

      totalWeight += WHITEBOARD_BASE_WEIGHT;
      console.log(`🎨 Whiteboard base: +25MB`);

      if (whiteboardData.elements && Array.isArray(whiteboardData.elements)) {
        const elementCount = whiteboardData.elements.length;
        const elementsWeight = elementCount * WHITEBOARD_ELEMENT_WEIGHT;
        totalWeight += elementsWeight;

        console.log(
          `📊 Elements: ${elementCount} * 10MB = ${
            elementsWeight / (1024 * 1024)
          }MB`
        );

        let imageWeight = 0;
        whiteboardData.elements.forEach((element: WhiteboardElement) => {
          if (element.type === "image" && element.dataUrl) {
            const base64Data = element.dataUrl.split(",")[1];
            if (base64Data) {
              const imageSize = Math.ceil(base64Data.length * 0.75);
              const weightedImageSize = imageSize * IMAGE_WEIGHT_MULTIPLIER;
              imageWeight += weightedImageSize;
            }
          }
        });

        if (imageWeight > 0) {
          totalWeight += imageWeight;
          console.log(
            `🖼️ Images weight: +${Math.ceil(imageWeight / (1024 * 1024))}MB`
          );
        }
      }
    } catch (e) {
      const charCount = whiteboard.length;
      const thousandsOfChars = Math.ceil(charCount / 1000);
      totalWeight += thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS;
      console.log(
        `📝 Whiteboard as text: ${charCount} chars = ${thousandsOfChars} * 25MB`
      );
    }
  }

  const totalMB = Math.ceil(totalWeight / (1024 * 1024));
  console.log(`⚖️ Total file weight: ${totalMB} MB`);

  return BigInt(totalWeight);
}

export function calculateVersionSize(content: string, type?: string): bigint {
  if (type === "document") {
    return calculateFileSize(content, undefined);
  } else if (type === "whiteboard") {
    return calculateFileSize(undefined, content);
  } else {
    try {
      JSON.parse(content);
      return calculateFileSize(undefined, content);
    } catch {
      return calculateFileSize(content, undefined);
    }
  }
}

export function formatBytes(bytes: bigint | number, decimals = 2): string {
  if (Number(bytes) === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const bytesNumber = typeof bytes === "bigint" ? Number(bytes) : bytes;
  const i = Math.floor(Math.log(bytesNumber) / Math.log(k));

  return (
    parseFloat((bytesNumber / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
}
