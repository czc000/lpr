import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ParticleState } from '../types';

const PHOTO_COUNT = 12;
const PHOTO_SPREAD_RADIUS = 15;

function createSpiralPositions(count: number, radius: number): Array<{ position: [number, number, number], rotation: [number, number, number] }> {
  const positions: Array<{ position: [number, number, number], rotation: [number, number, number] }> = [];
  const spreadRadius = radius;
  const innerRadius = radius * 0.3;
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const height = -TREE_HEIGHT / 2 + t * TREE_HEIGHT;
    const r = spreadRadius * (1 - t) + innerRadius * t;
    const angle = t * Math.PI * 2 * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    positions.push({
      position: [x, height, z] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number]
    });
  }
  return positions;
}

const TREE_HEIGHT = 9;

interface PhotoPlaneProps {
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  texture: THREE.Texture | null;
  isVisible: boolean;
  isSelected: boolean;
  onMeshRef: (mesh: THREE.Mesh | null) => void;
}

const PhotoPlane: React.FC<PhotoPlaneProps> = ({
  index,
  position,
  rotation,
  texture,
  isVisible,
  isSelected,
  onMeshRef
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(...position));
  const currentScale = useRef(1.5);
  const targetScale = useRef(1.5);
  const opacityRef = useRef(0);
  const targetOpacity = useRef(0);
  const rotationVelocity = useRef(0);
  const idleTimer = useRef(0);
  
  useEffect(() => {
    if (meshRef.current) {
      onMeshRef(meshRef.current);
      return () => onMeshRef(null);
    }
  }, [onMeshRef]);
  
  useEffect(() => {
    if (meshRef.current && rotation) {
      meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);
  
  useEffect(() => {
    if (isVisible) {
      const delay = index * 300;
      const timeout = setTimeout(() => {
        targetOpacity.current = 1;
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      targetOpacity.current = 1;
      opacityRef.current = 1;
      rotationVelocity.current = 0;
    }
  }, [isVisible, index]);
  
  useEffect(() => {
    if (isSelected) {
      targetScale.current = 3;
      targetPosition.current.set(0, 0.5, -8);
    } else {
      targetScale.current = 1.5;
      targetPosition.current.set(...position);
    }
  }, [isSelected, position]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const cameraPos = camera.position;
    const distance = cameraPos.distanceTo(targetPosition.current);
    
    if (isSelected || distance < 0.1) {
      meshRef.current.lookAt(cameraPos);
    }
    
    if (isVisible && !isSelected) {
      idleTimer.current += delta;
      if (idleTimer.current > 2) {
        rotationVelocity.current = 0.1;
      }
    }
    
    meshRef.current.position.lerp(targetPosition.current, delta * 3);
    
    const scaleLerp = THREE.MathUtils.lerp(currentScale.current, targetScale.current, delta * 5);
    currentScale.current = scaleLerp;
    meshRef.current.scale.set(scaleLerp, scaleLerp, scaleLerp);
    
    if (meshRef.current.material) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity.current, delta * 3);
      material.opacity = Math.max(0.95, opacityRef.current);
    }
  });
  
  const material = useMemo(() => {
    if (!texture || !texture.image) {
      console.warn('照片纹理无效');
      return new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1
      });
    }
    
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
      color: new THREE.Color(1, 1, 1)
    });
  }, [texture]);
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      material={material}
      scale={[0.3, 0.3, 0.3]}
    >
      <planeGeometry args={[10, 10]} />
    </mesh>
  );
};

interface PhotoPlanesProps {
  state: ParticleState;
  photoPaths: string[];
}

export const PhotoPlanes: React.FC<PhotoPlanesProps> = ({ state, photoPaths }) => {
  const groupRef = useRef<THREE.Group>(null);
  const visibleCount = Math.min(photoPaths.length, PHOTO_COUNT);
  const positions = useMemo(() => createSpiralPositions(visibleCount, PHOTO_SPREAD_RADIUS), [visibleCount]);
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const meshMap = useRef<Map<THREE.Mesh, number>>(new Map());
  
  const IMAGE_SIZE = 1024;
  
  const compressImage = (img: HTMLImageElement, maxSize: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img);
        return;
      }
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = height / width * maxSize;
          width = maxSize;
        } else {
          width = width / height * maxSize;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedImg = new Image();
      compressedImg.onload = () => resolve(compressedImg);
      compressedImg.src = canvas.toDataURL('image/jpeg', 0.8);
    });
  };
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const slice = photoPaths.slice(0, visibleCount);
    
    const loadPromises = slice.map((path, index) => {
      return new Promise<THREE.Texture>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          try {
            const compressed = await compressImage(img, IMAGE_SIZE);
            const texture = new THREE.Texture(compressed);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.format = THREE.RGBAFormat;
            texture.anisotropy = 1;
            console.log(`成功加载并压缩照片：${path} (${compressed.width}x${compressed.height})`);
            setLoadedCount(prev => prev + 1);
            resolve(texture);
          } catch (error) {
            console.error(`处理照片失败 ${path}:`, error);
            reject(error);
          }
        };
        img.onerror = (error) => {
          console.error(`加载照片失败 ${path}:`, error);
          reject(error);
        };
        img.src = `./my_picture/${path}`;
      });
    });
    
    Promise.all(loadPromises)
      .then(loadedTextures => {
        setTextures(loadedTextures);
        console.log(`所有照片加载完成，共 ${loadedTextures.length} 张`);
      })
      .catch(error => {
        console.error('部分照片加载失败:', error);
      });
  }, [photoPaths, visibleCount]);
  
  const { camera, gl, raycaster, pointer } = useThree();
  const handleClick = (event: MouseEvent) => {
    if (state !== 'SCATTERED') return;
    
    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    
    const intersectableObjects = Array.from(meshMap.current.keys());
    const intersects = raycaster.intersectObjects(intersectableObjects, true);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const clickedIndex = meshMap.current.get(clickedObject);
      if (clickedIndex !== undefined) {
        setSelectedIndex(selectedIndex === clickedIndex ? null : clickedIndex);
      }
    } else {
      setSelectedIndex(null);
    }
  };
  
  useEffect(() => {
    const onMouseClick = handleClick;
    gl.domElement.addEventListener('click', onMouseClick);
    return () => {
      gl.domElement.removeEventListener('click', onMouseClick);
    };
  }, [state, selectedIndex, camera, gl, raycaster, pointer]);
  
  useEffect(() => {
    if (state !== 'SCATTERED') {
      setSelectedIndex(null);
    }
  }, [state]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const isVisible = state === 'SCATTERED';
    groupRef.current.visible = isVisible;
    
    if (isVisible && selectedIndex === null) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });
  
  useEffect(() => {
    if (state === 'SCATTERED') {
      console.log(`显示 ${visibleCount} 张照片，位置半径：${PHOTO_SPREAD_RADIUS}`);
    }
  }, [state, visibleCount]);
  
  return (
    <group ref={groupRef} visible={state === 'SCATTERED' && textures.length > 0}>
      {textures.map((texture, index) => {
        if (index >= positions.length || !texture || !texture.image) return null;
        
        const pos = positions[index];
        return (
          <PhotoPlane
            key={index}
            index={index}
            position={pos.position}
            rotation={pos.rotation}
            texture={texture}
            isVisible={state === 'SCATTERED'}
            isSelected={selectedIndex === index}
            onMeshRef={(mesh) => {
              if (mesh) {
                meshMap.current.set(mesh, index);
              } else {
                for (const [key, value] of meshMap.current.entries()) {
                  if (value === index) {
                    meshMap.current.delete(key);
                    break;
                  }
                }
              }
            }}
          />
        );
      })}
    </group>
  );
};
