"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocale } from "@/i18n/locale-provider";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface PreviewImageItem {
  src: string;
  alt?: string;
}

export interface OpenImagePreviewPayload {
  images: PreviewImageItem[];
  initialIndex?: number;
}

const PREVIEW_EVENT = "srp:open-image-preview";

/**
 * Global trigger to open the image previewer from any component.
 */
export function openImagePreview(payload: OpenImagePreviewPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenImagePreviewPayload>(PREVIEW_EVENT, {
      detail: payload,
    })
  );
}

export function ImagePreviewer() {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<PreviewImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Transform states
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const currentImage = images[currentIndex];

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
    hasMovedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetTransform();
  }, [resetTransform]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetTransform();
  }, [images.length, resetTransform]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetTransform();
  }, [images.length, resetTransform]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(Number((s + 0.25).toFixed(2)), 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(Number((s - 0.25).toFixed(2)), 0.25));
  }, []);

  const handleRotateCcw = useCallback(() => {
    setRotation((r) => (r - 90 + 360) % 360);
  }, []);

  const handleRotateCw = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleFlipH = useCallback(() => {
    setFlipH((f) => !f);
  }, []);

  const handleFlipV = useCallback(() => {
    setFlipV((f) => !f);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale <= 1.05) {
      setScale(2);
    } else {
      resetTransform();
    }
  }, [scale, resetTransform]);

  // Listen for open events
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<OpenImagePreviewPayload>;
      const detail = customEvent.detail;
      if (detail && detail.images && detail.images.length > 0) {
        setImages(detail.images);
        setCurrentIndex(
          Math.min(Math.max(detail.initialIndex ?? 0, 0), detail.images.length - 1)
        );
        resetTransform();
        setIsOpen(true);
      }
    };

    window.addEventListener(PREVIEW_EVENT, handleOpen);
    return () => {
      window.removeEventListener(PREVIEW_EVENT, handleOpen);
    };
  }, [resetTransform]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          handleZoomOut();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRotateCw();
          break;
        case "h":
        case "H":
          e.preventDefault();
          handleFlipH();
          break;
        case "v":
        case "V":
          e.preventDefault();
          handleFlipV();
          break;
        case "0":
          e.preventDefault();
          resetTransform();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    handleClose,
    handlePrev,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    handleRotateCw,
    handleFlipH,
    handleFlipV,
    resetTransform,
  ]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((s) => Math.min(Math.max(Number((s + delta).toFixed(2)), 0.25), 5));
  }, []);

  // Drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      setIsDragging(true);
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      };
    },
    [offset]
  );

  // Drag move & end via window listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      if (Math.abs(newX - offset.x) > 3 || Math.abs(newY - offset.y) > 3) {
        hasMovedRef.current = true;
      }
      setOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, offset]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !hasMovedRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!isOpen || !currentImage) return null;

  const transformStyle = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale}) scaleX(${
      flipH ? -1 : 1
    }) scaleY(${flipV ? -1 : 1}) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      className="fixed inset-0 z-[100] flex items-center justify-center select-none bg-black/85 backdrop-blur-md transition-opacity duration-200"
      onWheel={handleWheel}
      onClick={handleBackdropClick}
    >
      {/* Top Header Bar */}
      <div className="pointer-events-none fixed top-0 inset-x-0 z-10 flex items-center justify-between p-4 sm:p-6">
        {/* Left: Index indicator & Alt title */}
        <div className="pointer-events-auto flex items-center gap-2">
          {images.length > 1 && (
            <span className="rounded-full bg-black/50 px-3 py-1 font-mono text-xs font-medium text-white/80 backdrop-blur-md border border-white/10">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          {currentImage.alt && (
            <span
              title={currentImage.alt}
              className="max-w-[240px] truncate rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-md border border-white/10 sm:max-w-md"
            >
              {currentImage.alt}
            </span>
          )}
        </div>

        {/* Right: Close button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            title={t.imageViewer.close}
            aria-label={t.imageViewer.close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md border border-white/10 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden p-6 sm:p-12"
        onClick={handleBackdropClick}
      >
        <div
          style={transformStyle}
          className={`flex items-center justify-center ${
            scale > 1.05
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in"
          }`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.src}
            alt={currentImage.alt || ""}
            draggable={false}
            className="max-h-[82vh] max-w-[88vw] object-contain rounded-md shadow-2xl pointer-events-auto"
          />
        </div>
      </div>

      {/* Left/Right Prev/Next navigation */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            title={t.imageViewer.prev}
            aria-label={t.imageViewer.prev}
            className="fixed left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md border border-white/10 transition-all hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            title={t.imageViewer.next}
            aria-label={t.imageViewer.next}
            className="fixed right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md border border-white/10 transition-all hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 sm:gap-1 rounded-full border border-white/15 bg-black/75 px-2.5 py-1.5 shadow-2xl backdrop-blur-xl text-white/85">
        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          title={t.imageViewer.zoomOut}
          aria-label={t.imageViewer.zoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 hover:text-white active:scale-95"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        {/* Scale percent indicator (click to toggle 100% / 200%) */}
        <button
          type="button"
          onClick={handleDoubleClick}
          title={t.imageViewer.reset}
          className="px-2 py-0.5 font-mono text-xs font-medium tracking-tight rounded-md transition-colors hover:bg-white/15 hover:text-white"
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          title={t.imageViewer.zoomIn}
          aria-label={t.imageViewer.zoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 hover:text-white active:scale-95"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <span className="mx-1 h-3.5 w-px bg-white/20" />

        {/* Rotate CCW */}
        <button
          type="button"
          onClick={handleRotateCcw}
          title={t.imageViewer.rotateLeft}
          aria-label={t.imageViewer.rotateLeft}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 hover:text-white active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Rotate CW */}
        <button
          type="button"
          onClick={handleRotateCw}
          title={t.imageViewer.rotateRight}
          aria-label={t.imageViewer.rotateRight}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 hover:text-white active:scale-95"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <span className="mx-1 h-3.5 w-px bg-white/20" />

        {/* Flip Horizontal */}
        <button
          type="button"
          onClick={handleFlipH}
          title={t.imageViewer.flipHorizontal}
          aria-label={t.imageViewer.flipHorizontal}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 active:scale-95 ${
            flipH ? "bg-[#f75c7e]/25 text-[#f75c7e]" : "hover:text-white"
          }`}
        >
          <FlipHorizontal className="h-4 w-4" />
        </button>

        {/* Flip Vertical */}
        <button
          type="button"
          onClick={handleFlipV}
          title={t.imageViewer.flipVertical}
          aria-label={t.imageViewer.flipVertical}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 active:scale-95 ${
            flipV ? "bg-[#f75c7e]/25 text-[#f75c7e]" : "hover:text-white"
          }`}
        >
          <FlipVertical className="h-4 w-4" />
        </button>

        <span className="mx-1 h-3.5 w-px bg-white/20" />

        {/* Reset */}
        <button
          type="button"
          onClick={resetTransform}
          title={t.imageViewer.reset}
          aria-label={t.imageViewer.reset}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 hover:text-white active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
