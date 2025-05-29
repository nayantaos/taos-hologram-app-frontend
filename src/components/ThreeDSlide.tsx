import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  PresentationControls,
  Resize,
  ContactShadows,
  OrbitControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { SlideConfig } from "@/types/slide";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModelProps {
  filePath: string;
  onLoad: (isLoading: boolean) => void;
  
}

function Model({ filePath, onLoad }: ModelProps) {
  const { scene } = useGLTF(filePath);
  const meshRef = useRef();
  const [annotations, setAnnotations] = useState<
    { name: string; position: [number, number, number]; visible: boolean; sprite: THREE.Sprite }[]
  >([]);

  useEffect(() => {
    if (scene) onLoad(false);
    else onLoad(true);
  }, [scene, onLoad]);

  useFrame(() => {
    if (meshRef.current) {
      const anyVisible = annotations.some((a) => a.visible);
    if (!anyVisible) {
      meshRef.current.rotation.y += 0.009;
    }
    }
  });

  useEffect(() => {
    const newAnnotations = [];

    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material.side = 2;
      }

      if (node.userData.type === "annotation") {
        const parent = node.parent;
        if (!parent) return;

        const placeholderPosition = node.position.clone();
        const placeholderScale = node.scale.clone();

        const texture = new THREE.TextureLoader().load("/loader/plus.png");
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.name = node.name;
        sprite.position.copy(placeholderPosition);
        sprite.scale.copy(placeholderScale);
        
        
        sprite.userData = {
        ...node.userData,
        clickable: true,
      };

        parent.add(sprite);

        newAnnotations.push({
          name: node.name,
          position: [placeholderPosition.x, placeholderPosition.y, placeholderPosition.z],
          visible: false,
          sprite: sprite,
        });

        node.visible = false; // Hide the original annotation node
      }
    });

    setAnnotations(newAnnotations);
  }, [scene]);

  const handlePointerDown = (e) => {
    console.log(e.object.userData);
    
    if (e.object.userData.clickable) {
      e.stopPropagation();
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.sprite === e.object
            ? { ...ann, visible: !ann.visible }
            : { ...ann, visible: false }
        )
      );
    }
  };

  return (
    
    <group
      ref={meshRef}
      onPointerDown={handlePointerDown}
    >
      <primitive object={scene} />
      
      {annotations.map((a, idx) =>
        a.visible ? (
          <Html position={a.position} center key={idx}>
            <div
              style={{
                background: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>
                {(() => {
                  switch (a.sprite.userData.content_type) {
                    case 'link': return '🔗 Link';
                    case 'qr': return '📷 QR Code';
                    case 'video': return '🎥 Video';
                    case 'html': return '📝 Details';
                    default: return a.sprite.userData.content_type || 'ℹ️ Info';
                  }
                })()}
              </strong>
                <button
                  onClick={() =>
                    setAnnotations((prev) =>
                      prev.map((a) =>
                        a.name === a.name ? { ...a, visible: false } : a
                      )
                    )
                  }
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginLeft: '10px',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: '8px' }}>
                {a.sprite.userData.content_type === 'link' && (
                  <a href={a.sprite.userData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#007BFF' }}>
                    {a.sprite.userData.link_label}
                  </a>
                )}
                {a.sprite.userData.content_type === 'qr' && <img src={a.sprite.userData.qr_image} alt="QR Code" className="" />}
                {a.sprite.userData.content_type === 'video' && (
                  <iframe
                    width="400"
                    height="226"
                    src={a.sprite.userData.video_link}
                    frameBorder="0"
                    allowFullScreen
                    style={{ borderRadius: '8px' }}
                  ></iframe>
                )}
                {a.sprite.userData.content_type === 'html' && <div dangerouslySetInnerHTML={{ __html: a.sprite.userData.content }} />}
              </div>
            </div>
          </Html>
        ) : null
      )}

    </group>
  );
}

interface ThreeDSlideProps {
  slide: SlideConfig;
  isActive: boolean;
  
}

const ThreeDSlide = ({
  slide,
  isActive,
  
}: ThreeDSlideProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const positionClasses = {
    top_left: "top-4 left-4",
    top_center: "top-4 left-1/2 transform -translate-x-1/2",
    top_right: "top-4 right-4",
    bottom_left: "bottom-4 left-4",
    bottom_center: "bottom-4 left-1/2 transform -translate-x-1/2",
    bottom_right: "bottom-4 right-4",
    left_center: "top-1/2 left-4 transform -translate-y-1/2",
    right_center: "top-1/2 right-4 transform -translate-y-1/2",
  };

  const QRDisplay = ({ qr_links }) => {
    const qrElements = useMemo(() => {
      if (!qr_links?.length) return null;

      return qr_links.map((item, index) => (
        <div
          key={index}
          className={`absolute z-20 space-y-2 bg-white bg-opacity-70 p-2 rounded-lg shadow-md ${
            positionClasses[item.position] || "top-4 right-4"
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
