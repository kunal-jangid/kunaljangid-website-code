import React, { useState, useRef, useEffect } from 'react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableImage({ src, alt, className = '' }: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [state, setState] = useState({
    scale: 1,
    posX: 0,
    posY: 0,
  });

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPinchDist: 0,
    currentScale: 1,
  });

  // Reset zoom state when image source changes
  useEffect(() => {
    setState({ scale: 1, posX: 0, posY: 0 });
  }, [src]);

  // Non-passive wheel zoom listener to allow e.preventDefault() without browser warnings
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.25 : -0.25;

      setState((prevState) => {
        const nextScale = Math.min(Math.max(1, prevState.scale + factor), 4);
        let nextX = prevState.posX;
        let nextY = prevState.posY;
        if (nextScale === 1) {
          nextX = 0;
          nextY = 0;
        }

        let targetX = nextX;
        let targetY = nextY;
        if (nextScale > 1 && imgRef.current) {
          const rect = imgRef.current.getBoundingClientRect();
          const maxW = (rect.width / nextScale * (nextScale - 1)) / 2;
          const maxH = (rect.height / nextScale * (nextScale - 1)) / 2;

          if (maxW > 0) targetX = Math.min(Math.max(nextX, -maxW), maxW);
          else targetX = 0;

          if (maxH > 0) targetY = Math.min(Math.max(nextY, -maxH), maxH);
          else targetY = 0;
        } else {
          targetX = 0;
          targetY = 0;
        }

        return { scale: nextScale, posX: targetX, posY: targetY };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getDistance = (t1: Touch, t2: Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  const constrainAndApply = (scale: number, posX: number, posY: number) => {
    let targetX = posX;
    let targetY = posY;

    if (scale > 1 && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const maxW = (rect.width / scale * (scale - 1)) / 2;
      const maxH = (rect.height / scale * (scale - 1)) / 2;

      if (maxW > 0) targetX = Math.min(Math.max(posX, -maxW), maxW);
      else targetX = 0;

      if (maxH > 0) targetY = Math.min(Math.max(posY, -maxH), maxH);
      else targetY = 0;
    } else {
      targetX = 0;
      targetY = 0;
    }

    setState({ scale, posX: targetX, posY: targetY });
  };

  // Start drag or pinch
  const handleStart = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    const isTouch = 'touches' in e;
    const touches = isTouch ? e.touches : null;

    if (!isTouch && (e as React.MouseEvent).button !== 0) return; // ignore right clicks

    if (!isTouch && state.scale > 1) {
      dragRef.current.isDragging = true;
      dragRef.current.startX = (e as React.MouseEvent).clientX - state.posX;
      dragRef.current.startY = (e as React.MouseEvent).clientY - state.posY;
    } else if (isTouch && touches) {
      if (touches.length === 1 && state.scale > 1) {
        dragRef.current.isDragging = true;
        dragRef.current.startX = touches[0].clientX - state.posX;
        dragRef.current.startY = touches[0].clientY - state.posY;
      } else if (touches.length === 2) {
        dragRef.current.isDragging = false;
        dragRef.current.initialPinchDist = getDistance(touches[0], touches[1]);
        dragRef.current.currentScale = state.scale;
      }
    }
  };

  // Drag or pinch movement
  const handleMove = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    const isTouch = 'touches' in e;
    const touches = isTouch ? e.touches : null;

    if (dragRef.current.isDragging && state.scale > 1) {
      const clientX = isTouch ? touches![0].clientX : (e as React.MouseEvent).clientX;
      const clientY = isTouch ? touches![0].clientY : (e as React.MouseEvent).clientY;
      const nextX = clientX - dragRef.current.startX;
      const nextY = clientY - dragRef.current.startY;
      constrainAndApply(state.scale, nextX, nextY);
    } else if (isTouch && touches && touches.length === 2) {
      const currentDist = getDistance(touches[0], touches[1]);
      const factor = currentDist / dragRef.current.initialPinchDist;
      const nextScale = Math.min(Math.max(1, dragRef.current.currentScale * factor), 4);
      let nextX = state.posX;
      let nextY = state.posY;
      if (nextScale === 1) {
        nextX = 0;
        nextY = 0;
      }
      constrainAndApply(nextScale, nextX, nextY);
    }
  };

  const handleEnd = () => {
    dragRef.current.isDragging = false;
  };

  return (
    <div
      ref={containerRef}
      className="max-w-full max-h-[65vh] flex items-center justify-center overflow-hidden rounded relative"
      style={{ touchAction: 'none' }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} max-w-full max-h-[65vh] object-contain shadow-2xl transition-transform duration-75 ease-out origin-center select-none`}
        style={{
          transform: `translate(${state.posX}px, ${state.posY}px) scale(${state.scale})`,
          cursor: state.scale > 1 ? (dragRef.current.isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
}
