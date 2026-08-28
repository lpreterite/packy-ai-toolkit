#!/usr/bin/env node
// verify.mjs — 帕奇的AI工具包 结构/引用完整性校验
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = join(root, "skills");
const problems = [];
const notes = [];

if (!existsSync(skillsRoot)) {
  console.error("[verify] 缺少 skills/ 目录"); process.exit(1);
}

function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return fm;
}

const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith("."))
  .map(d => d.name)
  .sort();

if (skillDirs.length === 0) problems.push("skills/ 下没有任何技能目录");

const names = new Set();
for (const dir of skillDirs) {
  const skillPath = join(skillsRoot, dir);
  const skillMd = join(skillPath, "SKILL.md");
  if (!existsSync(skillMd)) { problems.push(`${dir}: 缺少 SKILL.md`); continue; }
  const text = readFileSync(skillMd, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm) { problems.push(`${dir}: SKILL.md 缺少合法 frontmatter (--- name/description ---)`); continue; }
  if (!fm.name) problems.push(`${dir}: frontmatter 缺 name`);
  if (!fm.description) problems.push(`${dir}: frontmatter 缺 description`);
  if (fm.name && fm.name !== dir) problems.push(`${dir}: frontmatter name (${fm.name}) 与目录名不一致`);
  if (fm.name) {
    if (names.has(fm.name)) problems.push(`${dir}: name ${fm.name} 与其他技能重复`);
    names.add(fm.name);
  }
  const pathRefs = new Set();
  for (const m of text.matchAll(/`((?:references|resources|guides|checkpoints|ops|lobster-flows|subagent-templates)\/[^`]+)`/g)) pathRefs.add(m[1]);
  for (const m of text.matchAll(/\!\(([^)]+)\)|\]\(([^)#]+)\)/g)) {
    const p = m[1] || m[2];
    if (p && !/^(https?:|mailto:|#|~|\/)/.test(p)) pathRefs.add(p.split("?")[0]);
  }
  for (const p of pathRefs) {
    if (p.endsWith("/")) continue;
    // 跳过占位符/模板路径（NN 编号、{文章名}、<...>、通配符）
    if (/[{}<>*?]|\bNN\b/.test(p)) continue;
    const full = join(skillPath, p);
    if (!existsSync(full)) problems.push(`${dir}/SKILL.md 引用不存在的文件: ${p}`);
  }
  notes.push(`${dir}: 通过 (name=${fm.name || "-"})`);
}

const readme = readFileSync(join(root, "README.md"), "utf8");
const tableNames = [...readme.matchAll(/^\| `([a-z0-9-]+)`/gm)].map(m => m[1]).sort();
const dirSet = [...names].sort();
if (JSON.stringify(tableNames) !== JSON.stringify(dirSet)) {
  problems.push(`README 技能总表与 skills/ 目录不一致\n  目录: [${dirSet.join(", ")}]\n  表格: [${tableNames.join(", ")}]`);
}

console.log("==== verify 结果 ====");
for (const n of notes) console.log("  ✓", n);
if (problems.length) {
  for (const p of problems) console.error("  ✗", p);
  console.error(`\n[verify] FAILED (${problems.length} 个问题)`);
  process.exit(1);
}
console.log(`\n[verify] OK — ${skillDirs.length} 个技能，全部通过`);
