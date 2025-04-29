"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/solid";

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Handle video visibility using Intersection Observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && playing) {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
    return () => observer.unobserve(video);
  }, [playing]);

  // Handle volume and mute state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setIsLoaded(true);
    const handleError = () => {
      console.error("Video error:", video.error);
      setHasError(true);
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (playing) {
      // Show controls initially, then hide after 3 seconds
      setControlsVisible(true);
      const hideControls = () => setControlsVisible(false);
      
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
      return () => clearTimeout(controlsTimeoutRef.current);
    } else {
      // Always show controls when paused
      setControlsVisible(true);
    }
  }, [playing]);

  // Control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playing) {
      video.pause();
    } else {
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing video:", error);
          });
        }
      } catch (error) {
        console.error("Error in play method:", error);
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const decreaseVolume = () => {
    setVolume((v) => {
      const newVolume = Math.max(0, v - 0.1);
      if (newVolume <= 0.1) setIsMuted(true);
      return newVolume;
    });
  };

  const increaseVolume = () => {
    setVolume((v) => {
      const newVolume = Math.min(1, v + 0.1);
      setIsMuted(false);
      return newVolume;
    });
  };

  // Show controls when mouse enters
  const handleMouseEnter = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  // Start hiding timer when mouse leaves
  const handleMouseLeave = () => {
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1500);
    }
  };

  return (
    <div 
      className="mt-8 w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl relative video-player-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        className={`w-full h-auto ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white flex-col">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-center">Video playback error</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Reload
          </button>
        </div>
      )}
      
      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 inset-x-0 flex justify-between items-center p-2 sm:p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left side - play/pause */}
        <button
          onClick={togglePlay}
          className="group bg-purple-700 p-2 sm:p-3 rounded-full hover:bg-purple-600 transition-colors touch-manipulation"
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {playing ? (
            <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
        
        {/* Right side - volume controls */}
        <div className="flex space-x-1 sm:space-x-2">
          {/* On mobile, we only show mute toggle for simplicity */}
          <div className="hidden sm:block">
            <button
              onClick={decreaseVolume}
              className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors touch-manipulation"
              aria-label="Decrease volume"
            >
              <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
          </div>
          
          <button
            onClick={toggleMute}
            className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors touch-manipulation"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            ) : (
              <SpeakerWaveIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </button>
          
          {/* On mobile, we only show mute toggle for simplicity */}
          <div className="hidden sm:block">
            <button
              onClick={increaseVolume}
              className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors touch-manipulation"
              aria-label="Increase volume"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}