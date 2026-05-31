import fs from "fs";

const IMAGE_SIZE_THRESHOLD = 1000; // chars in base64 string

export interface CleanResult {
  linesProcessed: number;
  imagesCleaned: number;
  sizeBeforeMB: string;
  sizeAfterMB: string;
  savedMB: string;
}

function isLargeImageBlock(block: Record<string, unknown>): boolean {
  // Format: { type: "image", data: "base64..." }
  if (
    block.type === "image" &&
    typeof block.data === "string" &&
    block.data.length > IMAGE_SIZE_THRESHOLD
  ) {
    return true;
  }
  // Format: { type: "image", image: { source: { data: "base64..." } } }
  const imgSrc = (block.image as Record<string, unknown> | undefined)?.source as
    | Record<string, unknown>
    | undefined;
  if (
    imgSrc?.data &&
    typeof imgSrc.data === "string" &&
    (imgSrc.data as string).length > IMAGE_SIZE_THRESHOLD
  ) {
    return true;
  }
  return false;
}

function isRemovedImagePlaceholder(block: Record<string, unknown>): boolean {
  // Format: { type: "image", data: "[IMAGE_DATA_REMOVED_...chars]" }
  if (
    block.type === "image" &&
    typeof block.data === "string" &&
    block.data.startsWith("[IMAGE_DATA_REMOVED_")
  ) {
    return true;
  }
  // Format: { type: "image", image: { source: { data: "[IMAGE_DATA_REMOVED_...chars]" } } }
  const imgSrc = (block.image as Record<string, unknown> | undefined)?.source as
    | Record<string, unknown>
    | undefined;
  if (
    imgSrc?.data &&
    typeof imgSrc.data === "string" &&
    (imgSrc.data as string).startsWith("[IMAGE_DATA_REMOVED_")
  ) {
    return true;
  }
  return false;
}

function filterLargeImagesFromContent(
  content: Array<Record<string, unknown>>,
): { filtered: Array<Record<string, unknown>>; removedCount: number } {
  let removedCount = 0;
  const filtered = content.filter((block) => {
    if (isLargeImageBlock(block) || isRemovedImagePlaceholder(block)) {
      removedCount++;
      return false;
    }
    return true;
  });
  return { filtered, removedCount };
}

/**
 * Remove large image data from session file to prevent it from growing too large.
 * Instead of replacing data with placeholders (which breaks LLM API calls),
 * we completely remove the image block from the message content.
 */
export async function cleanSessionImages(filePath: string): Promise<CleanResult> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  let imagesCleaned = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  const newLines = lines.map((line) => {
    totalBefore += line.length;
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;

      // Clean images in message content by filtering out large image blocks
      const msg = obj.message as Record<string, unknown> | undefined;
      const contentArr = msg?.content as Array<Record<string, unknown>> | undefined;
      if (msg && Array.isArray(contentArr)) {
        const { filtered, removedCount } = filterLargeImagesFromContent(contentArr);
        if (removedCount > 0) {
          imagesCleaned += removedCount;
          msg.content = filtered;
        }
      }

      // Also clean nested content in tool results
      const toolResults = obj.toolResults as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(toolResults)) {
        for (const tr of toolResults) {
          const trContent = tr.content as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(trContent)) {
            const { filtered, removedCount } = filterLargeImagesFromContent(trContent);
            if (removedCount > 0) {
              imagesCleaned += removedCount;
              tr.content = filtered;
            }
          }
        }
      }

      const cleanedLine = JSON.stringify(obj);
      totalAfter += cleanedLine.length;
      return cleanedLine;
    } catch {
      totalAfter += line.length;
      return line;
    }
  });

  fs.writeFileSync(filePath, newLines.join("\n") + "\n");

  const beforeMB = (totalBefore / 1024 / 1024).toFixed(2);
  const afterMB = (totalAfter / 1024 / 1024).toFixed(2);
  const savedMB = (parseFloat(beforeMB) - parseFloat(afterMB)).toFixed(2);

  return {
    linesProcessed: lines.length,
    imagesCleaned,
    sizeBeforeMB: beforeMB,
    sizeAfterMB: afterMB,
    savedMB,
  };
}

/**
 * Fix existing session files that contain [IMAGE_DATA_REMOVED...] placeholders.
 * These placeholders were created by an older version of cleanSessionImages and
 * cause LLM API calls to fail with 400 errors.
 */
export function fixRemovedImagePlaceholders(filePath: string): number {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  let placeholdersRemoved = 0;
  let modified = false;

  const newLines = lines.map((line) => {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;

      const msg = obj.message as Record<string, unknown> | undefined;
      const contentArr = msg?.content as Array<Record<string, unknown>> | undefined;
      if (msg && Array.isArray(contentArr)) {
        const { filtered, removedCount } = filterLargeImagesFromContent(contentArr);
        if (removedCount > 0) {
          placeholdersRemoved += removedCount;
          modified = true;
          msg.content = filtered;
        }
      }

      // Also fix nested content in tool results
      const toolResults = obj.toolResults as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(toolResults)) {
        for (const tr of toolResults) {
          const trContent = tr.content as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(trContent)) {
            const { filtered, removedCount } = filterLargeImagesFromContent(trContent);
            if (removedCount > 0) {
              placeholdersRemoved += removedCount;
              modified = true;
              tr.content = filtered;
            }
          }
        }
      }

      if (modified) {
        return JSON.stringify(obj);
      }
      return line;
    } catch {
      return line;
    }
  });

  if (placeholdersRemoved > 0) {
    fs.writeFileSync(filePath, newLines.join("\n") + "\n");
  }

  return placeholdersRemoved;
}
