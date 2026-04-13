import { motion } from "framer-motion";
import { Sparkles, Send, BarChart3, Users } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Sparkles,
    title: "Create Assessment",
    description:
      "Use AI to generate cognitive tests, personality profiles, or custom quizzes in English or Arabic. Just describe what you need.",
  },
  {
    step: "02",
    icon: Send,
    title: "Launch Campaign",
    description:
      "Create assessment groups, add participants, and generate secure unique links. Set start/end dates and track in real-time.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Analyze Results",
    description:
      "View completion rates, score distributions, and AI-generated narrative insights. Export PDFs and data for stakeholders.",
  },
  {
    step: "04",
    icon: Users,
    title: "Build Profiles",
    description:
      "Aggregate all assessment history into unified employee profiles. Make informed promotion, selection, and development decisions.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-section-dark">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-1/2 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/3 h-96 bg-amber-500/5 rounded-full blur-3xl" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-semibold mb-4 backdrop-blur-sm border border-white/10">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white mb-6">
            From Idea to Insight{" "}
            <span className="text-gradient-gold">in Four Steps</span>
          </h2>
          <p className="text-lg text-white/60">
            Qudurat streamlines the entire assessment lifecycle —
            from creation to analysis.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-[72px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-gradient-to-r from-indigo-500/40 via-amber-500/40 to-indigo-500/40" />

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
                {/* Glass Card */}
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-6 hover:bg-white/[0.1] transition-all duration-300">
                  {/* Step Number Circle */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Step Label */}
                  <span className="text-amber-400 font-display text-xs tracking-widest mb-2 block uppercase">
                    Step {step.step}
                  </span>

                  {/* Content */}
                  <h3 className="text-lg font-display font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
