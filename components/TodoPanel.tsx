"use client";

import { useState } from "react";
import type { TodoTask } from "@/lib/types";

interface Props {
  tasks: TodoTask[];
  hasData: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<TodoTask["status"], { label: string; color: string; bg: string }> = {
  pending: { label: "待处理", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  in_progress: { label: "进行中", color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  completed: { label: "已完成", color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  deleted: { label: "已删除", color: "#ef4444", bg: "rgba(239,68,68,0.06)" },
};

const STATUS_ORDER: Record<TodoTask["status"], number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
  deleted: 3,
};

function TodoIcon({ status }: { status: TodoTask["status"] }) {
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

export function TodoPanel({ tasks, hasData, onClose }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter out deleted tasks, sort by status priority
  const visibleTasks = tasks
    .filter((t) => t.status !== "deleted")
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        width: 320,
        maxHeight: "min(520px, 70vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>任务</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasData && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-dim)" }}>
              {inProgressCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_LABELS.in_progress.color }} />
                  {inProgressCount}
                </span>
              )}
              {pendingCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_LABELS.pending.color }} />
                  {pendingCount}
                </span>
              )}
              {completedCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_LABELS.completed.color }} />
                  {completedCount}
                </span>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              padding: 0,
              background: "none",
              border: "none",
              borderRadius: 6,
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {!hasData ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: 8, opacity: 0.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            暂无任务<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              Agent 将自动创建和管理任务
            </span>
          </div>
        ) : visibleTasks.length === 0 ? (
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
        ) : (
          visibleTasks.map((task) => {
            const status = STATUS_LABELS[task.status];
            const isCollapsed = collapsed.has(task.id);
            const hasDescription = !!task.description;
            const isInProgress = task.status === "in_progress";

            return (
              <div
                key={task.id}
                style={{
                  padding: "8px 14px",
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
                      color: status.color,
                      opacity: task.status === "completed" ? 0.6 : 1,
                    }}
                  >
                    <TodoIcon status={task.status} />
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
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: status.bg,
                          color: status.color,
                          flexShrink: 0,
                        }}
                      >
                        {status.label}
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
          })
        )}
      </div>

      {/* Footer */}
      {hasData && (
        <div
          style={{
            padding: "6px 14px",
            borderTop: "1px solid var(--border)",
            fontSize: 10,
            color: "var(--text-dim)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {visibleTasks.length} 个任务 · Agent 自动管理
        </div>
      )}
    </div>
  );
}
