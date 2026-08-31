import img from "@/public/assets/Sect10.jpg";

const Sect10 = () => {
  return (
    <div className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-10 xl:py-8 2xl:py-8">
      <div className="max-w-[133rem] mx-auto">
        <div className="flex flex-col lg:flex-row justify-center items-center space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8 xl:space-x-6 2xl:space-x-10 3xl:space-x-20 my-4 xs:my-6 sm:my-8 md:my-10 lg:my-12 xl:my-6 2xl:my-8 mb-[1rem] xs:mb-[1.5rem] sm:mb-[2rem] md:mb-[3rem] lg:mb-[3rem] xl:mb-[2rem] 2xl:mb-[3rem]">
          <div className="w-full lg:w-[48%] xl:w-[46%] 2xl:w-[44%] text-center lg:text-left">
            {/* No changes to content */}
            <div
              className="p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-3.5 xl:p-3 2xl:p-3.5 rounded-[12px] xs:rounded-[14px] sm:rounded-[18px] md:rounded-[20px] lg:rounded-[22px] xl:rounded-[18px] 2xl:rounded-[20px] inline-block text-xs xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-base 2xl:text-lg font-semibold font-sans mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-7 xl:mb-5 2xl:mb-6 text-black"
              style={{
                background: `linear-gradient(135deg,
                  rgba(41, 163, 218, 0.5) 0%,
                  rgba(68, 176, 255, 0.5) 15%,
                  rgba(151, 62, 238, 0.5) 35%,
                  rgba(230, 31, 122, 0.5) 55%,
                  rgba(255, 112, 57, 0.5) 75%,
                  rgba(255, 195, 40, 0.5) 100%)`,
              }}
            >
              Empower your business with unmatched expertise
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl 3xl:text-8xl 4xl:text-9xl font-bold mb-2 xs:mb-2 sm:mb-3 md:mb-4 lg:mb-4 xl:mb-3 2xl:mb-4 leading-tight">
              Workbudd: Unleashing Potential, Delivering Excellence
            </h2>
            <p className="text-sm xs:text-base sm:text-xl md:text-2xl lg:text-2xl xl:text-xl 2xl:text-2xl 3xl:text-6xl 4xl:text-7xl text-gray-600 mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-6 xl:mb-5 2xl:mb-6 leading-relaxed">
              Your Gateway to the Elite Freelance revolution
            </p>

            {/* Subscribe Newsletter Button */}
            <div className="flex justify-center lg:justify-start mb-8 xs:mb-10 sm:mb-12 md:mb-8 lg:mb-0">
              <button
                className="relative mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-6 xl:mt-5 2xl:mt-6 px-8 xs:px-10 sm:px-12 md:px-16 lg:px-18 xl:px-12 2xl:px-16 py-3 xs:py-3.5 sm:py-4 md:py-5 lg:py-5 xl:py-4 2xl:py-5 rounded-[20px] font-semibold text-sm xs:text-base sm:text-lg md:text-xl lg:text-xl xl:text-lg 2xl:text-xl text-black active:scale-95 transition-all duration-300 group"
                style={{
                  background: "white",
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
                  // Hide the gradient border and show the gradient background
                  const gradientBorder = e.currentTarget.querySelector("div");
                  if (gradientBorder) gradientBorder.style.display = "none";

                  e.currentTarget.style.background = `
                    linear-gradient(135deg,
                      rgba(41, 163, 218, 0.9) 0%,
                      rgba(68, 176, 255, 0.9) 20%,
                      rgba(151, 62, 238, 0.9) 40%,
                      rgba(230, 31, 122, 0.9) 60%,
                      rgba(255, 112, 57, 0.9) 80%,
                      rgba(255, 195, 40, 0.9) 100%)
                  `;
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.boxShadow = `
                    0 6px 18px rgba(41, 163, 218, 0.35),
                    0 8px 25px rgba(151, 62, 238, 0.3),
                    0 10px 30px rgba(255, 112, 57, 0.25)
                  `;
                }}
                onMouseLeave={(e) => {
                  // Show the gradient border again and reset background
                  const gradientBorder = e.currentTarget.querySelector("div");
                  if (gradientBorder) gradientBorder.style.display = "block";

                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "black";
                  e.currentTarget.style.boxShadow = `
                    0 0 15px rgba(68, 176, 255, 0.4),
                    0 0 25px rgba(151, 62, 238, 0.3),
                    0 0 35px rgba(241, 42, 230, 0.2),
                    0 4px 12px rgba(41, 163, 218, 0.2),
                    0 6px 18px rgba(151, 62, 238, 0.15),
                    0 8px 24px rgba(255, 112, 57, 0.1)
                  `;
                }}
                onClick={() => console.log("Subscribe to Newsletter clicked")}
              >
                {/* Gradient Border */}
                <div
                  className="absolute inset-0 rounded-[20px] p-0.5"
                  style={{
                    background:
                      "linear-gradient(88.65deg, #44B0FF -8.8%, #973EEE 33.57%, #F12AE6 58.38%, #FF7039 79.99%, #F3BC3B 98%)",
                  }}
                >
                  <div className="w-full h-full rounded-[18px] bg-white"></div>
                </div>
                <span className="relative z-10 flex items-center gap-3">
                  Subscribe to Newsletter
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transform transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[48%] xl:w-[46%] 2xl:w-[44%] flex justify-center">
            <div
              className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-5 xl:p-4 2xl:p-6 rounded-lg xs:rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[1.5rem] xl:rounded-[1.2rem] 2xl:rounded-[2rem] inline-block shadow-lg"
              style={{
                background: `linear-gradient(135deg,
                rgba(41, 163, 218, 0.5) 0%,
                rgba(68, 176, 255, 0.5) 15%,
                rgba(151, 62, 238, 0.5) 35%,
                rgba(230, 31, 122, 0.5) 55%,
                rgba(255, 112, 57, 0.5) 75%,
                rgba(255, 195, 40, 0.5) 100%)`,
              }}
            >
              <img
                src="./assets/Sect10.jpg"
                alt="Section 10"
                className="w-[18rem] xs:w-[22rem] sm:w-[38rem] md:w-[44rem] lg:w-[42rem] xl:w-[40rem] 2xl:w-[48rem] 3xl:w-[68rem] 4xl:w-[74rem] h-48 xs:h-56 sm:h-96 md:h-[28rem] lg:h-[26rem] xl:h-[24rem] 2xl:h-[30rem] 3xl:h-[50rem] 4xl:h-[56rem] rounded-md xs:rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[1rem] xl:rounded-[0.8rem] 2xl:rounded-[1.5rem] shadow-lg border-2 xs:border-3 sm:border-4 md:border-6 lg:border-6 xl:border-4 2xl:border-6 3xl:border-[1.25rem] border-white object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sect10;
