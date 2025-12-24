import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AssessmentTypesSection } from "@/components/landing/AssessmentTypesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Jadarat Assess | AI-Powered Employee Assessment Platform</title>
        <meta 
          name="description" 
          content="Design, launch, and analyze employee assessments with AI. Cognitive tests, personality profiles, SJT, and more in English and Arabic. Enterprise-ready." 
        />
        <meta name="keywords" content="employee assessment, HR software, talent management, cognitive testing, personality assessment, enterprise SaaS" />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <AssessmentTypesSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
};

export default Index;
