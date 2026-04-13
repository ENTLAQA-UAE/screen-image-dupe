import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Qudurat transformed how we evaluate candidates. The AI-generated assessments saved our HR team dozens of hours per hiring cycle, and the bilingual support was a game-changer for our regional offices.",
    name: "Sarah Al-Rashid",
    title: "VP of Human Resources",
    company: "TechCorp International",
    initials: "SA",
    color: "bg-indigo-500",
  },
  {
    quote:
      "The depth of analytics blew us away. We went from gut-feel decisions to data-driven talent strategies in weeks. The cognitive and personality assessments are scientifically rigorous yet easy to deploy.",
    name: "James Chen",
    title: "Chief People Officer",
    company: "FinanceHub Group",
    initials: "JC",
    color: "bg-sky-500",
  },
  {
    quote:
      "Rolling out assessments across 12 government agencies used to take months. With Qudurat, we launched standardized competency evaluations in days. The enterprise security features gave our compliance team full confidence.",
    name: "Dr. Layla Mansour",
    title: "Director of Talent Development",
    company: "GovServe Solutions",
    initials: "LM",
    color: "bg-emerald-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground mb-6">
            What Our Clients Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Organizations around the world trust Qudurat to power their
            assessment and talent management programs.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-muted/20 border border-border/40 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-foreground/80 leading-relaxed mb-8 flex-1 text-[15px]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-6 border-t border-border/40">
                  <div className={`w-11 h-11 rounded-full ${testimonial.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-semibold text-sm">{testimonial.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {testimonial.title} · <span className="text-primary font-medium">{testimonial.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
