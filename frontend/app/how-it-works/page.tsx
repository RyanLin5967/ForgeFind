export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-[860px] px-7 py-16 pb-20">
      <h1 className="text-4xl font-bold mb-2 [text-shadow:0_0_6px_rgba(0,255,255,0.3)]">
        How It Works
      </h1>
      <p className="text-[#abc3d3] text-lg font-light mb-14">
        Two detection engines working in parallel to catch image manipulation.
      </p>

      {/* Pipeline */}
      <div className="flex flex-col gap-12">

        {/* Step 1 */}
        <div className="flex gap-7 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-base font-semibold text-cyan-400 mt-0.5">
            1
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2.5 text-cyan-400">Upload an Image</h3>
            <p className="text-[#abc3d3] text-sm leading-relaxed mb-2.5">
              Drag and drop or browse for any PNG, JPG, or WebP image. The file is sent to the
              backend where its signature bytes are verified to make sure it&apos;s actually an
              image before anything runs.
            </p>
            <p className="text-[#82969f] text-xs leading-relaxed">
              No file extension tricks get through. ForgeFind reads the raw binary header, not the
              filename.
            </p>
          </div>
        </div>

        <div className="w-0.5 h-7 bg-cyan-400/15 ml-5" />

        {/* Step 2 */}
        <div className="flex gap-7 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-base font-semibold text-cyan-400 mt-0.5">
            2
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2.5 text-cyan-400">Dual-Engine Analysis</h3>
            <p className="text-[#abc3d3] text-sm leading-relaxed">
              Your image is processed by two independent detection systems at the same time. Each
              one targets a different kind of forgery.
            </p>
          </div>
        </div>
      </div>

      {/* Engine cards */}
      <div className="flex gap-6 mt-12 mb-12 flex-col sm:flex-row">
        <div className="flex-1 bg-[#080f27]/80 border border-cyan-400/12 rounded-xl p-7">
          <h4 className="text-lg font-semibold mb-1.5 text-cyan-400">Splicing Detection</h4>
          <p className="text-[#82969f] text-xs mb-3.5">PyTorch · U-Net · ResNet34 encoder</p>
          <p className="text-[#abc3d3] text-sm leading-relaxed mb-0">
            A deep learning segmentation model trained to identify regions of an image that were
            pasted in from a different source. It outputs a pixel-level mask highlighting suspicious
            areas.
          </p>
          <ul className="mt-3 space-y-1">
            {[
              'Resizes input to 256×256 for inference',
              'Upscales the probability map back to original resolution',
              'Applies morphological cleanup to remove noise',
              'Filters small blobs by confidence threshold',
              'Rejects masks covering more than 25% of the image',
            ].map((item) => (
              <li key={item} className="text-[#96a8b4] text-xs py-1 flex gap-2">
                <span className="text-cyan-400/50 font-bold">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 bg-[#080f27]/80 border border-cyan-400/12 rounded-xl p-7">
          <h4 className="text-lg font-semibold mb-1.5 text-cyan-400">Copy-Move Detection</h4>
          <p className="text-[#82969f] text-xs mb-3.5">OpenCV · SIFT · FLANN · RANSAC</p>
          <p className="text-[#abc3d3] text-sm leading-relaxed">
            A classical computer vision pipeline that finds regions duplicated within the same
            image. It extracts keypoints, matches them, and uses geometric verification to confirm
            cloned areas.
          </p>
          <ul className="mt-3 space-y-1">
            {[
              'SIFT extracts scale-invariant feature descriptors',
              'FLANN matches features with a ratio test (0.70)',
              'Filters out spatially close matches (same region)',
              'RANSAC fits a homography to verify geometric consistency',
              'Rejects overlapping bounding boxes as false positives',
            ].map((item) => (
              <li key={item} className="text-[#96a8b4] text-xs py-1 flex gap-2">
                <span className="text-cyan-400/50 font-bold">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <div className="w-0.5 h-7 bg-cyan-400/15 ml-5" />

        {/* Step 3 */}
        <div className="flex gap-7 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-base font-semibold text-cyan-400 mt-0.5">
            3
          </div>
          <div className="w-full">
            <h3 className="text-xl font-semibold mb-2.5 text-cyan-400">Results Visualization</h3>
            <p className="text-[#abc3d3] text-sm leading-relaxed mb-4">
              The original image is drawn to a canvas, and both detection outputs are layered on
              top. You can toggle between views to examine each finding independently or see
              everything at once.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Original Image',
                  desc: 'The unmodified upload with no overlays.',
                },
                {
                  title: 'Noise Mask',
                  desc: 'Red overlay showing pixel regions the U-Net flagged as spliced. White mask pixels become semi-transparent red.',
                },
                {
                  title: 'Clone Detection',
                  desc: 'Green bounding boxes around matched copy-move regions identified by the SIFT pipeline.',
                },
                {
                  title: 'Overall',
                  desc: 'Both the red mask and green boxes together on a single view.',
                },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="bg-[#080f27]/50 border border-cyan-400/8 rounded-lg p-4"
                >
                  <p className="text-cyan-400 text-sm font-semibold mb-1.5">{title}</p>
                  <p className="text-[#96a8b4] text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-0.5 h-7 bg-cyan-400/15 ml-5" />

        {/* Step 4 */}
        <div className="flex gap-7 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-base font-semibold text-cyan-400 mt-0.5">
            4
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2.5 text-cyan-400">Confidence Scoring</h3>
            <p className="text-[#abc3d3] text-sm leading-relaxed mb-2.5">
              Each engine produces its own score. The splicing confidence is the average probability
              across all flagged pixels. Copy-move detection is binary: if SIFT finds a verified
              clone, it reports 98% confidence.
            </p>
            <p className="text-[#abc3d3] text-sm leading-relaxed mb-4">
              The overall score takes the higher of the two, since either type of manipulation is
              enough to flag the image.
            </p>

            <div className="bg-[#080f27]/60 border-l-[3px] border-cyan-400/30 pl-6 pr-5 py-5 rounded-r-lg">
              <p className="text-sm font-semibold text-cyan-400 mb-2.5">Score Ranges</p>
              {[
                { color: 'bg-green-500', label: '0 – 30%', desc: 'Low Risk. No meaningful manipulation detected.' },
                { color: 'bg-yellow-400', label: '31 – 70%', desc: 'Medium Risk. Some suspicious regions found, but inconclusive.' },
                { color: 'bg-red-500', label: '71 – 100%', desc: 'High Risk. Strong evidence of tampering.' },
              ].map(({ color, label, desc }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                  <span className="text-[#abc3d3] text-sm">
                    <strong>{label}</strong> &nbsp;{desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-0.5 h-7 bg-cyan-400/15 ml-5" />

        {/* Step 5 */}
        <div className="flex gap-7 items-start">
          <div className="shrink-0 w-11 h-11 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-base font-semibold text-cyan-400 mt-0.5">
            5
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2.5 text-cyan-400">Cleanup</h3>
            <p className="text-[#abc3d3] text-sm leading-relaxed">
              Uploaded images and generated masks are stored temporarily on the server. A background
              task runs every 10 minutes and deletes any files older than 10 minutes. Nothing is
              kept permanently.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
