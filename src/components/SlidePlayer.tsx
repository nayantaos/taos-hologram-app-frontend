import { useState, useEffect, useCallback } from "react";
import { SlidePlayerConfig } from "@/types/slide";
import ThreeDSlide from "./ThreeDSlide";
import VideoSlide from "./VideoSlide";
import NotFound from "@/pages/NotFound";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'; // or 24/solid


const SlidePlayer = ({ slug }) => {
  const [config, setConfig] = useState<SlidePlayerConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  

  useEffect(() => {
    const fetchConfig = async () => {
      try {       
        const response = await fetch('/config.json');
        //const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/getfiles?token=${slug}`);

        if (response.status === 404) {
          <NotFound />
          return; // stop further execution
        }
        
        if (!response.ok) throw new Error("Failed to get model from S3 Bucket.");
        const data = await response.json();
               
        setConfig(data);
      } catch (err) {
        setError("Error loading : " + (err instanceof Error ? err.message : String(err)));
        <NotFound />
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const goToPreviousSlide = useCallback(() => {
    if (!config) return;
    setFadeOut(true);
    setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex - 1 < 0 ? config.files.length - 1 : prevIndex - 1
      );
      setFadeOut(false);
    }, 500);
  }, [config]);

  const goToNextSlide = useCallback(() => {
    if (!config) return;
    setFadeOut(true);
    setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        (prevIndex + 1) % config.files.length
      );
      setFadeOut(false);
    }, 500);
  }, [config]);

  useEffect(() => {
    if (!config || config.files.length === 0) return;
    const currentSlide = config.files[currentSlideIndex];
    const timer = setTimeout(goToNextSlide, currentSlide.rotation_time * 1000);
    return () => clearTimeout(timer);
  }, [currentSlideIndex, config, goToNextSlide]);

  if (error) {
    return <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-4">
        <h1 className="text-2xl mb-4">Error</h1>
        <p>{error}</p>
      </div>
    </div>;
  }

  
  if (loading || !config || config.files.length === 0) {
    return <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <p>Loading...</p>
    </div>;
  }
  
  return (
    <div className="w-full h-screen overflow-hidden bg-black relative">
      {config.files.map((slide, index) => (
        <div
        key={index}
        className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${fadeOut ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ display: index === currentSlideIndex ? 'block' : 'none' }}
        >
          {slide.type === "3d" ? (
            <ThreeDSlide slide={slide} company_logo={config.company_logo} isActive={index === currentSlideIndex} />
          ) : (
            <VideoSlide slide={slide} isActive={index === currentSlideIndex} />
          )}
        </div>
      ))}
      <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between z-50 px-4 pointer-events-none">
        {/* Previous Button */}
        <button
          onClick={goToPreviousSlide}
          className="p-2 text-black pointer-events-auto"
        >
          <ChevronLeftIcon className="w-10 h-10" />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNextSlide}
          className="p-2 text-black pointer-events-auto"
        >
          <ChevronRightIcon className="w-10 h-10" />
        </button>
      </div>

    </div>
  );
};

export default SlidePlayer;