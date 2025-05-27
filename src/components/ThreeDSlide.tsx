import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  PresentationControls,
  Resize,
  ContactShadows,
  OrbitControls,
  Html
} from "@react-three/drei";
import { SlideConfig } from "@/types/slide";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModelProps {
  filePath: string;
  onLoad: (isLoading: boolean) => void;
  onModelBeingTouched: (value: boolean) => void;
}

function Model({ filePath, onLoad, onModelBeingTouched }: ModelProps) {
  const { scene } = useGLTF(filePath);
  const meshRef = useRef();
  const [shouldRotate, setShouldRotate] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (scene) onLoad(false);
    else onLoad(true);
  }, [scene, onLoad]);

  useFrame(() => {
    if (meshRef.current && shouldRotate) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material.side = 2;
      }
    });
  }, [scene]);

  return (
    <group
      ref={meshRef}
      onPointerEnter={() => {
        setShouldRotate(true);
        onModelBeingTouched(true);
      }}
      onPointerLeave={() => {
        setShouldRotate(true);
        onModelBeingTouched(false);
      }}
    >
      <primitive object={scene} />
      <mesh
        position={[0, 0, 0]} // ← Adjust this to place the hotspot
        onClick={() => setShowPopup(!showPopup)}
      >
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshStandardMaterial color="orange" emissive="yellow" emissiveIntensity={1} />
        {showPopup && (
          <Html
            distanceFactor={10}
            center
            position={[0, 0.2, 0]}
            style={{
              background: "white",
              padding: "6px 10px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
            }}
          >
            <div>
              <strong>Hotspot Info</strong><br />
              <button onClick={() => alert("Clicked!")}>Learn More</button>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

interface ThreeDSlideProps {
  slide: SlideConfig;
  isActive: boolean;
  onModelBeingTouched: (value: boolean) => void;
}

const ThreeDSlide = ({
  slide,
  isActive,
  onModelBeingTouched,
}: ThreeDSlideProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const positionClasses = {
    top_left: 'top-4 left-4',
    top_center: 'top-4 left-1/2 transform -translate-x-1/2',
    top_right: 'top-4 right-4',
    bottom_left: 'bottom-4 left-4',
    bottom_center: 'bottom-4 left-1/2 transform -translate-x-1/2',
    bottom_right: 'bottom-4 right-4', 
    left_center: 'top-1/2 left-4 transform -translate-y-1/2',
    right_center: 'top-1/2 right-4 transform -translate-y-1/2'
  };

  const QRDisplay = ({ qr_links }) => {
    const qrElements = useMemo(() => {
      if (!qr_links?.length) return null;

      return qr_links.map((item, index) => (
        <div
          key={index}
          className={`absolute z-20 space-y-2 bg-white bg-opacity-70 p-2 rounded-lg shadow-md ${
            positionClasses[item.position] || 'top-4 right-4'
          }`}
        >
          <div className="flex items-center space-x-2">
            <img src={item.qr} alt={`QR ${item.label}`} className="w-16 h-16" />
            <span className="text-xs font-medium text-gray-800">{item.label}</span>
          </div>
        </div>
      ));
    }, [qr_links]);

    return <>{qrElements}</>;
  };

  return (
    <div className={`w-full h-full bg-transparent relative`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white flex items-center justify-center touch-manipulation">
          <img
            src="/loader/skechers-logo.png"
            alt="Loading..."
            className="w-[80%] animate-pulse"
          />
        </div>
      )}
      <QRDisplay qr_links={slide.qr_links} />
      <Canvas
        shadows
        camera={{ position: [-3, 4, 15], fov: isMobile ? 50 : 15 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[0, 5, 10]}
          intensity={2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <PresentationControls
          global
          config={{ mass: 2, tension: 1000 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Resize height width>
            <Model
              filePath={slide.file}
              onLoad={setIsLoading}
              onModelBeingTouched={onModelBeingTouched}
            />
            <OrbitControls enableZoom={true} enablePan={true} />
          </Resize>
        </PresentationControls>
        <ContactShadows
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0.15, -0.9, 0]}
          opacity={0.2}
          scale={10}
          blur={1}
          far={5}
          resolution={1024}
          color="#000000"
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default ThreeDSlide;
