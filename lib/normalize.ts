import type { AgentMessage, AssistantMessage, ToolCallContent } from "./types";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function normalizeToolCallBlock(block: unknown): ToolCallContent | null {
  if (!isObject(block) || block.type !== "toolCall") return null;
  return {
    type: "toolCall",
    toolCallId: typeof block.toolCallId === "string" ? block.toolCallId : (typeof block.id === "string" ? block.id : ""),
    toolName: typeof block.toolName === "string" ? block.toolName : (typeof block.name === "string" ? block.name : ""),
    input: typeof block.input === "object" && block.input !== null && !Array.isArray(block.input)
      ? block.input as Record<string, unknown>
      : (typeof block.arguments === "object" && block.arguments !== null && !Array.isArray(block.arguments)
        ? block.arguments as Record<string, unknown>
        : {}),
  };
}

function cleanEmptyTextBlocks(msg: AgentMessage): AgentMessage {
  const content = msg.content;
  if (!Array.isArray(content)) return msg;
  const filtered = content.filter((block) => {
    if (isObject(block) && block.type === "text") {
      const text = typeof block.text === "string" ? block.text : "";
      return text.trim() !== "";
    }
    return true;
  });
  if (filtered.length === content.length) return msg;
  // If only one text block remains, flatten to string for compatibility
  const newContent = filtered.length === 1 && isObject(filtered[0]) && filtered[0].type === "text"
    ? (filtered[0] as { text: string }).text
    : filtered;
  return { ...msg, content: newContent } as AgentMessage;
}

export function normalizeToolCalls(msg: AgentMessage): AgentMessage {
  let normalized = msg;

  // Clean empty text blocks from all messages (not just assistant)
  normalized = cleanEmptyTextBlocks(normalized);

  if (normalized.role !== "assistant") return normalized;
  const content = (normalized as AssistantMessage).content;
  if (!Array.isArray(content)) return normalized;
  const toolNormalized = content.map((block) => {
    const result = normalizeToolCallBlock(block);
    return result ?? block;
  });
  return { ...normalized, content: toolNormalized } as AgentMessage;
}