import { motion } from "framer-motion";

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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-muted-foreground mb-8 tracking-wider uppercase">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {companies.map((company, index) => (
              <motion.span
                key={company}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="text-lg font-display text-muted-foreground/40 select-none"
              >
                {company}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
