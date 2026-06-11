import { NextResponse } from "next/server";
import fs from "fs";
import { resolveSessionPath } from "@/lib/session-reader";
import { startRpcSession, getRpcSession } from "@/lib/rpc-manager";
import { cleanSessionImages, fixRemovedImagePlaceholders } from "@/lib/clean-session";
import { SessionManager } from "@earendil-works/pi-coding-agent";

const SESSION_SIZE_THRESHOLD_MB = 20; // Auto-clean when session file exceeds this size (~API request body limit)

// POST /api/agent/[id] - Send a command to an existing session
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json() as { type: string; [key: string]: unknown };

    // Fast path: already-running session
    const existing = getRpcSession(id);
    if (existing?.isAlive()) {
      console.log(`[API ${id}] Existing session alive, sending command:`, body.type);
      const result = await existing.send(body);
      return NextResponse.json({ success: true, data: result });
    }

    const filePath = await resolveSessionPath(id);
    if (!filePath) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Auto-clean images if session file is too large
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB > SESSION_SIZE_THRESHOLD_MB) {
      const result = await cleanSessionImages(filePath);
      return NextResponse.json({
        autoCleaned: true,
        message: `会话文件过大（${result.sizeBeforeMB}MB），已自动清理 ${result.imagesCleaned} 张历史图片（释放 ${result.savedMB}MB）。请重新发送消息。`,
        cleanResult: result,
      });
    }

    const cwd = SessionManager.open(filePath).getHeader()?.cwd ?? process.cwd();

    // Fix legacy [IMAGE_DATA_REMOVED...] placeholders that break LLM API calls
    const fixedCount = fixRemovedImagePlaceholders(filePath);
    if (fixedCount > 0) {
      console.log(`[API ${id}] Fixed ${fixedCount} removed image placeholders in session file`);
    }

    console.log(`[API ${id}] Starting RPC session for file:`, filePath);
    const { session } = await startRpcSession(id, filePath, cwd);
    console.log(`[API ${id}] RPC session started, sending command:`, body.type);
    const result = await session.send(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`[API ${id}] Error:`, error);
    return NextResponse.json({ error: String(error), stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}

// GET /api/agent/[id] - Get current agent state
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = getRpcSession(id);
    if (!session || !session.isAlive()) {
      return NextResponse.json({ running: false });
    }

    const state = await session.send({ type: "get_state" });
    return NextResponse.json({ running: true, state });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
