"use client";

import React from "react";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function CollectionInfo({ minted, collectionSize = 1000 }) {
  return (
    <div className="text-center mt-8 space-y-1">
      <p className="text-xl md:text-2xl">
        <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500">
          {collectionSize}
        </span>{" "}
        uniquely generated{" "}
        <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-300">
          NFTs
        </span>
        . Verified.
      </p>
      <p className="text-lg md:text-xl flex items-center justify-center space-x-2">
        <span>Tiered. Built for Holders.</span>
        <HeartIcon className="h-6 w-6 text-pink-400" />
      </p>
      <p className="text-purple-300 font-mono text-sm md:text-base">
        {minted} / {collectionSize} Minted
      </p>
    </div>
  );
}