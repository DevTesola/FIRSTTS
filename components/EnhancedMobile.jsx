"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletStatus from "./WalletStatus";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { connected } = useWallet();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest(".mobile-menu") && !e.target.closest(".menu-toggle")) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);
  
  // Close menu when ESC key is pressed
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);
  
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  
  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        className="menu-toggle md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          // Close icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Menu icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      
      {/* Mobile menu overlay */}
      <div 
        className={`mobile-menu fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
        
        {/* Menu content */}
        <div className={`absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-gray-900 shadow-xl transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          {/* Menu header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
            <div className="font-bold text-xl">SOLARA</div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-gray-800"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Wallet status */}
          {connected && (
            <div className="px-4 py-3">
              <WalletStatus className="w-full" />
            </div>
          )}
          
          {/* Menu items */}
          <nav className="px-2 pt-3 pb-5">
            <ul className="space-y-1">
              <MenuItem href="/" label="Home" icon={HomeIcon} onClick={() => setIsOpen(false)} />
              <MenuItem href="/my-collection" label="My Collection" icon={CollectionIcon} onClick={() => setIsOpen(false)} />
              <MenuItem href="/transactions" label="Transactions" icon={TransactionIcon} onClick={() => setIsOpen(false)} />
              <MenuItem href="/#value" label="Value Proposition" icon={ValueIcon} onClick={() => setIsOpen(false)} />
              <MenuItem href="/#roadmap" label="Roadmap" icon={RoadmapIcon} onClick={() => setIsOpen(false)} />
            </ul>
          </nav>
          
          {/* Social links */}
          <div className="px-4 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Follow Us</p>
            <div className="flex space-x-4">
              <SocialButton href="https://twitter.com/TESLAINSOLANA" icon={TwitterIcon} label="Twitter" />
              <SocialButton href="https://t.me/TESLAINSOLANA" icon={TelegramIcon} label="Telegram" />
              <SocialButton href="https://discord.gg/solara" icon={DiscordIcon} label="Discord" />
            </div>
          </div>
          
          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-800">
            © 2025 SOLARA • Built on Solana
          </div>
        </div>
      </div>
    </>
  );
};

// Menu item component
const MenuItem = ({ href, label, icon: Icon, onClick }) => (
  <li>
    <Link
      href={href}
      className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-lg transition-colors"
      onClick={onClick}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span>{label}</span>
    </Link>
  </li>
);

// Social button component
const SocialButton = ({ href, icon: Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
    aria-label={label}
  >
    <Icon className="w-5 h-5 mb-1" />
    <span className="text-xs">{label}</span>
  </a>
);

// Icon components
const HomeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CollectionIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TransactionIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ValueIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const RoadmapIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
  </svg>
);

const DiscordIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.964 19.964 0 0 0 6-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
);

export default MobileMenu;