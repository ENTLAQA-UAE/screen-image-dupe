import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Globe2,
  Users,
  BarChart3,
  Shield,
  CheckCircle2,
  Zap,
  FileText,
  TrendingUp,
  Lock,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Assessment Builder",
    description:
      "Generate professional assessments in minutes with AI. From cognitive tests to personality profiles — no psychometrics expertise needed.",
    highlights: ["AI-powered generation", "Multiple question types", "Auto-scoring logic"],
    gradient: "from-indigo-600 to-violet-600",
    gradientLight: "from-indigo-500/20 to-violet-500/10",
    accentColor: "indigo",
    // Mock dashboard elements
    mockup: {
      type: "builder" as const,
      stats: [
        { label: "Questions", value: "24" },
        { label: "Duration", value: "45m" },
        { label: "Score", value: "Auto" },
      ],
    },
  },
  {
    icon: Brain,
    title: "Multiple Assessment Types",
    description:
      "Cognitive, personality, behavioral, SJT, language assessments, and custom profiles like DESC — all scientifically grounded.",
    highlights: ["6 assessment categories", "Scientific frameworks", "Custom profiles"],
    gradient: "from-sky-600 to-cyan-600",
    gradientLight: "from-sky-500/20 to-cyan-500/10",
    accentColor: "sky",
    mockup: {
      type: "types" as const,
      stats: [
        { label: "Cognitive", value: "IQ" },
        { label: "Personality", value: "Big5" },
        { label: "SJT", value: "Comp" },
      ],
    },
  },
  {
    icon: Globe2,
    title: "Bilingual EN/AR",
    description:
      "Full Arabic and English support with RTL layouts. AI generates content in both languages for truly localized experiences.",
    highlights: ["Full RTL support", "AI bilingual generation", "Localized UI"],
    gradient: "from-emerald-600 to-teal-600",
    gradientLight: "from-emerald-500/20 to-teal-500/10",
    accentColor: "emerald",
    mockup: {
      type: "bilingual" as const,
      stats: [
        { label: "English", value: "EN" },
        { label: "العربية", value: "AR" },
        { label: "RTL", value: "✓" },
      ],
    },
  },
  {
    icon: Users,
    title: "Assessment Groups",
    description:
      "Run assessment campaigns per cohort with time-bound groups, unique participant links, and real-time tracking.",
    highlights: ["Campaign management", "Unique secure links", "Real-time tracking"],
    gradient: "from-amber-600 to-orange-600",
    gradientLight: "from-amber-500/20 to-orange-500/10",
    accentColor: "amber",
    mockup: {
      type: "groups" as const,
      stats: [
        { label: "Active", value: "12" },
        { label: "Invited", value: "86" },
        { label: "Done", value: "64%" },
      ],
    },
  },
  {
    icon: BarChart3,
    title: "Unified Employee Profiles",
    description:
      "Aggregate all assessment history per employee. Make informed promotion, selection, and development decisions.",
    highlights: ["360° assessment view", "Historical tracking", "Decision support"],
    gradient: "from-rose-600 to-pink-600",
    gradientLight: "from-rose-500/20 to-pink-500/10",
    accentColor: "rose",
    mockup: {
      type: "profiles" as const,
      stats: [
        { label: "Tests", value: "8" },
        { label: "Score", value: "87%" },
        { label: "Rank", value: "A+" },
      ],
    },
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant isolation, role-based access, and secure UUID-based assessment links for every participant.",
    highlights: ["Multi-tenant isolation", "Role-based access", "Secure links"],
    gradient: "from-slate-700 to-slate-900",
    gradientLight: "from-slate-500/20 to-slate-800/10",
    accentColor: "slate",
    mockup: {
      type: "security" as const,
      stats: [
        { label: "Encrypted", value: "AES" },
        { label: "RBAC", value: "✓" },
        { label: "SOC2", value: "✓" },
      ],
    },
  },
];

// Mini dashboard mockup component
const MockupPanel = ({ feature }: { feature: typeof features[0] }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${feature.gradientLight} border border-border/30 p-6 lg:p-8 aspect-[4/3] flex flex-col`}>
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Top bar mockup */}
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 h-5 bg-white/60 rounded-md" />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col gap-3">
        {/* Stat cards row */}
        <div className="grid grid-cols-3 gap-2">
          {feature.mockup.stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-2.5 shadow-sm border border-border/20">
              <p className="text-[10px] text-muted-foreground/70 truncate">{stat.label}</p>
              <p className="text-sm font-bold text-foreground/80">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Content lines */}
        <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-border/20 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
              <feature.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="h-2.5 bg-foreground/10 rounded-full flex-1 max-w-[120px]" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-foreground/[0.06] rounded-full w-full" />
            <div className="h-2 bg-foreground/[0.06] rounded-full w-4/5" />
            <div className="h-2 bg-foreground/[0.06] rounded-full w-3/5" />
          </div>
          {/* Progress bar */}
          <div className="pt-1">
            <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${feature.gradient} w-2/3`} />
            </div>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex gap-2">
          <div className={`h-7 rounded-md bg-gradient-to-r ${feature.gradient} flex-1 flex items-center justify-center`}>
            <div className="h-1.5 bg-white/50 rounded-full w-12" />
          </div>
          <div className="h-7 rounded-md bg-white border border-border/30 w-16 flex items-center justify-center">
            <div className="h-1.5 bg-foreground/10 rounded-full w-8" />
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-white text-[10px] font-semibold shadow-lg`}>
          AI
        </div>
      </div>
    </div>
  );
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 lg:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
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
        <div className="space-y-12 lg:space-y-24 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const isReversed = index % 2 !== 0;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                } items-center gap-8 lg:gap-16`}
              >
                {/* Visual / Mockup Side */}
                <div className="flex-1 w-full">
                  <MockupPanel feature={feature} />
                </div>

                {/* Text Side */}
                <div className="flex-1 w-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base lg:text-lg mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-sm text-foreground/80">
                        <CheckCircle2 className={`w-4 h-4 text-${feature.accentColor}-500 flex-shrink-0`} />
                        <span>{h}</span>
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
