import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { NearbyCafesSection } from "@/components/landing/nearby-cafes-section";
import { SecureSharingSection } from "@/components/landing/secure-sharing-section";
import { AccessControlSection } from "@/components/landing/access-control-section";
import { PrintingSection } from "@/components/landing/printing-section";
import { SecuritySection } from "@/components/landing/security-section";
import { AiAssistantSection } from "@/components/landing/ai-assistant-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <NearbyCafesSection />
      <FeaturesSection />
      <SecureSharingSection />
      <AccessControlSection />
      <PrintingSection />
      <SecuritySection />
      <AiAssistantSection />
      <HowItWorksSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
