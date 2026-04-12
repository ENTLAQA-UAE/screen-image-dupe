import { motion } from "framer-motion";
import { Sparkles, Send, BarChart3, Users } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Sparkles,
    title: "Create Assessment",
    description: "Use AI to generate cognitive tests, personality profiles, or custom quizzes in English or Arabic. Just describe what you need.",
  },
  {
    step: "02",
    icon: Send,
    title: "Launch Campaign",
    description: "Create assessment groups, add participants, and generate secure unique links. Set start/end dates and track in real-time.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Analyze Results",
    description: "View completion rates, score distributions, and AI-generated narrative insights. Export PDFs and data for stakeholders.",
  },
  {
    step: "04",
    icon: Users,
    title: "Build Profiles",
    description: "Aggregate all assessment history into unified employee profiles. Make informed promotion, selection, and development decisions.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-1/2 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/3 h-96 bg-highlight/5 rounded-full blur-3xl" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
            From Idea to Insight
            <br />
            <span className="text-gradient-gold">in Four Steps</span>
          </h2>
          <p className="text-lg text-primary-foreground/70">
            Jadarat Assess streamlines the entire assessment lifecycle — 
            from creation to analysis.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-16 right-16 h-0.5 bg-gradient-to-r from-accent/50 via-highlight/50 to-accent/50" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="relative z-10 w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-6 shadow-glow">
                  <step.icon className="w-5 h-5 text-accent-foreground" />
                </div>

                {/* Step Label */}
                <span className="text-accent font-display font-bold text-sm tracking-wider mb-2 block">
                  STEP {step.step}
                </span>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-primary-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-primary-foreground/70 leading-relaxed text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
