import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Globe2 } from "lucide-react";

const securityItems = [
  {
    icon: Lock,
    title: "Data Encryption",
    description:
      "All data is encrypted at rest with AES-256 and in transit with TLS 1.3. Your assessment data is protected at every layer.",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Compliance",
    description:
      "Our infrastructure and processes meet SOC 2 Type II standards, ensuring rigorous controls for security, availability, and confidentiality.",
  },
  {
    icon: KeyRound,
    title: "Role-Based Access",
    description:
      "Granular permission controls let you define exactly who can create, manage, and view assessments and results across your organization.",
  },
  {
    icon: Globe2,
    title: "GDPR Ready",
    description:
      "Built-in data processing agreements, consent management, and the right to erasure. Fully compliant with EU and regional privacy regulations.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const SecuritySection = () => {
  return (
    <section className="py-24 gradient-subtle relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
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
            Security
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground mb-6">
            Enterprise-Grade Security
          </h2>
          <p className="text-lg text-muted-foreground">
            Your data security is our top priority. Qudurat is built with
            enterprise-level protections from the ground up.
          </p>
        </motion.div>

        {/* Security Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {securityItems.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
