import profile from "@/public/assets/ProfilPic.jpg";
import image from "@/public/assets/Vision.jpg";

const Vision = () => {
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
      <div className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-22 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-9 xl:py-9 2xl:py-9 2xl:pt-6">
        <div className="max-w-[120rem] mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-12">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-5xl 2xl:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-6 2xl:mb-8 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-3 2xl:gap-4">
              <svg
                className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-14 xl:h-14 2xl:w-20 2xl:h-20 3xl:w-32 3xl:h-32 text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                xmlSpace="preserve"
                viewBox="0 0 2048 2048"
                style={{
                  shapeRendering: "geometricPrecision",
                  textRendering: "geometricPrecision",
                  imageRendering: "optimizeQuality",
                  fillRule: "evenodd",
                  clipRule: "evenodd",
                }}
              >
                <g>
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="M379.419 1426.25c-104.139-161.332-139.918-348.799-112.788-526.636 27.132-177.862 117.233-346.19 264.84-469.216 147.791-123.18 329.909-181.407 510.004-175.808 180.295 5.604 358.539 75.013 498.349 207.093l-43.75 46.5c-128.175-121.088-291.388-184.714-456.35-189.842-165.157-5.134-332.105 48.207-467.502 161.056-135.024 112.538-217.473 266.704-242.34 429.717-24.873 163.039 7.89 334.848 103.287 482.635l-53.75 34.5z"
                  />
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="m1546.29 350.714 26.19 151.48 5.43 31.419-31.55 5.457-142.39 24.622-10.75-63 110.83-19.166-20.76-120.061zM1663.67 562.401c109.82 166.98 148.732 361.712 122.093 546.95-26.656 185.362-118.87 361.304-271.275 490.556-152.623 129.436-341.608 191.616-529.111 187.393-187.618-4.226-373.696-74.871-520.37-211.079l43.5-46.75c134.867 125.242 305.83 190.198 478.12 194.078 172.403 3.883 346.205-53.319 486.61-172.393 140.041-118.766 224.777-280.453 249.275-450.805 24.516-170.476-11.206-349.551-112.094-502.95l53.251-35z"
                  />
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="m459.824 1692.72-28.649-157.64-5.686-31.29 31.435-5.71 148.173-26.93 11.251 62.75-116.738 21.22 22.963 126.34zM1407.71 593.898c-68.641-61.28-152.043-106.367-244.216-129.278 41.674 50.492 79.673 104.093 111.962 160.916l6.517 11.466 12.677-3.641c38.406-11.035 76.126-24.281 113.06-39.463zM1090.411 451.4a581.855 581.855 0 0 0-42.952-3.31V671.54l17.422-.696c49.343-1.972 98.442-7.848 146.884-17.408l23.41-4.62-12.293-20.45c-37.995-63.2-83.211-122.1-132.47-176.967zm-89.87-3.31a580.958 580.958 0 0 0-36.653 2.627c-49.5 55.065-94.96 114.2-133.117 177.682l-12.324 20.504 23.48 4.574c46.55 9.068 93.697 14.852 141.075 17.075l17.54.82V448.09zM891.63 462.896c-94.741 22.261-180.468 67.894-250.766 130.484 38.608 15.531 78 29.093 118.082 40.353l12.626 3.547 6.474-11.404c32.696-57.596 71.266-111.885 113.584-162.98zM604.327 628.92c-91.649 97.314-149.822 226.51-156.13 369.19h223.504l.56-16.175c3.44-99.226 27.958-194.317 69.123-284.475l8.003-17.528-18.47-5.49c-43.017-12.789-85.249-28.09-126.59-45.523zm-156.328 416.107c4.766 132.854 54.494 254.25 134.423 349.428l-6.861-14.876c47.634-21.425 96.509-40.084 146.46-55.376l17.53-5.366-6.918-16.977c-31.472-77.236-52.358-158.074-58.723-241.355l-1.181-15.478h-224.73zm155.586 373.263a579.915 579.915 0 0 0 12.848 13.277c76.983 76.984 175.65 132.285 286.053 155.978-51.928-66.72-98.825-137.763-136.763-213.064l-6.288-12.48-13.406 3.945c-48.575 14.293-96.11 31.94-142.443 52.344zm367.184 179.66a583.46 583.46 0 0 0 29.773 1.96v-275.32l-17.537.821c-52.417 2.457-104.526 9.28-155.87 20.072l-21.717 4.562 10.335 19.636c42.853 81.422 96.392 157.486 155.016 228.268zm76.691 1.96a582.933 582.933 0 0 0 35.966-2.555c58.434-70.607 111.763-146.453 154.474-227.6l10.3-19.573-21.63-4.616c-53.23-11.358-107.3-18.277-161.687-20.448l-17.423-.695v275.486zm104.94-13.888c107.62-24.482 203.79-79.074 279.17-154.455a578.693 578.693 0 0 0 13.104-13.55c-44.537-20.134-90.3-37.506-137.11-51.614l-13.464-4.057-6.33 12.555c-37.61 74.574-84.008 144.966-135.37 211.121zm313.427-191.862c79.787-95.13 129.413-216.416 134.176-349.133h-219.03l-1.182 15.478c-6.38 83.509-27.365 164.558-58.976 241.984l-6.886 16.867 17.383 5.451c48.303 15.152 95.514 33.604 141.462 54.826l-6.946 14.526zm133.976-396.05c-6.3-142.54-64.366-271.624-155.862-368.907-39.652 17.106-80.198 32.113-121.528 44.693l-18.328 5.577 7.97 17.421c41.323 90.32 65.937 185.601 69.385 285.04l.56 16.175h217.804zm-820.028 295.644c-30.981-73.597-52.014-150.851-58.859-230.538l-1.561-18.19h281.188v232.493l-16.03.692c-62.514 2.701-124.571 11.366-185.545 25.37l-13.726 3.155-5.466-12.982zm29.081-599.156c57.79 12.707 116.53 20.597 175.655 23.152l16.032.693V998.11H718.3l.696-17.423c3.868-96.952 29.41-189.6 71.144-276.947l5.732-11.994 12.984 2.853zm445.705 609.193c-62.715-14.662-126.6-23.425-190.97-25.821l-16.13-.6v-232.343h286.89l-1.562 18.189c-6.853 79.769-27.945 157.104-58.974 230.765l-5.487 13.028-13.766-3.218zm8.88-600.247c41.794 87.4 67.39 180.115 71.265 277.142l.697 17.424h-287.942V718.59l16.13-.598c60.975-2.27 121.54-10.262 181.08-23.573l13.016-2.909 5.755 12.033z"
                  />
                </g>
              </svg>
              The Vision
            </h2>
          </div>

          {/* Quote Section */}
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[2rem] xl:rounded-[1.5rem] 2xl:rounded-[2rem] p-4 sm:p-6 md:p-8 lg:p-10 xl:p-8 2xl:p-12 3xl:p-20 mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-8 2xl:mb-12 shadow-lg">
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-6">
              <div className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 lg:w-56 lg:h-64 xl:w-48 xl:h-56 2xl:w-56 2xl:h-64 3xl:w-80 3xl:h-96 rounded-lg overflow-hidden mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-4 2xl:mb-5 shadow-lg ring-4 ring-purple-200 hover:ring-purple-300 transition-all duration-300">
                <img
                  src="./assets/ProfilPic.jpg"
                  alt="Darshana Manikkuwadura"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6">
                <a
                  href="https://x.com/DashMofficial"
                  className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>

                <a
                  href="https://www.linkedin.com/in/dash-manikkuwadura"
                  className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="text-center">
              <blockquote className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl font-medium text-gray-800 leading-relaxed mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-6 2xl:mb-8 italic">
                "At Workbudd, we're not just building a platform — we're
                rebuilding the foundation of freelance work for the
                decentralized age."
              </blockquote>
              <cite className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-3xl font-semibold text-gray-700">
                — Darshana Manikkuwadura, Founder & CEO Workbudd
              </cite>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="space-y-1 sm:space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-3 2xl:space-y-4">
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-3xl text-gray-700 leading-relaxed text-center">
              Workbudd is on a mission to disrupt legacy freelance platforms like
              Upwork and Fiverr by introducing a fully on-chain protocol built
              on the Internet Computer (ICP).
            </p>

            {/* Key Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-8 lg:gap-10 xl:gap-6 2xl:gap-8 my-4 sm:my-6 md:my-8 lg:my-10 xl:my-6 2xl:my-8 3xl:my-20">
              <div className="text-center">
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-12 xl:h-12 2xl:w-16 2xl:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-7 lg:mb-8 xl:mb-4 2xl:mb-6 shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-3 2xl:mb-5">
                  No more 30% commissions.
                </h3>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-12 xl:h-12 2xl:w-16 2xl:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-7 lg:mb-8 xl:mb-4 2xl:mb-6 shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-3 2xl:mb-5">
                  No more platform censorship.
                </h3>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-12 xl:h-12 2xl:w-16 2xl:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-7 lg:mb-8 xl:mb-4 2xl:mb-6 shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 9V7a3 3 0 00-6 0v2"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-3 2xl:mb-5">
                  No more locked-in reputations.
                </h3>
              </div>
            </div>

            {/* Solution Description */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-3xl text-gray-700 leading-relaxed text-center">
              By removing intermediaries, enabling portable on-chain
              reputations, and securing transactions via smart contracts,
              Workbudd empowers freelancers and clients to collaborate directly —
              trustlessly, transparently, and globally.
            </p>

            {/* Closing Statement */}
            <div className="text-center mt-4 sm:mt-6 md:mt-8 lg:mt-10 xl:mt-6 2xl:mt-8 3xl:mt-16">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-xl 2xl:text-2xl 3xl:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8 lg:mb-8 xl:mb-4 2xl:mb-6">
                This isn't gig economy 2.0.
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-xl 2xl:text-2xl 3xl:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent pb-2 sm:pb-3 md:pb-4 lg:pb-5 xl:pb-3 2xl:pb-4 leading-tight">
                This is decentralized freelancing, reimagined.
              </p>
            </div>
            <div className="flex justify-center mt-2 sm:mt-3 md:mt-4 lg:mt-5 xl:mt-2 2xl:mt-4 3xl:mt-8">
              <img
                src="./assets/Vision.jpg"
                alt="Vision Image"
                className="w-full sm:w-full md:w-11/12 lg:w-5/6 xl:w-4/5 2xl:w-4/5 h-auto rounded-lg sm:rounded-xl md:rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Vision;
