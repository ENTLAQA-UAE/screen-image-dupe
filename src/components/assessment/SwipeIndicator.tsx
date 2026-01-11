import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeIndicatorProps {
  direction: 'left' | 'right' | null;
  offsetX: number;
  isArabic?: boolean;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
}

export function SwipeIndicator({ 
  direction, 
  offsetX, 
  isArabic = false,
  canSwipeLeft = true,
  canSwipeRight = true,
}: SwipeIndicatorProps) {
  const showLeftIndicator = direction === 'left' && canSwipeLeft;
  const showRightIndicator = direction === 'right' && canSwipeRight;
  const intensity = Math.min(Math.abs(offsetX) / 100, 1);

  return (
    <>
      {/* Left edge indicator (next question in LTR, previous in RTL) */}
      <AnimatePresence>
        {showLeftIndicator && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: intensity, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div 
              className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              style={{ opacity: intensity }}
            >
              {isArabic ? (
                <ChevronLeft className="w-6 h-6 text-primary-foreground" />
              ) : (
                <ChevronRight className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <motion.p 
              className="text-xs text-center mt-2 text-muted-foreground font-medium"
              style={{ opacity: intensity }}
            >
              {isArabic ? 'السابق' : 'Next'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right edge indicator (previous question in LTR, next in RTL) */}
      <AnimatePresence>
        {showRightIndicator && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: intensity, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div 
              className="w-12 h-12 rounded-full bg-muted/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              style={{ opacity: intensity }}
            >
              {isArabic ? (
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <motion.p 
              className="text-xs text-center mt-2 text-muted-foreground font-medium"
              style={{ opacity: intensity }}
            >
              {isArabic ? 'التالي' : 'Previous'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
