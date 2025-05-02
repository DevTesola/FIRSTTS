"use client";

import React from "react";
import { CheckBadgeIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

export default function FooterLinks({ onShowHowItWorks }) {
  return (
    <div className="flex justify-center space-x-8 mt-8">
      {/* "Verified on Magic Eden" link */}
      <a
        href="https://magiceden.io/marketplace/slr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 hover:underline"
      >
        <CheckBadgeIcon className="h-6 w-6 text-green-400" />
        <span className="font-semibold text-purple-400">Verified on Magic Eden</span>
      </a>
      
      <button
        onClick={onShowHowItWorks}
        className="flex items-center space-x-2 text-white bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
      >
        <InformationCircleIcon className="h-5 w-5" />
        <span>How it works</span>
      </button>
    </div>
  );
}