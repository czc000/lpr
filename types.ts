export enum ParticleState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export enum ParticleType {
  NEEDLE = 'NEEDLE',
  ORNAMENT = 'ORNAMENT',
  RIBBON = 'RIBBON',
  STAR = 'STAR',
  SPARKLE = 'SPARKLE'
}

export interface ParticleData {
  type: ParticleType;
  treePosition: [number, number, number];
  scatterPosition: [number, number, number];
  treeRotation: [number, number, number, number];
  scatterRotation: [number, number, number, number];
  color: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
}
