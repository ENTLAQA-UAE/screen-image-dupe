import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div
            className="relative rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center bg-section-cta"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                Ready to Transform Your{" "}
                <br className="hidden md:block" />
                Assessment Process?
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
                Join leading organizations using Qudurat to make smarter,
                data-driven talent decisions. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button
                    size="xl"
                    className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-xl group"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  variant="heroOutline"
                  size="xl"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
