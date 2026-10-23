#!/usr/bin/env node
// 내 브랜치가 내 역할 경로만 건드렸는지 검사. 로컬: npm run scope / CI: .github/workflows/scope-check.yml
// 사용: node scripts/check-scope.mjs [--base origin/main] [--role fe]
import { execSync } from "node:child_process";
import { loadOwnership, currentBranch, roleFromBranch, localRole, canEdit } from "./ownership-lib.mjs";
// localRole: 브랜치 역할과 CLAUDE.local.md 역할이 다르면 경고용

const root = execSync("git rev-parse --show-toplevel").toString().trim();
const own = loadOwnership(root);
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const base = arg("--base") || process.env.SCOPE_BASE || "origin/main";
const branch = currentBranch(root);

const byBranch = roleFromBranch(branch, own);
const role = arg("--role") || (byBranch === "shared" ? null : byBranch);

if (!byBranch) {
  console.error(`✖ 브랜치 이름 "${branch}" 이 규칙에 안 맞습니다. po/ ds/ fe/ be/ chore/ 중 하나로 시작하세요.`);
  process.exit(1);
}
const mine = localRole(root);
if (mine && byBranch !== "shared" && mine !== byBranch) console.warn(`⚠ CLAUDE.local.md 역할(${mine})과 브랜치 역할(${byBranch})이 다릅니다.`);
if (byBranch !== "shared" && role !== byBranch) {
  console.error(`✖ 브랜치(${byBranch})와 내 역할(${role})이 다릅니다. 내 역할의 브랜치에서 작업하세요.`);
  process.exit(1);
}

const sh = (c) => execSync(c, { cwd: root }).toString().split("\n").filter(Boolean);
let files;
try {
  files = new Set([
    ...sh(`git diff --name-only ${base}...HEAD`),
    ...(process.env.CI ? [] : [...sh("git diff --name-only"), ...sh("git diff --name-only --cached"), ...sh("git ls-files --others --exclude-standard")]),
  ]);
} catch {
  console.error(`✖ ${base} 를 찾을 수 없습니다. git fetch origin 후 다시 실행하세요.`);
  process.exit(1);
}

let bad = 0;
for (const f of files) {
  const r = canEdit(f, role ?? "shared", branch, own);
  if (!r.ok) { bad++; console.error(`✖ ${r.reason}`); }
  else if (r.warn) console.warn(`⚠ ${r.warn}`);
}
if (bad) { console.error(`\n범위 밖 파일 ${bad}개. 되돌리거나 주인에게 요청하세요.`); process.exit(1); }
console.log(`✔ 범위 검사 통과 — 브랜치 ${branch}, 역할 ${role ?? "chore"}, 변경 파일 ${files.size}개`);
