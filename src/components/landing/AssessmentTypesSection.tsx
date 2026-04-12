import { motion } from "framer-motion";
import {
  Brain,
  Heart,
  Users,
  MessageSquare,
  Languages,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const assessmentTypes = [
  {
    icon: Brain,
    title: "Cognitive Assessment",
    description:
      "Measure numerical, verbal, logical, spatial, and memory abilities with configurable difficulty levels.",
    features: ["Custom subdomains", "Difficulty distribution", "Auto-calculated duration"],
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Heart,
    title: "Personality & Psychometric",
    description:
      "Big Five-like and DISC-like personality profiles with trait-based scoring and Likert scales.",
    features: ["Multiple personality models", "Trait-based analysis", "Flexible response scales"],
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Behavioral (FBA-Style)",
    description:
      "Assess workplace behaviors across domains like antecedents, behaviors, consequences, and frequency.",
    features: ["Behavior domains", "Frequency analysis", "Workplace context"],
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    icon: MessageSquare,
    title: "Situational Judgment (SJT)",
    description:
      "Job-relevant scenarios measuring decision-making, teamwork, and leadership competencies.",
    features: ["Role-specific scenarios", "Competency mapping", "Ranking options"],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Languages,
    title: "Language Assessment",
    description:
      "Test grammar, vocabulary, and reading comprehension with CEFR-aligned proficiency bands.",
    features: ["Multi-skill testing", "Proficiency levels", "EN & AR support"],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Lightbulb,
    title: "Custom Profiles",
    description:
      "Build generic quizzes or profile assessments like DESC with custom scales and traits.",
    features: ["Flexible structure", "Custom scoring", "Reusable templates"],
    gradient: "from-purple-500 to-fuchsia-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const AssessmentTypesSection = () => {
  return (
    <section id="assessments" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-cta/10 text-cta text-sm font-semibold mb-4">
            Assessment Types
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground mb-6">
            Scientific Assessments,{" "}
            <span className="text-gradient-gold">Built by AI</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from pre-built assessment types or create custom profiles.
            AI generates questions, scoring logic, and interpretive reports.
          </p>
        </motion.div>

        {/* Assessment Types Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {assessmentTypes.map((type) => (
            <motion.div
              key={type.title}
              variants={itemVariants}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Icon with gradient background */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-5 shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {type.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button variant="default" size="lg" className="shadow-md">
            Explore All Assessment Types
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
