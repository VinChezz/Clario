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
  whiteboard?: string | null,
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
  }

  if (whiteboard && typeof whiteboard === "string") {
    try {
      const whiteboardData: WhiteboardData = JSON.parse(whiteboard);

      totalWeight += WHITEBOARD_BASE_WEIGHT;

      if (whiteboardData.elements && Array.isArray(whiteboardData.elements)) {
        const elementCount = whiteboardData.elements.length;
        const elementsWeight = elementCount * WHITEBOARD_ELEMENT_WEIGHT;
        totalWeight += elementsWeight;

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
        }
      }
    } catch (e) {
      const charCount = whiteboard.length;
      const thousandsOfChars = Math.ceil(charCount / 1000);
      totalWeight += thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS;
    }
  }

  return BigInt(totalWeight);
}

export function calculateVersionSize(
  content: string,
  type?: string,
  previousContent?: string | null,
): bigint {
  if (!previousContent) {
    return calculateFullVersionSize(content, type);
  }

  if (type === "document") {
    return calculateDocumentDiffSize(content, previousContent);
  } else if (type === "whiteboard") {
    return calculateWhiteboardDiffSize(content, previousContent);
  } else {
    try {
      JSON.parse(content);
      return calculateWhiteboardDiffSize(content, previousContent);
    } catch {
      return calculateDocumentDiffSize(content, previousContent);
    }
  }
}

export function calculateFullVersionSize(
  content: string,
  type?: string,
): bigint {
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

function calculateDocumentDiffSize(
  currentContent: string,
  previousContent: string,
): bigint {
  const TEXT_WEIGHT_PER_1000_CHARS = 25 * 1024 * 1024;

  const currentLength = currentContent.length;

  if (currentContent === previousContent) {
    return BigInt(0);
  }

  const similarity = calculateStringSimilarity(previousContent, currentContent);

  if (similarity < 0.3) {
    const thousandsOfChars = Math.ceil(currentLength / 1000);
    return BigInt(thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS);
  } else {
    const changeRatio = 1 - similarity;
    const estimatedChangedChars = Math.ceil(currentLength * changeRatio);
    const thousandsOfChangedChars = Math.ceil(estimatedChangedChars / 1000);
    return BigInt(thousandsOfChangedChars * TEXT_WEIGHT_PER_1000_CHARS);
  }
}

function calculateWhiteboardDiffSize(
  currentContent: string,
  previousContent: string,
): bigint {
  const WHITEBOARD_ELEMENT_WEIGHT = 10 * 1024 * 1024;
  const IMAGE_WEIGHT_MULTIPLIER = 2.5;

  try {
    const currentData: WhiteboardData = JSON.parse(currentContent);
    const previousData: WhiteboardData = JSON.parse(previousContent);

    let diffWeight = 0;

    const currentElements = currentData.elements || [];
    const previousElements = previousData.elements || [];

    const elementCountDiff = Math.abs(
      currentElements.length - previousElements.length,
    );
    diffWeight += elementCountDiff * WHITEBOARD_ELEMENT_WEIGHT;

    const minElements = Math.min(
      currentElements.length,
      previousElements.length,
    );

    let changedElements = 0;
    for (let i = 0; i < minElements; i++) {
      if (
        JSON.stringify(currentElements[i]) !==
        JSON.stringify(previousElements[i])
      ) {
        changedElements++;
      }
    }

    diffWeight += changedElements * WHITEBOARD_ELEMENT_WEIGHT;

    const currentImages = currentElements.filter(
      (el) => el.type === "image" && el.dataUrl,
    );
    const previousImages = previousElements.filter(
      (el) => el.type === "image" && el.dataUrl,
    );

    const imageCountDiff = Math.abs(
      currentImages.length - previousImages.length,
    );
    if (imageCountDiff > 0) {
      const avgImageSize = 500 * 1024; // 500KB
      diffWeight += imageCountDiff * avgImageSize * IMAGE_WEIGHT_MULTIPLIER;
    }

    return BigInt(diffWeight);
  } catch (e) {
    return calculateDocumentDiffSize(currentContent, previousContent);
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0;

  const maxLength = Math.max(str1.length, str2.length);
  const editDistance = calculateLevenshteinDistance(str1, str2);

  return 1 - editDistance / maxLength;
}

function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[str2.length][str1.length];
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
