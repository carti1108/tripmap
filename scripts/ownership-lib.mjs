// 소유표(ownership.json) 해석 — check-scope.mjs 와 .claude/hooks/guard-scope.mjs 가 함께 쓴다.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

export function loadOwnership(root) {
  return JSON.parse(readFileSync(join(root, "ownership.json"), "utf8"));
}

const matches = (file, p) => (p.endsWith("/") ? file.startsWith(p) : file === p);

/** 파일의 주인: "po" | "design" | "fe" | "be" | "shared" | null(미등록) */
export function ownerOf(file, own) {
  let best = null, len = -1;
  for (const [role, r] of Object.entries(own.roles)) {
    for (const p of r.paths) if (matches(file, p) && p.length > len) { best = role; len = p.length; }
  }
  for (const p of own.shared.paths) if (matches(file, p) && p.length > len) { best = "shared"; len = p.length; }
  return best;
}

export const isFrozen = (file, own) => own.frozen.includes(file);

export function currentBranch(root) {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  try { return execSync("git rev-parse --abbrev-ref HEAD", { cwd: root }).toString().trim(); } catch { return ""; }
}

/** CLAUDE.local.md 의 "ROLE: fe" 줄에서 역할을 읽는다 */
export function localRole(root) {
  const f = join(root, "CLAUDE.local.md");
  if (!existsSync(f)) return null;
  const m = readFileSync(f, "utf8").match(/^ROLE:\s*(po|design|fe|be)\b/m);
  return m ? m[1] : null;
}

export function roleFromBranch(branch, own) {
  for (const [role, r] of Object.entries(own.roles)) if (branch.startsWith(r.branch)) return role;
  if (branch.startsWith(own.shared.branch)) return "shared";
  return null;
}

/**
 * 이 역할(또는 chore 브랜치)이 이 파일을 고쳐도 되나?
 * @returns {{ok: boolean, warn?: string, reason?: string}}
 */
export function canEdit(file, role, branch, own) {
  const owner = ownerOf(file, own);
  const onChore = branch.startsWith(own.shared.branch);
  if (isFrozen(file, own)) {
    return onChore
      ? { ok: true, warn: `${file} 은 원본 보존(FROZEN) 파일 — PO 승인 필요` }
      : { ok: false, reason: `${file} 은 원본 보존(FROZEN) 파일입니다. 감싸거나 복제해서 src/components/trip/ 에 만드세요.` };
  }
  if (owner === null) return { ok: false, reason: `${file} 은 ownership.json 에 주인이 없습니다. chore/ 브랜치에서 소유표에 먼저 추가하세요.` };
  if (onChore) {
    return owner === "shared" || owner === role
      ? { ok: true }
      : { ok: true, warn: `${file} 의 주인은 ${owner} — 그 사람 리뷰 필요` };
  }
  if (owner === role) return { ok: true };
  if (owner === "shared") return { ok: false, reason: `${file} 은 공용 설정 파일입니다. chore/<내용> 브랜치를 따로 만들어 작은 PR로 올리세요.` };
  const o = own.roles[owner];
  return { ok: false, reason: `${file} 의 주인은 ${o.title}(${o.github}) 입니다. 직접 고치지 말고 이슈나 PR 코멘트로 요청하세요.` };
}
