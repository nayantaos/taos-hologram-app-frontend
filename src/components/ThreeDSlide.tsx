import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
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
  const outerGroup = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(filePath);
  const { actions } = useAnimations(animations, outerGroup);

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

    // Center the model within a new container group
    const centeredGroup = new THREE.Group();
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);
    centeredGroup.add(scene);
    console.log(scene);
    

    // Clear and re-add centeredGroup to outerGroup
    outerGroup.current.clear();
    outerGroup.current.add(centeredGroup);

    // Start animation if available
    if (animations.length > 0) {
      const animationName = Object.keys(actions)[0];
      const action = actions[animationName];
      if (action) action.play();
    }

    // Notify on load
    if (onLoad) {
      const timer = setTimeout(() => onLoad(), 100);
      return () => clearTimeout(timer);
    }
  }, [animations, actions, onLoad, scene]);

  return <group ref={outerGroup} />;
}


 
interface ThreeDSlideProps {
  company_logo?: string;
  slide: SlideConfig;
  isActive: boolean;
}
 
const ThreeDSlide = ({ slide, company_logo, isActive }: ThreeDSlideProps) => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [logo, setLogo] = useState("/loader/proto-loader.svg");
  
  
  //const orbitRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const wallRef = useRef<THREE.Mesh>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
 
  const zoomLevel = isMobile ? slide?.zoom?.[0] ?? 5 : slide?.zoom?.[1] ?? 5;
  const cameraPosition = useMemo(() => new THREE.Vector3(0, 0, zoomLevel), [zoomLevel]);
  const cameraFov = isMobile ? 60 : 45;
  
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();
 
  const rotationSpeed = 0.005;

  const updateRotation = () => {
    if (!isDragging.current || !groupRef.current) return;
 
    const deltaX = currentMouse.current.x - previousMouse.current.x;
    const deltaY = currentMouse.current.y - previousMouse.current.y;
 
    groupRef.current.rotation.y += deltaX * rotationSpeed;
    groupRef.current.rotation.x += deltaY * rotationSpeed;
 
    // Clamp vertical rotation
    groupRef.current.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, groupRef.current.rotation.x)
    );
 
    previousMouse.current = { ...currentMouse.current };
 
    animationFrame.current = requestAnimationFrame(updateRotation);
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    currentMouse.current = { x: e.clientX, y: e.clientY };
    animationFrame.current = requestAnimationFrame(updateRotation);
    e.stopPropagation();
  };
 
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    currentMouse.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };
 
  const handlePointerUp = (e?: React.PointerEvent) => {
    isDragging.current = false;
    cancelAnimationFrame(animationFrame.current!);
    e?.stopPropagation();
  };
 
  // Preload the 3D model when the slide file changes
  useEffect(() => {
    if (slide?.file) {
      useGLTF.preload(slide.file);
    }
  }, [slide?.file]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        if (groupRef.current && !isDragging.current) {
          groupRef.current.rotation.y += 0.01;
        }
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Validate company_logo and fallback if broken or blank
  useEffect(() => {
    const finalLogo = company_logo && company_logo.trim() !== ""
      ? company_logo
      : "/loader/proto-loader.svg";

    const img = new Image();
    img.src = finalLogo;

    img.onload = () => setLogo(finalLogo);
    img.onerror = () => setLogo("/loader/proto-loader.svg");
  }, [company_logo]);
 
  const handleModelLoad = () => {
    if (isFirstLoad) {
      setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false);
        //if (orbitRef.current) orbitRef.current.autoRotate = true;
      }, 3000);
    } else {
      setIsLoading(false);
      //if (orbitRef.current) orbitRef.current.autoRotate = true;
    }
  };
 
  return (
    <div className="w-full h-full bg-white relative">
      {isFirstLoad && isLoading && (
        <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
          <img
            src={logo}
            alt="Loading..."
            className="max-w-[90%] max-h-full object-contain animate-pulse"
          />
        </div>
      )}
 
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >

        <PerspectiveCamera
          makeDefault={false}
          position={[0, 5, 10]}
          fov={45}
          name="LightCamera"
        />
        <OrbitControls
          makeDefault={false}
          target={[0, 0, 0]}
          enableRotate={false}
          enableZoom={false}
          enablePan={false}
        />
        <PerspectiveCamera
          makeDefault
          position={cameraPosition.toArray()}
          fov={cameraFov}
          name="MainCamera"
        />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={false}
        />
        <spotLight
          position={slide.Dlight}
          angle={0.5}
          penumbra={3}
          intensity={1}
          distance={300}
          decay={2}
          castShadow
          shadow-bias={-0.0005}
          shadow-normalBias={0.05}
          shadow-radius={20}
          shadow-mapSize-width={3300}
          shadow-mapSize-height={3300}
        />
        {/* <directionalLight
          ref={directionalLightRef}
          castShadow
          position={slide.Dlight}
          intensity={0.6}
          shadow-mapSize-width={5070}
          shadow-mapSize-height={5070}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-camera-near={1}
          shadow-camera-far={20}
        /> */}
        <mesh
          ref={wallRef}
          receiveShadow={true}
          position={slide.wall}
          rotation={[0, 0, 0]}
          scale={[100, 101, 1]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <planeGeometry args={[900, 900]} />
          <shadowMaterial transparent opacity={slide.shadow_opacity} />
        </mesh>

        <Suspense
          fallback={
            <Html center>
              <img
                src={logo}
                alt="Loading..."
                className="max-w-[90%] max-h-full object-contain animate-pulse"
              />
            </Html>
          }
        >
          <group ref={groupRef} position={[0, 0, 0]}>
            <Model filePath={slide.file} onLoad={handleModelLoad} />
          </group>
        </Suspense>
 
        <Environment preset="forest" />
       
      </Canvas>
    </div>
  );
};
 
export default ThreeDSlide;