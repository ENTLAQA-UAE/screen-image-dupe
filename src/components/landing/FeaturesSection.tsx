import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  Users, 
  BarChart3, 
  Globe2, 
  Shield, 
  Zap, 
  FileText 
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Assessment Builder",
    description: "Generate professional assessments in minutes with AI. From cognitive tests to personality profiles — no psychometrics expertise needed.",
    color: "accent",
  },
  {
    icon: Brain,
    title: "Multiple Assessment Types",
    description: "Cognitive, personality, behavioral, SJT, language assessments, and custom profiles like DESC — all scientifically grounded.",
    color: "highlight",
  },
  {
    icon: Globe2,
    title: "Bilingual EN/AR",
    description: "Full Arabic and English support with RTL layouts. AI generates content in both languages for truly localized experiences.",
    color: "success",
  },
  {
    icon: Users,
    title: "Assessment Groups",
    description: "Run assessment campaigns per cohort with time-bound groups, unique participant links, and real-time tracking.",
    color: "accent",
  },
  {
    icon: BarChart3,
    title: "Unified Employee Profiles",
    description: "Aggregate all assessment history per employee. Make informed promotion, selection, and development decisions.",
    color: "highlight",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Multi-tenant isolation, role-based access, and secure UUID-based assessment links for every participant.",
    color: "success",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Everything You Need to
            <br />
            <span className="text-gradient">Assess at Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From AI-powered assessment creation to comprehensive analytics — 
            Jadarat Assess gives HR teams the tools to make data-driven talent decisions.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="h-full p-8 rounded-2xl bg-card border border-border/50 shadow-elegant hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${
                    feature.color === "accent"
                      ? "bg-accent/10 text-accent"
                      : feature.color === "highlight"
                      ? "bg-highlight/10 text-highlight"
                      : "bg-success/10 text-success"
                  }`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Accent */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    feature.color === "accent"
                      ? "gradient-accent"
                      : feature.color === "highlight"
                      ? "gradient-gold"
                      : "bg-success"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
