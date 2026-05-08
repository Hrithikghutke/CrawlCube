import { Suspense } from "react";
import BuildPage from "@/components/builder/html/BuildPage";

export default function Build() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
          <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BuildPage />
    </Suspense>
  );
}
