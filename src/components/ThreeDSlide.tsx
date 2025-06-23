import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, PresentationControls, Resize, ContactShadows, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { SlideConfig } from "@/types/slide";
import { useIsMobile } from "@/hooks/use-mobile";
import { Howl } from 'howler';
import { trackEvent } from "@/utils/analytics";

interface ModelProps {
  filePath: string;
  onLoad: (isLoading: boolean) => void;
  onAnnotationOpen?: (isOpen: boolean) => void;
  isVisible?: boolean;
  onAnimationsLoaded?: (names: string[], play: (name: string) => void) => void;
  onModelLoaded?: () => void;
}

const ARViewer = ({ filePath }) => {
  const viewerRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    script.type = 'module';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (viewer) {
      const handleLoad = () => {
        setIsModelLoaded(true);
        console.log('✨ The model has arrived — ready for its grand entrance.');

        setTimeout(() => {
          const arButton = viewer.querySelector('#ar-button');
          if (arButton) {
            console.log('Attempting to auto-trigger AR button...');
            arButton.click();
          } else {
            console.log('AR button is not visible...');
          }
        }, 500);
      };

      viewer.addEventListener('load', handleLoad);

      return () => {
        viewer.removeEventListener('load', handleLoad);
      };
    }
  }, [viewerRef]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <model-viewer 
        ref={viewerRef}
        src={filePath} 
        shadow-intensity="1" 
        ar
        camera-controls 
        touch-action="pan-y" 
        alt="A 3D model"
        style={{ width: '100%', height: '100%' }}
      >
        <div 
          slot="poster"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <img 
            src="/loader/ar-loader.gif" 
            alt="Loading..." 
           
          />
        </div>
        {isModelLoaded && (
          <button slot="ar-button" id="ar-button" style={{
            position: 'absolute',
            bottom: '10%',
            left: '25%',
            display: 'none',
            padding: '10px 20px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            opacity: isModelLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: 20
          }}
            onClick={() => {
          trackEvent({
            eventName: "NAVIGATION",
            category: "User Interaction",
            label: "Left Button",
          });
        }}>
            View in your space
          </button>
        )}
      </model-viewer>
    </div>
  );
};

function Model({ filePath, onLoad, onAnnotationOpen, isVisible, onAnimationsLoaded, onModelLoaded }: ModelProps) {
  const { scene, animations } = useGLTF(filePath);
  const meshRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, meshRef);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<
    { name: string; position: [number, number, number]; visible: boolean; sprite: THREE.Sprite }[]
  >([]);

  useEffect(() => {
    if (names.length && actions && onAnimationsLoaded) {
      onAnimationsLoaded(names, playAnimation);
    }
  }, [names, actions, onAnimationsLoaded]);

   useFrame(() => {
    if (meshRef.current) {
      const anyVisible = annotations.some((a) => a.visible);
    if (!anyVisible) {
      meshRef.current.rotation.y += 0.009;
    }
    }
  });

  useEffect(() => {
    if (scene && typeof scene.visible !== 'undefined') {
      scene.visible = isVisible !== false;
    }
  }, [isVisible, scene]);

  useEffect(() => {
    return () => {
      // Clean up annotations
      annotations.forEach(ann => {
        if (ann?.sprite?.parent) {
          ann.sprite.parent.remove(ann.sprite);
        }
        if (ann?.sprite?.material) {
          ann.sprite.material.dispose();
          if (ann.sprite.material.map) {
            ann.sprite.material.map.dispose();
          }
        }
      });

      // Clean up scene if it exists
      if (scene && typeof scene.traverse === 'function') {
        scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose?.());
            } else {
              mesh.material?.dispose?.();
            }

            const material = mesh.material as THREE.Material;
            if (material) {
              for (const key in material) {
                const value = (material as any)[key];
                if (value?.isTexture) value.dispose?.();
              }
            }
          }
        });
      }
    };
  }, [scene, annotations]);

  useEffect(() => {
    if (scene) {
      onLoad(false);
      
      // Setup annotations only if scene exists
      const newAnnotations: typeof annotations = [];
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
          node.visible = false;
        }
      });
      setAnnotations(newAnnotations);
      if (onModelLoaded) onModelLoaded();
    } else {
      onLoad(true);
    }
  }, [scene, onLoad]);

 

  const playAnimation = (name: string, speed: number = 1) => {
    stopCurrentAction();
    if (actions && actions[name]) {
      actions[name]
        .reset()
        .setEffectiveTimeScale(speed) // 🌀 Set animation speed here
        .fadeIn(0.3)
        .play();
      setCurrentAction(name);
    }
  };


  const stopCurrentAction = () => {
    if (currentAction && actions && actions[currentAction]) {
      actions[currentAction].fadeOut(0.2).stop();
    }
  };

  const handlePointerDown = (e: THREE.Event) => {
    trackEvent({
      eventName: "MODEL-SELECT HOTSPOT",
      label: e.object?.name || "unknown",
      data: {
        contentType: e.object?.userData?.content_type,
        position: e.object?.position,
      },
    });
    if (e.object?.userData?.clickable) {
      e.stopPropagation();
      const wasVisible = annotations.some(a => a.sprite === e.object && a.visible);
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.sprite === e.object
            ? { ...ann, visible: !ann.visible }
            : { ...ann, visible: false }
        )
      );
      if (onAnnotationOpen && !wasVisible) {
        onAnnotationOpen(true);
      }
    }
  };

  return (
    <group ref={meshRef} onPointerDown={handlePointerDown}>
      {scene && <primitive object={scene} dispose={null} />}
      {annotations.map((a, idx) =>
        a.visible ? (
          <Html position={a.position} center key={idx}>
            {/* ... existing annotation HTML ... */}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnnotations((prev) =>
                      prev.map((ann) => 
                        ann.name === a.name ? { ...ann, visible: false } : ann
                      )
                    );
                    if (onAnnotationOpen) {
                      onAnnotationOpen(false);
                    }
                  }}
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
  onAnnotationOpen?: (isOpen: boolean) => void;
  onModelLoaded?: () => void;
  version: string;
}

const ThreeDSlide = ({ slide, isActive, onAnnotationOpen, onModelLoaded, version}: ThreeDSlideProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showAR, setShowAR] = useState(false);
  const isMobile = useIsMobile();
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [triggerAnimation, setTriggerAnimation] = useState<(name: string) => void>(() => () => {});
  const canvasKey = useRef(0);
  const soundRef = useRef<Howl | null>(null); // Add this ref for audio
  const [modelLoaded, setModelLoaded] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
   const [audioBlocked, setAudioBlocked] = useState(false);

  
 // Add this effect to click the mute button when model loads
  useEffect(() => {
    if (!isLoading && isActive) {
      const timer = setTimeout(() => {
        const muteButton = document.querySelector('.mute-unmute') as HTMLButtonElement;
        if (muteButton) {
          muteButton.click();
          console.log('clicked..............'); 
        }
      }, 3000); // Small delay to ensure button exists
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isActive]);


   // Add this useEffect for audio handling
  useEffect(() => {
    if (!isActive || !slide.audio_file) return;

    // Initialize audio
    soundRef.current = new Howl({
      src: [slide.audio_file],
      autoplay: true,
      loop: true,
      volume: 0.0,
      onplayerror: () => {
        console.error('Error playing audio');
      },
      onplay: () => {
      console.log("Audio started muted.");

        // Optional: Fade in after user interacts
        setTimeout(() => {
          soundRef.current?.fade(0.0, 0.5, 1000); // fade to 0.5 volume in 1 second
        }, 3000); // or after click
      }
    });

    // Play audio when slide becomes active
    soundRef.current.play();

    if (soundRef.current && soundRef.current.mute()) {
      soundRef.current.mute(false); // Unmute
      soundRef.current.play();      // Re-play in case needed
    }

    return () => {
      // Clean up audio when slide changes or component unmounts
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.unload();
        soundRef.current = null;
      }
    };
  }, [isActive, slide.audio_file]);
  
 

  useEffect(() => {
    return () => {
      const canvasElements = document.querySelectorAll('canvas');
      canvasElements.forEach((canvas) => {
        const gl = canvas.getContext('webgl2');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            ext.loseContext();
          }
        }
        canvas.remove(); // force DOM removal
        console.log('canvas removed'); 
        
      });
    };
  }, []);


  useEffect(() => {
    return () => {
      const canvasElements = document.querySelectorAll('canvas');
      canvasElements.forEach((canvas) => {
        const parent = canvas.parentElement;
        if (parent) {
          parent.removeChild(canvas);
          console.log('remove...');
        }
      });
    };
  }, []);



  
  const positionClasses = {
    top_left: "top-4 left-4",
    top_center: "top-4 left-1/2 transform -translate-x-1/2",
    top_right: "top-4 right-4",
    bottom_left: "bottom-8 left-4",
    bottom_center: "bottom-8 left-1/2 transform -translate-x-1/2",
    bottom_right: "bottom-8 right-4",
    left_center: "top-1/2 left-4 transform -translate-y-1/2",
    right_center: "top-1/2 right-4 transform -translate-y-1/2",
  };

  useEffect(() => {
    // Increment canvas key when slide changes to force new canvas instance
    if (isActive) {
      canvasKey.current += 1;
      setIsLoading(true);
      setAnimationNames([]);
    }
  }, [slide, isActive]);

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
    <div className={`w-full h-full bg-transparent flex flex-col`}>

      <div style={{ height: version === "1" ? "100dvh" : "70dvh", position: 'relative', flex: '0 0 auto' }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white flex items-center justify-center touch-manipulation">
            <img
              src="/loader/proto-loader.svg"
              alt="Loading..."
              className="w-[25%] md:w-[10%] animate-pulse"
            />
          </div>
        )}
        
        {showAR ? (
          <div style={{ width: '100%', height: '100%' }}>
            <ARViewer filePath={slide.file} />
            <button 
              onClick={() => { setShowAR(false); onAnnotationOpen(false); }}
              className="absolute bottom-[3%] right-[3%] px-3 py-1.5 bg-white text-[#0062BA] rounded-md cursor-pointer capitalize text-sm border border-[#0062BA] font-sans z-20"
              style={{ fontFamily: "Albert Sans" }}
            >
              Exit AR
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            {version == "1" && (
              <QRDisplay qr_links={slide.qr_links} />
            )}
            {isActive && (
              <Canvas
                key={canvasKey.current}
                shadows
                camera={{ position: [-3, 4, 15], fov: isMobile ? 10 : 6 }}
                gl={{ antialias: true }}
                onPointerDown={() => onAnnotationOpen?.(true)}
                onPointerUp={() => onAnnotationOpen?.(false)}
                onTouchStart={() => onAnnotationOpen?.(true)}
                onPointerLeave={() => onAnnotationOpen?.(false)}
                onTouchEnd={() => onAnnotationOpen?.(false)}
                onTouchCancel={() => onAnnotationOpen?.(false)}
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
                  <Suspense fallback={<Html center></Html>}>
                    <Resize height width>
                      <Model 
                        filePath={slide.file} 
                        onLoad={setIsLoading} 
                        onAnnotationOpen={onAnnotationOpen} 
                        isVisible={isActive} 
                        onModelLoaded={() => {
                          setModelLoaded(true);
                          if (onModelLoaded) onModelLoaded();
                        }}
                        onAnimationsLoaded={(names, play) => {
                          setAnimationNames(names);
                          setTriggerAnimation(() => play);
                        }} 
                      />
                      <OrbitControls 
                        enableZoom={true} 
                        enablePan={true} 
                        onEnd={(e) => {
                          trackEvent({
                            eventName: "MODEL-ZOOM",
                            label: "Zoom Ended",
                            data: {
                              distance: e.target.object.position.distanceTo(new THREE.Vector3(0, 0, 0)),
                            },
                          });
                        }} />
                    </Resize>
                  </Suspense>
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
            )}

            {version !== "1" && animationNames.length > 0 && (
              
              <div className="absolute top-[20px] right-[20px] z-20 flex items-center gap-[8px] bg-white/85">
                <span className="w-full text-white bg-[#0063ba] font-semibold rounded-full px-2.5 py-1 font-['Albert_Sans']">
                  Animation: 
                </span>
                {animationNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => triggerAnimation(name)}
                    className="px-3 py-1.5 bg-white text-[#0062BA] rounded-md cursor-pointer capitalize text-sm border border-[#0062BA] font-sans"
                    style={{ fontFamily: '"Albert Sans", sans-serif' }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {version !== "1" && (
      <div style={{ height: '100dvh', overflowY: 'auto', flex: '0 0 auto' }}>
        <div className="w-full bg-white px-6 py-2 z-20 flex flex-col space-y-4">
          <div className="w-full flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {slide.product_name || "Product Title"}
            </h2>
            <div className="flex space-x-3">
              {!isLoading && (
                <button
                  onClick={() => {
                    if (soundRef.current) {
                      if (soundRef.current.playing()) {
                        soundRef.current.stop();
                      } else {
                        soundRef.current.play();
                      }
                    }
                    setAudioBlocked(false);
                  }}
                  className="absolute top-[calc(70dvh-40px)] right-5 z-[100] px-2 py-1 bg-white text-[#0062BA] rounded border border-[#0062BA] font-sans text-sm cursor-pointer shadow-sm transition-all duration-200 hover:bg-blue-50 mute-unmute"
                  style={{ fontFamily: '"Albert Sans", sans-serif' }}
                >
                {soundRef.current?.playing() ? '🔊 Mute' : '🔇 Unmute'}
                </button>
              )} 
              {!isLoading && (
                <button
                  onClick={() => {setShowAR(true); onAnnotationOpen(true); }} 
                  className="flex items-center space-x-2 px-2 py-2 rounded-full bg-white border border-gray-400 text-sm text-gray-800 shadow hover:bg-gray-100 transition"
                  aria-label="View in AR"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-gray-800"
                  >
                    <rect fill="none" width="24" height="24" />
                    <g>
                      <path d="M3,4c0-0.55,0.45-1,1-1h2V1H4C2.35,1,1,2.35,1,4v2h2V4z" />
                      <path d="M20,3c0.55,0,1,0.45,1,1v2h2V4c0-1.65-1.35-3-3-3h-2v2H20z" />
                      <path d="M4,21c-0.55,0-1-0.45-1-1v-2H1v2c0,1.65,1.35,3,3,3h2v-2H4z" />
                      <path d="M20,21c0.55,0,1-0.45,1-1v-2h2v2c0,1.65-1.35,3-3,3h-2v-2H20z" />
                      <path d="M18.25,7.6l-5.5-3.18c-0.46-0.27-1.04-0.27-1.5,0L5.75,7.6C5.29,7.87,5,8.36,5,8.9v6.35c0,0.54,0.29,1.03,0.75,1.3l5.5,3.18c0.46,0.27,1.04,0.27,1.5,0l5.5-3.18c0.46-0.27,0.75-0.76,0.75-1.3V8.9C19,8.36,18.71,7.87,18.25,7.6z M7,14.96v-4.62l4,2.32v4.61L7,14.96z M12,10.93L8,8.61l4-2.31l4,2.31L12,10.93z M13,17.27v-4.61l4-2.32v4.62L13,17.27z" />
                    </g>
                  </svg>
                </button>
              )}
              <button
                onClick={() => alert("We are working on this features...")}
                className="px-5 py-2 rounded-full bg-yellow-500 text-white text-sm font-semibold shadow hover:bg-yellow-600 transition"
              >
                Buy Now
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-700 font-medium">
            {slide.price ? `$${slide.price}` : "$299.99"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {slide.Product_description ||
              "Experience timeless elegance with our handcrafted full-grain leather weekender bag. A perfect blend of vintage soul and modern function."}
          </p>
        </div>
      </div>

      )}
    </div>
  );
};

export default ThreeDSlide;