import React, { useState, useEffect } from 'react';

export default function PresaleTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    // Function to calculate time difference
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endDate);
      const difference = end - now;
      
      // If presale has ended
      if (difference <= 0) {
        setIsEnded(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return { days, hours, minutes, seconds };
    };
    
    // Set initial time
    setTimeLeft(calculateTimeLeft());
    
    // Update countdown every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [endDate]);
  
  // Format number to always have two digits
  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num;
  };

  return (
    <div className="mt-6 text-center">
      {isEnded ? (
        <div className="bg-red-900/30 px-6 py-4 rounded-lg inline-block">
          <p className="text-2xl font-bold text-red-400">Presale Has Ended</p>
          <p className="text-gray-300 mt-1">Contact support for more information</p>
        </div>
      ) : (
        <div className="w-full">
          <h3 className="text-xl font-bold mb-3 text-gray-200">Presale Ends In</h3>
          
          <div className="flex justify-center gap-3 md:gap-4">
            <div className="flex-1 max-w-[70px] bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30 shadow-lg relative overflow-hidden">
              <div className="relative z-10 text-3xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.days)}</div>
              <div className="relative z-10 text-xs text-gray-300 mt-1 font-medium">Days</div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 animate-pulse-slow"></div>
            </div>
            
            <div className="flex-1 max-w-[70px] bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30 shadow-lg relative overflow-hidden animation-delay-1000">
              <div className="relative z-10 text-3xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.hours)}</div>
              <div className="relative z-10 text-xs text-gray-300 mt-1 font-medium">Hours</div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 animate-pulse-slow"></div>
            </div>
            
            <div className="flex-1 max-w-[70px] bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30 shadow-lg relative overflow-hidden">
              <div className="relative z-10 text-3xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.minutes)}</div>
              <div className="relative z-10 text-xs text-gray-300 mt-1 font-medium">Mins</div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 animate-pulse-slow"></div>
            </div>
            
            <div className="flex-1 max-w-[70px] bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30 shadow-lg relative overflow-hidden animation-delay-1000">
              <div className="relative z-10 text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent animate-pulse-slow">{formatNumber(timeLeft.seconds)}</div>
              <div className="relative z-10 text-xs text-gray-300 mt-1 font-medium">Secs</div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-purple-600/10 animate-pulse-slow"></div>
            </div>
          </div>
          
          <p className="text-yellow-400 text-sm mt-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Token price increases after presale ends
          </p>
        </div>
      )}
    </div>
  );
}