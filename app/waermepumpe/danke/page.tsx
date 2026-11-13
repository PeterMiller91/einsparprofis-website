import type { Metadata } from "next";
import { Suspense } from "react";
import DankeClient from "./DankeClient";

// Separate thank-you page so ad platforms (Facebook) can count a lead as conversion
export const metadata: Metadata = {
  title: "Danke – wir melden uns | Einsparprofis",
  robots: { index: false, follow: false },
};

export default function WaermepumpeDankePage() {
  return (
    <Suspense fallback={null}>
      <DankeClient />
    </Suspense>
  );
}
