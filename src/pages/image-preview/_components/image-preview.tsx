import { useState, useEffect, useRef, type FC, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Palette,
  X,
  Image as ImageIcon,
  AlertCircle,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface FileInfo {
  name: string;
  size: string;
  dimensions: string;
  type: string;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

// --- Constants ---
const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const DEFAULT_BG_COLOR = "#0a0a0a";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// --- Utility Functions ---
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getImageDimensions = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
};

// --- Main Component ---
export const ImagePreview: FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: DEFAULT_SCALE,
  });
  const [bgColor, setBgColor] = useState<string>(DEFAULT_BG_COLOR);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // --- Auto-hide controls on inactivity ---
  const resetHideControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (!isSettingsOpen && !isPanelOpen) {
        setShowControls(false);
      }
    }, 3000);
  }, [isSettingsOpen, isPanelOpen]);

  // --- File Processing ---
  const processFile = async (file: File | null | undefined) => {
    setError(null);
    if (!file) return;

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, GIF, WebP, SVG).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          setImageUrl(result);
          setTransform({ x: 0, y: 0, scale: DEFAULT_SCALE });

          const dimensions = await getImageDimensions(file);
          setFileInfo({
            name: file.name,
            size: formatFileSize(file.size),
            dimensions: `${dimensions.width} × ${dimensions.height}`,
            type: file.type,
          });
        }
      };
      reader.onerror = () => {
        setError("Error reading file.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- Drag & Drop Handlers ---
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    processFile(file);
  };

  // --- Paste Handler ---
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // --- Zoom & Pan Handlers ---
  const handleWheel = (event: WheelEvent) => {
    if (!imageUrl || !containerRef?.current) return;
    if (
      event.target instanceof HTMLElement &&
      event.target.closest(".controls-panel")
    )
      return;

    event.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleSensitivity = 0.001;
    const delta = -event.deltaY * scaleSensitivity;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(transform.scale + delta, MAX_SCALE),
    );

    if (newScale !== transform.scale) {
      const scaleChange = newScale - transform.scale;
      setTransform((prev) => ({
        x: prev.x - (x - rect.width / 2 - prev.x) * (scaleChange / prev.scale),
        y: prev.y - (y - rect.height / 2 - prev.y) * (scaleChange / prev.scale),
        scale: newScale,
      }));
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!imageUrl) return;
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;

    setIsDragging(true);
    setDragStart({
      x: event.clientX - transform.x,
      y: event.clientY - transform.y,
    });
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;
      event.preventDefault();

      setTransform((prev) => ({
        ...prev,
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      }));
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Keyboard Handlers ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!imageUrl) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        adjustZoom(0.1);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        adjustZoom(-0.1);
      } else if (event.key === "0") {
        event.preventDefault();
        resetTransform();
      } else if (event.key === "Escape") {
        setIsSettingsOpen(false);
        setIsPanelOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imageUrl, transform.scale]);

  // --- Mouse move listener for panning ---
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // --- Wheel listener for zoom ---
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // --- Mouse move for controls visibility ---
  useEffect(() => {
    const handleMouseMoveForControls = () => {
      resetHideControlsTimer();
    };

    document.addEventListener("mousemove", handleMouseMoveForControls);
    return () =>
      document.removeEventListener("mousemove", handleMouseMoveForControls);
  }, [resetHideControlsTimer]);

  // --- Control Functions ---
  const adjustZoom = (amount: number) => {
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(transform.scale + amount, MAX_SCALE),
    );
    setTransform((prev) => ({ ...prev, scale: newScale }));
  };

  const resetTransform = () => {
    setTransform({ x: 0, y: 0, scale: DEFAULT_SCALE });
  };

  const clearImage = () => {
    setImageUrl(null);
    setFileInfo(null);
    setError(null);
    resetTransform();
  };

  const downloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileInfo?.name || "image";
    link.click();
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden text-gray-100 font-sans select-none"
      style={{ backgroundColor: bgColor }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Main Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out origin-center p-8",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {imageUrl ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
            draggable={false}
          />
        ) : (
          <div className="text-center">
            <ImageIcon size={64} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/20 text-lg">No image loaded</p>
            <p className="text-white/10 text-sm mt-2">
              Drag & drop or paste an image
            </p>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/10 border-4 border-white/30 border-dashed backdrop-blur-sm z-50 m-4 rounded-xl pointer-events-none"
          >
            <div className="text-center">
              <Upload size={48} className="mx-auto text-white/80 mb-4" />
              <p className="text-2xl font-bold text-white/90">
                Drop image here
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-500/90 backdrop-blur-md rounded-lg shadow-xl border border-red-400/30 p-4 flex items-center gap-3 max-w-md">
              <AlertCircle size={20} className="text-red-200 shrink-0" />
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Controls - Zoom */}
      <AnimatePresence>
        {showControls && imageUrl && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-6 left-6 z-30"
          >
            <div className="bg-black/60 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-2 flex flex-col gap-2">
              <button
                onClick={() => adjustZoom(0.2)}
                className="p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Zoom In (+)"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => adjustZoom(-0.2)}
                className="p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Zoom Out (-)"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={resetTransform}
                className="p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Reset View (0)"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-mono text-white/60 border border-white/10 text-center mt-2">
              {Math.round(transform.scale * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Controls - Actions */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-30"
          >
            <div className="flex flex-col gap-2">
              {!imageUrl && (
                <button
                  onClick={triggerFileUpload}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-md"
                  title="Upload Image"
                >
                  <Upload size={20} />
                </button>
              )}

              {imageUrl && (
                <>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-md"
                    title="Settings"
                  >
                    <Palette size={20} />
                  </button>

                  <button
                    onClick={downloadImage}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-md"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>

                  <button
                    onClick={clearImage}
                    className="p-3 bg-white/10 hover:bg-red-500/20 text-white rounded-lg transition-all duration-200 backdrop-blur-md"
                    title="Clear Image"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input - Always in DOM */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="file-input-upload"
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-y-6">
              {/* Upload Section */}
              <div className="flex flex-col gap-y-3">
                <label className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                  Upload Image
                </label>
                <button
                  onClick={triggerFileUpload}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 border-dashed rounded-lg transition-all text-white/80 hover:text-white"
                >
                  <Upload size={18} className="inline mr-2" />
                  Choose File
                </button>
              </div>

              {/* File Info */}
              {fileInfo && (
                <div className="flex flex-col gap-y-3">
                  <label className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                    File Information
                  </label>
                  <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Name:</span>
                      <span className="text-white/80 truncate ml-2">
                        {fileInfo.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Size:</span>
                      <span className="text-white/80">{fileInfo.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Dimensions:</span>
                      <span className="text-white/80">
                        {fileInfo.dimensions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Type:</span>
                      <span className="text-white/80">{fileInfo.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Background Color */}
              <div className="flex flex-col gap-y-3">
                <label className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} />
                  Background Color
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                    <div
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded border border-white/30"
                      style={{ backgroundColor: bgColor }}
                    />
                  </div>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-12 w-12 p-1 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 text-xs text-white/40 flex-wrap">
                  <span>Presets:</span>
                  <button
                    onClick={() => setBgColor("#0a0a0a")}
                    className="hover:text-white/80 transition-colors"
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setBgColor("#ffffff")}
                    className="hover:text-white/80 transition-colors"
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setBgColor("#1a1a1a")}
                    className="hover:text-white/80 transition-colors"
                  >
                    Gray
                  </button>
                  <button
                    onClick={() => setBgColor("#000000")}
                    className="hover:text-white/80 transition-colors"
                  >
                    Black
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="flex flex-col gap-y-3">
                <label className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                  Controls
                </label>
                <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-y-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Move size={16} />
                    <span>Click & drag to pan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🖱️</span>
                    <span>Scroll to zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">⌨️</span>
                    <span>+/- to zoom, 0 to reset</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📋</span>
                    <span>Ctrl+V to paste image</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
