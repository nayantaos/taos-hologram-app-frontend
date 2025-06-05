import { useState, useEffect, useCallback } from "react";
import { SlidePlayerConfig } from "@/types/slide";
import ThreeDSlide from "./ThreeDSlide";
import VideoSlide from "./VideoSlide";
import NotFound from "@/pages/NotFound";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid"; // or 24/solid

const SlidePlayer = ({ slug }) => {
  const [config, setConfig] = useState<SlidePlayerConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlideFresh, setIsSlideFresh] = useState<boolean>(true);
  const [isPausedByAnnotation, setIsPausedByAnnotation] = useState(false);

  
  const [isModelBeingTouched, setIsModelBeingTouched] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        //const response = await fetch("/config.json");
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/getfiles?token=${slug}`);
        
        if (response.status === 404) {
          <NotFound />;
          return;
        }
        
        if (!response.ok)
          throw new Error("Failed to get model from S3 Bucket.");
        const data = await response.json();
        console.log(data);
        
        setConfig(data);
      } catch (err) {
        setError(
          "Error loading : " +
            (err instanceof Error ? err.message : String(err))
        );
        <NotFound />;
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const goToPreviousSlide = useCallback(() => {
   
    setIsSlideFresh(true);

    if (!config) return;

    setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex - 1 < 0 ? config.files.length - 1 : prevIndex - 1
      );
    }, 500);
  }, [config]);

  const goToNextSlide = useCallback(() => {
    
    setIsSlideFresh(true);

    if (!config) return;

    setTimeout(() => {
      setCurrentSlideIndex(
        (prevIndex) => (prevIndex + 1) % config.files.length
      );
    }, 500);
  }, [config]);

  // Effect to handle rotation_timer

  useEffect(() => {
    if (!config || config.files.length === 0) return;
    const currentSlide = config.files[currentSlideIndex];

    const timer = setTimeout(
      () => setIsSlideFresh(false),
      currentSlide.rotation_time * 1000
    );
    return () => clearTimeout(timer);
  }, [config, setIsSlideFresh, currentSlideIndex]);

  // Effect to handle automatic slide change
  useEffect(() => {
    console.log('isPausedByAnnotation:',isPausedByAnnotation);
    
    if (!isSlideFresh && !isModelBeingTouched && !isPausedByAnnotation) {
      goToNextSlide();
      setIsSlideFresh(true);
    }
  }, [isSlideFresh, setIsSlideFresh, goToNextSlide, isModelBeingTouched, isPausedByAnnotation]);

  const handleAnnotationOpen = useCallback((isOpen: boolean) => {
    setIsPausedByAnnotation(isOpen);
    if (!isOpen) {
      // Reset the timer when annotation closes
      setIsSlideFresh(true);
    }
  }, []);

  // Effect to handle arrow navigation

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEventInit) => {
      if (e.key === "ArrowRight") goToNextSlide();
      if (e.key === "ArrowLeft") goToPreviousSlide();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPreviousSlide]);

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
      <div className="w-full h-screen flex items-center justify-center  text-white">
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
              setCurrentSlideIndex(index);
              setIsSlideFresh(true);
            }}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300
              ${index === currentSlideIndex 
                ? "bg-gray-600 border-gray-600 scale-120" 
                : "bg-transparent border-gray-400 opacity-70 hover:opacity-100"}
            `}
          />
        ))}
      </div>


    </div>
  );
};

export default SlidePlayer;
