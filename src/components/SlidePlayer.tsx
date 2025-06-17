import { useState, useEffect, useCallback, useRef } from "react";
import { SlidePlayerConfig } from "@/types/slide";
import ThreeDSlide from "./ThreeDSlide";
import VideoSlide from "./VideoSlide";
import NotFound from "@/pages/NotFound";
import { useModelPreloader } from "@/hooks/use-model-preloader"; // adjust path if needed


const SlidePlayer = ({ slug }) => {
  const [config, setConfig] = useState<SlidePlayerConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPausedByAnnotation, setIsPausedByAnnotation] = useState(false);
  const [isSlideLoading, setIsSlideLoading] = useState<boolean>(true); // 🌟 new

  const autoTimer = useRef<NodeJS.Timeout | null>(null); // ⏲️ External timer ref

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/getfiles?token=${slug}`);
        if (response.status === 404) {
          <NotFound />;
          return;
        }
        if (!response.ok) throw new Error("Failed to get model from S3 Bucket.");
        const data = await response.json();
        setConfig(data);
        

      } catch (err) {
        setError("Error loading: " + (err instanceof Error ? err.message : String(err)));
        <NotFound />;
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [slug]);

  //Pre load custom hook
  useModelPreloader(config?.files?.filter(f => f.type === '3d').map(f => f.file));

  const goToPreviousSlide = useCallback(() => {
    if (!config) return;
    clearAutoTimer();
    setCurrentSlideIndex((prevIndex) =>
      prevIndex - 1 < 0 ? config.files.length - 1 : prevIndex - 1
    );
  }, [config]);

  const goToNextSlide = useCallback(() => {
    if (!config) return;
    clearAutoTimer();
    setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % config.files.length);
  }, [config]);

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const startAutoTimer = useCallback((rotationTimeSec: number) => {
    clearAutoTimer();
    autoTimer.current = setTimeout(() => {
      if (!isPausedByAnnotation) {
        goToNextSlide();
      }
    }, rotationTimeSec * 1000);
  }, [goToNextSlide, isPausedByAnnotation]);

  const handleAnnotationOpen = useCallback((isOpen: boolean) => {
    setIsPausedByAnnotation(isOpen);
    if (!isOpen && config) {
      const slide = config.files[currentSlideIndex];
      startAutoTimer(slide.rotation_time);
    } else {
      clearAutoTimer();
    }
  }, [config, currentSlideIndex, startAutoTimer]);

  const handleModelLoaded = useCallback(() => {
    setTimeout(() => {
      setIsSlideLoading(false); // ⏱️ Enable dots after delay
      if (config) {
        const slide = config.files[currentSlideIndex];
        startAutoTimer(slide.rotation_time);
      }
    }, 2000); // 1 second delay after model is visible
  }, [config, currentSlideIndex, startAutoTimer]);

  useEffect(() => {
    clearAutoTimer(); // Clear when slide changes
    setIsPausedByAnnotation(false);
    setIsSlideLoading(true); // 🔒 block when new slide loads
  }, [currentSlideIndex]);


  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-transparent text-white">
        <div className="text-center p-4">
          <h1 className="text-2xl mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !config || config.files.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-transparent relative">
      {config.files.map((slide, index) => (
        <div
          key={index}
          className={`absolute px-42 md:px-0 inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {slide.type === "3d" ? (
            <ThreeDSlide
              slide={slide}
              isActive={index === currentSlideIndex}
              onAnnotationOpen={handleAnnotationOpen}
              onModelLoaded={handleModelLoaded}
            />
          ) : (
            <VideoSlide slide={slide} isActive={index === currentSlideIndex} />
          )}
        </div>
      ))}

      <div className="absolute top-[calc(70dvh-20px)] left-4 z-50 flex space-x-2">
        {config.files.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isSlideLoading && index !== currentSlideIndex) {
                setCurrentSlideIndex(index);
                clearAutoTimer();
                setIsSlideLoading(true); // immediately lock all dots
              }
            }}
            disabled={isSlideLoading}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              index === currentSlideIndex
                ? "bg-gray-600 border-gray-600 scale-120"
                : "bg-transparent border-gray-400 opacity-70 hover:opacity-100"
            } ${isSlideLoading ? "cursor-not-allowed opacity-40" : ""}`}
          />
        ))} 
      </div>
    </div>
  );
};

export default SlidePlayer;
