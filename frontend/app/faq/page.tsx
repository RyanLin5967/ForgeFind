'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqSection {
  label: string;
  items: FaqItem[];
}

const SECTIONS: FaqSection[] = [
  {
    label: 'General',
    items: [
      {
        question: 'What is image forgery?',
        answer: (
          <p>
            Image forgery is any deliberate manipulation of a photo to misrepresent what it shows.
            The two most common types are <strong>splicing</strong> (pasting part of one image into
            another) and <strong>copy-move</strong> (duplicating a region within the same image to
            hide or create objects).
          </p>
        ),
      },
      {
        question: 'What types of manipulation does ForgeFind detect?',
        answer: (
          <>
            <p>
              ForgeFind targets two specific forgery types. The <strong>splicing detector</strong>{' '}
              (a U-Net neural network) finds regions that were pasted in from a different image. The{' '}
              <strong>copy-move detector</strong> (an OpenCV SIFT pipeline) finds regions that were
              cloned within the same image.
            </p>
            <p className="mt-2">
              It does not currently detect things like brightness/contrast edits, color grading,
              AI-generated images, or face swaps.
            </p>
          </>
        ),
      },
      {
        question: 'Is ForgeFind free to use?',
        answer: (
          <p>
            Yes. ForgeFind is open source under the MIT license. You can use it, modify it, or
            build on top of it.
          </p>
        ),
      },
    ],
  },
  {
    label: 'Detection & Accuracy',
    items: [
      {
        question: 'How accurate is it?',
        answer: (
          <>
            <p>
              The U-Net model was trained on the CASIA dataset and performs well on clear splicing
              cases. The SIFT copy-move pipeline is reliable for duplicated regions that have
              distinct features (textures, edges, objects).
            </p>
            <p className="mt-2">
              That said, no detection tool is perfect. Heavily compressed images, very small edits,
              or manipulations followed by re-saving can reduce accuracy. ForgeFind includes multiple
              post-processing steps (blob filtering, mask ratio limits, homography checks)
              specifically to reduce false positives.
            </p>
          </>
        ),
      },
      {
        question: 'What does the confidence score mean?',
        answer: (
          <>
            <p>
              For splicing, the confidence score is the average probability the model assigned to
              all pixels it flagged as tampered. A score of 85% means the model is, on average, 85%
              sure about the regions it highlighted.
            </p>
            <p className="mt-2">
              For copy-move, detection is more binary. If the SIFT pipeline finds a verified clone
              (passing the ratio test, spatial separation, RANSAC, and overlap checks), it reports
              98%. Otherwise it reports 0%.
            </p>
            <p className="mt-2">The overall score shown at the top takes whichever is higher.</p>
          </>
        ),
      },
      {
        question: "Why did it flag my image as manipulated when it's not?",
        answer: (
          <>
            <p>
              False positives can happen. Images with lots of repeated patterns (text, tiles,
              fences) sometimes trigger the copy-move detector. The splicing model can also flag
              regions on images that were saved with heavy JPEG compression, since compression
              artifacts can look similar to splice boundaries.
            </p>
            <p className="mt-2">
              ForgeFind already applies several filters to reduce these (minimum blob area, mask
              ratio limits, confidence-scaled thresholds), but edge cases exist.
            </p>
          </>
        ),
      },
      {
        question: 'Why did it miss a manipulation I know is there?',
        answer: (
          <p>
            A few reasons this can happen. Very small edits might produce mask regions below the
            minimum blob threshold and get filtered out. Heavily recompressed images lose the
            artifacts that the model relies on. And the copy-move detector needs at least 6
            geometrically consistent feature matches to confirm a clone, so textureless or blurry
            duplicated regions can slip through.
          </p>
        ),
      },
    ],
  },
  {
    label: 'Privacy & Files',
    items: [
      {
        question: 'What happens to my uploaded image?',
        answer: (
          <p>
            Your image is saved temporarily on the server so the detection engines can process it
            and so the browser can display the results. A cleanup task runs every 10 minutes and
            deletes all uploads older than 10 minutes. Nothing is stored permanently or shared with
            anyone.
          </p>
        ),
      },
      {
        question: 'What file formats are supported?',
        answer: (
          <p>
            PNG, JPEG, and WebP. The backend validates file type by reading the binary signature
            (magic bytes) of the uploaded file, not the file extension. If the bytes don&apos;t
            match a supported image format, the upload is rejected with a 415 error.
          </p>
        ),
      },
      {
        question: 'Is there a file size limit?',
        answer: (
          <p>
            There&apos;s no hard limit enforced in the app, but very large images will take longer
            since the U-Net still processes at 256×256 internally and the SIFT detector scales with
            the number of keypoints. Anything under 10MB should work without issues.
          </p>
        ),
      },
    ],
  },
  {
    label: 'Technical',
    items: [
      {
        question: "What's the tech stack?",
        answer: (
          <p>
            The backend is Python with FastAPI, running PyTorch (U-Net via
            segmentation-models-pytorch) and OpenCV for detection. It&apos;s containerized with
            Docker and hosted on HuggingFace Spaces. The frontend is React with Next.js and
            Tailwind CSS, hosted on Netlify.
          </p>
        ),
      },
      {
        question: 'Can I run it locally?',
        answer: (
          <p>
            Yes. Clone the repo, install the Python dependencies from{' '}
            <code className="bg-cyan-400/6 text-cyan-400 px-1.5 py-0.5 rounded text-sm">
              requirements.txt
            </code>
            , and run the FastAPI server with{' '}
            <code className="bg-cyan-400/6 text-cyan-400 px-1.5 py-0.5 rounded text-sm">
              uvicorn main:app
            </code>
            . The model weights download automatically on first run. Update{' '}
            <code className="bg-cyan-400/6 text-cyan-400 px-1.5 py-0.5 rounded text-sm">
              API_BASE
            </code>{' '}
            in{' '}
            <code className="bg-cyan-400/6 text-cyan-400 px-1.5 py-0.5 rounded text-sm">
              lib/api.ts
            </code>{' '}
            to point to localhost.
          </p>
        ),
      },
    ],
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`bg-[#080f27]/60 border rounded-xl overflow-hidden transition-colors duration-300 ${
              isOpen ? 'border-cyan-400/25' : 'border-cyan-400/8 hover:border-cyan-400/20'
            }`}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer select-none hover:bg-cyan-400/3 transition-colors"
            >
              <span className="text-base font-semibold text-[rgb(220,230,240)] leading-snug pr-4">
                {item.question}
              </span>
              <ChevronDown
                size={20}
                className={`shrink-0 stroke-cyan-400/50 transition-transform duration-250 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[500px]' : 'max-h-0'
              }`}
            >
              <div className="px-6 pb-6 text-[#a0afbe] text-sm leading-relaxed [&_p]:mb-0 [&_strong]:text-[rgb(220,230,240)]">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-[820px] px-7 py-16 pb-20">
      <h1 className="text-4xl font-bold mb-2 [text-shadow:0_0_6px_rgba(0,255,255,0.3)]">FAQ</h1>
      <p className="text-[#abc3d3] text-lg font-light mb-12">
        Common questions about ForgeFind and image forgery detection.
      </p>

      <div className="flex flex-col">
        {SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p className="text-cyan-400/40 text-xs font-semibold tracking-widest uppercase mt-9 mb-3.5 first:mt-0">
              {label}
            </p>
            <FaqAccordion items={items} />
          </div>
        ))}
      </div>
    </main>
  );
}
