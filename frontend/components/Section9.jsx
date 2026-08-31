import React from "react";

const WhyChooseWorkbudd = () => {
  return (
    <section className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-12 2xl:py-14 bg-white text-gray-900">
      {/* Main Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 xs:gap-8 sm:gap-12 lg:gap-14 xl:gap-12 2xl:gap-20 max-w-[120rem] mx-auto">
        {/* Text Content */}
        <div className="flex-1">
          <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl xl:text-3xl 2xl:text-5xl font-semibold mb-4">
            Why Choose Workbudd?
          </h2>
          <p className="text-gray-700 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl leading-relaxed">
            Beyond just a freelancing platform, Workbudd offers a truly
            decentralized experience. Built 100% on-chain using canisters,
            reverse gas, and Internet Identity, we eliminate middlemen and
            empower both freelancers and clients to interact transparently and
            trustlessly.
          </p>
          <p className="mt-4 text-gray-700 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl leading-relaxed">
            With Workbudd, you don’t just find work —
          </p>
          <ul className="mt-2 text-gray-700 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl leading-relaxed space-y-1">
            <li>🛠️ You join a movement.</li>
            <li>🌍 You shape the future of work.</li>
            <li>
              🔐 You own your reputation, your payments, and your freedom.
            </li>
          </ul>
        </div>

        {/* Image */}
        <div className="flex-1 flex justify-center">
          <img
            src="/section9.jpg"
            alt="Workbudd Illustration"
            className="w-full rounded-3xl md:w-4/5 lg:w-3/4"
          />
        </div>
      </div>

      {/* Bottom Call-to-Action */}
      <div className="mt-8 xs:mt-5 sm:mt-8 lg:mt-9 xl:mt-8 2xl:mt-10 relative rounded-2xl p-1 bg-gradient-to-r from-green-500 via-yellow-500 via-red-500 via-green-500 via-blue-500 via-pink-500 via-purple-500 to-blue-500 max-w-[120rem] mx-auto">
        <div className="rounded-2xl p-6 md:p-8 bg-white shadow-sm text-center">
          <h3 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl xl:text-3xl 2xl:text-5xl font-semibold mb-3">
            🌐 Ready to Build the Future of Work?
          </h3>
          <p className="text-gray-700 mb-2 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl">
            Join us on this mission. Let's build a better freelance economy —
            together.
          </p>
          <p className="text-gray-700 mb-6 text-sm xs:text-base lg:text-xl xl:text-lg 2xl:text-2xl leading-relaxed">
            Whether you're a creator looking for autonomy or a business seeking
            top-tier talent without the gatekeepers, Workbudd is your home.
            <br />
            We're more than a network. We're a protocol-powered revolution.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="w-full sm:w-auto relative rounded-[20px] text-white px-8 lg:px-10 xl:px-12 2xl:px-14 3xl:px-16 4xl:px-20 5xl:px-24 py-3 lg:py-4 xl:py-5 2xl:py-6 3xl:py-7 4xl:py-8 5xl:py-10 font-semibold text-sm lg:text-base xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl transition-all duration-500 transform hover:-translate-y-0.5"
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

                // Change text back to "Join as Freelancer"
                const textSpan = e.currentTarget.querySelector("span");
                if (textSpan) textSpan.textContent = "Join as Freelancer";

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
              <span className="relative z-10">Join as Freelancer</span>
            </button>
            <button className="w-full sm:w-auto bg-gray-200 text-slate-700 hover:text-slate-900 font-semibold transition-colors duration-300 px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-14 4xl:px-18 5xl:px-22 py-3 lg:py-4 xl:py-5 2xl:py-6 3xl:py-7 4xl:py-8 5xl:py-10 rounded-[20px] hover:bg-gray-300 text-sm lg:text-base xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl">
              Join as Client
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseWorkbudd;
