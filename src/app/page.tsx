'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, createUserWithEmailAndPassword } from '@/firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Navigation, ArrowRight, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'sales-executive') {
        router.push('/dashboard');
      } else {
        toast.error('Access Denied', {
          description: `This app is only for Sales Executives. Your role: ${user.role || 'Unassigned'}`
        });
        import('@/firebase/auth').then(({ signOut }) => signOut());
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      await signIn(email, password);
      toast.success('Login successful');
    } catch (error: any) {
      // Auto-create demo user if it doesn't exist
      if (email === 'executive1@fieldforce.demo' && error.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          // Create the Firestore profile
          await setDoc(doc(db, 'users', cred.user.uid), {
            name: 'Demo Executive',
            email: email,
            role: 'sales-executive',
            status: 'active',
            isActive: true,
            assignedRegion: 'Downtown Area',
            phone: '+1 234 567 8900',
            createdAt: new Date(),
          });
          toast.success('Demo account auto-created & logged in');
          return;
        } catch (createErr) {
          console.error('Failed to create demo user:', createErr);
        }
      }

      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'Invalid email or password'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('executive1@fieldforce.demo');
    setPassword('executive@1234');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl animated-gradient text-white mb-4 shadow-lg shadow-primary/25">
              <MapPin className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              FieldForce SE
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Sales Executive Portal
            </p>
          </div>

          <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-12 bg-white/50 dark:bg-black/20"
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl h-12 bg-white/50 dark:bg-black/20"
                    disabled={isLoggingIn}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl animated-gradient text-white font-medium shadow-lg shadow-primary/25 mt-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>

              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Demo Access
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleDemoLogin}
                  className="rounded-xl h-12 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  disabled={isLoggingIn}
                >
                  <Briefcase className="w-4 h-4 mr-2 text-primary" />
                  Load Demo Executive
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
