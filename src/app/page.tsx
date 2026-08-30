import type { Metadata } from "next";
import { LandingClient } from "@/components/landing/landing-client";

export const metadata: Metadata = { title: "Listening & Reading Practice" };

export default function LandingPage() {
  return <LandingClient />;
}
