"use client";

import { useMemo } from "react";
import type { AgentMessage, ToolResultMessage, TodoTask } from "@/lib/types";

/**
 * Extracts the latest todo task list from agent messages.
 * Scans for todo tool results and parses the task data.
 */
export function useTodos(messages: AgentMessage[]): {
  tasks: TodoTask[];
  hasData: boolean;
} {
  return useMemo(() => {
    // Find all tool call IDs for "todo" tool
    const todoCallIds = new Set<string>();
    for (const msg of messages) {
      if (msg.role === "assistant" && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === "toolCall" && block.toolName === "todo") {
            todoCallIds.add(block.toolCallId);
          }
        }
      }
    }

    // Find the most recent todo tool result
    let latestResult: ToolResultMessage | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "toolResult") {
        const tr = msg as ToolResultMessage;
        if (todoCallIds.has(tr.toolCallId) || tr.toolName === "todo") {
          latestResult = tr;
          break;
        }
      }
    }

    if (!latestResult) return { tasks: [], hasData: false };

    // Check details field first (rpiv-todo stores full snapshot here)
    if (latestResult.details && typeof latestResult.details === "object") {
      const details = latestResult.details as Record<string, unknown>;
      if (Array.isArray(details.tasks)) {
        return {
          tasks: details.tasks as TodoTask[],
          hasData: true,
        };
      }
    }

    // Try to parse tasks from the tool result content
    const textBlocks = latestResult.content.filter(
      (b): b is { type: "text"; text: string } => b.type === "text"
    );

    // First, try to find a JSON details block in the text
    for (const block of textBlocks) {
      try {
        const parsed = JSON.parse(block.text);
        if (parsed && Array.isArray(parsed.tasks)) {
          return {
            tasks: parsed.tasks as TodoTask[],
            hasData: true,
          };
        }
      } catch {
        // Not JSON, continue
      }
    }

    // Fallback: scan for balanced {...} JSON that contains a "tasks" key
    // This handles nested arrays (e.g. blockedBy) that simple regex can't match
    const combinedText = textBlocks.map((b) => b.text).join("\n");
    let depth = 0;
    let start = -1;
    for (let i = 0; i < combinedText.length; i++) {
      if (combinedText[i] === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (combinedText[i] === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const candidate = combinedText.slice(start, i + 1);
          if (candidate.includes('"tasks"')) {
            try {
              const parsed = JSON.parse(candidate);
              if (parsed && Array.isArray(parsed.tasks)) {
                return { tasks: parsed.tasks as TodoTask[], hasData: true };
              }
            } catch { /* not valid JSON */ }
          }
          start = -1;
        }
      }
    }

    return { tasks: [], hasData: false };
  }, [messages]);
}
