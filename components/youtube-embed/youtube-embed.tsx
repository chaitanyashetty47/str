"use client";
import { useState } from 'react';

export default function YoutubeEmbed({ videoLink }: { videoLink: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const videoId = videoLink.split('v=')[1];

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div>
      {/* Thumbnail */}
      <div className="relative cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}>
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt="Video Thumbnail"
          className="w-16 h-9"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="bg-black bg-opacity-50 text-white p-1 rounded-full">
            ▶
          </button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl">
            <button
              className="absolute top-2 right-2 text-white z-50" // Ensure z-index is high
              onClick={handleClose}
            >
              ✕
            </button>
            <div className="relative h-0 pb-[56.25%]">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}