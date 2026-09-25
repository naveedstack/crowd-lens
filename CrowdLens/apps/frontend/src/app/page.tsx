import Navbar from '../components/Navbar';
import HeroSection from '../sections/HeroSection';
import FeaturesSection from '../sections/FeaturesSection';
import HowItWorksSection from '../sections/HowItWorksSection';
import TestimonialsSection from '../sections/TestimonialsSection';
import PricingSection from '../sections/PricingSection';
import FAQSection from '../sections/FAQSection';
import CTASection from '../sections/CTASection';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;