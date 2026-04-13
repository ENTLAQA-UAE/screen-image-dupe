import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Globe2, BadgeCheck } from "lucide-react";

const securityItems = [
  {
    icon: Lock,
    title: "Data Encryption",
    description:
      "All data is encrypted at rest with AES-256 and in transit with TLS 1.3. Your assessment data is protected at every layer.",
    badge: "AES-256",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Compliance",
    description:
      "Our infrastructure and processes meet SOC 2 Type II standards, ensuring rigorous controls for security, availability, and confidentiality.",
    badge: "SOC 2",
  },
  {
    icon: KeyRound,
    title: "Role-Based Access",
    description:
      "Granular permission controls let you define exactly who can create, manage, and view assessments and results across your organization.",
    badge: "RBAC",
  },
  {
    icon: Globe2,
    title: "GDPR Ready",
    description:
      "Built-in data processing agreements, consent management, and the right to erasure. Fully compliant with EU and regional privacy regulations.",
    badge: "GDPR",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const SecuritySection = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
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

          {/* Certification Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {["SOC 2 Type II", "GDPR", "ISO 27001", "TLS 1.3"].map((cert) => (
              <div
                key={cert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-border/60 shadow-sm"
              >
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">{cert}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {securityItems.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="group"
            >
              <div className="h-full p-7 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-display font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {item.description}
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
