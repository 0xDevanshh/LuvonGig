import React from "react";

const steps = [
  {
    title: "Registration & Profile Setup",
    description:
      "Register using Internet Identity for secure, anonymous authentication",
    img: "/section3Img/1.png",
  },
  {
    title: "Project Posting",
    description: "Define project requirements, budget, and deadlines",
    img: "/section3Img/2.png",
  },
  {
    title: "Freelancer Selection",
    description: "Review proposals and communicate with potential freelancers",
    img: "/section3Img/3.png",
  },
  {
    title: "Contract & Escrow",
    description: "Smart contract creation and secure fund deposit",
    img: "/section3Img/4.png",
  },
  {
    title: "Work Review & Payment",
    description: "Review deliverables and trigger automatic payment release",
    img: "/section3Img/5.png",
  },
];

export default function OrganisedProcess() {
  return (
    <section className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-12 2xl:py-14 bg-white text-center">
      <div className="max-w-[120rem] mx-auto">
        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl xl:text-3xl 2xl:text-5xl font-semibold mb-2 xs:mb-3 sm:mb-4 lg:mb-5 xl:mb-4 2xl:mb-6">
          How Workbudd Functions
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-8 xs:mb-5 sm:mb-8 lg:mb-9 xl:mb-8 2xl:mb-10 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl">
          Simple, secure, and transparent workflows for clients and freelancers
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {/* Join Workbudd Button */}
          <button
            className="w-full sm:w-auto relative rounded-[20px] text-white px-8 lg:px-10 xl:px-12 2xl:px-14 3xl:px-16 4xl:px-20 5xl:px-24 py-3 lg:py-4 xl:py-5 2xl:py-6 3xl:py-7 4xl:py-8 5xl:py-10  font-semibold text-sm lg:text-base xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl transition-all duration-500 transform hover:-translate-y-0.5"
            style={{
              background: "transparent",
              boxShadow: `
        0 0 15px rgba(68, 176, 255, 0.4),
        0 0 25px rgba(151, 62, 238, 0.3),
        0 0 35px rgba(241, 42, 230, 0.2),
        0 4px 12px rgba(41, 163, 218, 0.2),
        0 6px 18px rgba(151, 62, 238, 0.15),
        0 8px 24px rgba(255, 112, 57, 0.1)
      `,
            }}
            onMouseEnter={(e) => {
              const gradientBorder = e.currentTarget.querySelector("div");
              if (gradientBorder) gradientBorder.style.display = "none";

              // Change text to "Coming Soon"
              const textSpan = e.currentTarget.querySelector("span");
              if (textSpan) textSpan.textContent = "Coming Soon";

              e.currentTarget.style.background = `
        linear-gradient(135deg,
          rgba(41, 163, 218, 0.9) 0%,
          rgba(68, 176, 255, 0.9) 20%,
          rgba(151, 62, 238, 0.9) 40%,
          rgba(230, 31, 122, 0.9) 60%,
          rgba(255, 112, 57, 0.9) 80%,
          rgba(255, 195, 40, 0.9) 100%)
      `;
              e.currentTarget.style.boxShadow = `
        0 6px 18px rgba(41, 163, 218, 0.35),
        0 8px 25px rgba(151, 62, 238, 0.3),
        0 10px 30px rgba(255, 112, 57, 0.25)
      `;
            }}
            onMouseLeave={(e) => {
              const gradientBorder = e.currentTarget.querySelector("div");
              if (gradientBorder) gradientBorder.style.display = "block";

              // Change text back to "Join Workbudd"
              const textSpan = e.currentTarget.querySelector("span");
              if (textSpan) textSpan.textContent = "Join Workbudd";

              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = `
        0 0 15px rgba(68, 176, 255, 0.4),
        0 0 25px rgba(151, 62, 238, 0.3),
        0 0 35px rgba(241, 42, 230, 0.2),
        0 4px 12px rgba(41, 163, 218, 0.2),
        0 6px 18px rgba(151, 62, 238, 0.15),
        0 8px 24px rgba(255, 112, 57, 0.1)
      `;
            }}
          >
            {/* Gradient Border */}
            <div
              className="absolute inset-0 rounded-[20px] p-0.5"
              style={{
                background:
                  "linear-gradient(88.65deg, #44B0FF -8.8%, #973EEE 33.57%, #F12AE6 58.38%, #FF7039 79.99%, #F3BC3B 98%)",
              }}
            >
              <div className="w-full h-full rounded-[18px] bg-black"></div>
            </div>
            <span className="relative z-10">Join Workbudd</span>
          </button>

          {/* Learn More Button - unchanged */}
          <button className="w-full sm:w-auto bg-gray-200 text-slate-700 hover:text-slate-900 font-semibold transition-colors duration-300 px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-14 4xl:px-18 5xl:px-22 py-3 lg:py-4 xl:py-5 2xl:py-6 3xl:py-7 4xl:py-8 5xl:py-10 rounded-[20px] hover:bg-gray-300 text-sm lg:text-base xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl">
            Learn more →
          </button>
        </div>

        <div className="grid gap-6 xs:gap-8 sm:gap-12 lg:gap-14 xl:gap-12 2xl:gap-20 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group rounded-xl shadow-md overflow-hidden bg-gray-50 hover:bg-white transition-all duration-500"
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
                e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                e.currentTarget.style.background = "#f9fafb";
                // Reset text colors
                const heading = e.currentTarget.querySelector("h3");
                const description = e.currentTarget.querySelector("p");
                if (heading) heading.style.color = "";
                if (description) description.style.color = "";
              }}
            >
              {/* Image */}
              <div className="w-full">
                <img
                  src={step.img}
                  alt={step.title}
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Content */}
              <div className="p-4 text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-900 text-white flex items-center justify-center">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl mb-1">
                  {step.title}
                </h3>
                <p className="text-sm xs:text-md lg:text-lg xl:text-lg 2xl:text-xl text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
