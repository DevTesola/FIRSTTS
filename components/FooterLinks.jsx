"use client";

import React from "react";
import Link from 'next/link';
import { CheckBadgeIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

export default function FooterLinks({ onShowHowItWorks }) {
  return (
    <footer className="mt-16 py-8 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-6 justify-center">
            {/* "Verified on Magic Eden" link */}
            <a
              href="https://magiceden.io/marketplace/solara"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:underline"
            >
              <CheckBadgeIcon className="h-6 w-6 text-green-400" />
              <span className="font-semibold text-purple-400">Verified on Magic Eden</span>
            </a>
            
            <button
              onClick={onShowHowItWorks}
              className="flex items-center space-x-2 text-white bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              <InformationCircleIcon className="h-5 w-5" />
              <span>How it works</span>
            </button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2025 TESOLA & SOLARA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}