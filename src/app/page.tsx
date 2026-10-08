import { GridVisibilitySection } from "@/components/landing/grid-visibility-section";
import { HeroSection } from "@/components/landing/hero-section";
import { OperationalFlowStrip } from "@/components/landing/operational-flow-strip";
import { PlatformMetrics } from "@/components/landing/platform-metrics";
import { ReliabilitySection } from "@/components/landing/reliability-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--ps-background)]">
      <SiteNavbar />

      <HeroSection />

      <PlatformMetrics />

      <OperationalFlowStrip />

      <GridVisibilitySection />

      <ReliabilitySection />

      <SiteFooter />
    </main>
  );
}
