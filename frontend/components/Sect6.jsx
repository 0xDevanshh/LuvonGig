import table from "@/public/assets/Sect6.png";
import tick from "@/public/assets/icon3.png";

const Sect6 = () => {
  let arr = [
    "Infinite Scalability",
    "Chain-Key Cryptography",
    "Direct Web Serving",
  ];
  return (
    <div className="flex flex-col lg:flex-row px-1 xs:px-2 sm:px-4 md:px-6 lg:px-8 xl:px-6 2xl:px-8 3xl:px-12 4xl:px-14 5xl:px-16 justify-center items-center lg:space-x-[4rem] xl:space-x-[3rem] 2xl:space-x-[4rem] 3xl:space-x-[8rem] my-3 xs:my-6 sm:my-6 md:my-7 lg:my-8 xl:my-6 2xl:my-8 3xl:my-14 space-y-8 xs:space-y-12 sm:space-y-16 md:space-y-20 lg:space-y-0">
      <div className="relative flex-shrink-0">
        <img
          src="./assets/Sect6.png"
          alt="Img"
          className="h-[18rem] xs:h-[20rem] sm:h-[28rem] md:h-[32rem] lg:h-[33rem] xl:h-[25rem] 2xl:h-[28rem] 3xl:h-[42rem] 4xl:h-[45rem] 5xl:h-[50rem] w-auto transition-all duration-200 ease-in-out"
          style={{
            filter: "none",
            transition: "filter 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.filter =
              "drop-shadow(0 1px 12px rgba(41, 163, 218, 0.6)) drop-shadow(0 2px 16px rgba(255, 112, 57, 0.8)) drop-shadow(0 3px 20px rgba(255, 195, 40, 0.7)) drop-shadow(0 4px 24px rgba(151, 62, 238, 0.6)) drop-shadow(0 5px 28px rgba(230, 31, 122, 0.5)) drop-shadow(0 6px 32px rgba(68, 176, 255, 0.4))";
          }}
          onMouseLeave={(e) => {
            e.target.style.filter = "none";
          }}
        />
        <div className="bg-white rounded-[8px] xs:rounded-[10px] sm:rounded-[15px] lg:rounded-[16px] xl:rounded-[12px] 2xl:rounded-[14px] 3xl:rounded-[18px] py-2 xs:py-3 sm:py-5 lg:py-5 xl:py-3 2xl:py-4 3xl:py-10 4xl:py-12 5xl:py-16 pl-3 xs:pl-4 sm:pl-6 lg:pl-6 xl:pl-4 2xl:pl-5 3xl:pl-10 4xl:pl-12 5xl:pl-16 pr-2 xs:pr-3 sm:pr-5 lg:pr-5 xl:pr-3 2xl:pr-4 3xl:pr-8 4xl:pr-10 5xl:pr-12 text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl max-w-[10rem] xs:max-w-[12rem] sm:max-w-[20rem] lg:max-w-[20rem] xl:max-w-[14rem] 2xl:max-w-[16rem] 3xl:max-w-[28rem] 4xl:max-w-[32rem] 5xl:max-w-[38rem] absolute top-[25%] -translate-y-1/2 -right-[1rem] xs:-right-[1.5rem] sm:-right-[3.5rem] lg:-right-[3.5rem] xl:-right-[2.2rem] 2xl:-right-[2.6rem] 3xl:-right-[6rem] 4xl:-right-[7rem] 5xl:-right-[9rem] shadow-[0_0_1rem_rgba(0,0,0,0.3)] xs:shadow-[0_0_1.5rem_rgba(0,0,0,0.4)] sm:shadow-[0_0_3rem_rgba(0,0,0,0.5)] lg:shadow-[0_0_3.5rem_rgba(0,0,0,0.55)] xl:shadow-[0_0_2.2rem_rgba(0,0,0,0.42)] 2xl:shadow-[0_0_2.6rem_rgba(0,0,0,0.46)] 3xl:shadow-[0_0_6rem_rgba(0,0,0,0.7)] 4xl:shadow-[0_0_7rem_rgba(0,0,0,0.7)] 5xl:shadow-[0_0_12rem_rgba(0,0,0,0.8)]">
          <ul>
            {arr.map((item, index) => {
              return (
                <li
                  key={index}
                  className="flex space-x-1 xs:space-x-1.5 sm:space-x-2 mt-1 xs:mt-1.5 sm:mt-3 lg:mt-4 font-sans"
                >
                  <img
                    src="./assets/icon3.png"
                    alt="Tick Icon"
                    className="h-3 xs:h-3.5 sm:h-5 lg:h-5 xl:h-3.5 2xl:h-4 3xl:h-8 4xl:h-10 5xl:h-12 inline flex-shrink-0 mt-0.5"
                  />
                  <div className="text-xs xs:text-sm sm:text-base lg:text-base xl:text-xs 2xl:text-sm 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl">
                    {" "}
                    {item}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="flex-1 p-2 xs:p-3 sm:p-4 lg:p-5 xl:p-4 2xl:p-5 3xl:p-10 4xl:p-12 5xl:p-16 flex flex-col content-center justify-center max-w-none lg:max-w-[50rem] xl:max-w-[46rem] 2xl:max-w-[52rem] 3xl:max-w-[75rem] 4xl:max-w-[85rem] 5xl:max-w-[95rem] text-center lg:text-left">
        <p className="text-xl xs:text-2xl sm:text-4xl lg:text-4xl xl:text-3xl 2xl:text-4xl 3xl:text-7xl 4xl:text-8xl 5xl:text-9xl font-bold mb-3 xs:mb-4 lg:mb-[1rem] xl:mb-[0.9rem] 2xl:mb-[1rem] 3xl:mb-[2rem] 4xl:mb-[2.5rem] 5xl:mb-[4rem]">
          Built on the Internet Computer
        </p>
        <p className="text-sm xs:text-base sm:text-xl lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl text-gray-600 mt-2 mb-6 xs:mb-8 lg:mb-10 xl:mb-8 2xl:mb-9 3xl:mb-16 leading-relaxed">
          Leveraging the most advanced blockchain technology for the future of
          work
        </p>

        {/* Grid with features */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 lg:gap-10 xl:gap-6 2xl:gap-7 3xl:gap-16">
          <div
            className="text-center lg:text-left p-4 xs:p-5 sm:p-6 lg:p-7 xl:p-4 2xl:p-5 3xl:p-10 rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-[1.2rem] xl:rounded-[0.8rem] 2xl:rounded-[1rem] 3xl:rounded-[2rem] cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl active:scale-95 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border border-transparent hover:border-blue-200"
            onClick={() => console.log("Infinite Scalability clicked")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(41, 163, 218, 0.3), 0 15px 40px rgba(151, 62, 238, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <h3 className="text-sm xs:text-base sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl font-semibold mb-2 xs:mb-3 sm:mb-4 lg:mb-5 xl:mb-2 2xl:mb-3 3xl:mb-6 text-gray-900 transition-colors duration-300">
              Infinite Scalability
            </h3>
            <p className="text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-xs 2xl:text-sm 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl text-gray-600 leading-relaxed transition-colors duration-300">
              Horizontal Scaling Through Subnet Architecture Accommodates
              Massive User Growth
            </p>
          </div>

          <div
            className="text-center lg:text-left p-4 xs:p-5 sm:p-6 lg:p-7 xl:p-4 2xl:p-5 3xl:p-10 rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-[1.2rem] xl:rounded-[0.8rem] 2xl:rounded-[1rem] 3xl:rounded-[2rem] cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl active:scale-95 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 border border-transparent hover:border-purple-200"
            onClick={() => console.log("Direct Web Serving clicked")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(151, 62, 238, 0.3), 0 15px 40px rgba(230, 31, 122, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <h3 className="text-sm xs:text-base sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl font-semibold mb-2 xs:mb-3 sm:mb-4 lg:mb-5 xl:mb-2 2xl:mb-3 3xl:mb-6 text-gray-900 transition-colors duration-300">
              Direct Web Serving
            </h3>
            <p className="text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-xs 2xl:text-sm 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl text-gray-600 leading-relaxed transition-colors duration-300">
              Entire Application Runs On-Chain, Eliminating Centralized Cloud
              Dependencies
            </p>
          </div>

          <div
            className="text-center lg:text-left p-4 xs:p-5 sm:p-6 lg:p-7 xl:p-4 2xl:p-5 3xl:p-10 rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-[1.2rem] xl:rounded-[0.8rem] 2xl:rounded-[1rem] 3xl:rounded-[2rem] cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl active:scale-95 bg-white hover:bg-gradient-to-br hover:from-pink-50 hover:to-orange-50 border border-transparent hover:border-pink-200"
            onClick={() => console.log("Chain-Key Cryptography clicked")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(230, 31, 122, 0.3), 0 15px 40px rgba(255, 112, 57, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <h3 className="text-sm xs:text-base sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl font-semibold mb-2 xs:mb-3 sm:mb-4 lg:mb-5 xl:mb-2 2xl:mb-3 3xl:mb-6 text-gray-900 transition-colors duration-300">
              Chain-Key Cryptography
            </h3>
            <p className="text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-xs 2xl:text-sm 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl text-gray-600 leading-relaxed transition-colors duration-300">
              Revolutionary Cryptography Enables Secure Interoperability And
              Cross-Chain Functionality
            </p>
          </div>

          <div
            className="text-center lg:text-left p-4 xs:p-5 sm:p-6 lg:p-7 xl:p-4 2xl:p-5 3xl:p-10 rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-[1.2rem] xl:rounded-[0.8rem] 2xl:rounded-[1rem] 3xl:rounded-[2rem] cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl active:scale-95 bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 border border-transparent hover:border-orange-200"
            onClick={() => console.log("Seamless Upgradability clicked")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(255, 112, 57, 0.3), 0 15px 40px rgba(255, 195, 40, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <h3 className="text-sm xs:text-base sm:text-lg lg:text-lg xl:text-sm 2xl:text-base 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl font-semibold mb-2 xs:mb-3 sm:mb-4 lg:mb-5 xl:mb-2 2xl:mb-3 3xl:mb-6 text-gray-900 transition-colors duration-300">
              Seamless Upgradability
            </h3>
            <p className="text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-xs 2xl:text-sm 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl text-gray-600 leading-relaxed transition-colors duration-300">
              Smart Contracts (Canisters) Can Be Upgraded Without Downtime,
              Preserving State and Ensuring Continuous Availability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sect6;
