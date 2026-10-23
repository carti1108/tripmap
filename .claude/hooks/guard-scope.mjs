#!/usr/bin/env node
// Claude Code PreToolUse 훅: Claude가 내 역할 밖 파일을 Edit/Write 하려 하면 막는다 (exit 2).
// 역할은 각자 만드는 CLAUDE.local.md 의 "ROLE: fe" 줄로 정한다. (docs/COLLABORATION.md)
import { relative, isAbsolute, resolve } from "node:path";
import { loadOwnership, currentBranch, localRole, canEdit } from "../../scripts/ownership-lib.mjs";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const data = JSON.parse(input || "{}");
const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
const target = data.tool_input?.file_path || data.tool_input?.notebook_path;
if (!target) process.exit(0);

const abs = isAbsolute(target) ? target : resolve(root, target);
const file = relative(root, abs).split("\\").join("/");
if (file.startsWith("..")) process.exit(0); // 프로젝트 밖은 관여 안 함
if (file === "CLAUDE.local.md") process.exit(0); // 내 역할 파일은 언제나 수정 가능

const own = loadOwnership(root);
const role = localRole(root);
if (!role) {
  console.error("역할이 설정되지 않았습니다. 프로젝트 루트에 CLAUDE.local.md 를 만들고 첫 줄에 'ROLE: po|design|fe|be' 를 적어 주세요. 예시는 docs/roles/local-examples/ 에 있습니다. 사용자에게 어떤 역할인지 물어보세요.");
  process.exit(2);
}
const r = canEdit(file, role, currentBranch(root), own);
if (!r.ok) { console.error(`[역할 범위 밖 · ROLE=${role}] ${r.reason}`); process.exit(2); }
if (r.warn) console.error(`[주의] ${r.warn}`);
process.exit(0);
