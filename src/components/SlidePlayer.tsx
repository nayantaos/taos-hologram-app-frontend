import { useState, useEffect, useCallback, useRef } from "react";
import { SlidePlayerConfig } from "@/types/slide";
import ThreeDSlide from "./ThreeDSlide";
import VideoSlide from "./VideoSlide";
import CameraKitSlide from "./CameraKitSlide";
import NotFound from "@/pages/NotFound";
import { useModelPreloader } from "@/hooks/use-model-preloader"; // adjust path if needed
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Howl } from 'howler';


const SlidePlayer = ({ slug, version  }) => {
  
  
  const [config, setConfig] = useState<SlidePlayerConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPausedByAnnotation, setIsPausedByAnnotation] = useState(false);
  const [isSlideLoading, setIsSlideLoading] = useState<boolean>(true); // 🌟 new
  const soundRef = useRef<Howl | null>(null);
  const autoTimer = useRef<NodeJS.Timeout | null>(null); // ⏲️ External timer ref

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        //const response = await fetch('/config.json');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/getfiles?token=${slug}`);
        if (response.status === 404) {
          <NotFound />;
          return;
        }
        if (!response.ok) throw new Error("Failed to get model from S3 Bucket.");
        const data = await response.json();
        //const filteredData = version === "1" ? { ...data, files: [data.files[0]] } : data;
        console.log('data:',data);
        
        setConfig(data);
        //setConfig(data);
        

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
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }
    setCurrentSlideIndex((prevIndex) =>
      prevIndex - 1 < 0 ? config.files.length - 1 : prevIndex - 1
    );
  }, [config]);

  const goToNextSlide = useCallback(() => {
    if (!config) return;
    clearAutoTimer();
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }
    setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % config.files.length);
  }, [config]);

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const startAutoTimer = useCallback((rotationTimeSec: number) => {
    //if (version === "1") return; 
    clearAutoTimer();
    autoTimer.current = setTimeout(() => {
      if (!isPausedByAnnotation) {
        goToNextSlide();
      }
    }, rotationTimeSec * 1000);
  }, [goToNextSlide, isPausedByAnnotation, version]);

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
      //if (version === "1") return; 
      if (config) {
        const slide = config.files[currentSlideIndex];
        startAutoTimer(slide.rotation_time);
      }
    }, 2000); // 1 second delay after model is visible
  }, [config, currentSlideIndex, startAutoTimer, version]);

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
      {(() => {
        const slide = config.files[currentSlideIndex];
        return (
          <div
            key={currentSlideIndex}
            className="absolute px-42 md:px-0 inset-0 transition-opacity duration-700 ease-in-out opacity-100 z-10"
          >
            {slide.type === "3d" ? (
              <ThreeDSlide
                key={`slide-${currentSlideIndex}`}
                slide={slide}
                isActive={true}
                onAnnotationOpen={handleAnnotationOpen}
                onModelLoaded={handleModelLoaded}
                version={version}
              />
            ) : slide.type === "Video" ? (
              <VideoSlide
                key={`slide-${currentSlideIndex}`}
                slide={slide}
                isActive={true}
                onVideoEnd={goToNextSlide}
              />
            ) : (
              <CameraKitSlide
                key={`slide-${currentSlideIndex}`}
                slide={slide}
                isActive={true}
                onSlideEnd={goToNextSlide}
              />
            )}
          </div>
        );
      })()}

      {version !== "1" && config.files[currentSlideIndex].type === "3d" && (
        <div
          className={`absolute ${
            version === "1"
              ? "top-[calc(100dvh-40px)]"
              : "top-[calc(70dvh-20px)]"
          } left-4 z-50 flex space-x-2`}
        >
          
          {config.files.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isSlideLoading && index !== currentSlideIndex) {
                  setCurrentSlideIndex(index);
                  clearAutoTimer();
                  setIsSlideLoading(true);
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
      )}

      {version === "1" && (
        <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between z-50 px-4 pointer-events-none">
          <button
            onClick={goToPreviousSlide}
            className="p-2 text-black pointer-events-auto"
          >
            <ChevronLeftIcon className="w-100 h-10" />
          </button>

          <button
            onClick={goToNextSlide}
            className="p-2 text-black pointer-events-auto"
          >
            <ChevronRightIcon className="w-100 h-10" />
          </button>
        </div>
      )}
    </div>
  );

};

export default SlidePlayer;
