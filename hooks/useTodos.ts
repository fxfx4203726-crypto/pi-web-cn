"use client";

import { useMemo } from "react";
import type { AgentMessage, ToolResultMessage, TodoTask } from "@/lib/types";

interface TodoToolResult {
  tasks: TodoTask[];
  nextId: number;
  action: string;
}

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

    // Fallback: try to extract tasks from the combined text
    // The todo tool returns human-readable text like:
    // "Created task #1: Do something [pending]"
    // "Updated task #1: status pending → in_progress"
    // We'll try to parse the details from a JSON-like structure embedded in the text
    const combinedText = textBlocks.map((b) => b.text).join("\n");

    // Try to find JSON object with tasks array in the text
    const jsonMatch = combinedText.match(/\{[^]*"tasks"\s*:\s*\[[^\]]*\][^]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && Array.isArray(parsed.tasks)) {
          return {
            tasks: parsed.tasks as TodoTask[],
            hasData: true,
          };
        }
      } catch {
        // Not valid JSON
      }
    }

    return { tasks: [], hasData: false };
  }, [messages]);
}
