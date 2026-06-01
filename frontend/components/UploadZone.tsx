'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onFile: (file: File) => void;
}

export default function UploadZone({ onFile }: Props) {
  const [isHovering, setIsHovering] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-2xl px-4">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 2px cyan)',
              'drop-shadow(0 0 15px cyan)',
              'drop-shadow(0 0 2px cyan)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="p-3"
        >
          <Lock size={50} strokeWidth={1.5} className="text-cyan-400" />
        </motion.div>
        <h1 className="text-6xl font-semibold tracking-tight text-cyan-400 [text-shadow:0_0_8px_cyan] sm:text-7xl">
          ForgeFind
        </h1>
        <p className="text-lg font-light text-[#abc3d3] sm:text-xl">
          AI-Powered Image Manipulation Detection
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`relative w-full cursor-pointer rounded-lg border-2 border-dashed px-8 py-16 transition-all duration-300 ${
          isDragActive
            ? 'border-cyan-400 bg-[#080f21]'
            : 'border-cyan-400/40 bg-[#080f27]/40 hover:border-cyan-400 hover:bg-[#080f21]'
        }`}
      >
        {/* Corner decorations */}
        <span className="absolute top-5 left-5 h-7 w-7 border-t-2 border-l-2 border-cyan-400/30 pointer-events-none" />
        <span className="absolute bottom-5 right-5 h-7 w-7 border-b-2 border-r-2 border-cyan-400/30 pointer-events-none" />

        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <Upload
            size={58}
            strokeWidth={2}
            className={`text-cyan-400/50 ${isHovering || isDragActive ? 'animate-float' : ''}`}
          />
          <p className="text-xl font-normal text-white">
            {isDragActive ? 'Drop image here' : 'Drag image here or browse'}
          </p>
          <p className="text-sm text-[#abc3d3]">
            Supports PNG, JPG, WebP, and other image formats
          </p>
        </div>
      </div>
    </div>
  );
}
