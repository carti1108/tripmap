# CLAUDE.md — 트릭 오어 트립 (Trick or Trip) (tripmap)

이 저장소는 **4명이 각자 Claude와 함께** 작업한다. 너(Claude)는 지금 이 중 **한 사람의 역할**로 일한다.
다른 사람 영역을 건드리면 Git 충돌이 나니, 아래 순서를 반드시 지켜라.

## 0. 작업 시작 전 (매번)

1. **내 역할 확인** — 루트의 `CLAUDE.local.md`(각자 PC에만 있고 커밋 안 됨) 첫 줄 `ROLE: po | design | fe | be` 를 읽는다.
   - 파일이 없으면 사용자에게 "PO / 디자이너 / 개발자 A(프론트) / 개발자 B(서버·AI) 중 누구세요?"라고 묻고,
     `docs/roles/local-examples/` 의 해당 예시를 복사해 `CLAUDE.local.md` 로 만든다.
2. **내 역할 문서 읽기** — `ownership.json` 의 `roles.<ROLE>.doc` (예: `docs/roles/dev-a-frontend.md`).
   거기 있는 할 일 ID(FE-1, BE-3 …)와 "내가 고칠 수 있는 경로"만 작업 대상이다.
3. **PRD 확인** — `docs/PRD.md`. 요구사항 ID(FR-·BR-·NFR-)와 상태(CONFIRMED/PROPOSED…)를 지킨다.
   PROPOSED·UNDECIDED 항목을 확정된 것처럼 구현하지 말고, 애매하면 사용자에게 묻는다.
4. **최신화** — `git fetch origin && git rebase origin/main` (내 브랜치 위에서).

## 1. 역할과 경로 (요약 — 정본은 `ownership.json`)

| ROLE | 사람 | 브랜치 접두어 | 고칠 수 있는 경로 |
|---|---|---|---|
| `po` | 신종원 | `po/` | `docs/`, `content/`, `README.md` |
| `design` | 디자이너 | `ds/` | `design/`, `public/characters/` |
| `fe` | 개발자 A (프론트·지도) | `fe/` | `src/app/`(api 제외), `src/components/`, `src/lib/client/`, `public/`(characters 제외) |
| `be` | 개발자 B @carti1108 (서버·Gemini·카카오) | `be/` | `src/app/api/`, `src/lib/server/`, `src/lib/contracts/`, `src/mocks/` |
| (공용) | 누구나, 단 별도 PR | `chore/` | `package.json`, lockfile, 설정 파일, `.github/`, `.claude/`, `scripts/`, `ownership.json`, 이 파일 |

- **원본 보존(FROZEN)**: `src/components/ui/ai-prompt-box.tsx` — 고치지 말고 `src/components/trip/` 에서 감싸거나 복제.
- 내 경로 밖을 고쳐야 하면: **고치지 말고** 사용자에게 "이건 ○○ 담당이라 이슈/요청으로 넘기자"고 말하고, 요청 문안을 써 준다.
- `.claude/hooks/guard-scope.mjs` 가 역할 밖 Edit/Write 를 자동으로 막는다. 막히면 우회(Bash로 sed 등)하지 말 것.

## 2. 작업 흐름

```
git switch -c <접두어>/<할일ID>-<짧은설명>   # 예: fe/FE-5-kakao-map
… 작업 …
npm run scope      # 내 역할 경로만 바뀌었는지
npm run build      # 코드 바꿨으면
git commit -m "FE-5: 카카오맵 마커 표시"     # 커밋 메시지 앞에 할일 ID
git push -u origin HEAD  → PR (템플릿 체크리스트 채우기)
```

- PR은 작게(300줄 이하), 하루 1번 이상 main 반영. Squash merge 후 브랜치 삭제.
- 커밋·push·PR은 사용자가 요청할 때만.

## 3. A·B 사이 약속 (충돌 없이 병렬로 가는 핵심)

- 화면 ↔ 서버의 모양은 **`src/lib/contracts/`** 타입이 정한다. B 소유, 바꾸면 A 리뷰 필수, **필드 추가만** 허용.
- B는 `src/mocks/` 와 목업 `/api/chat` 을 먼저 제공 → A는 실제 Gemini·카카오 없이 화면을 만든다.
- 색은 `design/tokens.css` 의 CSS 변수만 쓴다 (HEX 직접 금지). 토큰이 필요하면 디자이너에게 요청.

## 4. 기술 메모

- Next.js 16 (App Router) + TypeScript + Tailwind 4, 모바일 우선 430px, Vercel 배포
- 키: `NEXT_PUBLIC_KAKAO_JS_KEY`(브라우저, 도메인 제한) / `KAKAO_REST_API_KEY`·`GEMINI_API_KEY`(서버 전용, 개발자 B 보유). `.env.local` 은 커밋 금지
- 카카오 로컬 API는 사진·평점·영업시간을 주지 않고, **응답 저장 금지**(실시간 호출만). AI는 카카오 검색 결과·이벤트 목록 안에서만 추천(BR-001)
- 할로윈 이벤트는 PO가 `content/halloween-events.json` 에 큐레이션(기간·출처 필수). 실제 폐가·출입금지 장소는 추천 금지(BR-005), 혼잡 거리 안내(BR-006)
- 서버 코드는 `import "server-only"` 로 브라우저 번들에 섞이지 않게
