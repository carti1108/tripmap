/** S4 내 할로윈 코스 — FE-7 */
import { Suspense } from "react";
import { MyCourse } from "@/components/trip/my-course";

export const metadata = { title: "내 할로윈 코스 · 트릭 오어 트립" };

export default function Page() {
  return (
    <Suspense>
      <MyCourse />
    </Suspense>
  );
}
