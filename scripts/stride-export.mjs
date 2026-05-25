#!/usr/bin/env node
/**
 * stride-export.mjs
 * 변경된 소스 파일을 자체 실행 스크립트로 출력합니다.
 *
 * 사용법:
 *   node scripts/stride-export.mjs                    ← 전체 파일 (1개)
 *   node scripts/stride-export.mjs --part=1           ← 전체 중 앞 절반
 *   node scripts/stride-export.mjs --part=2           ← 전체 중 뒤 절반
 *   node scripts/stride-export.mjs --since=cc023ca    ← 특정 커밋 이후 변경분
 *   node scripts/stride-export.mjs --changed          ← 미커밋 변경분만
 *
 * Windows CMD 사용법:
 *   node scripts/stride-export.mjs --part=1 > sync1.txt
 *   node scripts/stride-export.mjs --part=2 > sync2.txt
 *
 * 집 컴퓨터에서:
 *   cat > apply1.mjs  (붙여넣기 후 Ctrl+D)  node apply1.mjs
 *   cat > apply2.mjs  (붙여넣기 후 Ctrl+D)  node apply2.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const INCLUDE_DIRS = ["app", "components", "lib", "prisma", "scripts"];
const INCLUDE_EXTS = [".ts", ".tsx", ".prisma", ".mjs", ".js", ".json", ".css"];
const INCLUDE_ROOT_FILES = [
  "next.config.ts", "next.config.js",
  "tailwind.config.ts", "tailwind.config.js",
  "tsconfig.json", "package.json",
  "proxy.ts", "middleware.ts",
];
const EXCLUDE_PATTERNS = ["node_modules", ".next", ".git", "package-lock.json"];

function shouldExclude(p) {
  return EXCLUDE_PATTERNS.some((x) => p.includes(x));
}

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldExclude(full)) continue;
    if (entry.isDirectory()) collectFiles(full, files);
    else if (INCLUDE_EXTS.includes(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const changedOnly = process.argv.includes("--changed");
const sinceArg = process.argv.find((a) => a.startsWith("--since="));
const sinceCommit = sinceArg?.replace("--since=", "") ?? null;
const partArg = process.argv.find((a) => a.startsWith("--part="));
const part = partArg ? parseInt(partArg.replace("--part=", ""), 10) : null; // 1 or 2

let files = [];
for (const dir of INCLUDE_DIRS) collectFiles(path.join(ROOT, dir), files);
for (const name of INCLUDE_ROOT_FILES) {
  const full = path.join(ROOT, name);
  if (fs.existsSync(full)) files.push(full);
}
files = [...new Set(files)].sort();

// 변경 파일 필터링
if (sinceCommit || changedOnly) {
  const { execSync } = await import("child_process");
  try {
    const cmd = sinceCommit
      ? `git diff --name-only ${sinceCommit} HEAD`
      : "git diff --name-only HEAD && git ls-files --others --exclude-standard";
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8" });
    const changed = new Set(out.trim().split("\n").filter(Boolean).map((p) => p.replace(/\\/g, "/")));
    files = files.filter((f) => changed.has(path.relative(ROOT, f).replace(/\\/g, "/")));
  } catch {
    process.stderr.write("⚠ git 명령 실패. 전체 파일을 내보냅니다.\n");
  }
}

// --part 옵션으로 절반 분할
const totalFiles = files.length;
if (part === 1) {
  files = files.slice(0, Math.ceil(totalFiles / 2));
} else if (part === 2) {
  files = files.slice(Math.ceil(totalFiles / 2));
}

// 파일 내용을 JSON으로 수집
const fileMap = {};
for (const filePath of files) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  fileMap[rel] = fs.readFileSync(filePath, "utf8");
}

const count = Object.keys(fileMap).length;
const date = new Date().toISOString();
const partLabel = part ? ` (${part}/2파트)` : "";

process.stderr.write(`\n✓ ${count}개 파일 포함됨${partLabel} (${date})\n집 컴퓨터: cat > apply.mjs → 붙여넣기 → Ctrl+D → node apply.mjs\n\n`);

console.log(`#!/usr/bin/env node
// ============================================================
// Stride Sync Script - ${date}${partLabel}
// 파일 수: ${count}개 (전체 ${totalFiles}개 중)
// ------------------------------------------------------------
// 집 컴퓨터 사용법:
//   1. 이 텍스트 전체를 복사
//   2. 터미널에서: cat > apply.mjs
//   3. 붙여넣기 후 Ctrl+D
//   4. node apply.mjs
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const FILES = ${JSON.stringify(fileMap, null, 2)};

let written = 0;
for (const [rel, content] of Object.entries(FILES)) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  let existing = null;
  try { existing = fs.readFileSync(full, "utf8"); } catch {}
  if (existing === content) {
    console.log("  = " + rel + " (변경 없음)");
  } else {
    fs.writeFileSync(full, content, "utf8");
    console.log("  ✓ " + rel);
    written++;
  }
}
console.log("\\n완료: " + written + "개 파일 업데이트됨");
if (written > 0) console.log("⚠  개발 서버를 재시작하세요.");
`);
