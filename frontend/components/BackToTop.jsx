'use client';

import { useState, useEffect } from 'react';

function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-12 right-12 z-50 lg:w-16 w-8 h-10 md:w-14 md:h-16 lg:h-24 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 flex items-center justify-center group"
          style={{
            background: `linear-gradient(135deg,
              rgba(41, 163, 218, 0.9) 0%,
              rgba(68, 176, 255, 0.9) 15%,
              rgba(151, 62, 238, 0.9) 35%,
              rgba(230, 31, 122, 0.9) 55%,
              rgba(255, 112, 57, 0.9) 75%,
              rgba(255, 195, 40, 0.9) 100%)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg,
              rgba(41, 163, 218, 1) 0%,
              rgba(68, 176, 255, 1) 15%,
              rgba(151, 62, 238, 1) 35%,
              rgba(230, 31, 122, 1) 55%,
              rgba(255, 112, 57, 1) 75%,
              rgba(255, 195, 40, 1) 100%)`;
            e.currentTarget.style.boxShadow = `
              0 8px 32px rgba(41, 163, 218, 0.4),
              0 12px 40px rgba(68, 176, 255, 0.35),
              0 16px 48px rgba(151, 62, 238, 0.3),
              0 20px 56px rgba(230, 31, 122, 0.25),
              0 24px 64px rgba(255, 112, 57, 0.2),
              0 28px 72px rgba(255, 195, 40, 0.15)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg,
              rgba(41, 163, 218, 0.9) 0%,
              rgba(68, 176, 255, 0.9) 15%,
              rgba(151, 62, 238, 0.9) 35%,
              rgba(230, 31, 122, 0.9) 55%,
              rgba(255, 112, 57, 0.9) 75%,
              rgba(255, 195, 40, 0.9) 100%)`;
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <svg
            className=" w-6 sm:w-12 h-8 sm:h-16 text-white transition-transform duration-300 group-hover:translate-y-[-2px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  );
}

export default BackToTop;
