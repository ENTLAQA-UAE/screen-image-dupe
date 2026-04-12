import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Assessment Types", href: "#assessments" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Status", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-primary py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-accent-foreground font-display font-bold text-lg">J</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-primary-foreground">Jadarat</span>
                <span className="text-xs text-primary-foreground/60 -mt-1 tracking-wider">ASSESS</span>
              </div>
            </Link>
            <p className="text-primary-foreground/70 max-w-sm mb-6 leading-relaxed">
              The AI-powered, bilingual assessment platform for enterprises. 
              Design, launch, and analyze employee assessments at scale.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-medium">
                English
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-medium">
                العربية
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © 2024 Jadarat. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-primary-foreground/50 hover:text-primary-foreground/80 transition-smooth text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
