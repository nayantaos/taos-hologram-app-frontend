import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Environment,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";
import { SlideConfig } from "@/types/slide";

useGLTF.preload;

interface ModelProps {
  filePath: string;
  onLoad?: () => void;
  onError?: () => void;
}

function Model({ filePath, onLoad, onError }: ModelProps) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(filePath);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = false;
        if (object.material) {
          object.material.side = THREE.DoubleSide;
        }
      }
    });

    if (animations.length > 0) {
      const animationName = Object.keys(actions)[0];
      const action = actions[animationName];
      if (action) action.play();
    }

    if (onLoad) {
      const timer = setTimeout(() => onLoad(), 100);
      return () => clearTimeout(timer);
    }
  }, [animations, actions, onLoad, scene]);

  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

interface ThreeDSlideProps {
  slide: SlideConfig;
  isActive: boolean;
}

const ThreeDSlide = ({ slide, isActive }: ThreeDSlideProps) => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const orbitRef = useRef<any>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const zoomLevel = isMobile ? slide?.zoom?.[0] ?? 5 : slide?.zoom?.[1] ?? 5;
  const cameraPosition = useMemo(() => new THREE.Vector3(0, 0, zoomLevel), [zoomLevel]);
  const cameraFov = isMobile ? 60 : 45;

  useEffect(() => {
    if (slide?.file) {
      useGLTF.preload(slide.file);
    }
  }, [slide?.file]);

  const handleModelLoad = () => {
    if (isFirstLoad) {
      setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false);
        if (orbitRef.current) orbitRef.current.autoRotate = true;
      }, 3000);
    } else {
      setIsLoading(false);
      if (orbitRef.current) orbitRef.current.autoRotate = true;
    }
  };

  return (
    <div className="w-full h-full bg-white relative">
      {isFirstLoad && isLoading && (
        <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
          <img
            src="/loader/skechers-logo.png"
            alt="Loading..."
            className="w-[80%] animate-pulse"
          />
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        {/* Light that casts shadows */}
        <ambientLight intensity={0.3} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />

        {/* Ground Plane to catch shadows */}
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.3} />
        </mesh>

        {/* Model */}
        <Suspense
          fallback={
            <Html center>
              <img
                src="/loader/skechers-logo.png"
                alt="Loading..."
                className="w-40 animate-pulse"
              />
            </Html>
          }
        >
          <group position={[0, 0, 0]}>
            <Model filePath={slide.file} onLoad={handleModelLoad} />
          </group>
        </Suspense>

        {/* Controls */}
        <OrbitControls
          //ref={orbitRef}
          target={[0, 0, 0]}
          autoRotate={false}
          autoRotateSpeed={1}
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />

        {/* Environment */}
        <Environment preset="forest" />
      </Canvas>
    </div>
  );
};

export default ThreeDSlide;