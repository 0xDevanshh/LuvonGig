import {
  FaUsers,
  FaFileContract,
  FaTrophy,
  FaCoins,
  FaPenFancy,
  FaGraduationCap,
} from "react-icons/fa";

const features = [
  {
    icon: <FaUsers />,
    title: "Remote & Global Teams",
    description:
      "Seamless collaboration for geographically dispersed teams with unified project management.",
  },
  {
    icon: <FaFileContract />,
    title: "Smart Contract Development",
    description:
      "Connect Web3 projects with expert developers and auditors for secure blockchain development.",
  },
  {
    icon: <FaTrophy />,
    title: "Task Bounties",
    description:
      "Revolutionize open-source development with decentralized task bounties and rewards.",
  },
  {
    icon: <FaCoins />,
    title: "DAO Payroll",
    description:
      "Transparent treasury management and automated payroll for Decentralized Autonomous Organizations.",
  },
  {
    icon: <FaPenFancy />,
    title: "Content Creation",
    description:
      "Empower creators to monetize work directly with censorship-resistant content distribution.",
  },
  {
    icon: <FaGraduationCap />,
    title: "Web3 Education",
    description:
      "Peer-to-peer learning and mentorship marketplace for Web3 skill development.",
  },
];

export default function SpecializedServicesSlider() {
  return (
    <section className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-12 2xl:py-14 bg-white text-center">
      <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl xl:text-3xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl font-bold text-gray-800 mb-3 xs:mb-4">
        Use Cases
      </h2>
      <p className="text-gray-600 text-sm xs:text-base sm:text-lg lg:text-xl xl:text-lg 2xl:text-2xl 3xl:text-3xl mx-auto mb-8 xs:mb-5 sm:mb-8 lg:mb-9 xl:mb-8 2xl:mb-10 px-2 xs:px-4 sm:px-0">
        Versatile platform for diverse decentralized work scenarios
      </p>

      {/* Features Grid Layout */}
      <div className="max-w-[120rem] mx-auto">
        {/* Top Image */}
        <div className="mb-8 xs:mb-5 sm:mb-8 lg:mb-9 xl:mb-8 2xl:mb-10">
          <div className="max-w-4xl mx-auto">
            <img
              src="/section5Img/2.jpg"
              alt="Service Dashboard"
              className="rounded-3xl w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover transition-all duration-200 ease-in-out shadow-xl"
              style={{
                filter: "none",
                transition: "filter 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.target.style.filter =
                  "drop-shadow(0 0px 8px rgba(41, 163, 218, 0.6)) drop-shadow(0 1px 10px rgba(255, 112, 57, 0.8)) drop-shadow(0 1px 12px rgba(255, 195, 40, 0.7)) drop-shadow(0 2px 14px rgba(151, 62, 238, 0.6)) drop-shadow(0 2px 16px rgba(230, 31, 122, 0.5)) drop-shadow(0 3px 18px rgba(68, 176, 255, 0.4))";
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = "none";
              }}
            />
          </div>
        </div>

        {/* Features Grid Below */}
        <div className="w-full">
          <div 
            className="text-black rounded-3xl p-4 xs:p-6 sm:p-10 pb-6 xs:pb-8 sm:pb-12 lg:pb-12 xl:pb-10 2xl:pb-16 shadow-2xl "
            style={{
              background: `
                radial-gradient(circle at top left, rgba(41,163,218,0.3), transparent 60%),
                radial-gradient(circle at bottom right, rgba(255,195,40,0.3), transparent 60%),
                linear-gradient(135deg,
                  rgba(41, 163, 218, 0.3) 0%,
                  rgba(68, 176, 255, 0.3) 15%,
                  rgba(151, 62, 238, 0.3) 35%,
                  rgba(230, 31, 122, 0.3) 55%,
                  rgba(255, 112, 57, 0.3) 75%,
                  rgba(255, 195, 40, 0.3) 100%)
              `
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 lg:gap-10 xl:gap-8 2xl:gap-12 ">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="p-4 xs:p-6 sm:p-10 pb-6 xs:pb-8 sm:pb-12 lg:pb-12 xl:pb-10 2xl:pb-16 relative"
                >
                  <div className="flex items-start space-x-4 md:space-x-6 lg:space-x-8">
                    <div className="text-purple-600 text-base xs:text-lg sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base xs:text-lg sm:text-2xl lg:text-2xl xl:text-xl 2xl:text-3xl leading-tight mb-2 xs:mb-3 sm:mb-6">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 text-xs xs:text-sm sm:text-lg lg:text-lg xl:text-base 2xl:text-xl leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
