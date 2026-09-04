import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Categories } from "@/components/landing/Categories"
import { TrustSection } from "@/components/landing/TrustSection"
import { Faq } from "@/components/landing/Faq"
import { FinalCta } from "@/components/landing/FinalCta"
import { Footer } from "@/components/landing/Footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Categories />
        <TrustSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
