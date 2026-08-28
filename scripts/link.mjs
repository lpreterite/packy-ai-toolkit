#!/usr/bin/env node
// link.mjs — 软链本仓库全部技能到 Agent 技能目录（幂等）
// 用法: node scripts/link.mjs [--dry-run] [--only agents|openclaw|claude] [--replace]
import { readdirSync, existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, mkdirSync, renameSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const replace = args.includes("--replace");
const only = [...args].filter(a => a.startsWith("--only")).map((a, i, arr) => a.includes("=") ? a.split("=")[1] : (arr[i + 1] || "")).filter(Boolean);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = os.homedir();

const targets = {
  agents: join(home, ".agents", "skills"),
  openclaw: join(home, ".openclaw", "skills"),
  claude: join(home, ".claude", "skills"),
};
const selected = Object.keys(targets).filter(t => only.length === 0 || only.includes(t));
if (selected.length === 0) { console.error("未知 --only 值:", only.join(",")); process.exit(1); }

const skills = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith("."))
  .map(d => d.name)
  .sort();
if (skills.length === 0) { console.error("skills/ 下没有技能"); process.exit(1); }

const actions = [];
for (const t of selected) {
  const targetDir = targets[t];
  if (!existsSync(targetDir)) { if (!dryRun) mkdirSync(targetDir, { recursive: true }); actions.push(`mkdir ${targetDir}`); }
  for (const name of skills) {
    const linkPath = join(targetDir, name);
    const realPath = join(root, "skills", name);
    let state = "missing";
    try {
      const st = lstatSync(linkPath);
      if (st.isSymbolicLink()) state = readlinkSync(linkPath) === realPath ? "ok" : "stale";
      else state = "real";
    } catch { /* 路径不存在 */ }
    if (state === "ok") continue;
    if (state === "stale") {
      actions.push(`replace-symlink  ${linkPath} -> ${realPath}`);
      if (!dryRun) { unlinkSync(linkPath); symlinkSync(realPath, linkPath); }
    } else if (state === "real") {
      if (!replace) {
        actions.push(`SKIP(真实目录需 --replace)  ${linkPath}`);
        continue;
      }
      const backup = join(home, "Documents", "Works", "tmp", "links-backup-" + Date.now());
      if (!dryRun) {
        mkdirSync(backup, { recursive: true });
        renameSync(linkPath, join(backup, name));
        symlinkSync(realPath, linkPath);
        actions.push(`backup+replace  ${linkPath} -> ${backup}/${name}`);
      } else {
        actions.push(`backup+replace  ${linkPath} -> ${realPath}`);
      }
    } else {
      actions.push(`link  ${linkPath} -> ${realPath}`);
      if (!dryRun) symlinkSync(realPath, linkPath);
    }
  }
}

console.log(dryRun ? "==== dry-run 预览 ====" : "==== 执行结果 ====");
for (const a of actions) console.log("  " + (dryRun ? "·" : "✓"), a);
if (dryRun) console.log("\n提示: 加了 --replace 才会处理真实目录（如 skill-optimizer）");
if (!dryRun && actions.length === 0) console.log("  全部已是最新，无需改动");
