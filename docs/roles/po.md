# 역할: PO — 신종원  (ROLE: po · 브랜치 po/…)

## 고칠 수 있는 경로
`docs/` · `content/` · `README.md`
그 밖의 파일은 고치지 않는다. 필요하면 담당자에게 이슈로 요청.

## 할 일 (PRD v0.3 §15.1)
| ID | 할 일 | 산출물 위치 |
|---|---|---|
| PO-1 | OQ-012(출시일)·OQ-003(이벤트 출처)·OQ-010(흉가 범위)·OQ-013(이름) 결정 → PRD 갱신 | `docs/PRD.md`, `docs/decisions/` |
| PO-2 | GitHub: 팀원 초대, main 보호 규칙, CODEOWNERS 아이디 채우기(이건 `chore/codeowners` 브랜치) | GitHub 설정 |
| PO-3 | Gemini 월 예산을 개발자 B와 합의 | `docs/decisions/` |
| PO-4 | 할로윈 이벤트 시트 30~50건 (기간·출처 필수) | `content/halloween-events.json` |
| PO-5 | 공포체험 검색 키워드·예시 칩 | `content/spooky-keywords.json`, `content/example-chips.json` |
| PO-6 | 매일 이벤트 출처 링크 점검 | `content/halloween-events.json` |
| PO-7 | QA 30질문 → 출시 판단 | `docs/qa/` |

## Claude에게 시킬 때
- "PO-4 이벤트 시트에 ○○ 이벤트 추가해 줘" → 형식은 `src/lib/contracts/place.ts` 의 `HalloweenEvent`. 출처 URL·기간 없는 건 넣지 않는다.
- 결정을 내리면 `docs/decisions/YYYY-MM-DD-주제.md` 한 장 + `docs/PRD.md` 상태(CONFIRMED) 갱신.
- PRD를 바꾸면 PR 설명에 바뀐 ID를 적어 팀이 볼 수 있게.
