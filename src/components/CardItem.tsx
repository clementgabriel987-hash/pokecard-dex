"use client";

import Image from "next/image";

export interface CardItemData {
  id: string;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  rarity?: string;
  seriesName?: string;
}

interface CardDetails {
  normalOwned: boolean;
  foilOwned: boolean;
  langs?: string[];
  isWishlist?: boolean;
}

interface CardItemProps {
  card: CardItemData;
  cardData?: CardDetails;
  isGlobalBinder: boolean;
  cardDefaultLang: string;
  hasImageError: boolean;
  onImageError: (id: string, currentImg: string) => void;
  onZoom: (card: CardItemData) => void;
  onToggleWishlist: (id: string) => void;
  onToggleOwnership: (id: string, type: "normal" | "foil", defaultLang: string) => void;
  onToggleLanguage: (id: string, lang: string, defaultLang: string) => void;
}

export default function CardItem({
  card,
  cardData,
  isGlobalBinder,
  cardDefaultLang,
  hasImageError,
  onImageError,
  onZoom,
  onToggleWishlist,
  onToggleOwnership,
}: CardItemProps) {
  const isNormalOwned = cardData?.normalOwned || false;
  const isFoilOwned = cardData?.foilOwned || false;
  const isWishlisted = cardData?.isWishlist || false;

  return (
    <div className="bg-[#18181B] rounded-[20px] p-4 flex flex-col gap-3 font-['Outfit']">
      
      {/* 1. En-tête : Titre empilé et Coeur */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h3 
            className="text-white text-lg font-normal leading-tight cursor-pointer hover:text-rose-400 transition-colors" 
            onClick={() => onZoom(card)}
          >
            {card.name}
          </h3>
          <span className="text-zinc-400 text-xs mt-0.5">#{card.localId}</span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(card.id);
          }}
          className="p-1 cursor-pointer transition-transform hover:scale-110"
        >
          <svg 
            className={`w-5 h-5 ${isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-[#373436] fill-current hover:text-rose-400'}`} 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={isWishlisted ? "0" : "2"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>

      {/* Tag Série (uniquement pour le mode Classeur Global) */}
      {isGlobalBinder && card.seriesName && (
        <div className="text-[10px] text-rose-400 font-normal truncate">
          {card.seriesName}
        </div>
      )}

      {/* 2. L'image de la carte (Pleine largeur, coins légèrement arrondis) */}
      <div 
        onClick={() => onZoom(card)}
        className="w-full aspect-[63/88] relative rounded-lg overflow-hidden cursor-pointer"
      >
        {card.image && !hasImageError ? (
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
            className="object-cover"
            onError={() => onImageError(card.id, card.image)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090B]">
            <span className="text-4xl opacity-20 mb-2">🃏</span>
          </div>
        )}
      </div>

      {/* 3. Boutons de possession (Le bloc unifié Normal / Foil de Figma) */}
      <div className="grid grid-cols-2 bg-neutral-900 rounded-md outline outline-1 outline-white/10 mt-1">
        <button 
          onClick={() => onToggleOwnership(card.id, "normal", cardDefaultLang)}
          className={`py-1.5 text-[15px] font-normal transition-colors cursor-pointer ${
            isNormalOwned 
              ? "bg-rose-500 text-white rounded-md outline outline-1 outline-white/10 z-10" 
              : "text-stone-500 hover:text-white"
          }`}
        >
          Normal
        </button>
        <button 
          onClick={() => onToggleOwnership(card.id, "foil", cardDefaultLang)}
          className={`py-1.5 text-[15px] font-normal transition-colors cursor-pointer ${
            isFoilOwned 
              ? "bg-rose-500 text-white rounded-md outline outline-1 outline-white/10 z-10" 
              : "text-stone-500 hover:text-white"
          }`}
        >
          Foil
        </button>
      </div>

    </div>
  );
}