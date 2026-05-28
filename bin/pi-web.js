#!/usr/bin/env node
"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { parseArgs } = require("util");
const https = require("https");

const pkgDir = path.join(__dirname, "..");
const nextDir = path.join(pkgDir, ".next");

// ========== 每日自动检测 pi 更新 ==========
const CHECK_FILE = path.join(pkgDir, ".next", ".last-update-check");
const UPDATE_JSON = path.join(pkgDir, "public", "update-check.json");

function checkPiUpdate() {
  return new Promise((resolve) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // 今天已经检查过就跳过
      if (fs.existsSync(CHECK_FILE)) {
        const lastCheck = fs.readFileSync(CHECK_FILE, "utf-8").trim();
        if (lastCheck === today) {
          resolve();
          return;
        }
      }

      console.log("[pi-web-cn] 正在检测 pi 更新...");
      
      // 获取当前安装的版本
      let currentVersion = "未知";
      try {
        const piPkg = require.resolve("@earendil-works/pi-coding-agent/package.json", { paths: [pkgDir] });
        currentVersion = require(piPkg).version;
      } catch {}

      // 查询 npm registry 最新版本
      const req = https.get("https://registry.npmjs.org/@earendil-works/pi-coding-agent/latest", {
        timeout: 10000,
        headers: { "Accept": "application/json" }
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const latestVersion = json.version;
            const hasUpdate = latestVersion && currentVersion !== "未知" && latestVersion !== currentVersion;
            
            const result = {
              current: currentVersion,
              latest: latestVersion || "未知",
              hasUpdate: !!hasUpdate,
              checkedAt: new Date().toISOString()
            };

            // 写入 JSON 供前端读取
            fs.writeFileSync(UPDATE_JSON, JSON.stringify(result));
            
            if (hasUpdate) {
              console.log(`\n[pi-web-cn] ⚡ pi 有新版本！当前: ${currentVersion} → 最新: ${latestVersion}`);
              console.log("[pi-web-cn] 执行 npx @earendil-works/pi-coding-agent@latest 更新\n");
            } else {
              console.log(`[pi-web-cn] pi 已是最新版本 (${currentVersion})`);
            }

            // 记录检查日期
            fs.writeFileSync(CHECK_FILE, today);
            resolve();
          } catch (e) {
            console.log("[pi-web-cn] 更新检测失败:", e.message);
            resolve();
          }
        });
      });
      req.on("error", (e) => {
        console.log("[pi-web-cn] 无法连接 npm registry:", e.message);
        resolve();
      });
      req.on("timeout", () => {
        req.destroy();
        console.log("[pi-web-cn] 更新检测超时");
        resolve();
      });
    } catch (e) {
      console.log("[pi-web-cn] 更新检测异常:", e.message);
      resolve();
    }
  });
}
// ========== 更新检测结束 ==========

// Resolve next's CLI entry
let nextBin;
try {
  nextBin = require.resolve("next/dist/bin/next", { paths: [pkgDir] });
} catch {
  try {
    const nextPkg = require.resolve("next/package.json", { paths: [pkgDir] });
    nextBin = path.join(path.dirname(nextPkg), "dist", "bin", "next");
  } catch {
    nextBin = path.join(pkgDir, "node_modules", "next", "dist", "bin", "next");
  }
}

const { values: cliArgs } = parseArgs({
  options: {
    port:     { type: "string", short: "p" },
    hostname: { type: "string", short: "H" },
  },
  strict: false,
});

const port     = cliArgs.port     ?? process.env.PORT     ?? "30141";
const hostname = cliArgs.hostname ?? process.env.HOSTNAME ?? null;

if (!fs.existsSync(nextDir)) {
  console.error("Build artifacts not found. Please report this issue.");
  process.exit(1);
}

const nextArgs = ["start", "-p", port];
if (hostname) nextArgs.push("-H", hostname);

// 先检测更新，再启动服务
checkPiUpdate().then(() => {
  const child = spawn(process.execPath, [nextBin, ...nextArgs], {
    cwd: pkgDir,
    stdio: ["inherit", "pipe", "inherit"],
    env: { ...process.env },
  });

  let browserOpened = false;
  const url = `http://${hostname ?? "localhost"}:${port}`;

  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    if (!browserOpened && text.includes("Ready")) {
      browserOpened = true;
      const isWindows = process.platform === "win32";
      const isMac = process.platform === "darwin";
      const openCmd = isWindows ? "start" : isMac ? "open" : "xdg-open";
      spawn(openCmd, [url], { shell: isWindows, stdio: "ignore", detached: true }).unref();
    }
  });

  child.on("exit", (code) => process.exit(code ?? 0));
});
