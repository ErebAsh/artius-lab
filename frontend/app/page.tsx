"use client";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Steps from "./components/Steps";
import FAQ from "./components/FAQ";

export default function Home() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <Hero />

      <Features />

      <Steps />

      <FAQ />

      <div style={{ height: 100 }} />
    </div>
  );
}
