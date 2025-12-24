import { motion } from "framer-motion";
import { 
  Brain, 
  Heart, 
  Users, 
  MessageSquare, 
  Languages, 
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const assessmentTypes = [
  {
    icon: Brain,
    title: "Cognitive Assessment",
    description: "Measure numerical, verbal, logical, spatial, and memory abilities with configurable difficulty levels.",
    features: ["Custom subdomains", "Difficulty distribution", "Auto-calculated duration"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Personality & Psychometric",
    description: "Big Five-like and DISC-like personality profiles with trait-based scoring and Likert scales.",
    features: ["Multiple personality models", "Trait-based analysis", "Flexible response scales"],
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Behavioral (FBA-Style)",
    description: "Assess workplace behaviors across domains like antecedents, behaviors, consequences, and frequency.",
    features: ["Behavior domains", "Frequency analysis", "Workplace context"],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    title: "Situational Judgment (SJT)",
    description: "Job-relevant scenarios measuring decision-making, teamwork, and leadership competencies.",
    features: ["Role-specific scenarios", "Competency mapping", "Ranking options"],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Languages,
    title: "Language Assessment",
    description: "Test grammar, vocabulary, and reading comprehension with CEFR-aligned proficiency bands.",
    features: ["Multi-skill testing", "Proficiency levels", "EN & AR support"],
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Lightbulb,
    title: "Custom Profiles",
    description: "Build generic quizzes or profile assessments like DESC with custom scales and traits.",
    features: ["Flexible structure", "Custom scoring", "Reusable templates"],
    gradient: "from-teal-500 to-cyan-500",
  },
];

export const AssessmentTypesSection = () => {
  return (
    <section id="assessments" className="py-24 gradient-subtle relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-highlight/10 text-highlight text-sm font-semibold mb-4">
            Assessment Types
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Scientific Assessments,
            <br />
            <span className="text-gradient-gold">Built by AI</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from pre-built assessment types or create custom profiles. 
            AI generates questions, scoring logic, and interpretive reports.
          </p>
        </motion.div>

        {/* Assessment Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300">
                {/* Icon with Gradient */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${type.gradient}`}>
                  <type.icon className="w-6 h-6 text-primary-foreground" />
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
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button variant="hero" size="lg">
            Explore All Assessment Types
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
