import Navbar from "@/components/Navbar";
import ValidatorGuide from "@/sections/ValidatorGuide";
import Footer from "@/components/Footer";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { fetchEconomics } from "@/lib/server-data";

export default async function ValidatorsPage() {
  const economics = await fetchEconomics();

  return (
    <div className="relative overflow-x-hidden">
      <LandingBackdrop />
      <div className="relative z-10">
        <Navbar />
        <ValidatorGuide initialEconomics={economics} />
        <Footer />
      </div>
    </div>
  );
}
