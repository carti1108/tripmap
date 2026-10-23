# 역할: 개발자 A — 프론트엔드·지도  (ROLE: fe · 브랜치 fe/…)

## 고칠 수 있는 경로
`src/app/` (단, `src/app/api/` 제외) · `src/components/` · `src/lib/client/` · `public/` (단, `public/characters/` 제외)

## 읽기만 하는 것
- `src/lib/contracts/` — 서버 응답 모양. 바꿀 게 있으면 개발자 B에게 요청(또는 B 브랜치 PR에 코멘트)
- `src/mocks/` — B가 준 목업. 실제 API 전까지 이걸로 화면 개발
- `design/tokens.css` — 색은 CSS 변수만 (`var(--pumpkin)`), HEX 직접 금지
- `src/components/ui/ai-prompt-box.tsx` — 원본 보존(FROZEN). 감싸거나 복제해서 `src/components/trip/` 에

## 할 일 (PRD v0.3 §15.3)
| ID | 할 일 | 관련 |
|---|---|---|
| FE-1 | (완료) 프로젝트 세팅·원본 채팅바 | FR-001 |
| FE-2 | 채팅바 래퍼: 토글 오싹/이벤트/쉬어가기(구조·애니메이션 유지), 테마 토큰, `toggles` 전달 | FR-002 |
| FE-3 | S1 홈: 달 그라데이션, D-day, 예시 칩(`content/example-chips.json` import), 캐릭터 | FR-010 |
| FE-4 | S2 결과: 코스 카드, 이벤트 카드(기간·남은 기간 배지), 장소 카드 — `src/mocks/` 로 먼저 | FR-006~008 |
| FE-5 | 카카오맵 SDK 로더(`autoload=false` + `kakao.maps.load`, 클라이언트 전용), 종류별 마커, 코스 폴리라인, 카드↔마커 | FR-009 |
| FE-6 | 지도 실패 폴백, `prefers-reduced-motion`, 접근성 | NFR-004·006 |
| FE-7 | 찜·내 코스(localStorage, try/catch)·공유 링크 | FR-012 |

## 환경
`.env.local` 에 `NEXT_PUBLIC_KAKAO_JS_KEY` 만 (개발자 B에게 받기). REST·Gemini 키는 필요 없다.

## Claude에게 시킬 때
- 새 패키지가 필요하면: 지금 브랜치에 넣지 말고 `chore/deps-<이름>` 브랜치로 따로 PR.
- 서버 응답에 필드가 더 필요하면: 계약 파일을 고치지 말고 B에게 보낼 요청 문안을 만든다.
