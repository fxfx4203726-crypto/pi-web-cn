// Client-side helper for POST /api/agent/[id].
//
// Every /api/agent/[id] route returns one of:
//   { success: true, data: <result> }
//   { error: string }              (non-2xx)
//   { autoCleaned: true, message: string, cleanResult: object }
//
// Call sites previously repeated the same 5-line fetch block 13× in
// hooks/useAgentSession.ts. This helper collapses that down to one line.

export class AutoCleanedError extends Error {
  public readonly cleanResult: unknown;
  constructor(message: string, cleanResult: unknown) {
    super(message);
    this.name = "AutoCleanedError";
    this.cleanResult = cleanResult;
  }
}

export async function sendAgentCommand<T = unknown>(
  sessionId: string,
  command: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`/api/agent/${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    autoCleaned?: boolean;
    message?: string;
    cleanResult?: unknown;
  };
  if (body.autoCleaned) {
    throw new AutoCleanedError(
      body.message ?? "会话已自动清理，请重新发送",
      body.cleanResult,
    );
  }
  if (!res.ok || body.error) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return body.data as T;
}
