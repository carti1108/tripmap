/**
 * Gemini 호출 — 소유: 개발자 B. 서버 전용.
 * ① 의도 추출(JSON 구조화 출력) ② 큐레이션(카카오 결과 ID 안에서만 선택) — PRD §8.1
 * 키: GEMINI_API_KEY (서버 환경변수)
 */
import "server-only";

export async function extractIntent(_message: string): Promise<unknown> {
  // TODO(BE-2)
  throw new Error("not implemented");
}

export async function curate(_candidates: unknown): Promise<unknown> {
  // TODO(BE-3)
  throw new Error("not implemented");
}
