import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ShippingRatesSection } from './components/ShippingRatesSection';
import { PersonalShopperSection } from './components/PersonalShopperSection';
import { DiwaliOffersSection } from './components/DiwaliOffersSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ShopWorldwideSection } from './components/ShopWorldwideSection';
import { ChallengesSection } from './components/ChallengesSection';
import { CustomerProblemsSection } from './components/CustomerProblemsSection';
import { IndianStoresSection } from './components/IndianStoresSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ProhibitedSection } from './components/ProhibitedSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { Dashboard } from '@/components/Dashboard';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { VirtualAddress } from '@/components/dashboard/VirtualAddress';
import { Locker } from '@/components/dashboard/Locker';
import { Shipments } from '@/components/dashboard/Shipments';
import { PersonalShopper } from '@/components/dashboard/PersonalShopper';
import { ShippingCalculator } from '@/components/dashboard/ShippingCalculator';
import { Wallet } from '@/components/dashboard/Wallet';
import { Support } from '@/components/dashboard/Support';
import { AdminLogin } from '@/admin/AdminLogin';
import { AdminPanel } from '@/admin/AdminPanel';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';
import { TermsConditions } from '@/components/TermsConditions';
import { AuthModal } from '@/components/AuthModal';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AppContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    navigate('/dashboard');
  };

  const handleNavigate = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={
          <>
            <Navbar onLoginClick={handleLogin} onSignUpClick={handleSignUp} onNavigate={handleNavigate} />
            <HeroSection onSignUpClick={handleSignUp} />
            <CustomerProblemsSection />
            <ServicesSection />
            <HowItWorksSection />
            <ShippingRatesSection />
            <PersonalShopperSection onGetStartedClick={handleSignUp} />
            <div id="offers">
              <DiwaliOffersSection />
            </div>
            <IndianStoresSection />
            <ShopWorldwideSection onGetStartedClick={handleSignUp} />
            <ChallengesSection />
            <TestimonialsSection />
            <ProhibitedSection />
            <FAQSection />
            <Footer onNavigate={handleNavigate} />
          </>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="address" element={<VirtualAddress />} />
          <Route path="locker" element={<Locker />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shopper" element={<PersonalShopper />} />
          <Route path="calculator" element={<ShippingCalculator />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="support" element={<Support />} />
        </Route>

        <Route path="/admin-login" element={
          isAdminAuthenticated ? <Navigate to="/admin" replace /> :
            <AdminLogin onLogin={handleAdminLogin} onBackToHome={() => window.location.href = '/'} />
        } />

        <Route path="/admin" element={
          isAdminAuthenticated ?
            <AdminPanel onBackToHome={() => window.location.href = '/'} onLogout={handleAdminLogout} /> :
            <Navigate to="/admin-login" replace />
        } />

        <Route path="/privacy-policy" element={<PrivacyPolicy onBack={() => window.location.href = '/'} />} />
        <Route path="/terms-conditions" element={<TermsConditions onBack={() => window.location.href = '/'} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultMode={authModalMode}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
