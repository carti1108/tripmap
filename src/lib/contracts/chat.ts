/**
 * 공유 계약(CONTRACT) — /api/chat 요청·응답.
 * 소유: 개발자 B (@carti1108) / 변경 시 개발자 A 리뷰 필수. 필드 추가만 허용.
 */
import type { ChatToggle, Course, Recommendation } from "./place";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ChatRequest {
  message: string;
  /** 채팅바 토글 (비어 있으면 AI가 판단) */
  toggles: ChatToggle[];
  history: ChatTurn[];
  /** "내 주변" 선택 시에만 (서버에 저장하지 않음, NFR-005) */
  location?: { lat: number; lng: number };
}

/** 지역 등을 안 말했을 때 되묻기 */
export interface ClarifyReply {
  type: "clarify";
  text: string;
  options: string[];
}

export interface ResultReply {
  type: "result";
  text: string;
  center: { lat: number; lng: number };
  items: Recommendation[];
  course?: Course;
  /** BR-006 혼잡 안내 등 */
  notices?: string[];
}

export interface ErrorReply {
  type: "error";
  code: "RATE_LIMITED" | "KAKAO_QUOTA" | "NO_RESULT" | "OUT_OF_SCOPE" | "UNSAFE_PLACE" | "UPSTREAM";
  text: string;
}

export type ChatResponse = ClarifyReply | ResultReply | ErrorReply;
