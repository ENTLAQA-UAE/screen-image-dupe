import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AssessmentTypesSection } from "@/components/landing/AssessmentTypesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Qudurat | AI-Powered Employee Assessment Platform</title>
        <meta
          name="description"
          content="Design, launch, and analyze employee assessments with AI. Cognitive tests, personality profiles, SJT, and more in English and Arabic. Enterprise-ready."
        />
        <meta name="keywords" content="employee assessment, HR software, talent management, cognitive testing, personality assessment, enterprise SaaS" />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Dark hero */}
        <Navbar />
        <HeroSection />

        {/* White trust bar */}
        <TrustBar />

        {/* White — alternating feature blocks */}
        <FeaturesSection />

        {/* Light gray — card grid */}
        <AssessmentTypesSection />

        {/* Dark — steps */}
        <HowItWorksSection />

        {/* White — testimonials */}
        <TestimonialsSection />

        {/* Dark — pricing */}
        <PricingSection />

        {/* Light gray — security */}
        <SecuritySection />

        {/* White with gradient banner */}
        <CTASection />

        {/* Dark navy footer */}
        <Footer />
      </main>
    </>
  );
};

export default Index;
