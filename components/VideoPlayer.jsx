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

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
    setPlaying(!playing);
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

  const decVolume = () => {
    setVolume((v) => Math.max(0, v - 0.1));
    if (volume <= 0.1) setIsMuted(true);
  };

  const incVolume = () => {
    setVolume((v) => Math.min(1, v + 0.1));
    setIsMuted(false);
  };

  return (
    <div className="mt-8 w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl relative">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        className="w-full h-auto"
      />
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          onClick={toggleMute}
          className="bg-black bg-opacity-30 p-2 rounded-full hover:bg-opacity-50"
          aria-label={isMuted ? "음소거 해제" : "음소거"}
        >
          {isMuted ? (
            <SpeakerWaveIcon className="h-5 w-5 text-white" />
          ) : (
            <SpeakerXMarkIcon className="h-5 w-5 text-white" />
          )}
        </button>
        <button
          onClick={togglePlay}
          className="bg-purple-700 p-3 rounded-full hover:bg-opacity-90"
          aria-label={playing ? "비디오 일시정지" : "비디오 재생"}
        >
          {playing ? (
            <PauseIcon className="h-6 w-6 text-white" />
          ) : (
            <PlayIcon className="h-6 w-6 text-white" />
          )}
        </button>
        <button
          onClick={decVolume}
          className="bg-black bg-opacity-30 p-2 rounded-full hover:bg-opacity-50"
          aria-label="볼륨 낮추기"
        >
          <MinusIcon className="h-5 w-5 text-white" />
        </button>
        <button
          onClick={incVolume}
          className="bg-black bg-opacity-30 p-2 rounded-full hover:bg-opacity-50"
          aria-label="볼륨 높이기"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}