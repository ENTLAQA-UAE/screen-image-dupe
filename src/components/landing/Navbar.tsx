import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const navLinks = [
  { label: "Features", labelAr: "المميزات", href: "#features" },
  { label: "Assessments", labelAr: "التقييمات", href: "#assessments" },
  { label: "How It Works", labelAr: "كيف يعمل", href: "#how-it-works" },
  { label: "Pricing", labelAr: "الأسعار", href: "#pricing" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${
              scrolled ? "bg-primary" : "bg-white/15 backdrop-blur-sm border border-white/20"
            }`}>
              <span className={`font-bold text-lg ${scrolled ? "text-primary-foreground" : "text-white"}`}>Q</span>
            </div>
            <span className={`font-bold text-xl transition-colors duration-300 ${
              scrolled ? "text-foreground" : "text-white"
            }`}>
              Qudurat
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  scrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {isRTL ? link.labelAr : link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA + Language Switcher */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{language === "en" ? "العربية" : "English"}</span>
            </button>

            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  scrolled
                    ? "text-foreground hover:bg-muted/50"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="cta" size="default">
                {isRTL ? "ابدأ مجاناً" : "Get Started"}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-foreground" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className={`py-6 space-y-1 ${scrolled ? "" : "text-white"}`}>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      scrolled
                        ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {isRTL ? link.labelAr : link.label}
                  </a>
                ))}

                {/* Language Toggle in Mobile */}
                <button
                  onClick={toggleLanguage}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors w-full ${
                    scrolled
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{language === "en" ? "العربية" : "English"}</span>
                </button>

                <div className="pt-4 space-y-3 px-4">
                  <Link to="/auth" className="block">
                    <Button
                      variant="ghost"
                      className={`w-full ${
                        scrolled ? "" : "text-white border-white/20 hover:bg-white/10"
                      }`}
                    >
                      {isRTL ? "تسجيل الدخول" : "Sign In"}
                    </Button>
                  </Link>
                  <Link to="/auth" className="block">
                    <Button variant="cta" className="w-full">
                      {isRTL ? "ابدأ مجاناً" : "Get Started"}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
