import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Globe2,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Assessment Builder",
    description:
      "Generate professional assessments in minutes with AI. From cognitive tests to personality profiles — no psychometrics expertise needed.",
    highlights: ["AI-powered generation", "Multiple question types", "Auto-scoring logic"],
    color: "from-indigo-500 to-violet-500",
    bgLight: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: Brain,
    title: "Multiple Assessment Types",
    description:
      "Cognitive, personality, behavioral, SJT, language assessments, and custom profiles like DESC — all scientifically grounded.",
    highlights: ["6 assessment categories", "Scientific frameworks", "Custom profiles"],
    color: "from-sky-500 to-cyan-500",
    bgLight: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    icon: Globe2,
    title: "Bilingual EN/AR",
    description:
      "Full Arabic and English support with RTL layouts. AI generates content in both languages for truly localized experiences.",
    highlights: ["Full RTL support", "AI bilingual generation", "Localized UI"],
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Users,
    title: "Assessment Groups",
    description:
      "Run assessment campaigns per cohort with time-bound groups, unique participant links, and real-time tracking.",
    highlights: ["Campaign management", "Unique secure links", "Real-time tracking"],
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: BarChart3,
    title: "Unified Employee Profiles",
    description:
      "Aggregate all assessment history per employee. Make informed promotion, selection, and development decisions.",
    highlights: ["360° assessment view", "Historical tracking", "Decision support"],
    color: "from-rose-500 to-pink-500",
    bgLight: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant isolation, role-based access, and secure UUID-based assessment links for every participant.",
    highlights: ["Multi-tenant isolation", "Role-based access", "Secure links"],
    color: "from-slate-600 to-slate-800",
    bgLight: "bg-slate-50",
    iconColor: "text-slate-600",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Assess at Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From AI-powered assessment creation to comprehensive analytics —
            Qudurat gives HR teams the tools to make data-driven talent decisions.
          </p>
        </motion.div>

        {/* Alternating Feature Blocks */}
        <div className="space-y-24 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const isReversed = index % 2 !== 0;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                } items-center gap-12 lg:gap-16`}
              >
                {/* Visual / Mockup Side */}
                <div className="flex-1 w-full">
                  <div className={`relative ${feature.bgLight} rounded-2xl p-8 lg:p-12 aspect-[4/3] flex items-center justify-center overflow-hidden`}>
                    {/* Gradient accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-[0.07]`} />
                    {/* Icon display */}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                      <div className={`w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center`}>
                        <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
                      </div>
                      {/* Feature highlights as chips */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {feature.highlights.map((h) => (
                          <span
                            key={h}
                            className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground shadow-sm border border-border/50"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div className="flex-1 w-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-sm text-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`} />
                        {h}
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
