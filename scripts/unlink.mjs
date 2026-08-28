#!/usr/bin/env node
// unlink.mjs — 移除指向本仓库的软链（只删软链，不碰真实目录）
import { readdirSync, existsSync, lstatSync, readlinkSync, unlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = os.homedir();
const targets = [["agents", ".agents"], ["openclaw", ".openclaw"], ["claude", ".claude"]]
  .map(([t, dot]) => join(home, dot, "skills"));
const skills = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith("."))
  .map(d => d.name);

let removed = 0;
for (const target of targets) {
  if (!existsSync(target)) continue;
  for (const name of skills) {
    const p = join(target, name);
    if (!existsSync(p)) continue;
    if (lstatSync(p).isSymbolicLink() && readlinkSync(p) === join(root, "skills", name)) {
      unlinkSync(p);
      console.log("  ✗", "移除", p);
      removed++;
    }
  }
}
console.log(removed === 0 ? "没有需要移除的软链" : `已移除 ${removed} 条软链`);
