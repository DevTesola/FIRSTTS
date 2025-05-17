import React from 'react';

export default function SimpleVideo({ src, poster, className, controls = true, autoPlay = false }) {
  return (
    <video
      key={src}  // React가 src가 변경될 때 완전히 새로운 video 요소를 생성하도록 강제
      src={src}
      poster={poster}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={autoPlay}
      playsInline
    >
      Your browser does not support the video tag.
    </video>
  );
}