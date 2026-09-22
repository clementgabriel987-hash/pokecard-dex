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
  onToggleLanguage,
}: CardItemProps) {
  const isNormalOwned = cardData?.normalOwned || false;
  const isFoilOwned = cardData?.foilOwned || false;
  const isWishlisted = cardData?.isWishlist || false;
  const showLanguageFlags = cardDefaultLang !== "en";

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 md:p-4 flex flex-col justify-between shadow-lg relative group">
      {/* Bouton Wishlist */}
      <button
        onClick={() => onToggleWishlist(card.id)}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
          isWishlisted
            ? "bg-red-500/20 text-red-400 border border-red-500/40 scale-110"
            : "bg-slate-950/60 text-slate-400 hover:text-red-400 border border-slate-800"
        }`}
        title="Ajouter à la Wishlist"
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>

      <div>
        {isGlobalBinder && card.seriesName && (
          <div className="text-[10px] text-purple-400 font-semibold mb-2 truncate bg-purple-950/30 px-2 py-0.5 rounded border border-purple-900/30">
            {card.seriesName}
          </div>
        )}

        {/* Visuel & Clic pour Zoom */}
        <div
          onClick={() => onZoom(card)}
          className="mb-3 flex justify-center bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 min-h-[160px] md:min-h-[190px] items-center relative overflow-hidden cursor-pointer hover:border-yellow-500/50 transition duration-200"
          title="Cliquer pour zoomer en HD"
        >
          {card.image && !hasImageError ? (
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
              className="object-contain drop-shadow-md group-hover:scale-105 transition duration-300 p-2"
              onError={() => onImageError(card.id, card.image)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <span className="text-2xl mb-1">🃏</span>
              <span className="text-[11px] text-slate-400 font-medium">Image non disponible</span>
              <span className="text-[9px] text-slate-500">#{card.localId}</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 bg-slate-950/80 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 transition z-10">
            🔍 Zoom
          </div>
        </div>

        {/* Titre & Numéro */}
        <div className="flex justify-between items-start mb-1 gap-1">
          <h3
            className="text-xs md:text-sm font-bold truncate cursor-pointer hover:text-yellow-400 transition"
            onClick={() => onZoom(card)}
          >
            {card.name}
          </h3>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">
            #{card.localId}
          </span>
        </div>
      </div>

      {/* Boutons de possession */}
      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 mt-1">
        <button
          onClick={() => onToggleOwnership(card.id, "normal", cardDefaultLang)}
          className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${
            isNormalOwned
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-slate-900 text-slate-400 hover:bg-slate-800"
          }`}
        >
          {isNormalOwned ? "✓ Normale" : "Normale"}
        </button>
        <button
          onClick={() => onToggleOwnership(card.id, "foil", cardDefaultLang)}
          className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${
            isFoilOwned
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-slate-900 text-slate-400 hover:bg-slate-800"
          }`}
        >
          {isFoilOwned ? "✨ Foil" : "Foil"}
        </button>
      </div>

      {/* Drapeaux de langues */}
      {showLanguageFlags && (isNormalOwned || isFoilOwned) && (
        <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-slate-800/50">
          {(["fr", "en", "jp"] as const).map((lang) => {
            const isActive = (cardData?.langs || [cardDefaultLang]).includes(lang);
            const flagEmoji = lang === "fr" ? "🇫🇷" : lang === "en" ? "🇬🇧" : "🇯🇵";
            return (
              <button
                key={lang}
                onClick={() => onToggleLanguage(card.id, lang, cardDefaultLang)}
                className={`text-base transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "grayscale-0 opacity-100 scale-110 drop-shadow-md"
                    : "grayscale opacity-30 hover:opacity-70"
                }`}
                title={`Marquer comme possédée en ${lang.toUpperCase()}`}
              >
                {flagEmoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}