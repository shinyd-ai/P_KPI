#!/usr/bin/env node
/**
 * stride-import.mjs
 * Simplenote에서 복사한 텍스트 블록을 파일로 복원합니다.
 *
 * 사용법:
 *   1. Simplenote에서 전체 내용 복사
 *   2. 아래 명령 실행 후 프롬프트에 붙여넣고 엔터 두 번 + Ctrl+D
 *      node scripts/stride-import.mjs
 *
 *   또는 파일로 저장한 경우:
 *      node scripts/stride-import.mjs < sync.txt
 *
 *   또는 특정 파일만 가져오기:
 *      node scripts/stride-import.mjs --only "app/weekly/page.tsx,lib/claude.ts"
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// --only 옵션 파싱
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyFiles = onlyArg
  ? new Set(onlyArg.replace("--only=", "").split(",").map((s) => s.trim()))
  : null;

// stdin 전체 읽기
async function readStdin() {
  const rl = readline.createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join("\n");
}

function parseBlocks(text) {
  const blocks = {};
  const beginRegex = /<<<BEGIN:(.+?)>>>/g;
  let match;

  while ((match = beginRegex.exec(text)) !== null) {
    const relPath = match[1];
    const startIdx = match.index + match[0].length + 1; // +1 for newline
    const endMarker = `<<<END:${relPath}>>>`;
    const endIdx = text.indexOf(endMarker, startIdx);
    if (endIdx === -1) continue;
    const content = text.slice(startIdx, endIdx - 1); // -1 to trim trailing newline
    blocks[relPath] = content;
  }

  return blocks;
}

async function main() {
  console.error("📋 Simplenote에서 복사한 텍스트를 붙여넣고 Ctrl+D를 누르세요...\n");

  const text = await readStdin();

  if (!text.includes("STRIDE_SYNC_EXPORT")) {
    console.error("❌ 올바른 Stride 내보내기 형식이 아닙니다.");
    process.exit(1);
  }

  const blocks = parseBlocks(text);
  const entries = Object.entries(blocks);

  if (entries.length === 0) {
    console.error("❌ 파일 블록을 찾을 수 없습니다.");
    process.exit(1);
  }

  let written = 0;
  let skipped = 0;

  for (const [relPath, content] of entries) {
    if (onlyFiles && !onlyFiles.has(relPath)) {
      skipped++;
      continue;
    }

    const fullPath = path.join(ROOT, relPath);
    const dir = path.dirname(fullPath);

    // 디렉토리 생성
    fs.mkdirSync(dir, { recursive: true });

    // 기존 파일과 비교 (변경된 경우만 쓰기)
    let existing = null;
    try {
      existing = fs.readFileSync(fullPath, "utf8");
    } catch {}

    if (existing === content) {
      console.error(`  = ${relPath} (변경 없음)`);
      skipped++;
    } else {
      fs.writeFileSync(fullPath, content, "utf8");
      console.error(`  ✓ ${relPath}`);
      written++;
    }
  }

  console.error(`\n✓ 완료: ${written}개 파일 업데이트, ${skipped}개 건너뜀`);
  if (written > 0) {
    console.error("⚠  npm install 후 개발 서버를 재시작하세요.");
  }
}

main().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
