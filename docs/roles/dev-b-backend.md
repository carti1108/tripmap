# 역할: 개발자 B — 서버·AI(Gemini)·카카오 REST — @carti1108  (ROLE: be · 브랜치 be/…)

## 고칠 수 있는 경로
`src/app/api/` · `src/lib/server/` · `src/lib/contracts/` · `src/mocks/`

## 읽기만 하는 것
- `content/halloween-events.json`, `content/spooky-keywords.json` — PO 데이터. 서버에서 import 해서 쓴다
- `docs/PRD.md` — BR(정책)·FR·예외 E1~E8

## 계약 관리 (중요)
- `src/lib/contracts/` 는 A와의 약속. **필드 추가만**, 바꾸면 PR에 A를 리뷰어로.
- 계약을 바꾸면 `src/mocks/` 도 같은 PR에서 맞춰 준다 (A 화면이 안 깨지게).

## 할 일 (PRD v0.3 §15.4)
| ID | 할 일 | 관련 |
|---|---|---|
| BE-0 | 카카오맵 사용 설정 확인, JS 키 도메인(localhost:3000·Vercel) 등록, **JS 키만** A에게 공유 | §3.1 |
| BE-1 | `/api/places`: 키워드·카테고리 검색 프록시 (`src/lib/server/kakao.ts`) | FR-005 |
| BE-2 | 이벤트 로더: 기간(오늘~요청일)·지역 필터, 기간·출처 없는 건 제외 (+P1 TourAPI) | FR-007, BR-002 |
| BE-3 | Gemini ① 의도 추출 JSON (지역·날짜·인원·아이 동반·공포 강도) | FR-003 |
| BE-4 | Gemini ② 후보 ID 안에서만 선택 + 코스(2~4) + 한 줄, 서버 ID 검증, BR-005 폐가 거절·BR-006 혼잡 안내·BR-007 아이 동반 | FR-005·006 |
| BE-5 | `/api/chat` 오케스트레이션 + 예외(429·0건·UNSAFE_PLACE) | §10 |
| BE-6 | 도보 경로 API로 `walkMinutes` | FR-013 |
| BE-7 | 요청 제한, Vercel 배포·환경변수 | BR-008 |

## 키
`.env.local` 에 `KAKAO_REST_API_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY`. 커밋 금지. 서버 파일 맨 위 `import "server-only"`.

## Claude에게 시킬 때
- 카카오 응답은 저장·DB화 금지(실시간 호출만). 캐시는 정책 확인 전엔 쓰지 않는다.
- 새 패키지(예: `@google/genai`)는 `chore/deps-gemini` 브랜치로 따로 PR.
