import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Qudurat transformed how we evaluate candidates. The AI-generated assessments saved our HR team dozens of hours per hiring cycle, and the bilingual support was a game-changer for our regional offices.",
    name: "Sarah Al-Rashid",
    title: "VP of Human Resources",
    company: "TechCorp International",
  },
  {
    quote:
      "The depth of analytics blew us away. We went from gut-feel decisions to data-driven talent strategies in weeks. The cognitive and personality assessments are scientifically rigorous yet easy to deploy.",
    name: "James Chen",
    title: "Chief People Officer",
    company: "FinanceHub Group",
  },
  {
    quote:
      "Rolling out assessments across 12 government agencies used to take months. With Qudurat, we launched standardized competency evaluations in days. The enterprise security features gave our compliance team full confidence.",
    name: "Dr. Layla Mansour",
    title: "Director of Talent Development",
    company: "GovServe Solutions",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
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
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Quote Icon */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Quote className="w-5 h-5 text-primary" />
                </div>

                {/* Quote Text */}
                <p className="text-foreground/80 leading-relaxed mb-8 flex-1">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="pt-6 border-t border-border/50">
                  <p className="font-display text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {testimonial.title}
                  </p>
                  <p className="text-sm text-primary font-medium mt-0.5">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
