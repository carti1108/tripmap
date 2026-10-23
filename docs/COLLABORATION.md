# 협업 규칙 — Git 충돌 없이 4명이 같이 일하기

## 왜 충돌이 나나
같은 파일의 같은 줄을 두 사람이 동시에 고치면 충돌이 난다. 그래서 **파일마다 주인을 한 명으로** 정했다.
주인이 아닌 사람은 그 파일을 고치지 않고 요청만 한다. 이것만 지키면 충돌은 거의 안 난다.

## 1. 처음 한 번 (각자)

```bash
git clone https://github.com/carti1108/tripmap.git
cd tripmap
npm install
cp docs/roles/local-examples/<내역할>.md CLAUDE.local.md   # po / design / fe / be 중 하나
cp .env.example .env.local                                  # 개발자만, 키는 개발자 B에게 받기(JS 키만)
```

`CLAUDE.local.md` 는 `.gitignore` 에 있어서 커밋되지 않는다. Claude Code는 이 파일을 자동으로 읽어서 "나는 어떤 역할"인지 안다.

## 2. 경로 주인

정본은 `ownership.json`. 가장 긴 경로가 이긴다.

| 경로 | 주인 |
|---|---|
| `docs/`, `content/`, `README.md` | PO (신종원) |
| `design/`, `public/characters/` | 디자이너 |
| `src/app/`, `src/components/`, `src/lib/client/`, `public/` | 개발자 A |
| `src/app/api/`, `src/lib/server/`, `src/lib/contracts/`, `src/mocks/` | 개발자 B (@carti1108) |
| `package.json`, lockfile, 설정, `.github/`, `.claude/`, `scripts/`, `ownership.json`, `CLAUDE.md` | 공용 — `chore/` 브랜치로만 |
| `src/components/ui/ai-prompt-box.tsx` | 원본 보존(FROZEN) |

## 3. 브랜치

| 접두어 | 누가 | 예 |
|---|---|---|
| `po/` | PO | `po/PO-4-keywords` |
| `ds/` | 디자이너 | `ds/DS-1-tokens` |
| `fe/` | 개발자 A | `fe/FE-5-kakao-map` |
| `be/` | 개발자 B | `be/BE-1-places-api` |
| `chore/` | 누구나 (공용 파일) | `chore/deps-add-zod` |

- `main` 에 직접 push 금지. 모든 변경은 PR.
- 하루 시작할 때 `git fetch origin && git rebase origin/main`.
- PR은 300줄 이하, Squash merge, 머지 후 브랜치 삭제.

## 4. 자주 겹치는 파일 처리법

| 파일 | 규칙 |
|---|---|
| `package.json` / `package-lock.json` | 패키지 추가는 `chore/deps-<이름>` 브랜치에서 그것만 담아 PR. lockfile 충돌이 나면 **손으로 고치지 말고** `git checkout origin/main -- package-lock.json && npm install` |
| `src/lib/contracts/*` | 개발자 B 소유. 필드 **추가만**. 이름 변경·삭제는 PO 승인 + A·B 동시 PR |
| `design/tokens.css` | 디자이너만. 개발자는 변수만 사용. 새 색이 필요하면 디자이너에게 이슈 |
| `docs/PRD.md` | PO만. 다른 사람은 PR 코멘트나 이슈로 제안 |
| `.env.local` | 커밋 금지. REST·Gemini 키는 개발자 B만 보관 (Vercel 환경변수) |

## 5. 자동 안전장치

1. **Claude 훅** (`.claude/hooks/guard-scope.mjs`): Claude Code가 내 역할 밖 파일을 Edit/Write 하려고 하면 막고 이유를 알려 준다.
2. **로컬 검사**: `npm run scope` — 내 브랜치 변경 파일이 내 경로 안인지 확인.
3. **CI** (`.github/workflows/scope-check.yml`): PR마다 범위 검사 + `npm run build`.
4. **CODEOWNERS**: 경로 주인이 자동으로 리뷰어로 지정된다.

## 6. PO가 GitHub에서 한 번 해 줄 설정

1. Settings → Collaborators: 디자이너·개발자 A 초대 (Write 권한)
2. `.github/CODEOWNERS` 와 `ownership.json` 의 `@PO_GITHUB_ID` 등 자리표시를 실제 아이디로 (`chore/codeowners` PR)
3. Settings → Branches → `main` 보호 규칙: Require a pull request · Require review from Code Owners · Require status checks(`scope`, `build`) · 직접 push 금지

## 7. 다른 사람 영역을 고쳐야 할 때

고치지 말고 이슈를 연다. 제목 예: `[요청→디자이너] 볼거리 마커 선택 상태 색 토큰 필요`.
Claude에게 "이건 ○○ 담당이니 요청 이슈 문안 써 줘"라고 하면 된다.
