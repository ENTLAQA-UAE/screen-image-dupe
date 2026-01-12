import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  hasPendingData?: boolean;
  isArabic?: boolean;
}

export function OfflineIndicator({ 
  isOnline, 
  hasPendingData = false,
  isArabic = false,
}: OfflineIndicatorProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>
              {isArabic 
                ? 'أنت غير متصل بالإنترنت - يتم حفظ إجاباتك محلياً' 
                : "You're offline - Your answers are being saved locally"}
            </span>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
