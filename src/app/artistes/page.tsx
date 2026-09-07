"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  seriesName?: string;
}

export default function ArtistSearchPage() {
  const [artistName, setArtistName] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) return;
    setLoading(true);
    try {
      // Recherche globale via l'API TCGDex (filtrage par illustrateur)
      const res = await fetch(`https://api.tcgdex.net/v2/fr/cards?illustrator=${encodeURIComponent(artistName.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (Array.isArray(data)) {
        const detailed = await Promise.all(data.slice(0, 60).map(async (c: any) => {
          let imageUrl = c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/fr/base1/${c.localId}/high.png`;
          let series = c.set?.name || "Série inconnue";
          try {
            const detailRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${c.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.image) imageUrl = `${detailData.image}/high.png`;
              series = detailData.set?.name || series;
            }
          } catch {}
          return {
            id: c.id,
            name: c.name || "Inconnue",
            localId: c.localId || "?",
            image: imageUrl,
            illustrator: artistName,
            seriesName: series
          };
        }));
        setCards(detailed);
      } else {
        setCards([]);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
            ⬅️ Retour au Pokédex
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          🎨 Recherche Globale par Artiste
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Tape le nom d'un illustrateur pour voir toutes ses cartes à travers le temps !</p>

        <form onSubmit={handleSearch} className="flex justify-center max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Ex: Mitsuhiro Arita, 5ban Graphics..."
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-sm px-4 py-3 rounded-l-xl text-white outline-none focus:border-yellow-500"
          />
          <button type="submit" className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-r-xl font-bold hover:bg-yellow-400 transition cursor-pointer">
            🔍
          </button>
        </form>

        {loading && <div className="text-center py-20 text-slate-400 animate-pulse">Exploration des portfolios... ⚡</div>}

        {!loading && cards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                <div className="bg-slate-950/50 p-2 rounded-lg mb-3 flex justify-center items-center h-44 relative">
                  {card.seriesName && (
                    <span className="absolute top-1 left-1 text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                      {card.seriesName}
                    </span>
                  )}
                  <img src={card.image} alt={card.name} className="h-36 object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-bold truncate">{card.name}</h3>
                  <p className="text-[10px] text-slate-400 italic">#{card.localId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}