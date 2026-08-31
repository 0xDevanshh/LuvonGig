import React from "react";
import {
  FaTwitter,
  FaGithub,
  FaLinkedin,
  FaDiscord,
  FaTelegramPlane,
  FaEnvelope,
  FaLaptopCode,
} from "react-icons/fa";
import logo from "@/public/WB.png";

export default function WorkbuddFooter() {
  const scrollToHome = () => {
    const homeElement = document.getElementById('home');
    if (homeElement) {
      homeElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        .gradient-icon {
          background: linear-gradient(135deg,
            rgba(41, 163, 218, 0.8) 0%,
            rgba(68, 176, 255, 0.8) 15%,
            rgba(151, 62, 238, 0.8) 35%,
            rgba(230, 31, 122, 0.8) 55%,
            rgba(255, 112, 57, 0.8) 75%,
            rgba(255, 195, 40, 0.8) 100%);
          border-radius: 1.5rem;
          padding: 0.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .gradient-icon svg {
          color: white;
        }
      `}</style>
      <footer className="bg-white text-black px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-12 2xl:py-14">
        {/* Main Footer Content */}
        <div className="max-w-[110rem] mx-auto">
          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 xs:gap-8 sm:gap-12 lg:gap-14 xl:gap-12 2xl:gap-20 text-sm lg:text-base xl:text-lg 2xl:text-lg mb-8 xs:mb-5 sm:mb-8 lg:mb-9 xl:mb-8 2xl:mb-10">
            {/* Categories */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900 text-base lg:text-lg xl:text-xl 2xl:text-xl flex items-center gap-2">
                <span className="text-lg lg:text-xl xl:text-xl 2xl:text-2xl">
                  📂
                </span>{" "}
                Categories
              </h3>
              <ul className="space-y-3">
                {[
                  "Development & Smart Contracts",
                  "Web3 & Blockchain Consulting",
                  "UI/UX & Frontend Design",
                  "DAO Governance & Operations",
                  "Identity & Authentication (II)",
                  "Canister Development",
                  "Tokenomics & DeFi",
                  "AI & Autonomous Agents",
                  "Growth & Community Building",
                  "Content & Translation",
                  "Security Audits & Testing",
                  "NFT & Gaming Assets",
                  "Data & Analytics",
                  "Educational Services",
                  "On-chain Marketing",
                  "Open Bounties Directory",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="hover:text-green-600 cursor-pointer transition-colors duration-200 hover:translate-x-1 transform"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Clients */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900 text-base lg:text-lg xl:text-xl 2xl:text-xl flex items-center gap-2">
                <span className="text-lg lg:text-xl xl:text-xl 2xl:text-2xl">
                  🤝
                </span>{" "}
                For Clients
              </h3>
              <ul className="space-y-3">
                {[
                  "How Workbudd Works",
                  "Client Onboarding Guide",
                  "Trust & Dispute Resolution (DAO)",
                  "Hiring Decentralized Teams",
                  "Workbudd Client Help Center",
                  "Browse Talent Pools",
                  "Integration with ICP dApps",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="hover:text-green-600 cursor-pointer transition-colors duration-200 hover:translate-x-1 transform"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Freelancers */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900 text-base lg:text-lg xl:text-xl 2xl:text-xl flex items-center gap-2">
                <span className="text-lg lg:text-xl xl:text-xl 2xl:text-2xl">
                  👨‍💻
                </span>{" "}
                For Freelancers
              </h3>
              <ul className="space-y-3">
                {[
                  "Become an Workbudd Freelancer",
                  "Contributor DAO & Voting Rights",
                  "On-chain Reputation System",
                  "Freelancer Knowledge Hub",
                  "Events & Bounties",
                  "Token Rewards & Staking",
                  "Wallet & Identity Setup (II)",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="hover:text-green-600 cursor-pointer transition-colors duration-200 hover:translate-x-1 transform"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Business Solutions */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900 text-base lg:text-lg xl:text-xl 2xl:text-xl flex items-center gap-2">
                <span className="text-lg lg:text-xl xl:text-xl 2xl:text-2xl">
                  🏢
                </span>{" "}
                Business Solutions
              </h3>
              <ul className="space-y-3">
                {[
                  "Hire via DAO",
                  "Enterprise Smart Contract Deployment",
                  "Decentralized Workforce Solutions",
                  "Custom ICP Canister Builds",
                  "API Access & SDKs",
                  "ICP Identity Management",
                  "Request Enterprise Demo",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="hover:text-green-600 cursor-pointer transition-colors duration-200 hover:translate-x-1 transform"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900 text-base lg:text-lg xl:text-xl 2xl:text-xl flex items-center gap-2">
                <span className="text-lg lg:text-xl xl:text-xl 2xl:text-2xl">
                  🏛
                </span>{" "}
                Company
              </h3>
              <ul className="space-y-3">
                {[
                  "About Workbudd",
                  "Roadmap & Whitepaper",
                  "Community DAO",
                  "Ecosystem Partnerships",
                  "Terms of Use",
                  "Privacy & Data Policy",
                  "Bug Bounty Program",
                  "Creator Ambassadors",
                  "Careers",
                  "Press & Newsroom",
                  "Contact Team",
                  "Investor Deck",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="hover:text-green-600 cursor-pointer transition-colors duration-200 hover:translate-x-1 transform"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 bg-white pt-6 xs:pt-5 sm:pt-8 lg:pt-9 xl:pt-8 2xl:pt-10">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between lg:items-center lg:gap-4">
              {/* Logo */}
              <div className="flex justify-center lg:justify-start">
                <img
                  src={logo}
                  alt="Workbudd Logo"
                  className="h-8 lg:h-10 xl:h-12 2xl:h-14 w-auto cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={scrollToHome}
                />
              </div>

              {/* Text - Centered */}
              <div className="text-gray-600 text-center text-sm lg:text-base xl:text-lg 2xl:text-lg">
                <p>© Workbudd Protocol 2025</p>
                <p>
                  Built fully on-chain with{" "}
                  <span className="text-red-500">❤️</span> by the Internet
                  Computer community.
                </p>
              </div>

              {/* Social Icons */}
              <div className="flex items-center space-x-6">
                <div className="flex space-x-4 text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
                  <a
                    href="https://x.com/Workbuddofficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter/X"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaTwitter />
                  </a>
                  <a
                    href="https://github.com/WorkbuddOfficial/backend-canisters"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/Workbudd/?viewAsMember=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://discord.gg/uAhH8rMr27"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Discord"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaDiscord />
                  </a>
                  <a
                    href="mailto:WorkbuddOfficial@gmail.com"
                    aria-label="Email"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaEnvelope />
                  </a>
                  <a
                    href="https://dorahacks.io/hacker/WorkbuddOfficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="DoraHacks"
                    className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  >
                    <FaLaptopCode />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
