"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  rarity?: string;
  pricing?: any;
  cardmarket?: any;
}

interface CardZoomModalProps {
  card: Card | null;
  onClose: () => void;
  isNormalOwned: boolean;
  isFoilOwned: boolean;
  onToggleOwnership: (id: string, type: "normal" | "foil") => void;
  seriesId?: string;
  seriesName?: string;
}

export default function CardZoomModal({
  card,
  onClose,
  isNormalOwned,
  isFoilOwned,
  onToggleOwnership,
}: CardZoomModalProps) {
  const [price, setPrice] = useState<string>("...");

  // Calcul du prix au chargement de la modale
  useEffect(() => {
    if (!card) return;

    const fetchPrice = async () => {
      // 1. On essaie de lire le prix déjà présent dans les props
      let p = card.pricing?.cardmarket?.avg || card.cardmarket?.prices?.averageSellPrice || 0;
      
      if (p > 0) {
        setPrice(p.toFixed(2).replace(".", ","));
        return;
      }

      // 2. Sinon on interroge l'API
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/fr/cards/${card.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const cm = data?.pricing?.cardmarket;
        const fetchedPrice = cm?.avg || cm?.trend || cm?.low || 0;
        
        if (fetchedPrice > 0) {
          setPrice(fetchedPrice.toFixed(2).replace(".", ","));
        } else {
          setPrice("N/A");
        }
      } catch (err) {
        setPrice("N/A");
      }
    };

    fetchPrice();
  }, [card]);

  // Fermer la modale si on appuie sur Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80 font-['Outfit'] animate-fade-in"
      onClick={onClose}
    >
      {/* Conteneur principal de la modale */}
      <div 
        className="bg-[#09090B] rounded-[32px] max-w-4xl w-full flex flex-col md:flex-row p-4 md:p-6 gap-6 md:gap-8 border border-white/10 relative"
        onClick={(e) => e.stopPropagation()} // Empêche le clic à l'intérieur de fermer la modale
      >
        
        {/* Bouton Fermer (Croix) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-6 text-zinc-500 hover:text-white text-3xl transition-colors z-10"
        >
          ×
        </button>

        {/* COLONNE GAUCHE : L'Image */}
        <div className="flex-1 bg-[#18181B] rounded-[24px] border border-white/10 p-6 flex items-center justify-center min-h-[300px]">
          {card.image ? (
            <img 
              src={card.image} 
              alt={card.name} 
              className="w-full max-w-[320px] rounded-xl drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <div className="text-6xl opacity-20">🃏</div>
          )}
        </div>

        {/* COLONNE DROITE : Les Infos */}
        <div className="flex-1 flex flex-col gap-6 pt-4">
          
          {/* Tags : Numéro et Rareté */}
          <div className="flex items-center gap-3">
            <span className="bg-[#18181B] text-white border border-white/10 px-4 py-1.5 rounded-lg text-sm">
              #{card.localId}
            </span>
            {card.rarity && (
              <span className="bg-rose-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                {card.rarity}
              </span>
            )}
          </div>

          {/* Titre */}
          <h2 className="text-white text-3xl md:text-4xl font-normal">
            {card.name} {card.seriesName ? card.seriesName: ""}
          </h2>

          {/* Bloc Prix et Wishlist */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">
              Cote du marché :
            </span>
            <div className="bg-[#18181B] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <span className="text-green-500 text-4xl font-medium tracking-tight">
                {price !== "N/A" ? `${price} €` : "N/A"}
              </span>
              <button 
                onClick={() => alert("Fonction Wishlist depuis la modale à venir !")}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-full flex items-center gap-2 text-[15px] transition-colors"
              >
                Wishlist <span className="text-white">🤍</span>
              </button>
            </div>
          </div>

          {/* Bloc Collection (Boutons Normal / Foil) */}
          <div className="flex flex-col gap-3 mt-4">
            <span className="text-white text-sm">Ma Collection :</span>
            
            {/* Ligne NORMAL */}
            <div 
              className={`flex items-center justify-between px-5 py-3.5 rounded-xl cursor-pointer transition-all ${
                isNormalOwned 
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                  : "bg-[#18181B] text-zinc-400 border border-white/10 hover:border-rose-500/50"
              }`}
              onClick={() => onToggleOwnership(card.id, "normal")}
            >
              <span className="text-[17px]">Normal</span>
              <div className="flex items-center gap-4 bg-black/20 px-3 py-1 rounded-lg">
                <button 
                  className="text-xl hover:text-white px-2"
                  onClick={(e) => { e.stopPropagation(); if(isNormalOwned) onToggleOwnership(card.id, "normal"); }}
                >-</button>
                <span className="text-lg font-medium">{isNormalOwned ? "1" : "0"}</span>
                <button 
                  className="text-xl hover:text-white px-2"
                  onClick={(e) => { e.stopPropagation(); if(!isNormalOwned) onToggleOwnership(card.id, "normal"); }}
                >+</button>
              </div>
            </div>

            {/* Ligne FOIL */}
            <div 
              className={`flex items-center justify-between px-5 py-3.5 rounded-xl cursor-pointer transition-all ${
                isFoilOwned 
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                  : "bg-[#18181B] text-zinc-400 border border-white/10 hover:border-rose-500/50"
              }`}
              onClick={() => onToggleOwnership(card.id, "foil")}
            >
              <span className="text-[17px]">Foil</span>
              <div className="flex items-center gap-4 bg-black/20 px-3 py-1 rounded-lg">
                <button 
                  className="text-xl hover:text-white px-2"
                  onClick={(e) => { e.stopPropagation(); if(isFoilOwned) onToggleOwnership(card.id, "foil"); }}
                >-</button>
                <span className="text-lg font-medium">{isFoilOwned ? "1" : "0"}</span>
                <button 
                  className="text-xl hover:text-white px-2"
                  onClick={(e) => { e.stopPropagation(); if(!isFoilOwned) onToggleOwnership(card.id, "foil"); }}
                >+</button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}