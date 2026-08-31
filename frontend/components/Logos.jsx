const Logos = () => {
  // Logo links in order 1-11
  const logoLinks = [
    
    "https://dfinity.org",
    "https://metamask.io", 
    "https://www.fireblocks.com",
    "https://www.assuredefi.com",
    "https://coinmarketcap.com",
    // "https://aws.amazon.com",
    "https://www.coinbase.com",
    "https://www.coindesk.com",
    "https://swing.xyz",
    "https://www.emoney.io/",
    "https://consensys.io",
  ];

  return (
    <div className="w-full bg-white px-4 my-4 sm:my-6 md:my-8 lg:my-12 xl:my-16 2xl:my-0">
      {/* Responsive flex container with Section 4 width constraint */}
      <div className="max-w-[120rem] mx-auto">
        <div className="flex flex-wrap lg:flex-nowrap justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-6 xl:gap-8 2xl:gap-10">
          {[1, 2, 3, 4, 5, 7, 8, 9, 10, 11].map((logoNumber, index) => (
            <div
              key={logoNumber}
              className="flex items-center justify-center px-1 py-1"
            >
              <a
                href={logoLinks[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 duration-200"
              >
                <img
                  src={`/logos/${logoNumber}.png`}
                  alt={`Logo ${logoNumber}`}
                  className="h-16 w-24 sm:h-20 sm:w-28 md:h-24 md:w-32 lg:h-28 lg:w-36 xl:h-32 xl:w-40 2xl:h-36 2xl:w-44 object-contain"
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Logos;
