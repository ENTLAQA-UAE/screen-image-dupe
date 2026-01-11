import { useState, useRef, useCallback } from 'react';

interface SwipeState {
  direction: 'left' | 'right' | null;
  swiping: boolean;
  offsetX: number;
}

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefaultOnSwipe?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  preventDefaultOnSwipe = true,
}: UseSwipeGestureOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    swiping: false,
    offsetX: 0,
  });
  
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = e.touches[0].clientX;
    isHorizontalSwipe.current = null;
    setSwipeState({ direction: null, swiping: true, offsetX: 0 });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.swiping) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - startX.current;
    const deltaY = touchY - startY.current;

    // Determine if this is a horizontal or vertical swipe
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // Only process horizontal swipes
    if (isHorizontalSwipe.current) {
      if (preventDefaultOnSwipe) {
        e.preventDefault();
      }
      
      currentX.current = touchX;
      const direction = deltaX > 0 ? 'right' : 'left';
      
      // Apply resistance at edges
      const maxOffset = 150;
      const resistedOffset = Math.sign(deltaX) * Math.min(Math.abs(deltaX), maxOffset);
      
      setSwipeState({
        direction,
        swiping: true,
        offsetX: resistedOffset,
      });
    }
  }, [swipeState.swiping, preventDefaultOnSwipe]);

  const handleTouchEnd = useCallback(() => {
    const deltaX = currentX.current - startX.current;

    if (isHorizontalSwipe.current && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setSwipeState({ direction: null, swiping: false, offsetX: 0 });
    isHorizontalSwipe.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    setSwipeState({ direction: null, swiping: false, offsetX: 0 });
    isHorizontalSwipe.current = null;
  }, []);

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
