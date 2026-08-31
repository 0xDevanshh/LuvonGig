// import React, { useEffect, useRef, useState } from "react";

// function Hero() {
//   const canvasRef = useRef(null);
//   const [counters, setCounters] = useState([0, 0, 0]);
//   const targetCounts = [350, 120, 500]; // Projects, Clients, Freelancers

//   // Counter animation effect
//   useEffect(() => {
//     const duration = 2000;
//     const startTime = Date.now();

//     const updateCounters = () => {
//       const elapsed = Date.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);

//       const nextCounters = targetCounts.map((target, i) => {
//         return Math.floor(target * progress);
//       });

//       setCounters(nextCounters);

//       if (progress < 1) {
//         requestAnimationFrame(updateCounters);
//       }
//     };

//     const timer = setTimeout(() => {
//       requestAnimationFrame(updateCounters);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, []);

//   // Globe animation effect
//   useEffect(() => {
//     if (!canvasRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     let animationFrameId;

//     const setCanvasDimensions = () => {
//       const dpr = window.devicePixelRatio || 1;
//       canvas.width = window.innerWidth * dpr;
//       canvas.height = window.innerHeight * dpr;
//       canvas.style.width = `${window.innerWidth}px`;
//       canvas.style.height = `${window.innerHeight}px`;
//       ctx.scale(dpr, dpr);
//     };

//     setCanvasDimensions();

//     const getResponsiveValues = () => {
//       const viewportWidth = window.innerWidth;
//       const viewportHeight = window.innerHeight;
//       const minDimension = Math.min(viewportWidth, viewportHeight);

//       // Calculate radius based on viewport dimensions
//       const radius = Math.max(150, minDimension * 0.35);

//       // Calculate focal length relative to radius
//       const focalLength = Math.max(300, radius * 1.5);

//       // Adjust dot count based on screen size
//       let numDots;
//       if (viewportWidth < 768) {
//         numDots = 3000;
//       } else if (viewportWidth < 1200) {
//         numDots = 5000;
//       } else {
//         numDots = 7000;
//       }

//       return { radius, focalLength, numDots };
//     };

//     let { radius, focalLength, numDots } = getResponsiveValues();
//     const dots = [];
//     let angleY = 0;

//     const generateDots = () => {
//       dots.length = 0;
//       for (let i = 0; i < numDots; i++) {
//         const theta = Math.random() * 2 * Math.PI;
//         const phi = Math.acos(2 * Math.random() - 1);
//         const x = radius * Math.sin(phi) * Math.cos(theta);
//         const y = radius * Math.sin(phi) * Math.sin(theta);
//         const z = radius * Math.cos(phi);
//         dots.push({ x, y, z });
//       }
//     };

//     generateDots();

//     const draw = () => {
//       const dpr = window.devicePixelRatio || 1;
//       ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

//       const viewportWidth = window.innerWidth;
//       const viewportHeight = window.innerHeight;

//       // Calculate center position with padding to prevent clipping
//       const centerX = viewportWidth / 2;
//       const centerY = viewportHeight / 2 - (viewportHeight * 0.05);

//       const cosAngle = Math.cos(angleY);
//       const sinAngle = Math.sin(angleY);

//       for (const dot of dots) {
//         const rotatedX = dot.x * cosAngle - dot.z * sinAngle;
//         const rotatedZ = dot.x * sinAngle + dot.z * cosAngle;

//         // Use responsive focal length
//         const scale = focalLength / (focalLength + rotatedZ);
//         const x2d = centerX + rotatedX * scale;
//         const y2d = centerY + dot.y * scale;

//         // Dynamic effects based on current radius
//         const distanceFromCenter = Math.sqrt(rotatedX * rotatedX + dot.y * dot.y);
//         const hollowEffect = Math.min(1, Math.max(0.02, distanceFromCenter / (radius * 0.8)));
//         const edgeDarkening = Math.max(0.3, (Math.abs(rotatedX) / radius) * 1.5);
//         const finalOpacity = hollowEffect * edgeDarkening * Math.max(0.04, scale * 0.4);

//         const size = Math.max(0.15, 1.2 * scale);

//         ctx.fillStyle = `rgba(0, 0, 0, ${finalOpacity})`;
//         ctx.fillRect(x2d, y2d, size, size);
//       }

//       angleY += 0.0025;
//       animationFrameId = requestAnimationFrame(draw);
//     };

//     draw();

//     const handleResize = () => {
//       setCanvasDimensions();
//       const newValues = getResponsiveValues();
//       radius = newValues.radius;
//       focalLength = newValues.focalLength;
//       numDots = newValues.numDots;
//       generateDots();
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, []);

//   return (
//     <div className="relative pb-2 w-full min-h-screen bg-white overflow-hidden">
//       <canvas
//         ref={canvasRef}
//         className="absolute top-0 left-0 w-full h-full"
//         style={{
//           background: "white",
//           zIndex: 1,
//         }}
//       />

//       <div className="relative z-50 flex flex-col items-center justify-center min-h-screen px-4 py-2">
//         <div className="text-center max-w-4xl mx-auto w-full">
//           <p className="text-slate-400 text-2xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 tracking-wide font-medium">
//             Workbudd
//           </p>
//           <h1 className="text-4xl md:text-2xl lg:text-5xl text-slate-900 mb-4 sm:mb-6 font-medium">
//             Unleashing Potential, <br />
//             <span>Delivering Excellence</span>
//           </h1>
//           <p className="text-slate-800 text-base leading-relaxed mb-4 sm:mb-6 max-w-2xl mx-auto font-medium">
//             Your Gateway to the Elite Freelance Revolution.
//           </p>
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
//             <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
//               Join Workbudd
//             </button>
//             <button className="w-full sm:w-auto bg-gray-200 text-slate-700 hover:text-slate-900 font-semibold text-sm transition-colors duration-300 px-6 py-3.5 rounded-full hover:bg-gray-300">
//               Learn more →
//             </button>
//           </div>

//           {/* Data Insights Counters */}
//           <div className="flex flex-wrap justify-center gap-8 mt-8 sm:mt-12">
//             <div className="text-center min-w-[100px]">
//               <div className="text-3xl md:text-4xl font-bold text-indigo-700">{counters[0]}+</div>
//               <div className="text-sm md:text-base text-slate-700 mt-1">Projects Completed</div>
//             </div>
//             <div className="text-center min-w-[100px]">
//               <div className="text-3xl md:text-4xl font-bold text-indigo-700">{counters[1]}+</div>
//               <div className="text-sm md:text-base text-slate-700 mt-1">Happy Clients</div>
//             </div>
//             <div className="text-center min-w-[100px]">
//               <div className="text-3xl md:text-4xl font-bold text-indigo-700">{counters[2]}+</div>
//               <div className="text-sm md:text-base text-slate-700 mt-1">Expert Freelancers</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Hero;
'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function Hero() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [counters, setCounters] = useState([0, 0, 0]);
  const targetCounts = [5, 120, 500]; // Projects, Clients, Freelancers
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for user session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data?.success && data.session?.userId) {
          setHasSession(true);
        } else {
          // Try alternative endpoint
          const meResponse = await fetch('/api/auth/me');
          const meData = await meResponse.json();
          if (meData?.success && meData.session?.userId) {
            setHasSession(true);
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleJoinClick = () => {
    if (hasSession) {
      router.push('/freelancer/dashboard');
    } else {
      router.push('/signup');
    }
  };

  // Counter animation effect
  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();

    const updateCounters = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const nextCounters = targetCounts.map((target, i) => {
        return Math.floor(target * progress);
      });

      setCounters(nextCounters);

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(updateCounters);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Globe animation effect
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1;
      const viewportWidth = window.innerWidth;
      let canvasHeight = window.innerHeight;
      if (viewportWidth < 1000) {
        canvasHeight = window.innerHeight / 2;
      }
      canvas.width = window.innerWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.scale(dpr, dpr);
    };

    setCanvasDimensions();

    const getResponsiveValues = () => {
      const viewportWidth = window.innerWidth;
      let viewportHeight;
      if (viewportWidth < 1000) {
        viewportHeight = window.innerHeight / 2;
      } else {
        viewportHeight = window.innerHeight;
      }
      const minDimension = Math.min(viewportWidth, viewportHeight);

      // Calculate radius based on viewport dimensions
      const radius = Math.max(150, minDimension * 0.35);

      // Calculate focal length relative to radius
      const focalLength = Math.max(300, radius * 1.5);

      // Adjust dot count based on screen size
      let numDots;
      if (viewportWidth < 768) {
        numDots = 2800;
      } else if (viewportWidth < 1200) {
        numDots = 5000;
      } else {
        numDots = 7000;
      }

      return { radius, focalLength, numDots };
    };

    let { radius, focalLength, numDots } = getResponsiveValues();
    const dots = [];
    let angleY = 0;

    const generateDots = () => {
      dots.length = 0;
      for (let i = 0; i < numDots; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        dots.push({ x, y, z });
      }
    };

    generateDots();

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const viewportWidth = window.innerWidth;
      let viewportHeight = window.innerHeight;
      if (viewportWidth < 1000) {
        viewportHeight = window.innerHeight / 2;
      }

      // Calculate center position with padding to prevent clipping
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;

      const cosAngle = Math.cos(angleY);
      const sinAngle = Math.sin(angleY);

      for (const dot of dots) {
        const rotatedX = dot.x * cosAngle - dot.z * sinAngle;
        const rotatedZ = dot.x * sinAngle + dot.z * cosAngle;

        // Use responsive focal length
        const scale = focalLength / (focalLength + rotatedZ);
        const x2d = centerX + rotatedX * scale;
        const y2d = centerY + dot.y * scale;

        // Dynamic effects based on current radius
        const distanceFromCenter = Math.sqrt(
          rotatedX * rotatedX + dot.y * dot.y
        );
        const hollowEffect = Math.min(
          1,
          Math.max(0.02, distanceFromCenter / (radius * 0.8))
        );
        const edgeDarkening = Math.max(
          0.3,
          (Math.abs(rotatedX) / radius) * 1.5
        );
        const finalOpacity =
          hollowEffect * edgeDarkening * Math.max(0.04, scale * 0.4);

        const size = Math.max(0.15, 1.2 * scale);

        ctx.fillStyle = `rgba(0, 0, 0, ${finalOpacity})`;
        ctx.fillRect(x2d, y2d, size, size);
      }

      angleY += 0.0025;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      setCanvasDimensions();
      const newValues = getResponsiveValues();
      radius = newValues.radius;
      focalLength = newValues.focalLength;
      numDots = newValues.numDots;
      generateDots();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full bg-white overflow-hidden md:min-h-screen">
      <div className="w-full absolute" style={{ height: '75vh', maxHeight: '100vh' }}>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: "white",
            zIndex: 1,
            height: '100%',
            maxHeight: '100vh',
          }}
        />
      </div>

      <div className="relative z-50 flex flex-col items-center justify-center px-4 lg:pt-16 2xl:pt-20"
        style={{ minHeight: '50vh' }}>
        <div className="text-center max-w-4xl mx-auto w-full">
          {/* Enhanced text sizing with better responsiveness for smaller screens */}
          <p
            className="text-slate-400 tracking-wide font-medium"
            style={{ fontSize: "clamp(0.506rem, 2.53vw, 2.925rem)" }}
          >
            The Future of Work
          </p>

          <h1
            className="text-slate-900 mb-4 sm:mb-6 font-medium"
            style={{ fontSize: "clamp(0.506rem, 2.53vw, 2.925rem)" }}
          >
            is Decentralized. <br className="sm:hidden" />
            <br className="hidden sm:block" />
            <span>Welcome to Workbudd.</span>
          </h1>

          <p
            className="text-slate-800 leading-relaxed mb-4 sm:mb-6 max-w-2xl mx-auto font-medium"
            style={{ fontSize: "clamp(0.337rem, 1.125vw, 1.125rem)" }}
          >
            Your Gateway to the Elite Freelance Revolution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Join Workbudd Button */}
            <button
              onClick={handleJoinClick}
              className="relative rounded-[20px] text-white font-semibold transition-all duration-500 transform hover:-translate-y-0.5 px-6 py-3 sm:px-8 sm:py-3 lg:px-10 lg:py-4 xl:px-12 xl:py-5 text-sm sm:text-base lg:text-lg xl:text-lg whitespace-nowrap"
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

            {/* Learn More Button */}
            <button className="bg-gray-200 text-slate-700 hover:text-slate-900 font-semibold transition-colors duration-300 rounded-[20px] hover:bg-gray-300 px-6 py-3 sm:px-8 sm:py-3 lg:px-10 lg:py-4 xl:px-12 xl:py-5 text-sm sm:text-base lg:text-lg xl:text-lg whitespace-nowrap">
              Learn more →
            </button>
          </div>

          {/* Enhanced Data Insights Counters with better mobile responsiveness */}
          <div className="flex justify-center gap-4 sm:gap-8 lg:gap-12 xl:gap-12 mt-4 sm:mt-12 xl:mt-12 font-semibold">
            <div className="text-center flex-1 max-w-[150px]">
              <div
                className="font-bold text-black"
                style={{ fontSize: "clamp(0.45rem, 2.625vw, 2.25rem)" }}
              >
                0-{counters[0]}%
              </div>
              <div
                className="text-slate-700 mt-1 font-semibold"
                style={{ fontSize: "clamp(0.3rem, 1.125vw, 0.9rem)" }}
              >
                Platform Fees
              </div>
            </div>
            <div className="text-center flex-1 max-w-[120px] font">
              <div
                className="font-bold text-black"
                style={{ fontSize: "clamp(0.45rem, 2.625vw, 2.25rem)" }}
              >
                1-2s
              </div>
              <div
                className="text-slate-700 mt-1"
                style={{ fontSize: "clamp(0.3rem, 1.125vw, 0.9rem)" }}
              >
                Transaction Speed
              </div>
            </div>
            <div className="text-center flex-1 max-w-[120px]">
              <div
                className="font-bold text-black"
                style={{ fontSize: "clamp(0.45rem, 2.625vw, 2.25rem)" }}
              >
                $0
              </div>
              <div
                className="text-slate-700 mt-1"
                style={{ fontSize: "clamp(0.3rem, 1.125vw, 0.9rem)" }}
              >
                Gas Fees
              </div>
            </div>
          </div>

          {/* Backed by Internet Computer */}
          <a href="https://internetcomputer.org">
            <div className="flex items-center justify-center gap-3 mt-4 sm:mt-8 border border-slate-200 rounded-2xl px-4 py-3 backdrop-blur-sm hover:border-slate-300 transition-all duration-300 max-w-fit mx-auto"
              style={{
                background: `linear-gradient(135deg,
                   rgba(41, 163, 218, 0.30) 0%,
                   rgba(68, 176, 255, 0.30) 20%,
                   rgba(151, 62, 238, 0.30) 40%,
                   rgba(230, 31, 122, 0.30) 60%,
                   rgba(255, 112, 57, 0.30) 80%,
                   rgba(255, 195, 40, 0.30) 100%)`
              }}>
              <p
                className="text-black font-medium"
                style={{ fontSize: "clamp(0.45rem, 1.125vw, 0.9rem)" }}
              >
                Backed by
              </p>
              <img
                src="/internet-computer.svg"
                alt="Internet Computer"
                className="h-4 sm:h-5 lg:h-8 opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
