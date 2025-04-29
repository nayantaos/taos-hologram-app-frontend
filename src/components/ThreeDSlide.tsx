import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  Html,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";
import { SlideConfig } from "@/types/slide";
 
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
        object.receiveShadow = false; // Only the back wall will receive shadows
        if (object.material) {
          object.material.side = THREE.DoubleSide;
        }
      }
    });
 
    // Center the model in the scene based on bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center); // Move model so its center is at origin
 
    // Optional: scale to fit camera view (uncomment if needed)
    // const size = new THREE.Vector3();
    // box.getSize(size);
    // const maxDim = Math.max(size.x, size.y, size.z);
    // const scale = 2 / maxDim;
    // scene.scale.setScalar(scale);
 
    // Play animation if available
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
      <primitive object={scene} />
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const orbitRef = useRef<any>(null);
  const wallRef = useRef<THREE.Mesh>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
 
  const zoomLevel = isMobile ? slide?.zoom?.[0] ?? 5 : slide?.zoom?.[1] ?? 5;
  const cameraPosition = useMemo(() => new THREE.Vector3(0, 0, zoomLevel), [zoomLevel]);
  const cameraFov = isMobile ? 60 : 45;
 
  useEffect(() => {
    if (slide?.file) {
      useGLTF.preload(slide.file);
    }
  }, [slide?.file]);
 
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isActive]);
 
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
        <directionalLight
          ref={directionalLightRef}
          castShadow
          position={[0, 5, 10]}
          intensity={1.2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        >
          <primitive object={new THREE.Object3D()} position={[0, 2, -5]} />
        </directionalLight>
 
        {/* Static back wall to receive shadows */}
        {/* <mesh
          ref={wallRef}
          receiveShadow
          position={[0, 2.5, -2]}
          rotation={[0, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />
          <shadowMaterial transparent opacity={0.3} />
        </mesh> */}
 
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
 
        <Environment preset="forest" />
        <OrbitControls
          ref={orbitRef}
          target={[0, 0, 0]}
          autoRotate={false}
          autoRotateSpeed={1}
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};
 
export default ThreeDSlide;