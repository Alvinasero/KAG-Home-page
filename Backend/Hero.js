import React from 'react';

const Hero = () => {
  return (
    <div className="relative h-screen flex items-center justify-center bg-navy-900 overflow-hidden">
      {/* Background Video/Image Overlay */}
      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
      <div className="relative z-20 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in">
          KAG MARIDADI CHURCH
        </h1>
        <p className="text-xl md:text-2xl text-gold-400 font-light italic mb-8">
          "Raising Lives, Building Faith, Transforming Nations"
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-3 rounded-full font-bold transition-all">Watch Live</button>
          <button className="border-2 border-white text-white hover:bg-white hover:text-navy-900 px-8 py-3 rounded-full font-bold transition-all">Give Online</button>
        </div>
      </div>
    </div>
  );
};

export default Hero;