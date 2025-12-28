import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User, Building2, Sparkles, Shield, BarChart3 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const features = [
  { icon: Brain, text: "AI-Powered Assessments" },
  { icon: Shield, text: "Enterprise Security" },
  { icon: BarChart3, text: "Advanced Analytics" },
];

// Import Brain icon
import { Brain } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, isSuperAdmin } = useAuth();
  const { t, isRTL, dir } = useLanguage();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      if (isSuperAdmin()) {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate, isSuperAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setLoginErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        variant: "destructive",
        title: t.auth.loginFailed,
        description: error.message === 'Invalid login credentials' 
          ? t.auth.invalidCredentials
          : error.message,
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    const result = signupSchema.safeParse({
      fullName: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setSignupErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          variant: "destructive",
          title: t.auth.accountExists,
          description: t.auth.emailAlreadyRegistered,
        });
      } else {
        toast({
          variant: "destructive",
          title: t.auth.signupFailed,
          description: error.message,
        });
      }
    } else {
      toast({
        title: t.auth.accountCreated,
        description: t.auth.checkEmail,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir={dir}>
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pattern-grid opacity-10" />
        <div className="absolute inset-0 gradient-mesh" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 rounded-full bg-accent/20 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-48 h-48 rounded-full bg-highlight/20 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
                <Building2 className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">
                  Jadarat Assess
                </h1>
                <p className="text-white/60 text-sm tracking-wide">ENTERPRISE PLATFORM</p>
              </div>
            </div>

            <h2 className="text-4xl font-display font-bold text-white leading-tight mb-6">
              Transform Your<br />
              <span className="text-gradient-gold">Talent Assessment</span>
            </h2>

            <p className="text-lg text-white/70 mb-10 leading-relaxed">
              {t.auth.enterprisePlatform}. Design, launch, and analyze employee assessments with AI-powered insights.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-white/90 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96">
          <motion.div
            className="absolute bottom-12 right-12 w-72 h-72 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, rotate: -5 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-64 h-64 rounded-3xl bg-accent/10 backdrop-blur-sm border border-accent/20"
            initial={{ opacity: 0, rotate: 5 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 gradient-subtle" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
                <Building2 className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className={`text-${isRTL ? 'right' : 'left'}`}>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Jadarat Assess
                </h1>
                <p className="text-muted-foreground text-xs tracking-wide">ENTERPRISE PLATFORM</p>
              </div>
            </div>
          </div>

          <Card className="shadow-card border-border/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-display text-center">
                {t.auth.welcome}
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                {t.auth.signInDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    {t.auth.login}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    {t.auth.signUp}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-0">
                  <motion.form 
                    onSubmit={handleLogin} 
                    className="space-y-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">
                        {t.auth.email}
                      </Label>
                      <div className="relative group">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                      {loginErrors.email && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-destructive" />
                          {loginErrors.email}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">
                        {t.auth.password}
                      </Label>
                      <div className="relative group">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 ${isRTL ? 'left-2' : 'right-2'}`}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-destructive" />
                          {loginErrors.password}
                        </motion.p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl font-semibold shadow-button hover:shadow-lg transition-all" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                          {t.auth.signingIn}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {t.auth.signIn}
                        </span>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-0">
                  <motion.form 
                    onSubmit={handleSignup} 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">
                        {t.auth.fullName}
                      </Label>
                      <div className="relative group">
                        <User className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                        />
                      </div>
                      {signupErrors.fullName && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {signupErrors.fullName}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">
                        {t.auth.email}
                      </Label>
                      <div className="relative group">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                        />
                      </div>
                      {signupErrors.email && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {signupErrors.email}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">
                        {t.auth.password}
                      </Label>
                      <div className="relative group">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 ${isRTL ? 'left-2' : 'right-2'}`}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupErrors.password && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {signupErrors.password}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">
                        {t.auth.confirmPassword}
                      </Label>
                      <div className="relative group">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`h-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 ${isRTL ? 'left-2' : 'right-2'}`}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {signupErrors.confirmPassword}
                        </motion.p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl font-semibold shadow-button hover:shadow-lg transition-all" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                          {t.auth.creatingAccount}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {t.auth.createAccount}
                        </span>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.auth.termsAgreement}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
