"use client";
/**
 * 찜·내 코스 (FR-012) — 기기(localStorage)에만 저장.
 * OQ-006(카카오 정책) 확인 전이라 카카오 장소의 id·이름·종류만 저장한다. 주소·좌표는 저장하지 않는다.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { PlaceKind } from "@/lib/contracts";

export interface SavedPlace {
  id: string;
  name: string;
  kind: PlaceKind;
}

const KEY = "trip:favorites:v1";
const EVENT = "trip:favorites";
const EMPTY: SavedPlace[] = [];

let cache: { raw: string | null; list: SavedPlace[] } = { raw: null, list: EMPTY };

function read(): SavedPlace[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.list;
  let list: SavedPlace[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter(isSavedPlace);
  } catch {
    list = EMPTY;
  }
  cache = { raw, list };
  return list;
}

function isSavedPlace(v: unknown): v is SavedPlace {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.kind === "string";
}

export function writeFavorites(list: SavedPlace[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 사파리 개인정보 보호 모드 등 — 저장 못 해도 화면은 동작
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((p: SavedPlace) => {
    const cur = read();
    writeFavorites(cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [...cur, p]);
  }, []);

  const move = useCallback((index: number, delta: -1 | 1) => {
    const cur = [...read()];
    const to = index + delta;
    if (to < 0 || to >= cur.length) return;
    [cur[index], cur[to]] = [cur[to], cur[index]];
    writeFavorites(cur);
  }, []);

  const remove = useCallback((id: string) => writeFavorites(read().filter((x) => x.id !== id)), []);

  return { list, has: (id: string) => list.some((x) => x.id === id), toggle, move, remove };
}

/** 공유 링크용 — 목록을 URL 쿼리 문자열로 */
export function encodeCourse(list: SavedPlace[]) {
  const json = JSON.stringify(list.map(({ id, name, kind }) => [id, name, kind]));
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeCourse(s: string): SavedPlace[] {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const rows: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r): r is [string, string, string] => Array.isArray(r) && r.length === 3 && r.every((x) => typeof x === "string"))
      .filter(([, , kind]) => ["spooky", "event", "food", "cafe"].includes(kind))
      .slice(0, 20)
      .map(([id, name, kind]) => ({ id, name: name.slice(0, 80), kind: kind as PlaceKind }));
  } catch {
    return [];
  }
}
