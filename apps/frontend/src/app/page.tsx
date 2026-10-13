import Navbar from '../components/Navbar';
import HeroSection from '../sections/HeroSection';
import FeaturesSection from '../sections/FeaturesSection';
import HowItWorksSection from '../sections/HowItWorksSection';
import PricingSection from '../sections/PricingSection';
import TestimonialsSection from '../sections/TestimonialsSection';
import FAQSection from '../sections/FAQSection';
import CTASection from '../sections/CTASection';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';
import { fetchEconomics } from '@/lib/server-data';

export default async function App() {
  const economics = await fetchEconomics();

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      <LandingBackdrop />
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection initialEconomics={economics} />
          <TestimonialsSection />
          <FAQSection />
          <CTASection />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
}