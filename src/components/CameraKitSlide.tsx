import { useEffect, useRef, useState } from "react";
import { 
  bootstrapCameraKit, 
  createMediaStreamSource, 
  Transform2D 
} from "@snap/camera-kit";
import { SlideConfig } from "@/types/slide";
import { Howl } from 'howler';

interface CameraKitSlideProps {
  slide: SlideConfig;
  isActive: boolean;
  onSlideEnd?: () => void;
}

const CameraKitSlide = ({ slide, isActive, onSlideEnd }: CameraKitSlideProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const soundRef = useRef<Howl | null>(null);
  const cameraKitRef = useRef<any>(null);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Create canvas element when component mounts
  useEffect(() => {
    if (!containerRef.current || canvasRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-output';
    canvas.className = 'w-full h-full';
    canvasRef.current = canvas;
    containerRef.current.appendChild(canvas);
    setIsCanvasReady(true);

    return () => {
      if (canvasRef.current && containerRef.current?.contains(canvasRef.current)) {
        containerRef.current.removeChild(canvasRef.current);
      }
    };
  }, []);

  // Handle slide rotation timer
  useEffect(() => {
    if (!isActive || !onSlideEnd || !slide.rotation_time) return;

    const startRotationTimer = () => {
      clearRotationTimer();
      rotationTimerRef.current = setTimeout(() => {
        onSlideEnd();
      }, slide.rotation_time * 1000);
    };

    const clearRotationTimer = () => {
      if (rotationTimerRef.current) {
        clearTimeout(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };

    startRotationTimer();

    return () => {
      clearRotationTimer();
    };
  }, [isActive, slide.rotation_time, onSlideEnd]);

  // Initialize Camera Kit only when canvas is ready and slide is active
  useEffect(() => {
    if (!isActive || !isCanvasReady) return;

    let mediaStream: MediaStream;
    let cleanupTimeout: NodeJS.Timeout;

    const initializeCameraKit = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Initialize CameraKit
        const cameraKit = await bootstrapCameraKit({
          apiToken: slide.camera_kit_token || process.env.REACT_APP_CAMERA_KIT_TOKEN,
          logger: process.env.NODE_ENV === 'development' ? 'console' : undefined
        });
        cameraKitRef.current = cameraKit;

        // 2. Create session with existing canvas
        const session = await cameraKit.createSession({ liveRenderTarget: 'canvas-output' });
        setSession(session);

        // 3. Set up error handling
        session.events.addEventListener('error', (event: any) => {
          console.error("CameraKit error:", event.detail);
          if (event.detail.error.name === 'LensExecutionError') {
            setError("The current filter encountered an error");
          }
        });

        // 4. Get user media
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: window.innerWidth * window.devicePixelRatio },
            height: { ideal: window.innerHeight * window.devicePixelRatio },
            // Add aspect ratio constraint to match the canvas
            aspectRatio: { ideal: window.innerWidth / window.innerHeight }
          },
          audio: false,
        });

        // 5. Create and configure source
        const source = createMediaStreamSource(mediaStream, {
          transform: Transform2D.MirrorX,
          cameraType: 'front',
          fpsLimit: 60
        });
        await session.setSource(source);

        // 6. Load lens if specified
        if (slide.camera_kit_lens_group) {
          try {
            const { lenses } = await cameraKit.lensRepository.loadLensGroups(
              [slide.camera_kit_lens_group],
              { respectCache: false }
            );
            if (lenses.length > 0) {
              await session.applyLens(lenses[3]);
            }
          } catch (lensError) {
            console.warn("Failed to load lens:", lensError);
          }
        }

        // 7. Start session
        await session.play();

        setIsLoading(false);
      } catch (err) {
        console.error("CameraKit initialization error:", err);
        setError("Failed to start camera");
        setIsLoading(false);
        
        // Retry after 3 seconds if failed
        cleanupTimeout = setTimeout(() => {
          initializeCameraKit();
        }, 3000);
      }
    };

    initializeCameraKit();

    return () => {
      clearTimeout(cleanupTimeout);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (session) {
        session.pause();
        session.removeAllListeners();
        session.setSource(null);
      }
    };
  }, [isActive, slide.camera_kit_token, slide.camera_kit_lens_group, isCanvasReady]);

  return (
    <div className="w-full h-[100dvh] relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="text-white">Loading camera...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-red-500 p-4">
          <div>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-white text-black rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
      >
        {/* Canvas is now created and managed by React */}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 z-20">
        <button
          onClick={onSlideEnd}
          className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CameraKitSlide;