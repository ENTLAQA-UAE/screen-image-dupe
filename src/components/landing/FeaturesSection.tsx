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

// Shared mockup shell
const MockupShell = ({ feature, children }: { feature: typeof features[0]; children: React.ReactNode }) => (
  <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${feature.gradientLight} border border-border/30 p-5 lg:p-6 aspect-[4/3] flex flex-col`}>
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
    {/* Window chrome */}
    <div className="relative z-10 flex items-center gap-2.5 mb-4 pb-3 border-b border-foreground/[0.06]">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="flex-1 h-5 bg-white/50 rounded-md max-w-[180px]" />
    </div>
    <div className="relative z-10 flex-1 flex flex-col">{children}</div>
  </div>
);

// — AI Assessment Builder —
const BuilderMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    {/* Toolbar */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`px-2.5 py-1 rounded-md bg-gradient-to-r ${feature.gradient} text-white text-[9px] font-bold flex items-center gap-1`}>
          <Sparkles className="w-3 h-3" /> Generate with AI
        </div>
        <div className="h-5 w-px bg-foreground/10" />
        <div className="text-[9px] text-muted-foreground/60 font-medium">Draft</div>
      </div>
      <div className="flex gap-1.5">
        <div className="w-6 h-6 rounded-md bg-white border border-border/30 flex items-center justify-center">
          <Zap className="w-3 h-3 text-foreground/30" />
        </div>
      </div>
    </div>
    {/* Question cards */}
    <div className="flex-1 space-y-2">
      {[
        { num: 1, text: "Describe a time you handled conflict...", type: "SJT" },
        { num: 2, text: "Rate your agreement: 'I prefer struc...", type: "Likert" },
        { num: 3, text: "Which pattern completes the seque...", type: "Cognitive" },
      ].map((q) => (
        <div key={q.num} className="bg-white rounded-lg p-3 shadow-sm border border-border/20 flex items-start gap-2.5">
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${feature.gradient} text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
            {q.num}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-foreground/70 leading-snug truncate">{q.text}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[8px] px-1.5 py-0.5 rounded bg-${feature.accentColor}-100 text-${feature.accentColor}-700 font-semibold`}>{q.type}</span>
              <div className="flex gap-1">
                <div className="h-1 w-8 rounded-full bg-foreground/[0.06]" />
                <div className="h-1 w-5 rounded-full bg-foreground/[0.06]" />
              </div>
            </div>
          </div>
          <div className="w-4 h-4 rounded border border-border/30 shrink-0 mt-0.5" />
        </div>
      ))}
    </div>
    {/* Bottom bar */}
    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-foreground/[0.06]">
      <div className="flex items-center gap-3">
        <span className="text-[9px] text-muted-foreground/60">3 of 24 questions</span>
        <div className="w-20 h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${feature.gradient} w-[12%]`} />
        </div>
      </div>
      <div className={`px-3 py-1 rounded-md bg-gradient-to-r ${feature.gradient} text-white text-[9px] font-semibold`}>Save</div>
    </div>
  </MockupShell>
);

// — Multiple Assessment Types —
const TypesMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    <div className="grid grid-cols-3 gap-2 flex-1">
      {[
        { icon: Brain, name: "Cognitive", tag: "IQ & Logic", color: "bg-sky-500" },
        { icon: Users, name: "Personality", tag: "Big Five", color: "bg-violet-500" },
        { icon: FileText, name: "SJT", tag: "Competency", color: "bg-amber-500" },
        { icon: Globe2, name: "Language", tag: "EN / AR", color: "bg-emerald-500" },
        { icon: BarChart3, name: "Behavioral", tag: "DESC Model", color: "bg-rose-500" },
        { icon: Sparkles, name: "Custom", tag: "AI-Built", color: "bg-indigo-500" },
      ].map((t) => (
        <div key={t.name} className="bg-white rounded-xl p-3 shadow-sm border border-border/20 flex flex-col items-center text-center gap-1.5 hover:shadow-md transition-shadow">
          <div className={`w-9 h-9 rounded-lg ${t.color}/10 flex items-center justify-center`}>
            <t.icon className={`w-4.5 h-4.5 ${t.color.replace('bg-', 'text-')}`} />
          </div>
          <p className="text-[11px] font-semibold text-foreground/80">{t.name}</p>
          <span className="text-[8px] text-muted-foreground/60 font-medium">{t.tag}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-2.5 border-t border-foreground/[0.06] flex items-center justify-between">
      <span className="text-[9px] text-muted-foreground/60">6 categories available</span>
      <div className="flex items-center gap-1 text-[9px] text-sky-600 font-medium">
        Browse all <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  </MockupShell>
);

// — Bilingual EN/AR —
const BilingualMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    {/* Language toggle */}
    <div className="flex items-center justify-center gap-1 mb-3">
      <div className={`px-3 py-1 rounded-l-md bg-gradient-to-r ${feature.gradient} text-white text-[9px] font-bold`}>English</div>
      <div className="px-3 py-1 rounded-r-md bg-white border border-border/30 text-[9px] font-bold text-foreground/60">العربية</div>
    </div>
    {/* Side-by-side preview */}
    <div className="flex-1 grid grid-cols-2 gap-2.5">
      {/* English side */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-border/20 flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center">
            <span className="text-[7px] font-bold text-emerald-600">EN</span>
          </div>
          <span className="text-[9px] font-semibold text-foreground/70">Question 1</span>
        </div>
        <p className="text-[10px] text-foreground/60 leading-relaxed mb-auto">How do you handle workplace disagreements with peers?</p>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-emerald-400" />
            <div className="h-1.5 bg-foreground/[0.06] rounded-full flex-1" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-foreground/10" />
            <div className="h-1.5 bg-foreground/[0.06] rounded-full w-4/5" />
          </div>
        </div>
      </div>
      {/* Arabic side */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-border/20 flex flex-col" dir="rtl">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center">
            <span className="text-[7px] font-bold text-emerald-600">AR</span>
          </div>
          <span className="text-[9px] font-semibold text-foreground/70">السؤال ١</span>
        </div>
        <p className="text-[10px] text-foreground/60 leading-relaxed mb-auto font-arabic">كيف تتعامل مع الخلافات في بيئة العمل مع زملائك؟</p>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-emerald-400" />
            <div className="h-1.5 bg-foreground/[0.06] rounded-full flex-1" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-foreground/10" />
            <div className="h-1.5 bg-foreground/[0.06] rounded-full w-4/5" />
          </div>
        </div>
      </div>
    </div>
    <div className="mt-3 pt-2.5 border-t border-foreground/[0.06] flex items-center justify-center gap-4">
      <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1">✓ Full RTL layout</span>
      <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1">✓ AI translation</span>
    </div>
  </MockupShell>
);

// — Assessment Groups —
const GroupsMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    {/* Campaign header */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`} />
        <span className="text-[10px] font-semibold text-foreground/70">Q2 Hiring Campaign</span>
      </div>
      <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Active</span>
    </div>
    {/* Participant rows */}
    <div className="flex-1 space-y-1.5">
      {[
        { name: "Engineering Batch", invited: 32, done: 28, pct: 87 },
        { name: "Sales Team A", invited: 18, done: 12, pct: 67 },
        { name: "Leadership Pool", invited: 8, done: 8, pct: 100 },
        { name: "Graduate Intake", invited: 45, done: 19, pct: 42 },
      ].map((g) => (
        <div key={g.name} className="bg-white rounded-lg px-3 py-2 shadow-sm border border-border/20 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground/75 truncate">{g.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${g.pct === 100 ? 'bg-green-500' : `bg-gradient-to-r ${feature.gradient}`}`} style={{ width: `${g.pct}%` }} />
              </div>
              <span className={`text-[8px] font-bold ${g.pct === 100 ? 'text-green-600' : 'text-foreground/50'}`}>{g.pct}%</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-muted-foreground/50">{g.done}/{g.invited}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-2.5 border-t border-foreground/[0.06] flex items-center justify-between">
      <span className="text-[9px] text-muted-foreground/60">103 total participants</span>
      <div className="flex -space-x-1.5">
        {['bg-indigo-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400'].map((c, i) => (
          <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white`} />
        ))}
        <div className="w-5 h-5 rounded-full bg-foreground/10 border-2 border-white flex items-center justify-center text-[7px] text-foreground/50 font-bold">+4</div>
      </div>
    </div>
  </MockupShell>
);

// — Unified Employee Profiles —
const ProfilesMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    {/* Profile header */}
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>SA</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-foreground/80">Sarah Al-Rashidi</p>
        <p className="text-[9px] text-muted-foreground/60">Senior Engineer · 8 assessments</p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">A+</span>
      </div>
    </div>
    {/* Skill bars */}
    <div className="bg-white rounded-xl p-3 shadow-sm border border-border/20 flex-1 flex flex-col gap-2">
      {[
        { skill: "Cognitive Ability", score: 92, color: "bg-indigo-500" },
        { skill: "Leadership", score: 88, color: "bg-violet-500" },
        { skill: "Problem Solving", score: 95, color: "bg-sky-500" },
        { skill: "Communication", score: 78, color: "bg-emerald-500" },
        { skill: "Emotional IQ", score: 85, color: "bg-amber-500" },
      ].map((s) => (
        <div key={s.skill} className="flex items-center gap-2">
          <span className="text-[9px] text-foreground/60 w-[90px] truncate shrink-0">{s.skill}</span>
          <div className="flex-1 h-2 bg-foreground/[0.05] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${s.color}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${s.score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <span className="text-[9px] font-bold text-foreground/60 w-7 text-right">{s.score}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-2.5 border-t border-foreground/[0.06] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3 h-3 text-green-500" />
        <span className="text-[9px] text-green-600 font-medium">+12% since last quarter</span>
      </div>
      <span className="text-[9px] text-muted-foreground/50">Last assessed 2d ago</span>
    </div>
  </MockupShell>
);

// — Enterprise Security —
const SecurityMockup = ({ feature }: { feature: typeof features[0] }) => (
  <MockupShell feature={feature}>
    {/* Security status header */}
    <div className="bg-white rounded-xl p-3 shadow-sm border border-border/20 mb-2.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
        <Shield className="w-5 h-5 text-green-600" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-foreground/80">All Systems Secure</p>
        <p className="text-[8px] text-green-600 font-medium">No threats detected</p>
      </div>
      <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    </div>
    {/* Security features grid */}
    <div className="flex-1 grid grid-cols-2 gap-2">
      {[
        { icon: Lock, label: "AES-256", desc: "Encryption", status: "Active" },
        { icon: Users, label: "RBAC", desc: "Access Control", status: "Enforced" },
        { icon: Shield, label: "Tenant", desc: "Isolation", status: "Enabled" },
        { icon: FileText, label: "UUID", desc: "Secure Links", status: "Active" },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-lg p-2.5 shadow-sm border border-border/20">
          <div className="flex items-center justify-between mb-1.5">
            <s.icon className="w-3.5 h-3.5 text-foreground/30" />
            <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">{s.status}</span>
          </div>
          <p className="text-[10px] font-semibold text-foreground/75">{s.label}</p>
          <p className="text-[8px] text-muted-foreground/50">{s.desc}</p>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-2.5 border-t border-foreground/[0.06] flex items-center justify-center gap-4">
      <span className="text-[8px] text-muted-foreground/50">🔒 SOC 2 Type II</span>
      <span className="text-[8px] text-muted-foreground/50">🛡️ GDPR Compliant</span>
      <span className="text-[8px] text-muted-foreground/50">✓ ISO 27001</span>
    </div>
  </MockupShell>
);

// Route to the right mockup per feature type
const MockupPanel = ({ feature }: { feature: typeof features[0] }) => {
  switch (feature.mockup.type) {
    case 'builder':   return <BuilderMockup feature={feature} />;
    case 'types':     return <TypesMockup feature={feature} />;
    case 'bilingual': return <BilingualMockup feature={feature} />;
    case 'groups':    return <GroupsMockup feature={feature} />;
    case 'profiles':  return <ProfilesMockup feature={feature} />;
    case 'security':  return <SecurityMockup feature={feature} />;
    default:          return <BuilderMockup feature={feature} />;
  }
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
