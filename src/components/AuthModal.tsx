import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Loader2, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authService } from '../services/api.service';
import { toast } from 'sonner';
import { supabase, getRedirectUrl } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const { refreshSession } = useAuth();



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFormData(prev => ({
      ...prev,
      [e.target.name as keyof typeof formData]: e.target.value,
    }));
  };

  // Debug: Check connection on mount
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔌 AuthModal opened, checking connection...');
      // Quick ping to check if Supabase is reachable
      const checkConnection = async () => {
        try {
          // We prefer checking via a simple fetch if possible, but reading session is a safe low-overhead op
          const start = Date.now();
          await supabase.auth.getSession();
          console.log(`✅ Connection check passed in ${Date.now() - start}ms`);
        } catch (err) {
          console.error('❌ Connection check failed:', err);
          toast.error('Connection Warning', { description: 'Could not connect to authentication server.' });
        }
      };
      checkConnection();
    }
  }, [isOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('🔐 Starting email/password sign in...');

    // Safety timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 15000)
    );

    try {
      const loginPromise = authService.login(formData.email, formData.password);

      const result: any = await Promise.race([loginPromise, timeoutPromise]);

      // ... rest of logic handled by result
      console.log('✅ Sign in successful:', {
        userId: result.user.id,
        email: result.user.email,
        sessionPresent: !!result.session
      });

      toast.success('Welcome back!', {
        description: `Signed in as ${result.profile?.full_name || formData.email}`,
      });

      localStorage.setItem('user', JSON.stringify({
        id: result.user.id,
        email: result.user.email,
        name: result.profile?.full_name,
      }));

      // No manual context update - allow listener to pick it up
      // await refreshSession(); // Not needed if listener is working

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      // ... catch block logic
      console.error('🔴 Sign in error:', error);
      setError(error.message || 'An error occurred');
      toast.error('Sign In Failed', { description: error.message });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // Track mount state to avoid setting state on unmounted component
  const mounted = React.useRef(true);
  React.useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    console.log('🔐 Starting Google OAuth sign in...');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl('/dashboard'),
        },
      });

      if (error) {
        console.error('🔴 Google OAuth error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        // Check if Google provider is disabled
        if (error.message?.includes('provider') || error.message?.includes('disabled')) {
          const errorMsg = '⚠️ Google Sign-In is currently disabled. Please enable Google provider in Supabase Dashboard → Authentication → Providers → Google.';
          setError(errorMsg);
          toast.error('Google Sign-In Disabled', {
            description: 'Please use email/password or contact support.',
            duration: 10000,
          });
        } else {
          setError(error.message);
          toast.error('Google Sign-In Failed', {
            description: error.message || 'Please try again or use email/password.',
          });
        }
        setLoading(false);
        return;
      }

      console.log('✅ Google OAuth redirect initiated:', data);

      toast.info('Opening Google Sign-In...', {
        description: 'You will be redirected to complete authentication.',
      });

      // Don't set loading to false - user is being redirected
    } catch (error: any) {
      console.error('🔴 Google sign-in error:', error);
      const errorMsg = error.message || 'An unexpected error occurred.';
      setError(errorMsg);
      toast.error('Google Sign-In Failed', {
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    console.log('🔐 Starting signup...');

    try {
      const nameParts = formData.name.split(' ');
      await authService.register({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '.',
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      console.log('✅ Signup successful');

      toast.success('Account created successfully!', {
        description: 'You can now sign in with your credentials.',
      });

      // Ensure session state is clean
      await refreshSession();

      // Auto switch to sign in mode
      setMode('signin');
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      console.error('🔴 Sign up error:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const isDatabaseError = error.message?.includes('user_profiles') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('table');

      if (isDatabaseError) {
        const errorMsg = '🚨 Database Setup Required! Please run the SQL migration in Supabase first.';
        setError(errorMsg);
        toast.error('Database Setup Required', {
          description: 'Check the console for migration instructions.',
          duration: 10000,
        });
      } else {
        const errorMsg = error.message || 'Failed to create account. Please try again.';
        setError(errorMsg);
        toast.error('Sign up failed', {
          description: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-white">G</span>
            </div>
            <div>
              <h2 className="text-2xl">Ganges Lite</h2>
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-8">
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 py-3 transition-colors relative ${mode === 'signin'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            disabled={loading}
          >
            Sign In
            {mode === 'signin' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-3 transition-colors relative ${mode === 'signup'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            disabled={loading}
          >
            Sign Up
            {mode === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Forms */}
        <div className="p-8">
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? 'Loading...' : 'Sign in with Google'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jay Agarwal"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <div className="relative mt-1">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Get ₹200 bonus when you use a referral code!</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? 'Loading...' : 'Sign up with Google'}
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-gray-600 mt-6">
            By continuing, you agree to our{' '}
            <button className="text-blue-600 hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-blue-600 hover:underline">Privacy Policy</button>
          </p>

          {/* Debug Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center font-mono">
            Env: {import.meta.env.MODE} |
            API: {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing'}
            ({import.meta.env.VITE_SUPABASE_URL?.slice(0, 12)}...)
          </div>
        </div>
      </div>
    </div>
  );
}


