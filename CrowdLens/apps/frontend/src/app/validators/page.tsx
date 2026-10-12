import ValidatorGuide from "@/sections/ValidatorGuide";
import Footer from "@/components/Footer";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";

export default function ValidatorsPage() {
  return (
    <div className="relative overflow-x-hidden">
      <LandingBackdrop />
      <div className="relative z-10">
        <ValidatorGuide />
        <Footer />
      </div>
    </div>
  );
}
