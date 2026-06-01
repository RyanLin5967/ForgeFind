'use client';

import { Copy, Scissors } from 'lucide-react';
import Link from 'next/link';
import { ApiResponse } from '@/lib/api';
import {
  getFullScore,
  getOpenCVScore,
  getRiskLevel,
  getDetectionStatus,
  getRiskColor,
  colorClasses,
} from '@/lib/utils';
import CanvasView from './CanvasView';

interface Props {
  data: ApiResponse;
}

export default function ResultsView({ data }: Props) {
  const overallScore = getFullScore(data.coords, data.confidence_score);
  const opencvScore = getOpenCVScore(data.coords);
  const spliceScore = Math.round(data.confidence_score);

  const oc = colorClasses[getRiskColor(getRiskLevel(overallScore))];
  const cmc = colorClasses[getRiskColor(getRiskLevel(opencvScore))];
  const cmd = colorClasses[getRiskColor(getDetectionStatus(opencvScore))];
  const splc = colorClasses[getRiskColor(getRiskLevel(spliceScore))];
  const spld = colorClasses[getRiskColor(getDetectionStatus(spliceScore))];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto px-4 pb-12 pt-6">
      <CanvasView orgUrl={data.org_url} maskUrl={data.mask_url} coords={data.coords} />

      {/* Confidence Score */}
      <div className={`self-stretch rounded-lg bg-[#080f27] p-5 ${oc.text}`}>
        <p className="text-sm text-gray-500 mb-2">Confidence Score</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-5xl font-semibold">{overallScore}%</span>
          <span className={`rounded-full border px-3 py-1 text-sm ${oc.border}`}>
            {getRiskLevel(overallScore)}
          </span>
        </div>
        <div className="mt-5 h-1.5 w-full rounded-full bg-gray-800">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${oc.bg}`}
            style={{ width: `${Math.max(overallScore, 0.1)}%` }}
          />
        </div>
      </div>

      {/* Detected Manipulations */}
      <div className="self-stretch rounded-lg bg-[#080f27] p-5">
        <p className="text-sm text-gray-500 mb-4">Detected Manipulations</p>

        {/* Copy-Move Forgery */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`rounded-lg p-1.5 ${cmc.bg} shrink-0`}>
            <Copy size={18} className="text-[#080d19]" />
          </span>
          <span className="text-[rgb(206,200,200)] text-sm">Copy-Move Forgery</span>
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 text-xs shrink-0 ${cmd.text} ${cmd.border}`}
          >
            {getDetectionStatus(opencvScore)}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-gray-800">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                data.coords.length > 0 ? cmc.bg : 'bg-green-400'
              }`}
              style={{ width: `${Math.max(opencvScore, 0.1)}%` }}
            />
          </div>
          <span className={`text-sm shrink-0 ${data.coords.length > 0 ? cmc.text : 'text-green-400'}`}>
            {opencvScore}%
          </span>
        </div>

        {/* Splicing */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`rounded-lg p-1.5 ${splc.bg} shrink-0`}>
            <Scissors size={18} className="text-[#080d19]" />
          </span>
          <span className="text-[rgb(206,200,200)] text-sm">Splicing</span>
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 text-xs shrink-0 ${spld.text} ${spld.border}`}
          >
            {getDetectionStatus(spliceScore)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-gray-800">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                spliceScore > 0 ? splc.bg : 'bg-green-400'
              }`}
              style={{ width: `${Math.max(spliceScore, 0.1)}%` }}
            />
          </div>
          <span className={`text-sm shrink-0 ${spliceScore > 0 ? splc.text : 'text-green-400'}`}>
            {spliceScore}%
          </span>
        </div>
      </div>

      <Link
        href="/"
        className="rounded-lg border border-cyan-400/40 bg-[#080f27] px-6 py-3 text-sm text-cyan-400 transition-all duration-300 hover:bg-[#001a30] hover:border-cyan-400"
      >
        Upload New Image
      </Link>
    </div>
  );
}
