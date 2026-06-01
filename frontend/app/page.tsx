'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendImage, ApiResponse } from '@/lib/api';
import UploadZone from '@/components/UploadZone';
import LoadingScreen from '@/components/LoadingScreen';
import ResultsView from '@/components/ResultsView';

type PageState = 'upload' | 'loading' | 'results';

export default function HomePage() {
  const [state, setState] = useState<PageState>('upload');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setState('loading');
    setError(null);
    try {
      const data = await sendImage(file);
      setResult(data);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('upload');
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      <LoadingScreen visible={state === 'loading'} />

      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-1 flex-col items-center justify-center px-4 py-16"
          >
            {error && (
              <div className="mb-6 rounded-lg border border-red-400/40 bg-red-900/20 px-4 py-3 text-sm text-red-400 max-w-md text-center">
                {error}
              </div>
            )}
            <UploadZone onFile={handleFile} />
          </motion.div>
        )}

        {state === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            <ResultsView data={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
