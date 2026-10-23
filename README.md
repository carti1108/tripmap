# 트릭 오어 트립 (Trick or Trip) (tripmap)

할로윈 시즌에만 열리는 공포체험·이벤트·테마 공간을 채팅으로 찾고, 카카오맵 위에 "오싹한 하루 코스"로 이어 주는 서비스.

- 기획: [`docs/PRD.md`](docs/PRD.md) (v0.3) — 구 이름 "가을이오면"
- 협업 규칙: [`docs/COLLABORATION.md`](docs/COLLABORATION.md) ← **처음이면 이것부터**
- 역할별 할 일: [`docs/roles/`](docs/roles/)
- Claude 안내: [`CLAUDE.md`](CLAUDE.md)

| 역할 | 사람 | 브랜치 |
|---|---|---|
| PO | 신종원 | `po/` |
| 디자이너 | — | `ds/` |
| 개발자 A (프론트·지도) | — | `fe/` |
| 개발자 B (서버·Gemini·카카오) | @carti1108 | `be/` |

## 시작
```bash
npm install
cp docs/roles/local-examples/<po|design|fe|be>.md CLAUDE.local.md
cp .env.example .env.local   # 개발자만
npm run dev                  # http://localhost:3000 (지금은 목업 응답)
npm run scope                # 내 역할 범위 검사
```

스택: Next.js 16 · TypeScript · Tailwind 4 · Kakao Maps/Local API · Gemini · Vercel
