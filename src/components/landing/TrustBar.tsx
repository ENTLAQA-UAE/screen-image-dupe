import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

const companies = [
  "TechCorp",
  "FinanceHub",
  "GovServe",
  "EduPrime",
  "HealthFirst",
  "RetailMax",
];

export const TrustBar = () => {
  return (
    <section className="py-12 bg-muted/30 border-y border-border/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs font-semibold text-muted-foreground/60 mb-8 tracking-[0.2em] uppercase">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {companies.map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex items-center gap-2 text-muted-foreground/60 select-none"
              >
                <Building2 className="w-4 h-4" />
                <span className="text-base font-semibold tracking-tight">{company}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
