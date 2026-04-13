import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    description: "Perfect for small teams getting started with structured assessments.",
    features: [
      "Up to 50 assessments/month",
      "3 assessment types",
      "Basic analytics dashboard",
      "Email support",
      "5 team members",
      "CSV data export",
    ],
    cta: "Start Free Trial",
    tier: "starter" as const,
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 66,
    description: "For growing organizations that need advanced assessment capabilities.",
    features: [
      "Unlimited assessments",
      "All 6 assessment types",
      "AI-powered question generation",
      "Advanced analytics & reports",
      "25 team members",
      "API access",
      "Priority support",
    ],
    cta: "Start Free Trial",
    tier: "professional" as const,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: "For large organizations with custom security and compliance needs.",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "Custom branding & white-label",
      "SSO & SAML integration",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    tier: "enterprise" as const,
  },
];

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-section-pricing">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-4 border border-amber-500/20">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-white/50">
            Choose the plan that fits your organization. All plans include a
            14-day free trial with no credit card required.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <span className={`text-sm font-medium transition-colors duration-200 ${
            !isAnnual ? "text-white" : "text-white/40"
          }`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              isAnnual ? "bg-indigo-500" : "bg-white/20"
            }`}
            aria-label="Toggle annual billing"
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors duration-200 ${
            isAnnual ? "text-white" : "text-white/40"
          }`}>
            Annual
            <span className="ml-1.5 text-xs text-emerald-400 font-semibold">Save 17%</span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {tiers.map((tier, index) => {
            const isProfessional = tier.tier === "professional";
            const isEnterprise = tier.tier === "enterprise";

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isProfessional
                    ? "bg-white shadow-2xl shadow-indigo-500/10 scale-[1.02]"
                    : isEnterprise
                      ? "bg-gradient-to-br from-amber-500/[0.12] to-amber-600/[0.06] backdrop-blur-md border border-amber-500/20 hover:border-amber-400/40"
                      : "bg-white/[0.06] backdrop-blur-md border border-white/10 hover:bg-white/[0.1]"
                }`}
              >
                {/* Popular Badge */}
                {tier.badge && (
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-center text-xs font-semibold py-2">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    {tier.badge}
                  </div>
                )}

                {/* Enterprise Crown Badge */}
                {isEnterprise && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center text-xs font-semibold py-2">
                    <Crown className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    Premium
                  </div>
                )}

                <div className={`p-8 ${tier.badge || isEnterprise ? "" : "pt-8"}`}>
                  {/* Tier Name */}
                  <h3 className={`font-display text-xl mb-2 ${
                    isProfessional ? "text-foreground" : isEnterprise ? "text-amber-300" : "text-white"
                  }`}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-4">
                    {tier.monthlyPrice !== null ? (
                      <>
                        <span className={`text-4xl font-display ${
                          isProfessional ? "text-foreground" : "text-white"
                        }`}>
                          ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                        </span>
                        <span className={`text-sm ${
                          isProfessional ? "text-muted-foreground" : "text-white/40"
                        }`}>/month</span>
                      </>
                    ) : (
                      <span className={`text-4xl font-display ${
                        isEnterprise ? "text-white" : "text-white"
                      }`}>Custom</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-sm mb-8 leading-relaxed ${
                    isProfessional ? "text-muted-foreground" : isEnterprise ? "text-white/60" : "text-white/50"
                  }`}>
                    {tier.description}
                  </p>

                  {/* CTA Button */}
                  <Link to={isEnterprise ? "#" : "/auth"}>
                    <Button
                      variant={isProfessional ? "cta" : "outline"}
                      size="lg"
                      className={`w-full ${
                        isEnterprise
                          ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-400/60"
                          : !isProfessional
                            ? "border-white/20 text-white hover:bg-white/10 hover:text-white"
                            : ""
                      }`}
                    >
                      {isEnterprise && <Crown className="w-4 h-4 mr-2" />}
                      {tier.cta}
                    </Button>
                  </Link>

                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isProfessional ? "text-success" : isEnterprise ? "text-amber-400" : "text-emerald-400"
                        }`} />
                        <span className={isProfessional ? "text-foreground" : "text-white/70"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
