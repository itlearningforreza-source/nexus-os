import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Modules } from "@/components/landing/modules";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar />
      <Hero />
      <Features />
      <Modules />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
