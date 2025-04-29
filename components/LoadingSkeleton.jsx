"use client";

import React from "react";

export function NFTCardSkeleton() {
  return (
    <div className="border border-purple-500/30 rounded-lg overflow-hidden hover:shadow-lg transition-all animate-pulse">
      <div className="aspect-square w-full bg-gradient-to-b from-gray-700 to-gray-800"></div>
      <div className="p-3 space-y-2">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md animate-pulse flex items-center">
      <div className="h-4 bg-gray-700 rounded w-48"></div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-32"></div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-16"></div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex space-x-2">
          <div className="h-7 bg-gray-700 rounded w-12"></div>
          <div className="h-7 bg-gray-700 rounded w-12"></div>
          <div className="h-7 bg-gray-700 rounded w-12"></div>
        </div>
      </td>
    </tr>
  );
}

export default function LoadingSkeleton({ type = "nft", count = 3 }) {
  // 스켈레톤 배열 생성
  const skeletons = Array(count).fill(null);

  if (type === "nft") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((_, index) => (
          <NFTCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (type === "transaction") {
    return (
      <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-purple-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Transaction</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Rewards</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {skeletons.map((_, index) => (
            <TransactionSkeleton key={index} />
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "profile") {
    return <ProfileSkeleton />;
  }

  return null;
}