"use client";
/**
 * 카카오맵 Web SDK 로더 (FE-5) — autoload=false 로 스크립트를 받고 kakao.maps.load 로 초기화.
 * 클라이언트에서만 호출한다. 키가 없거나 로드에 실패하면 reject → 화면은 리스트로 폴백(NFR-006).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    kakao?: any;
  }
}

const SDK_ID = "kakao-map-sdk";
const TIMEOUT_MS = 8000;
let pending: Promise<any> | null = null;

export function loadKakaoMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  if (pending) return pending;

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY 가 없어요"));

  pending = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => fail(new Error("카카오맵 로드 시간 초과")), TIMEOUT_MS);
    function fail(err: Error) {
      window.clearTimeout(timer);
      pending = null;
      document.getElementById(SDK_ID)?.remove();
      reject(err);
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.onerror = () => fail(new Error("카카오맵 스크립트를 불러오지 못했어요"));
    script.onload = () => {
      if (!window.kakao?.maps) return fail(new Error("카카오맵 초기화 실패 (도메인 등록 확인)"));
      window.kakao.maps.load(() => {
        window.clearTimeout(timer);
        resolve(window.kakao);
      });
    };
    document.head.appendChild(script);
  });
  return pending;
}

/** 카카오맵 앱/웹 길찾기 링크 */
export function directionsUrl(name: string, lat: string, lng: string) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}
