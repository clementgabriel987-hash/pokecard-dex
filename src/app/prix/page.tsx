"use client";
import { useState } from "react";
import Link from "next/link";

interface CardPriceInfo {
  id: string;
  name: string;
  localId: string;
  image: string;
  set: { name: string };
  pricing?: {
    cardmarket?: {
      avg?: number;
      trend?: number;
      low?: number;
      avg7?: number;
      avg30?: number;
      avgHolo?: number;
      trendHolo?: number;
    };
    tcgplayer?: {
      marketPrice?: number;
      lowPrice?: number;
      midPrice?: number;
      highPrice?: number;
    };
  };
}

export default function PriceSearchPage() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardPriceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/fr/cards?name=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (Array.isArray(data)) {
        // On récupère les détails (qui contiennent l'objet "pricing") pour les 20 premiers résultats
        const detailed = await Promise.all(data.slice(0, 20).map(async (c: any) => {
          try {
            const detailRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${c.id}`);
            if (detailRes.ok) {
              return await detailRes.json();
            }
          } catch {}
          return c;
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
            ⬅️ Retour au Pokédex
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
          📈 Historique & Prix des Cartes
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Cherche n'importe quelle carte pour consulter ses prix de marché (Cardmarket / TCGPlayer).</p>

        <form onSubmit={handleSearch} className="flex justify-center max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Ex: Dracaufeu V, Pikachu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-sm px-4 py-3 rounded-l-xl text-white outline-none focus:border-yellow-500"
          />
          <button type="submit" className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-r-xl font-bold hover:bg-yellow-400 transition cursor-pointer">
            🔍
          </button>
        </form>

        {loading && <div className="text-center py-20 text-slate-400 animate-pulse">Interrogation des marchés... 📊</div>}

        {!loading && cards.length > 0 && (
          <div className="space-y-4">
            {cards.map((card) => {
              const cm = card.pricing?.cardmarket;
              const tcg = card.pricing?.tcgplayer;
              const imageUrl = card.image ? `${card.image}/high.png` : "";

              return (
                <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row gap-6 items-center shadow-xl">
                  <div className="w-28 h-36 bg-slate-950 rounded-xl p-2 flex items-center justify-center shrink-0 border border-slate-800">
                    {imageUrl ? <img src={imageUrl} alt={card.name} className="h-full object-contain" /> : <span>Pas d'image</span>}
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-base font-bold text-white">{card.name}</h2>
                        <p className="text-xs text-slate-400">{card.set?.name} • #{card.localId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-yellow-400 mb-1">💶 Cardmarket (Europe)</p>
                        {cm ? (
                          <div className="space-y-1 text-slate-300">
                            <p>Prix moyen : <span className="font-semibold text-white">{cm.avg ? `${cm.avg} €` : "N/C"}</span></p>
                            <p>Tendance : <span className="font-semibold text-white">{cm.trend ? `${cm.trend} €` : "N/C"}</span></p>
                            <p>Prix bas : <span className="font-semibold text-white">{cm.low ? `${cm.low} €` : "N/C"}</span></p>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Données non disponibles</p>
                        )}
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-blue-400 mb-1">💲 TCGPlayer (US)</p>
                        {tcg ? (
                          <div className="space-y-1 text-slate-300">
                            <p>Prix Marché : <span className="font-semibold text-white">{tcg.marketPrice ? `$${tcg.marketPrice}` : "N/C"}</span></p>
                            <p>Prix Median : <span className="font-semibold text-white">{tcg.midPrice ? `$${tcg.midPrice}` : "N/C"}</span></p>
                            <p>Prix Bas : <span className="font-semibold text-white">{tcg.lowPrice ? `$${tcg.lowPrice}` : "N/C"}</span></p>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Données non disponibles</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}