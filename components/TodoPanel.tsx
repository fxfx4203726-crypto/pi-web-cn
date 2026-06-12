"use client";

import { useState } from "react";
import type { TodoTask } from "@/lib/types";

interface Props {
  tasks: TodoTask[];
  hasData: boolean;
}

const STATUS_COLORS: Record<TodoTask["status"], string> = {
  pending: "#6b7280",
  in_progress: "#2563eb",
  completed: "#16a34a",
  deleted: "#ef4444",
};

const STATUS_ORDER: Record<TodoTask["status"], number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
  deleted: 3,
};

function TaskIcon({ status }: { status: TodoTask["status"] }) {
  switch (status) {
    case "pending":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "in_progress":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 3v4l2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "completed":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 7l2 2 3-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "deleted":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="4.5" y1="4.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="9.5" y1="4.5" x2="4.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function TodoPanel({ tasks, hasData }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleTasks = tasks
    .filter((t) => t.status !== "deleted")
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  if (!hasData) {
    return (
      <div
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <div style={{ marginBottom: 8, opacity: 0.3 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        暂无任务<br />
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          AI 将自动创建和管理任务
        </span>
      </div>
    );
  }

  if (visibleTasks.length === 0) {
    return (
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: 12,
        }}
      >
        <span style={{ opacity: 0.5 }}>所有任务已完成 🎉</span>
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {visibleTasks.map((task) => {
        const color = STATUS_COLORS[task.status];
        const isCollapsed = collapsed.has(task.id);
        const hasDescription = !!task.description;
        const isInProgress = task.status === "in_progress";

        return (
          <div
            key={task.id}
            style={{
              padding: "7px 12px",
              borderBottom: "1px solid var(--border)",
              transition: "background 0.12s",
              cursor: hasDescription ? "pointer" : "default",
            }}
            onClick={() => hasDescription && toggleCollapse(task.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                  color,
                  opacity: task.status === "completed" ? 0.5 : 1,
                }}
              >
                <TaskIcon status={task.status} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isInProgress ? 600 : 400,
                      color: task.status === "completed" ? "var(--text-dim)" : "var(--text)",
                      textDecoration: task.status === "completed" ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}
                  >
                    {task.subject}
                  </span>
                  {task.activeForm && task.status === "in_progress" && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-dim)",
                        fontStyle: "italic",
                      }}
                    >
                      {task.activeForm}
                    </span>
                  )}
                </div>
                {hasDescription && (
                  <div
                    style={{
                      marginTop: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="var(--text-dim)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        flexShrink: 0,
                        transform: isCollapsed ? "none" : "rotate(90deg)",
                        transition: "transform 0.15s",
                      }}
                    >
                      <polyline points="3 2 7 5 3 8" />
                    </svg>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {isCollapsed ? "展开描述" : "收起描述"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Description */}
            {hasDescription && !isCollapsed && (
              <div
                style={{
                  marginTop: 6,
                  marginLeft: 22,
                  padding: "8px 10px",
                  background: "var(--bg)",
                  borderRadius: 6,
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  border: "1px solid var(--border)",
                }}
              >
                {task.description}
              </div>
            )}
            {/* Blocked by */}
            {task.blockedBy && task.blockedBy.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  marginLeft: 22,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "var(--text-dim)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                等待任务 #{task.blockedBy.join(", #")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
