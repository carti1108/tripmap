# 역할: 디자이너  (ROLE: design · 브랜치 ds/…)

## 고칠 수 있는 경로
`design/` · `public/characters/`
화면 코드(`src/`)는 고치지 않는다. 색은 **토큰으로만** 개발에 전달한다.

## 할 일 (PRD v0.3 §15.2)
| ID | 할 일 | 산출물 위치 |
|---|---|---|
| DS-1 | 할로윈 토큰 확정 + 대비 4.5:1 검사 | `design/tokens.css` |
| DS-2 | "떠오르는 달" 그라데이션 시안 | `design/tokens.css` (`--trip-gradient`), `design/specs/` |
| DS-3 | 캐릭터 자체 제작: 고양이(안내)·유령(로딩)·호박(이벤트)·도토리(쉬어가기), 상태별 6~8컷 | `public/characters/*.png|svg` |
| DS-4 | S1 홈 · S2 결과(코스 카드) · S3 지도 시안 | `design/specs/S1-home.md` 등 (Figma 링크 + 치수) |
| DS-5 | 채팅바 리테마·토글 3종(오싹/이벤트/쉬어가기) 아이콘 | `design/specs/chatbar.md` |
| DS-6 | 마커 4종 + 코스 번호·선 스타일 | `design/specs/map-markers.md`, `public/characters/` 또는 토큰 |

## 규칙
- 토큰 이름을 바꾸거나 지우면 개발 화면이 깨진다 → **추가만** 하고, 바꿀 땐 개발자 A에게 먼저 알림.
- 레퍼런스 이미지(제3자 작품)는 `public/`에 넣지 않는다. `design/references/README.md` 참고.
- 파일 이름은 영어 소문자-하이픈 (`ghost-loading.png`).

## Claude에게 시킬 때
- "DS-1 대비 검사해 줘" → 토큰 조합별 대비비 표를 `design/specs/contrast.md` 로.
- "시안 스펙 정리해 줘" → `design/specs/` 에 화면 ID 기준 마크다운.
