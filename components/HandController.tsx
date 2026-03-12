import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { ParticleState } from '../types';

interface HandControllerProps {
  onGesture: (state: ParticleState | null) => void;
  onRotation: (val: number) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ onGesture, onRotation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const animationFrameRef = useRef<number>();
  const lastGestureRef = useRef<string | null>(null);
  const gestureBufferRef = useRef<string[]>([]);
  const GESTURE_BUFFER_SIZE = 5;
  const lastIndexRef = useRef<number | null>(null);
  const indexBufferRef = useRef<number[]>([]);
  const INDEX_BUFFER_SIZE = 3;

  useEffect(() => {
    let animationFrameId: number;
    let handLandmarker: HandLandmarker | null = null;

    const initHandLandmarker = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMessage('浏览器不支持摄像头访问');
          return;
        }

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });

        handLandmarkerRef.current = handLandmarker;
        setIsLoaded(true);
        startWebcam();
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        setErrorMessage('MediaPipe 加载失败');
      }
    };

    const startWebcam = async () => {
      try {
        if (!videoRef.current) {
          setErrorMessage('视频元素未初始化');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', detectFrame);
        videoRef.current.play().catch(error => {
          console.error('视频播放失败:', error);
        });
      } catch (error: any) {
        console.error('Error accessing webcam:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('摄像头权限被拒绝，请允许访问摄像头');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setErrorMessage('未找到摄像头设备');
        } else {
          setErrorMessage('无法访问摄像头：' + (error.message || error.name));
        }
      }
    };

    const detectFrame = () => {
      if (!videoRef.current || !handLandmarkerRef.current || videoRef.current.currentTime === lastVideoTimeRef.current) {
        animationFrameId = requestAnimationFrame(detectFrame);
        return;
      }

      lastVideoTimeRef.current = videoRef.current.currentTime;
      const startTime = performance.now();

      const handLandmarkerResult = handLandmarkerRef.current.detectForVideo(
        videoRef.current,
        startTime
      );

      if (handLandmarkerResult.landmarks && handLandmarkerResult.landmarks.length > 0) {
        const landmarks = handLandmarkerResult.landmarks[0];
        const wrist = landmarks[0];

        const fingerTips = [8, 12, 16, 20];
        let extendedFingers = 0;

        [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]].forEach(([pip, dip, tip]) => {
          const pipJoint = landmarks[pip];
          const dipJoint = landmarks[dip];
          const tipJoint = landmarks[tip];
          
          const wristToPipDist = Math.sqrt(
            Math.pow(pipJoint.x - wrist.x, 2) + Math.pow(pipJoint.y - wrist.y, 2)
          );
          const wristToTipDist = Math.sqrt(
            Math.pow(tipJoint.x - wrist.x, 2) + Math.pow(tipJoint.y - wrist.y, 2)
          );
          
          if (wristToTipDist > wristToPipDist * 1.1) {
            extendedFingers++;
          }
        });

        const gesture = extendedFingers <= 1 ? 'fist' : 'open';
        gestureBufferRef.current.push(gesture);
        if (gestureBufferRef.current.length > GESTURE_BUFFER_SIZE) {
          gestureBufferRef.current.shift();
        }

        const isConsistent = gestureBufferRef.current.length >= GESTURE_BUFFER_SIZE &&
          gestureBufferRef.current.every(g => g === gesture);

        if (isConsistent && gesture !== lastGestureRef.current) {
          if (gesture === 'open' && lastGestureRef.current === 'fist') {
            onGesture('SCATTERED');
          } else if (gesture === 'fist' && lastGestureRef.current === 'open') {
            onGesture('TREE_SHAPE');
          }
          lastGestureRef.current = gesture;
        }

        if (gesture === 'open') {
          const indexX = wrist.x;
          indexBufferRef.current.push(indexX);
          if (indexBufferRef.current.length > INDEX_BUFFER_SIZE) {
            indexBufferRef.current.shift();
          }

          const avgIndexX = indexBufferRef.current.reduce((a, b) => a + b, 0) / indexBufferRef.current.length;

          if (lastIndexRef.current !== null) {
            const deltaX = avgIndexX - lastIndexRef.current;
            const rotation = deltaX * 50;
            const clampedRotation = Math.max(-6, Math.min(6, rotation));
            onRotation(clampedRotation);
          } else {
            onRotation(0);
          }

          lastIndexRef.current = avgIndexX;
        } else {
          lastIndexRef.current = null;
          indexBufferRef.current = [];
          onRotation(0);
        }
      } else {
        lastGestureRef.current = null;
        gestureBufferRef.current = [];
        lastIndexRef.current = null;
        indexBufferRef.current = [];
        onRotation(0);
      }

      animationFrameId = requestAnimationFrame(detectFrame);
    };

    initHandLandmarker();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
    };
  }, [onGesture, onRotation]);

  return (
    <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
      <div className={`
        relative w-32 h-24 rounded-lg overflow-hidden border-2 
        ${isLoaded ? 'border-pink-500/50' : 'border-red-500/50'}
        bg-black/40 backdrop-blur-sm
      `}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover transform -scale-x-100"
          autoPlay
          playsInline
          muted
        />
        <div className="absolute top-1 left-2 text-[8px] text-pink-200 uppercase tracking-widest bg-black/40 px-1 rounded">
          手势控制
        </div>
        {errorMessage && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-1">
            <div className="text-[6px] text-red-300 text-center leading-tight">
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
