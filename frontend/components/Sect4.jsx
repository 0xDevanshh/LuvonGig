import icon1 from "@/public/assets/Sect4_1.png";
import icon2 from "@/public/assets/Sect4_2.png";
import icon3 from "@/public/assets/Sect4_3.png";
import icon4 from "@/public/assets/Sect4_4.png";
import icon5 from "@/public/assets/Sect4_5.png";
import icon6 from "@/public/assets/Sect4_6.png";

function Sect4() {
  const services = [
    {
      icon: "./assets/Sect4_1.png",
      heading: "Smart Contract Escrow",
      description:
        "Automated, Tamper-proof Escrow Ensures Secure Payments Without Trusted Third Parties.",
    },
    {
      icon: "./assets/Sect4_2.png",
      heading: "Immutable Reputation",
      description:
        "On-Chain Reputation System That Can't Be Altered Or Censored By Any Central Authority",
    },
    {
      icon: "./assets/Sect4_3.png",
      heading: "DAO Governance",
      description:
        "Community-Driven Decision Making For Platform Upgrades And Dispute Resolution",
    },
    {
      icon: "./assets/Sect4_4.png",
      heading: "Web Speed Performance",
      description:
        "1-2 Second Transaction Finality With User Experience Comparable To Traditional Web Apps.",
    },
    {
      icon: "./assets/Sect4_5.png",
      heading: "No Gas Fees",
      description:
        "Reverse Gas Model Eliminates User-Facing Transaction Costs For Seamless Interaction.",
    },
    {
      icon: "./assets/Sect4_6.png",
      heading: "Global Payments",
      description:
        "Support For Multiple Cryptocurrencies With Future Traditional Payment Integration",
    },
  ];

  return (
    <div className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-16 2xl:px-20 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-10 2xl:py-12 3xl:py-14">
      <div>
        <div className="mb-8 xs:mb-5 sm:mb-8 lg:mb-9 xl:mb-7 2xl:mb-8 3xl:mb-10 text-center">
          <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl xl:text-3xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl font-bold text-gray-800 mb-3 xs:mb-4">
            Core Features & Benefits
          </h2>
          <p className="text-gray-600 text-sm xs:text-base sm:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-3xl mx-auto px-2 xs:px-4 sm:px-0">
            Built on the Internet Computer Protocol for unparalleled performance
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xs:gap-8 sm:gap-12 lg:gap-14 xl:gap-10 2xl:gap-14 3xl:gap-20 max-w-[120rem] mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 xs:p-6 sm:p-10 pb-6 xs:pb-8 sm:pb-12 lg:pb-12 xl:pb-6 2xl:pb-8 3xl:pb-16 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_30px_rgba(41,163,218,0.3),_0_0_40px_rgba(68,176,255,0.25),_0_0_50px_rgba(151,62,238,0.2),_0_0_60px_rgba(230,31,122,0.15),_0_0_70px_rgba(255,112,57,0.1)] transition-all duration-500 border border-gray-100 h-auto xs:h-[400px] sm:h-[500px] lg:h-[550px] xl:h-[360px] 2xl:h-[380px] 3xl:h-[480px] flex flex-col items-center text-center w-full relative overflow-hidden group"
              style={{
                transition: "all 0.5s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transition = "all 0.7s ease-in-out";

                e.currentTarget.style.boxShadow = `
    0 10px 40px rgba(41, 163, 218, 0.5),
    0 15px 50px rgba(68, 176, 255, 0.45),
    0 20px 60px rgba(151, 62, 238, 0.35),
    0 25px 70px rgba(230, 31, 122, 0.3),
    0 30px 80px rgba(255, 112, 57, 0.25),
    0 35px 90px rgba(255, 195, 40, 0.2)
  `;

                e.currentTarget.style.background = `
    radial-gradient(circle at top left, rgba(41,163,218,0.3), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255,195,40,0.3), transparent 60%),
    linear-gradient(135deg,
      rgba(41, 163, 218, 0.3) 0%,
      rgba(68, 176, 255, 0.3) 15%,
      rgba(151, 62, 238, 0.3) 35%,
      rgba(230, 31, 122, 0.3) 55%,
      rgba(255, 112, 57, 0.3) 75%,
      rgba(255, 195, 40, 0.3) 100%)
  `;

                const heading = e.currentTarget.querySelector("h3");
                const description = e.currentTarget.querySelector("p");
                if (heading) heading.style.color = "#111827";
                if (description) description.style.color = "#4B5563";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0,0,0,0.1)";
                e.currentTarget.style.background = "white";
                // Reset text colors
                const heading = e.currentTarget.querySelector("h3");
                const description = e.currentTarget.querySelector("p");
                if (heading) heading.style.color = "";
                if (description) description.style.color = "";
              }}
            >
              {/* Icon Container - Exactly 50% of card height */}
              <div className="h-1/2 w-full flex items-center justify-center mb-2 xs:mb-3 sm:mb-0">
                <img
                  src={service.icon}
                  alt={service.heading}
                  className="w-auto h-auto max-w-[60px] max-h-[60px] xs:max-w-[80px] xs:max-h-[80px] sm:max-w-[120px] sm:max-h-[120px] lg:max-w-[110px] lg:max-h-[110px] xl:max-w-[70px] xl:max-h-[70px] 2xl:max-w-[75px] 2xl:max-h-[75px] 3xl:max-w-[100px] 3xl:max-h-[100px] object-contain"
                />
              </div>

              {/* Content Container - Remaining 50% */}
              <div className="h-1/2 w-full flex flex-col justify-start px-2 xs:px-3 sm:px-4 pt-2 xs:pt-3 sm:pt-4">
                {/* Heading */}
                <h3 className="text-base xs:text-lg sm:text-2xl lg:text-2xl xl:text-lg 2xl:text-xl 3xl:text-4xl font-semibold text-gray-900 mb-2 xs:mb-3 sm:mb-6">
                  {service.heading}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-2xl leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sect4;
