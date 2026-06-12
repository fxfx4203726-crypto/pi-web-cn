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

function injectErrorContent(msg: AssistantMessage): AssistantMessage {
  const err = msg.errorMessage;
  if (!err && msg.stopReason !== "error") return msg;

  const errorText = err || "未知错误";
  const content = Array.isArray(msg.content) ? [...msg.content] : [];

  const hasText = content.some(
    (b) => isObject(b) && b.type === "text"
  );

  if (hasText) {
    content.push({ type: "text" as const, text: `\n\n---\n⚠️ **错误详情：**\n\`\`\`\n${errorText}\n\`\`\`` });
  } else {
    content.unshift({ type: "text" as const, text: `⚠️ **模型返回错误**\n\`\`\`\n${errorText}\n\`\`\`` });
  }

  return { ...msg, content };
}

export function normalizeToolCalls(msg: AgentMessage): AgentMessage {
  let normalized = msg;

  // Clean empty text blocks from all messages (not just assistant)
  normalized = cleanEmptyTextBlocks(normalized);

  if (normalized.role !== "assistant") return normalized;

  const assistant = normalized as AssistantMessage;
  let content = assistant.content;

  // Handle string content (flattened by cleanEmptyTextBlocks)
  if (typeof content === "string") {
    content = [{ type: "text" as const, text: content }];
  }
  if (!Array.isArray(content)) return assistant;

  // Normalize tool call blocks
  content = content.map((block) => {
    const result = normalizeToolCallBlock(block);
    return result ?? block;
  });

  let result: AssistantMessage = { ...assistant, content };

  // Log empty assistant messages for debugging
  if (content.length === 0) {
    console.warn("[normalize] Empty assistant message:", {
      model: assistant.model,
      provider: assistant.provider,
      stopReason: assistant.stopReason,
      errorMessage: assistant.errorMessage,
      originalContent: (normalized as AssistantMessage).content,
    });
  }

  // Inject Pi errors as visible text in the message bubble
  result = injectErrorContent(result);

  return result as AgentMessage;
}