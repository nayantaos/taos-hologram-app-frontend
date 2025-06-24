import { useEffect, useRef, useState } from "react";
import { SlideConfig } from "@/types/slide";

interface VideoSlideProps {
  slide: SlideConfig;
  isActive: boolean;
  onVideoEnd: () => void;
}

const VideoSlide = ({ slide, isActive, onVideoEnd }: VideoSlideProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // Default volume
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);


  // Initialize video volume and mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Autoplay prevented:", error);
        });
      }
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.muted = true; // Property, not just JSX attribute
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      // Delay ensures video is ready to accept `play()`
      const tryPlay = async () => {
        try {
          await video.play();
          console.log("🎬 Video autoplay started");

          // After autoplay starts, unmute and set volume
          video.muted = false;
          video.volume = 0.5; // Set desired audio level (0.0 to 1.0)
          console.log("🔊 Audio level set to 50%");
        } catch (err) {
          console.warn("⚠️ Autoplay failed:", err);
        }
      };

      // Small delay (iOS workaround)
      const timeout = setTimeout(tryPlay, 100);

      return () => clearTimeout(timeout);
    }
  }, []);


  // Handle video events
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const handleEnded = () => onVideoEnd();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onVideoEnd]);

  // Handle play/pause when active state changes
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If unmuting, restore previous volume
      if (newMutedState === false && videoRef.current.volume === 0) {
        videoRef.current.volume = volume;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      // Unmute if volume is increased while muted
      if (newVolume > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-black relative">
      <video
        ref={videoRef}
        src={slide.file}
        className="w-full h-full object-cover"
        muted={true}
        autoPlay
        playsInline 
      />
      
      {/* Video Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4 z-10">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>

        {/* Volume Controls */}
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
          >
            {isMuted || volume === 0 ? (
              // Muted icon (speaker with slash)
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : volume > 0.5 ? (
              // High volume icon
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              // Low volume icon
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>

          {/* Volume Slider (shown on hover) */}
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black bg-opacity-70 p-2 rounded-lg">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 accent-white cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSlide;