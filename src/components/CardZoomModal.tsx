"use client";

import { useState, useEffect, useRef } from "react";

export interface ZoomCard {
  id: string;
  name: string;
  localId: string;
  image: string;
  seriesName?: string;
}

interface CardZoomModalProps {
  card: ZoomCard | null;
  onClose: () => void;
  isNormalOwned: boolean;
  isFoilOwned: boolean;
  onToggleOwnership: (id: string, type: "normal" | "foil") => void;
  seriesId: string;
}

export default function CardZoomModal({
  card,
  onClose,
  isNormalOwned,
  isFoilOwned,
  onToggleOwnership,
  seriesId,
}: CardZoomModalProps) {
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);

  // Réinitialiser le zoom dès que la carte change ou s'ouvre
  useEffect(() => {
    if (card) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [card]);

  if (!card) return null;

  // Zoom avec la molette de la souris
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoomScale((prev) => {
      const next = Math.min(Math.max(0.8, prev + delta), 4.5);
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  // Déplacement à la souris (drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Pinch-to-zoom & déplacement tactile (mobile / tablette)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = zoomScale;
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current;
      const nextScale = Math.min(Math.max(0.8, initialPinchScaleRef.current * ratio), 4.5);
      setZoomScale(nextScale);
      if (nextScale <= 1) setPanOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging) {
      setPanOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 select-none">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 md:p-7 shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row gap-6 items-center">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800 rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm transition cursor-pointer z-30"
        >
          ✕
        </button>

        {/* Partie gauche : Visuel & Zoom interactif */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative w-full h-[340px] md:h-[400px] flex items-center justify-center bg-slate-950/70 p-2 rounded-2xl border border-slate-800/80 overflow-hidden ${
              zoomScale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
          >
            <img
              src={card.image}
              alt={card.name}
              draggable={false}
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
            />

            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] px-2 py-0.5 rounded-full text-slate-400 pointer-events-none border border-white/5">
              Molette / Écarter pour zoomer
            </div>
          </div>

          {/* Contrôles du zoom */}
          <div className="flex items-center gap-2 mt-2.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-xs text-slate-400">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.8, Number((s - 0.3).toFixed(1))))}
              className="px-2 py-0.5 hover:text-white font-bold cursor-pointer transition"
              title="Dézoomer"
            >
              −
            </button>
            <span className="font-mono text-yellow-400 font-bold min-w-[45px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(4.5, Number((s + 0.3).toFixed(1))))}
              className="px-2 py-0.5 hover:text-white font-bold cursor-pointer transition"
              title="Zoomer"
            >
              +
            </button>
            <button
              onClick={resetZoom}
              className="ml-2 pl-2 border-l border-slate-800 text-[11px] text-slate-400 hover:text-white cursor-pointer transition"
              title="Réinitialiser à 100%"
            >
              ↺ Reset
            </button>
          </div>

          {/* Bouton Cardmarket sous l'image */}
          <a
            href={`https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-3 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🛒</span> Rechercher sur Cardmarket
          </a>
        </div>

        {/* Partie droite : Informations & Possession */}
        <div className="w-full md:w-1/2 flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-md font-extrabold">
                #{card.localId}
              </span>
              <span className="text-xs text-slate-400">
                {card.seriesName || seriesId.toUpperCase()}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white mb-4">{card.name}</h2>
          </div>

          <div className="space-y-2 mt-4">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Dans ma collection :</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleOwnership(card.id, "normal")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  isNormalOwned
                    ? "bg-yellow-500 text-slate-950 shadow-md"
                    : "bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {isNormalOwned ? "✓ Normale acquise" : "+ Normale"}
              </button>
              <button
                onClick={() => onToggleOwnership(card.id, "foil")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  isFoilOwned
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {isFoilOwned ? "✨ Foil acquise" : "+ Foil"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}