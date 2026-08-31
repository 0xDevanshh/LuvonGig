import img from "@/public/assets/Section2.png";
import money from "@/public/assets/icon1.png";
import tick from "@/public/assets/icon2.png";

const Sect2 = () => {
  let arr = [
    "Top Blockchain & AI Experts",
    "Instant On-Chain Collaboration",
    "Trustless Results via Smart Contracts",
    "Immutable Reputation & DAO-Led Arbitration",
  ];
  return (
    <>
      <div className="flex flex-col xl:flex-row px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-10 2xl:px-[5rem] 3xl:px-[7rem] 4xl:px-[9rem] 5xl:px-[11rem] 6xl:px-[13rem] justify-center items-center space-y-8 xs:space-y-12 sm:space-y-16 md:space-y-20 xl:space-y-0 xl:space-x-5 2xl:space-x-[6rem] 3xl:space-x-[8rem] 4xl:space-x-[10rem] 5xl:space-x-[12rem] my-6 xs:my-8 lg:my-12 xl:my-10 2xl:my-20 3xl:my-24 4xl:my-28 5xl:my-32">
        <div className="relative order-1 xl:order-1 w-full xl:w-auto flex justify-center">
          <img
            src="./assets/Section2.png"
            alt="Img"
            className="w-full max-w-[20rem] xs:max-w-[22rem] sm:max-w-[30rem] md:max-w-[35rem] lg:max-w-[40rem] xl:max-w-[38rem] 2xl:w-[55rem] 3xl:w-[60rem] 4xl:w-[70rem] 5xl:w-[80rem] transition-all duration-200 ease-in-out"
            style={{
              filter: "none",
              transition: "filter 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.target.style.filter =
                "drop-shadow(0 5px 12px rgba(41, 163, 218, 0.6)) drop-shadow(0 8px 16px rgba(255, 112, 57, 0.8)) drop-shadow(0 12px 20px rgba(255, 195, 40, 0.7)) drop-shadow(0 16px 24px rgba(151, 62, 238, 0.6)) drop-shadow(0 20px 28px rgba(230, 31, 122, 0.5)) drop-shadow(0 24px 32px rgba(68, 176, 255, 0.4))";
            }}
            onMouseLeave={(e) => {
              e.target.style.filter = "none";
            }}
          />
          <div className="bg-white rounded-[12px] xs:rounded-[15px] sm:rounded-[18px] py-2 xs:py-3 sm:py-4 lg:py-4 xl:py-4 2xl:py-5 3xl:py-6 4xl:py-8 5xl:py-16 pl-3 xs:pl-4 sm:pl-5 lg:pl-5 xl:pl-5 2xl:pl-6 3xl:pl-7 4xl:pl-10 5xl:pl-18 pr-1.5 xs:pr-2 sm:pr-3 lg:pr-3 xl:pr-3 2xl:pr-3.5 3xl:pr-4 4xl:pr-6 5xl:pr-10 text-[0.65rem] xs:text-[0.7rem] sm:text-[0.875rem] lg:text-[0.875rem] xl:text-[0.95rem] 2xl:text-[1.05rem] 3xl:text-[1.1rem] 4xl:text-[1.25rem] 5xl:text-[2rem] max-w-[11rem] xs:max-w-[12rem] sm:max-w-[16rem] lg:max-w-[17rem] xl:max-w-[17rem] 2xl:max-w-[19rem] 3xl:max-w-[21rem] 4xl:max-w-[26rem] 5xl:max-w-[40rem] z-2 absolute bottom-[-0.75rem] xs:bottom-[-1rem] sm:bottom-[-1.5rem] lg:bottom-[-1.75rem] xl:bottom-[-1.75rem] 2xl:bottom-[-2rem] 3xl:bottom-[-3rem] 4xl:bottom-[-3.5rem] 5xl:bottom-[-6rem] right-[-0.25rem] xs:right-[-0.5rem] sm:right-[-1.5rem] lg:right-[-1.75rem] xl:right-[-1.75rem] 2xl:right-[-2rem] 3xl:right-[-3rem] 4xl:right-[-3.5rem] 5xl:right-[-6rem] shadow-[0_0_1.5rem_rgba(0,0,0,0.3)] xs:shadow-[0_0_2rem_rgba(0,0,0,0.4)] sm:shadow-[0_0_3rem_rgba(0,0,0,0.5)] lg:shadow-[0_0_3.5rem_rgba(0,0,0,0.55)] xl:shadow-[0_0_3.5rem_rgba(0,0,0,0.55)] 2xl:shadow-[0_0_4rem_rgba(0,0,0,0.6)] 3xl:shadow-[0_0_6rem_rgba(0,0,0,0.7)] 4xl:shadow-[0_0_7rem_rgba(0,0,0,0.7)] 5xl:shadow-[0_0_12rem_rgba(0,0,0,0.8)]">
            <img
              src="./assets/icon1.png"
              alt="Money Icon"
              className="inline-block h-6 xs:h-7 sm:h-10 lg:h-11 xl:h-10 2xl:h-11 3xl:h-16 4xl:h-20 5xl:h-24 mb-1 xs:mb-1.5 sm:mb-2"
            />
            <ul>
              {arr.map((item, index) => {
                return (
                  <li
                    key={index}
                    className="flex space-x-0.5 xs:space-x-1 sm:space-x-2 lg:space-x-2 xl:space-x-2.5 2xl:space-x-3 3xl:space-x-3 4xl:space-x-4 5xl:space-x-5 mt-1 xs:mt-1.5 sm:mt-3 lg:mt-3.5 xl:mt-3.5 2xl:mt-4.5 3xl:mt-6 4xl:mt-7 5xl:mt-8 font-sans"
                  >
                    <img
                      src="./assets/icon2.png"
                      alt="Tick Icon"
                      className="h-2.5 xs:h-3 sm:h-3.5 lg:h-3.5 xl:h-4 2xl:h-4.5 3xl:h-6 4xl:h-7 5xl:h-8 inline flex-shrink-0 mt-0.5"
                    />
                    <div className="text-xs xs:text-sm sm:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-2xl 4xl:text-3xl 5xl:text-[3rem] leading-tight">
                      {" "}
                      {item}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="order-2 lg:order-2 p-3 xs:p-4 lg:p-6 xl:p-5 2xl:p-6 3xl:p-10 4xl:p-12 5xl:p-16 flex flex-col content-center justify-center w-full xl:max-w-[45rem] 2xl:max-w-[48rem] 3xl:max-w-[60rem] 4xl:max-w-[65rem] 5xl:max-w-[70rem] text-center lg:text-left">
          <p className="text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl 3xl:text-7xl 4xl:text-8xl 5xl:text-[8rem] font-extrabold mb-3 xs:mb-4 lg:mb-[1rem] xl:mb-[1rem] 2xl:mb-[1.25rem] 3xl:mb-[2rem] 4xl:mb-[2.5rem] 5xl:mb-[4rem]">
            Expert Talent, One Click Away — On-Chain
          </p>
          <div className="text-base xs:text-lg sm:text-xl lg:text-xl xl:text-xl 2xl:text-2xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl text-gray-700 mt-2 space-y-2 xs:space-y-3 lg:space-y-3 xl:space-y-3.5 2xl:space-y-4 3xl:space-y-6 4xl:space-y-7 5xl:space-y-10">
            <p>
              In the age of decentralized innovation, finding elite talent
              shouldn't be a bottleneck. At <b>Workbudd</b>, we connect you with
              top-tier, fully verified freelancers — all operating on a
              censorship-resistant, blockchain-native infrastructure powered by
              the <b>Internet Computer Protocol</b> (ICP).
            </p>
            <p>
              Whether you're building in AI, DeFi, dApps, or protocol
              infrastructure, our platform gives you instant access to the top
              1% of Web3-native builders — all secured by smart contract escrow
              and governed by on-chain reputation.
            </p>
            <p>
              From automation to AI agents, Workbudd empowers you to work with
              trustless precision — where transparency, speed, and exceptional
              delivery are the norm, not the exception.
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-10 2xl:px-12 3xl:px-[13rem] 4xl:px-[15rem] 5xl:px-[18rem] 6xl:px-[22rem] mb-[2rem] xs:mb-[1.5rem] sm:mb-[2rem] lg:mb-[2rem] xl:mb-[2.5rem] 2xl:mb-[3rem] 3xl:mb-[3.5rem] 4xl:mb-[4rem] 5xl:mb-[6rem] mt-[3rem] xs:mt-[4rem] sm:mt-[5rem] lg:mt-[6rem] xl:mt-[6.5rem] 2xl:mt-[7.5rem] 3xl:mt-[9rem] 4xl:mt-[11rem] 5xl:mt-[16rem] text-center text-base xs:text-lg sm:text-xl lg:text-xl xl:text-xl 2xl:text-2xl 3xl:text-4xl 4xl:text-5xl 5xl:text-[4rem] font-bold">
        This isn't gig work. This is the future of decentralized execution.
        Welcome to Workbudd — built 100% on-chain.
      </div>
    </>
  );
};

export default Sect2;
