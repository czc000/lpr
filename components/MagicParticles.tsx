import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleState, ParticleType, ParticleData } from '../types';

const PARTICLE_COUNT = 3000;
const TREE_HEIGHT = 9;
const MAX_RADIUS = 3.8;
const SPIRAL_REVS = 4.5;

const PALETTE = {
  NEEDLE: [
    new THREE.Color('#013220'),
    new THREE.Color('#0B6623'),
    new THREE.Color('#1B4D3E'),
    new THREE.Color('#228B22'),
    new THREE.Color('#004225')
  ],
  RIBBON: [
    new THREE.Color('#F4C2C2'),
    new THREE.Color('#FFD1DC'),
    new THREE.Color('#FFB7CE'),
    new THREE.Color('#FFC1CC')
  ],
  ORNAMENT: [
    new THREE.Color('#ffd700'),
    new THREE.Color('#d4af37')
  ],
  STAR: [
    new THREE.Color('#ffd700'),
    new THREE.Color('#ffec8b'),
    new THREE.Color('#ffdf00')
  ],
  SPARKLE: [
    new THREE.Color('#fffacd'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#ffd700')
  ]
};

const dummyObj = new THREE.Object3D();

function randomInSphere(radius: number): [number, number, number] {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
}

function getRandomRotation(): [number, number, number, number] {
  dummyObj.rotation.set(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );
  dummyObj.updateMatrix();
  return [dummyObj.quaternion.x, dummyObj.quaternion.y, dummyObj.quaternion.z, dummyObj.quaternion.w];
}

function createParticle(
  type: ParticleType,
  x: number,
  y: number,
  z: number,
  treeRadius: number,
  treeHeightRatio: number
): ParticleData {
  const scatterPos = randomInSphere(12);
  const scatterRot = getRandomRotation();
  
  let treeRot: [number, number, number, number] = [0, 0, 0, 1];
  
  if (type === 'STAR') {
    dummyObj.rotation.set(0, 0, 0);
  } else if (type === 'NEEDLE') {
    dummyObj.position.set(0, 0, 0);
    dummyObj.lookAt(x, y, z);
    dummyObj.rotateX(Math.PI / 2 - 0.2);
    dummyObj.updateMatrix();
    const q = new THREE.Quaternion();
    q.setFromRotationMatrix(dummyObj.matrix);
    treeRot = [q.x, q.y, q.z, q.w];
  } else {
    dummyObj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummyObj.updateMatrix();
    const q = new THREE.Quaternion();
    q.setFromRotationMatrix(dummyObj.matrix);
    treeRot = [q.x, q.y, q.z, q.w];
  }
  
  let colorPalette = PALETTE.NEEDLE;
  let scale = 1;
  
  switch (type) {
    case 'STAR':
      colorPalette = PALETTE.STAR;
      scale = 3.0;
      break;
    case 'RIBBON':
      colorPalette = PALETTE.RIBBON;
      scale = 0.08;
      break;
    case 'ORNAMENT':
      colorPalette = PALETTE.ORNAMENT;
      scale = 0.4;
      break;
    case 'SPARKLE':
      colorPalette = PALETTE.SPARKLE;
      scale = 0.3;
      break;
    case 'NEEDLE':
      colorPalette = PALETTE.NEEDLE;
      scale = 0.6 + Math.random() * 0.4;
      break;
  }
  
  const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  
  return {
    type,
    scatterPosition: scatterPos,
    scatterRotation: scatterRot,
    treePosition: [x, y, z],
    treeRotation: treeRot,
    color: [color.r, color.g, color.b],
    scale,
    speed: Math.random() * 0.5 + 0.2,
    phase: Math.random() * Math.PI * 2
  };
}

export function generateParticles(photoCount: number = 0): ParticleData[] {
  const particles: ParticleData[] = [];
  
  // 添加顶部星星
  particles.push(createParticle('STAR', 0, TREE_HEIGHT / 2 + 0.2, 0, 0, 0));
  
  // 添加丝带（螺旋状）
  const ribbonCount = 1200;
  for (let i = 0; i < ribbonCount; i++) {
    const t = i / ribbonCount;
    const h = -TREE_HEIGHT / 2 + t * TREE_HEIGHT;
    const r = MAX_RADIUS * (1 - t) + 0.3;
    const angle = t * Math.PI * 2 * SPIRAL_REVS;
    const jitterX = (Math.random() - 0.5) * 0.1;
    const jitterY = (Math.random() - 0.5) * 0.1;
    const jitterZ = (Math.random() - 0.5) * 0.1;
    const x = Math.cos(angle) * r + jitterX;
    const z = Math.sin(angle) * r + jitterZ;
    const y = h + jitterY;
    particles.push(createParticle('RIBBON', x, y, z, r, t));
  }
  
  // 添加闪光粒子
  const sparkleCount = 400;
  for (let i = 0; i < sparkleCount; i++) {
    const t = Math.random();
    const h = -TREE_HEIGHT / 2 + t * TREE_HEIGHT;
    const r = MAX_RADIUS * (1 - t) + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    particles.push(createParticle('SPARKLE', x, h, z, r, t));
  }
  
  // 添加针叶和装饰
  const remainingCount = Math.floor(PARTICLE_COUNT * 1.5) - ribbonCount - sparkleCount - 1;
  for (let i = 0; i < remainingCount; i++) {
    const t = Math.random();
    let type: ParticleType = 'NEEDLE';
    
    if (t > 0.95) {
      type = 'ORNAMENT';
    }
    
    const h = -TREE_HEIGHT / 2 + Math.pow(t, 0.9) * TREE_HEIGHT;
    const r = MAX_RADIUS * (1 - t) + 0.3;
    const angle = Math.random() * Math.PI * 2;
    const w = type === 'NEEDLE' ? Math.sqrt(Math.random()) * r : r * (0.85 + Math.random() * 0.15);
    const x = Math.cos(angle) * w;
    const z = Math.sin(angle) * w;
    
    particles.push(createParticle(type, x, h, z, r, t));
  }
  
  return particles;
}

interface InstancedMeshProps {
  data: ParticleData[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  globalState: ParticleState;
}

export const InstancedParticles: React.FC<InstancedMeshProps> = ({ data, geometry, material, globalState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = data.length;
  const progressRef = useRef(0);
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  
  const idleTimeRef = useRef(0);
  const chunkIndexRef = useRef(0);
  const chunkSize = Math.max(1, Math.floor(count / 3));
  
  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((particle, i) => {
        meshRef.current!.setColorAt(i, new THREE.Color(particle.color[0], particle.color[1], particle.color[2]));
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    let targetProgress = globalState === 'TREE_SHAPE' ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, delta * 1);
    
    const progress = progressRef.current;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const time = state.clock.elapsedTime;
    const isTransitioning = Math.abs(progressRef.current - targetProgress) > 0.01;
    
    const currentChunk = chunkIndexRef.current;
    const startIndex = currentChunk * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, count);
    
    for (let i = startIndex; i < endIndex; i++) {
      const particle = data[i];
      
      tempPos.set(
        particle.scatterPosition[0],
        particle.scatterPosition[1],
        particle.scatterPosition[2]
      );
      
      targetPos.set(
        particle.treePosition[0],
        particle.treePosition[1],
        particle.treePosition[2]
      );
      
      if (!isTransitioning) {
        const wave = Math.sin(time * particle.speed + particle.phase) * (0.15 * (1 - progress) + 0.02 * progress);
        tempPos.y += wave;
      }
      
      tempPos.lerp(targetPos, smoothProgress);
      
      tempQuat.set(
        particle.scatterRotation[0],
        particle.scatterRotation[1],
        particle.scatterRotation[2],
        particle.scatterRotation[3]
      );
      
      targetQuat.set(
        particle.treeRotation[0],
        particle.treeRotation[1],
        particle.treeRotation[2],
        particle.treeRotation[3]
      );
      
      tempQuat.slerp(targetQuat, smoothProgress);
      
      if (!isTransitioning) {
        const rotationSpeed = (1 - progress) * 0.5;
        if (particle.type === 'STAR') {
          tempObj.rotation.z = Math.sin(time * 0.5) * 0.1;
          tempObj.rotation.y += delta * 0.5;
        } else {
          tempObj.rotateY(time * rotationSpeed * particle.speed);
        }
      }
      
      tempQuat.premultiply(tempObj.quaternion);
      
      let scale = particle.scale;
      if (isTransitioning) {
        scale = 1;
      } else {
        if (particle.type === 'SPARKLE') {
          scale = 0.5 + Math.abs(Math.sin(time * 8 + particle.phase));
        } else if (particle.type === 'RIBBON') {
          scale = 1 + Math.sin(time * 2 + particle.phase) * 0.1;
        } else {
          scale = 1 + Math.sin(time * 3 + particle.phase) * 0.05;
        }
        scale *= particle.scale;
      }
      
      tempScale.setScalar(scale);
      tempObj.position.copy(tempPos);
      tempObj.quaternion.copy(tempQuat);
      tempObj.scale.copy(tempScale);
      tempObj.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    
    chunkIndexRef.current = (chunkIndexRef.current + 1) % 3;
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    if (progress > 0.1 && !isTransitioning) {
      meshRef.current.rotation.y = time * 0.1 * smoothProgress;
    }
  });
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
};

interface MagicParticlesProps {
  state: ParticleState;
}

export const MagicParticles: React.FC<MagicParticlesProps> = ({ state }) => {
  const { needles, ornaments, ribbon, star, sparkles } = useMemo(() => {
    const allParticles = generateParticles();
    return {
      needles: allParticles.filter(p => p.type === 'NEEDLE'),
      ornaments: allParticles.filter(p => p.type === 'ORNAMENT'),
      ribbon: allParticles.filter(p => p.type === 'RIBBON'),
      star: allParticles.filter(p => p.type === 'STAR'),
      sparkles: allParticles.filter(p => p.type === 'SPARKLE')
    };
  }, []);
  
  const needleGeometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.01, 0.04, 0.5, 4);
    geom.translate(0, 0.25, 0);
    return geom;
  }, []);
  
  const ornamentGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.2, 2), []);
  
  const ribbonGeometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(0.2, 8, 8);
    geom.scale(1.2, 0.6, 1.2);
    return geom;
  }, []);
  
  const sparkleGeometry = useMemo(() => new THREE.OctahedronGeometry(0.1, 0), []);
  
  const starGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const numPoints = 5;
    const outerRadius = 0.6;
    const innerRadius = 0.3;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (numPoints * 2)) * Math.PI * 2 + Math.PI / 2;
      points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    
    const shape = new THREE.Shape(points);
    const extrudeSettings = {
      steps: 1,
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 1
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateZ(Math.PI);
    geom.center();
    return geom;
  }, []);
  
  const needleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true
  }), []);
  
  const ornamentMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffd700',
    roughness: 0.05,
    metalness: 1,
    clearcoat: 1,
    emissive: new THREE.Color('#d4af37'),
    emissiveIntensity: 0.2
  }), []);
  
  const ribbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F4C2C2'),
    emissive: new THREE.Color('#FFB7CE'),
    emissiveIntensity: 2,
    toneMapped: false,
    roughness: 0.2,
    metalness: 0.5
  }), []);
  
  const starMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700',
    emissive: '#ffd700',
    emissiveIntensity: 2,
    roughness: 0.2,
    metalness: 0.8
  }), []);
  
  const sparkleMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false
  }), []);
  
  return (
    <group>
      {needles.length > 0 && (
        <InstancedParticles
          data={needles}
          geometry={needleGeometry}
          material={needleMaterial}
          globalState={state}
        />
      )}
      {ornaments.length > 0 && (
        <InstancedParticles
          data={ornaments}
          geometry={ornamentGeometry}
          material={ornamentMaterial}
          globalState={state}
        />
      )}
      {ribbon.length > 0 && (
        <InstancedParticles
          data={ribbon}
          geometry={ribbonGeometry}
          material={ribbonMaterial}
          globalState={state}
        />
      )}
      {sparkles.length > 0 && (
        <InstancedParticles
          data={sparkles}
          geometry={sparkleGeometry}
          material={sparkleMaterial}
          globalState={state}
        />
      )}
      {star.length > 0 && (
        <InstancedParticles
          data={star}
          geometry={starGeometry}
          material={starMaterial}
          globalState={state}
        />
      )}
    </group>
  );
};
