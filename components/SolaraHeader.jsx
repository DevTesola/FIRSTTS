"use client";

import React from "react";

export default function SolaraHeader() {
  return (
    <div id="home" className="text-center mt-16 space-y-2">
      <h1 className="neon-title text-7xl md:text-8xl">
        SOLARA <span className="text-orange-400">GEN:0</span>
      </h1>
      <p className="text-md md:text-lg font-semibold">
        <span className="text-purple-400">SOLARA</span> : the ultimate symbol of{" "}
        <span className="text-purple-400">Solana Maxis</span>
      </p>
    </div>
  );
}