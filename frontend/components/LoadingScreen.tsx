'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
}

export default function LoadingScreen({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-lg bg-[#080d19]/60"
        >
          {/* Outer ring */}
          <div className="absolute h-24 w-24 rounded-full border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(0,255,255,0.4)]" />
          {/* Mid ring */}
          <div className="absolute h-[85px] w-[85px] rounded-full border border-cyan-400/20 drop-shadow-[0_0_5px_cyan]" />
          {/* Inner ring with scan line */}
          <div className="absolute h-[70px] w-[70px] overflow-hidden rounded-full border-2 border-cyan-400/40 drop-shadow-[0_0_5px_cyan]">
            <div className="absolute left-0 w-full border-t border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.4)] animate-scan" />
          </div>
          {/* Center dot */}
          <div className="absolute h-3 w-3 rounded-full bg-cyan-400/60" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
