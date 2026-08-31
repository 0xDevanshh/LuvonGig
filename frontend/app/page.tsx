"use client"
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Logos from "../components/Logos";
import OrganisedProcess from "../components/Section3";
import Sect10 from "../components/Sect10";
import Vision from "../components/Vision";
import Sect2 from "../components/Sect2";
import Sect4 from "../components/Sect4";
import Sect6 from "../components/Sect6";
import Sect8 from "../components/Sect8";
import SpecializedServices from "../components/Section5";
import FAQSection from "../components/Section7";
import { Footer } from "../components/Footer";
import WhyChooseWorkbudd from "../components/Section9";
import BackToTop from "../components/BackToTop";

function Home() {
  return (
    <>
      <Navbar />
      <div id="home">
        <Hero />
      </div>
      <Logos />
      <Sect2 />
      <div id="how-it-works">
        <OrganisedProcess />
      </div>
      <div id="features">
        <Sect4 />
      </div>
      <div id="use-cases">
        <SpecializedServices />
      </div>
      <Sect6 />
      <div id="faq">
        <FAQSection />
      </div>
      <Sect8 />
      <div id="why-choose-us">
        <WhyChooseWorkbudd />
      </div>
      <Sect10 />
      <Vision />
      <Footer />
      <BackToTop />
    </>
  );
}

export default Home;