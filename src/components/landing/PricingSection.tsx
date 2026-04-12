import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
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
    variant: "outline" as const,
    highlighted: false,
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
    variant: "cta" as const,
    highlighted: true,
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
    variant: "default" as const,
    highlighted: false,
  },
];

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cta/5 rounded-full blur-3xl" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-cta/10 text-cta text-sm font-semibold mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
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
          <span
            className={`text-sm font-medium transition-smooth ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              isAnnual ? "bg-primary" : "bg-muted"
            }`}
            aria-label="Toggle annual billing"
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium transition-smooth ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs text-success font-semibold">Save 17%</span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl border ${
                tier.highlighted
                  ? "border-primary shadow-glow"
                  : "border-border/50 shadow-card"
              } bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5">
                  {tier.badge}
                </div>
              )}

              <div className={`p-8 ${tier.badge ? "pt-12" : ""}`}>
                {/* Tier Name */}
                <h3 className="font-display text-xl text-foreground mb-2">
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-4">
                  {tier.monthlyPrice !== null ? (
                    <>
                      <span className="text-4xl font-display text-foreground">
                        ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-display text-foreground">Custom</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  {tier.description}
                </p>

                {/* CTA Button */}
                <Link to={tier.name === "Enterprise" ? "#" : "/dashboard"}>
                  <Button
                    variant={tier.variant}
                    size="lg"
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
