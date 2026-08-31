'use client';

import React, { useState, useEffect, useRef } from "react";

const Sect8 = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonialsRef = useRef(null);
  const feedbackRef = useRef(null);

  const testimonials = [
    {
      id: 13,
      name: "Buddhika Perera",
      position: "Technical Consultant and CTO",
      profilePic:
        "/testimonials/1740138703499.jpeg",
      quote:
        "Workbudd is the platform I recommend to any serious builder. The level of professionalism, speed of onboarding, and commitment to Web3 values make it a no-brainer. As a CTO, I’ve found exceptional talent and shipped high-impact work, fast.",
      linkedin: "https://www.linkedin.com/in/buddhika-perera/",
      x: "https://x.com/buddhikapp",
    },
    {
      id: 14,
      name: "Vivek Kumar",
      position: "Product Designer",
      profilePic:
        "/testimonials/1737567684365.jpeg",
      quote:
        "As a product designer, I value clarity, collaboration, and speed. Workbudd delivers all three. The projects are real, the expectations are clear, and the Web3-native workflows allow me to focus on what matters—building beautiful, functional products.",
      linkedin: "https://www.linkedin.com/in/vivek-kumar-ux-designer/",
      x: "https://x.com/Cmonvivek",
    },
    {
      id: 1,
      name: "Aman Sagar",
      position: "Fullstack Engineer",
      profilePic: "https://cdn-icons-png.flaticon.com/512/21/21104.png",
      quote:
        "Workbudd has completely changed how I approach freelance projects. The platform’s speed, transparency, and developer-first mindset make it feel like it was built by engineers—for engineers. I’ve finally found a place where I can focus on shipping great code, not chasing payments.",
      linkedin: "https://www.linkedin.com/in/aman-sagar-362497137/",
      x: "https://x.com/amanzrx",
    },
    {
      id: 2,
      name: "Prince Pal",
      position: "Full Stack Web3 Developer",
      profilePic:
        "/testimonials/Prince.jpeg",
      quote:
        "Working through Workbudd has given me consistent, high-quality projects and the trust of global clients. The onboarding was seamless, and the Web3-native ecosystem makes it easy to collaborate and get paid in crypto without headaches.",
      linkedin: "https://linkedin.com/in/princeai",
      x: "https://x.com/prince_twets",
    },
    {
      id: 3,
      name: "Adwait Keshari",
      position: "Blockchain & Fullstack Developer",
      profilePic:
        "/testimonials/Adwait.jpeg",
      quote:
        "As someone who builds dApps and backend systems, I appreciate how Workbudd empowers developers like me with real ownership and on-chain transparency. It’s more than just a freelancing site—it's a network of serious builders.",
      linkedin: "https://www.linkedin.com/in/adwait-keshari-b5793b294/",
      x: "https://x.com/AdwaitKeshari",
    },
    {
      id: 4,
      name: "Shivansh Anand",
      position: "MERN & React Native Developer",
      profilePic:
        "/testimonials/Shivansh.jpeg",
      quote:
        "What sets Workbudd apart is its simplicity and credibility. It’s rare to find a platform that respects both your time and your talent. I’ve grown my portfolio and landed amazing gigs without the usual platform noise.",
      linkedin:
        "https://www.linkedin.com/in/shivansh-anand-%F0%9F%93%88-aa48851b8/",
      x: "",
    },
    {
      id: 5,
      name: "Harsh Pandey",
      position: "Blockchain Developer",
      profilePic:
        "/testimonials/harsh.jpeg",
      quote:
        "Workbudd is a game-changer for blockchain devs. I’ve connected with serious clients and shipped meaningful work. The smart contract-based system ensures payments are fast and fair—and that’s what freelancers need most.",
      linkedin:
        "https://www.linkedin.com/in/harsh-pandey-aa783925a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      x: "https://x.com/HarshPandey9984?t=jcRv2XPHxLfzCUijL7ZTqA&s=09",
    },
    {
      id: 6,
      name: "Abhishek Jadhav",
      position: "Web3 Developer",
      profilePic:
        "/testimonials/Abhishek.jpeg",
      quote:
        "Workbudd stands out as a platform that understands Web3. The tools, the people, and the culture make it easier to focus on impact-driven code. It’s where I go when I want to work with teams who actually care about decentralization.",
      linkedin: "https://www.linkedin.com/in/AbhishekJadhav2002",
      x: "https://x.com/Abhishek_Jadhv",
    },
    {
      id: 7,
      name: "Sujal Joshi",
      position: "Smart Contract Engineer",
      profilePic:
        "/testimonials/Sujal.jpeg",
      quote:
        "Freelancing through Workbudd gives me the freedom to build and scale meaningful projects. The escrowed smart contracts and milestone-based payments remove all the stress from the equation. I feel like my time is finally valued.",
      linkedin: "https://www.linkedin.com/in/sujaljoshi19",
      x: "",
    },
    {
      id: 8,
      name: "Antony Nelson",
      position: "DevOps & Backend Specialist",
      profilePic: "https://cdn-icons-png.flaticon.com/512/21/21104.png",
      quote:
        "Most freelance platforms don’t get backend workflows—but Workbudd does. Their system runs like clockwork, with strong infrastructure and real respect for technical contributors. It’s the most developer-centric environment I’ve worked in.",
      linkedin: "#",
      x: "",
    },
    {
      id: 9,
      name: "Durgesh Kumar Prajapati",
      position: "Blockchain Security Auditor",
      profilePic:
        "/testimonials/Durgesh.jpeg",
      quote:
        "Workbudd is more than just a place to find gigs—it’s a hub for top-tier blockchain talent. The quality of projects and level of professionalism I’ve experienced here is unmatched. Every project feels like a serious collaboration.",
      linkedin: "https://www.linkedin.com/in/durgesh4993/",
      x: "https://twitter.com/durgesh4993",
    },
    {
      id: 10,
      name: "Chandra Shekhar Choudhary",
      position: "Software Engineer",
      profilePic:
        "/testimonials/Chandra.jpeg",
      quote:
        "What I love most about Workbudd is the trust. The clients are authentic, the deliverables are clear, and the payments are automated. It’s the kind of platform that actually values both sides of the table—clients and freelancers.",
      linkedin:
        "https://www.linkedin.com/in/chandra-shekhar-choudhary-a0a8b590?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      x: "https://x.com/chandu23531353?t=bfVUOTaDwVIC_M-f1xn-GQ&s=09",
    },
    {
      id: 11,
      name: "Muskan Bansal",
      position: "UI/UX Designer",
      profilePic:
        "/testimonials/Muskan.jpeg",
      quote:
        "Designing for Web3 startups can be chaotic—unless you’re on Workbudd. The structured processes, transparent scopes, and forward-thinking teams make every project a creative partnership. I feel seen and supported here.",
      linkedin: "https://www.linkedin.com/in/muskanbansal123",
      x: "",
    },
    {
      id: 12,
      name: "Salma Shaik",
      position: "Frontend Developer",
      profilePic: "https://cdn-icons-png.flaticon.com/512/21/21104.png",
      quote:
        "Workbudd brings together serious teams and talented devs in a way that feels collaborative and fair. From clean project specs to reliable payments, every detail has been thought through. It’s the best experience I’ve had freelancing.",
      linkedin:
        "https://www.linkedin.com/in/shaik-saleema-890573260?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      x: "",
    },
  ];

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const current = testimonials[currentTestimonial];

  return (
    <div className="px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-16 2xl:px-20 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-10 2xl:py-12 3xl:py-14">
      <div
        ref={testimonialsRef}
        className="bg-gray-100 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-10 2xl:p-12 3xl:p-16 text-center mx-auto w-full max-w-[100%] xs:max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[87%] xl:max-w-[88%] 2xl:max-w-[85%] 3xl:max-w-[80%] transition-all duration-200 ease-in-out"
        style={{
          filter: "none",
          transition: "filter 0.2s ease-in-out",
        }}
        onMouseEnter={() => {
          if (testimonialsRef.current) {
            testimonialsRef.current.style.filter =
              "drop-shadow(0 1px 12px rgba(41, 163, 218, 0.6)) drop-shadow(0 2px 16px rgba(255, 112, 57, 0.8)) drop-shadow(0 3px 20px rgba(255, 195, 40, 0.7)) drop-shadow(0 4px 24px rgba(151, 62, 238, 0.6)) drop-shadow(0 5px 28px rgba(230, 31, 122, 0.5)) drop-shadow(0 6px 32px rgba(68, 176, 255, 0.4))";
          }
        }}
        onMouseLeave={() => {
          if (testimonialsRef.current) {
            testimonialsRef.current.style.filter = "none";
          }
        }}
      >
        <h2 className="text-lg xs:text-xl sm:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl font-bold mb-4 xs:mb-6 sm:mb-8 lg:mb-10 xl:mb-10 2xl:mb-12 3xl:mb-16">
          Why Freelancers Love Workbudd ?
        </h2>
        {/* Audi logo style 14 LinkedIn DP circles */}
        <div className="flex justify-center items-center mb-6 gap-2 flex-wrap">
          {testimonials.map((person, idx) => (
            <a
              key={person.id}
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              title={person.name}
              className="inline-block rounded-full border-2 border-blue-400 hover:border-purple-600 transition-all duration-200 shadow-md w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11 overflow-hidden bg-white"
              style={{ marginLeft: idx === 0 ? 0 : -32, zIndex: 14 - idx }}
            >
              <img
                src={person.profilePic}
                alt={person.name}
                className="w-full h-full object-cover rounded-full"
              />
            </a>
          ))}
        </div>
        <p className="text-sm xs:text-base sm:text-lg lg:text-lg xl:text-lg 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl text-gray-700 mb-8 xs:mb-12 sm:mb-16 lg:mb-18 xl:mb-16 2xl:mb-20 3xl:mb-24 max-w-8xl mx-auto leading-relaxed px-2 xs:px-0">
          At Workbudd, we're redefining the future of freelancing — fully
          on-chain, censorship-resistant, and community-led. Our users aren't
          just freelancers or clients; they're Web3 pioneers shaping how work
          gets done in a decentralized world. Here's what they're saying:
        </p>

        {/* Testimonial Carousel */}
        <div className="rounded-lg xs:rounded-xl p-1 xs:p-2 sm:p-4 md:p-6 lg:p-6 xl:p-6 2xl:p-7 3xl:p-8 mx-auto">
          {/* Mobile Layout */}
          <div className="flex flex-col md:hidden space-y-4">
            {/* Testimonial Content */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Profile Section */}
              <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                <img
                  src={current.profilePic}
                  alt={current.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {current.name}
                  </h3>
                  <p className="text-gray-600 text-xs">{current.position}</p>
                  <div className="flex justify-center items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 mt-1">
                    {current.x && (
                      <a
                        href={current.x}
                        className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                        aria-label="Twitter"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    )}
                    {current.linkedin && (
                      <a
                        href={current.linkedin}
                        className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                        aria-label="LinkedIn"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="text-center max-w-2xl">
                <p className="text-gray-800 text-sm leading-relaxed font-bold">
                  "{current.quote}"
                </p>
              </div>
            </div>

            {/* Navigation Arrows - Horizontal line below content */}
            <div className="flex justify-center items-center space-x-8">
              <button
                onClick={prevTestimonial}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
              >
                <svg
                  className="w-3 h-3 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextTestimonial}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
              >
                <svg
                  className="w-3 h-3 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden md:flex items-center justify-between space-x-2 sm:space-x-4 lg:space-x-5 xl:space-x-6">
            {/* Left Navigation Arrow */}
            <button
              onClick={prevTestimonial}
              className="p-1.5 sm:p-2 lg:p-2.5 xl:p-3 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Testimonial Content */}
            <div className="flex flex-row items-start justify-center text-left flex-1 space-x-4 sm:space-x-24 lg:space-x-28 xl:space-x-24 2xl:space-x-32 3xl:space-x-48 4xl:space-x-56">
              {/* Profile Section */}
              <div className="flex flex-row items-center space-x-3 sm:space-x-4 lg:space-x-5 xl:space-x-3 2xl:space-x-4 3xl:space-x-5 flex-shrink-0">
                <img
                  src={current.profilePic}
                  alt={current.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-18 xl:h-18 2xl:w-20 2xl:h-20 3xl:w-24 3xl:h-24 rounded-full object-cover"
                />
                <div className="text-left">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-xl text-gray-900">
                    {current.name}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base xl:text-sm 2xl:text-base 3xl:text-lg">
                    {current.position}
                  </p>
                  <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-4 mt-1">
                    {current.x && (
                      <a
                        href={current.x}
                        className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                        aria-label="Twitter"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    )}
                    {current.linkedin && (
                      <a
                        href={current.linkedin}
                        className="gradient-icon cursor-pointer transition-all duration-300 hover:scale-125"
                        aria-label="LinkedIn"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="flex-1 text-left max-w-2xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
                <p className="text-gray-800 text-sm sm:text-base lg:text-lg xl:text-base 2xl:text-lg 3xl:text-2xl leading-relaxed font-bold">
                  "{current.quote}"
                </p>
              </div>
            </div>

            {/* Right Navigation Arrow */}
            <button
              onClick={nextTestimonial}
              className="p-1.5 sm:p-2 lg:p-2.5 xl:p-3 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-2 xs:mt-3 sm:mt-4 lg:mt-5 xl:mt-4 2xl:mt-5 3xl:mt-6 space-x-1 xs:space-x-1.5 sm:space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full transition-colors duration-200 ${index === currentTestimonial ? "bg-purple-600" : "bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div
        ref={feedbackRef}
        className="mx-auto mt-16 xs:mt-20 sm:mt-16 md:mt-20 lg:mt-22 xl:mt-20 2xl:mt-24 3xl:mt-32 w-full max-w-[100%] xs:max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[87%] xl:max-w-[88%] 2xl:max-w-[85%] 3xl:max-w-[80%] bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] transition-all duration-200 px-4 xs:px-6 sm:px-16 md:px-18 lg:px-20 xl:px-16 2xl:px-20 3xl:px-28 4xl:px-32 5xl:px-36 py-8 xs:py-6 sm:py-10 lg:py-11 xl:py-10 2xl:py-12 3xl:py-14"
        style={{
          filter: "none",
          transition: "filter 0.2s ease-in-out",
        }}
        onMouseEnter={() => {
          if (feedbackRef.current) {
            feedbackRef.current.style.filter =
              "drop-shadow(0 1px 12px rgba(41, 163, 218, 0.6)) drop-shadow(0 2px 16px rgba(255, 112, 57, 0.8)) drop-shadow(0 3px 20px rgba(255, 195, 40, 0.7)) drop-shadow(0 4px 24px rgba(151, 62, 238, 0.6)) drop-shadow(0 5px 28px rgba(230, 31, 122, 0.5)) drop-shadow(0 6px 32px rgba(68, 176, 255, 0.4))";
          }
        }}
        onMouseLeave={() => {
          if (feedbackRef.current) {
            feedbackRef.current.style.filter = "none";
          }
        }}
      >
        {/* Made with heart */}
        <div className="flex items-center justify-center mb-2 xs:mb-3 sm:mb-5 lg:mb-8 xl:mb-11 opacity-100">
          <span className="text-lg xs:text-xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl text-gray-400 mr-2 xs:mr-3 sm:mr-4 font-bold">
            Made with
          </span>
          <div className="relative">
            <svg
              className="w-6 h-6 xs:w-8 xs:h-8 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 3xl:w-20 3xl:h-20 text-red-500"
              height="200px"
              width="200px"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 19.625 19.625"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <g>
                  <path
                    style={{ fill: "#eb0a0a" }}
                    d="M18.73,2.645c-0.818-1.074-2.117-1.692-3.969-1.889C14.612,0.74,14.455,0.73,14.295,0.73 c-1.604,0-3.423,0.777-4.483,2.248c-1.06-1.47-2.877-2.247-4.481-2.247c-0.158,0-0.315,0.009-0.465,0.025 c-1.852,0.197-3.151,0.815-3.97,1.889c-0.81,1.062-1.074,2.516-0.778,4.324c0.719,4.385,8.838,11.425,9.183,11.723 c0.158,0.135,0.352,0.203,0.546,0.203c0.196,0,0.393-0.068,0.55-0.206c0.342-0.298,8.394-7.336,9.11-11.721 C19.803,5.163,19.542,3.708,18.73,2.645z M18.349,7.647c0,0-0.314-4.707-4.497-5.334C13.853,2.313,18.873,1.581,18.349,7.647z"
                  ></path>
                </g>
              </g>
            </svg>
          </div>
        </div>

        <h3 className="text-lg xs:text-xl sm:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl font-bold text-gray-900 mb-4 xs:mb-6 sm:mb-8 lg:mb-10 xl:mb-8 2xl:mb-10 3xl:mb-16">
          Got Feedback for Workbudd?
        </h3>
        <p className="text-gray-600 text-sm xs:text-base sm:text-lg lg:text-lg xl:text-lg 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl mb-6 xs:mb-8 sm:mb-10 lg:mb-12 xl:mb-10 2xl:mb-12 3xl:mb-18 leading-relaxed">
          <b>Still Have Suggestions?</b>
          <br />
          We're building Workbudd with our community — and your input shapes
          every feature. Whether you're a developer, freelancer, or curious
          explorer, we want to hear from you.
        </p>
        <p className="text-gray-800 text-sm xs:text-base sm:text-lg lg:text-xl xl:text-lg 2xl:text-xl 3xl:text-4xl 4xl:text-5xl mb-4 xs:mb-6 sm:mb-8 lg:mb-12 xl:mb-8 2xl:mb-10 3xl:mb-16 font-medium lg:font-semibold">
          Drop your valuable feedback below:
        </p>

        <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-7">
          <div className="relative max-w-7xl">
            <textarea
              placeholder="Please describe your idea or suggestion clearly..."
              className="w-full p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-6 2xl:p-8 3xl:p-10 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-lg sm:rounded-xl lg:rounded-2xl resize-none h-24 xs:h-28 sm:h-32 lg:h-40 xl:h-32 2xl:h-40 3xl:h-48 text-sm xs:text-base sm:text-lg lg:text-xl xl:text-base 2xl:text-lg 3xl:text-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder-gray-400 bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="flex justify-center sm:justify-start">
            <button
              className="w-auto xs:w-auto sm:w-[18%] md:w-[22%] lg:w-[26%] xl:w-[24%] 2xl:w-[26%] 3xl:w-[28%] min-w-[120px] xs:min-w-[140px] sm:min-w-[180px] lg:min-w-[200px] px-4 xs:px-5 sm:px-6 lg:px-8 xl:px-6 2xl:px-8 3xl:px-10 py-3 xs:py-3.5 sm:py-4 lg:py-5 xl:py-4 2xl:py-5 3xl:py-6 rounded-full text-white text-sm xs:text-base sm:text-lg lg:text-xl xl:text-base 2xl:text-lg 3xl:text-2xl font-semibold hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: "#041D37" }}
            >
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sect8;
