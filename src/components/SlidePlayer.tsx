import { useState, useEffect, useCallback } from "react";
import { SlidePlayerConfig } from "@/types/slide";
import ThreeDSlide from "./ThreeDSlide";
import VideoSlide from "./VideoSlide";

const SlidePlayer = () => {
  const [config, setConfig] = useState<SlidePlayerConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/config.json');
        //const response = await fetch('http://34.229.246.17/admin/api/getfiles');
        if (!response.ok) throw new Error("Failed to get model from S3 Bucket.");
        const data = await response.json();
        setConfig(data);
        console.log(data);
      } catch (err) {
        setError("Error loading : " + (err instanceof Error ? err.message : String(err)));
        console.error("Error loading configuration:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const goToNextSlide = useCallback(() => {
    if (!config) return;
    setFadeOut(true);
    setTimeout(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1 >= config.files.length ? 0 : prevIndex + 1));
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
            <ThreeDSlide slide={slide} isActive={index === currentSlideIndex} />
          ) : (
            <VideoSlide slide={slide} isActive={index === currentSlideIndex} />
          )}
        </div>
      ))}
    </div>
  );
};

export default SlidePlayer;