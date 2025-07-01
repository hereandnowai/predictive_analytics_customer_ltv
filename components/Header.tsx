
import React from 'react';

// HERE AND NOW AI Branding
const brand = {
  shortName: "HERE AND NOW AI",
  logo: {
    title: "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png"
  }
};

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img src={brand.logo.title} alt={`${brand.shortName} Logo`} className="h-10 md:h-12 mr-3" />
          {/* Optional: Add brand name text if not clear in logo, or for SEO, screen readers */}
          {/* <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {brand.shortName} LTV Analyzer
          </h1> */}
        </div>
        <a 
            href="https://ai.google.dev/gemini-api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
            Powered by Gemini API
        </a>
      </div>
    </header>
  );
};