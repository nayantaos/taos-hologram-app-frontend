import { useEffect, useRef } from "react";
import { SlideConfig } from "@/types/slide";

interface VideoSlideProps {
  slide: SlideConfig;
  isActive: boolean;
}

const VideoSlide = ({ slide, isActive }: VideoSlideProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Autoplay prevented:", error);
      });
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <video
        ref={videoRef}
        src={slide.file}
        className="max-h-full max-w-full object-contain"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
};

export default VideoSlide;
