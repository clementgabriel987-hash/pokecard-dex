"use client";
import { useState, useEffect } from "react";

interface Card {
  id: string;
  name: string;
  number: string;
  imageUrl: string;
  normalOwned: boolean;
  foilOwned: boolean;
}

const POKEMON_SERIES = [
  { id: "base1", name: "Base Set (1999)" },
  { id: "base2", name: "Jungle" },
  { id: "base3", name: "Fossil" },
  { id: "base4", name: "Base Set 2" },
  { id: "gym1", name: "Gym Heroes" },
  { id: "neo1", name: "Neo Genesis" }
];

export default function PokedexPage() {
  const [selectedSeries, setSelectedSeries] = useState<string>("base1");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      try {
        // On enlève la limite de pageSize pour récupérer toutes les cartes du set
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${selectedSeries}&orderBy=number`);
        const data = await response.json();
        
        const formattedCards: Card[] = data.data.map((card: any) => ({
          id: card.id,
          name: card.name,
          number: card.number,
          imageUrl: card.images.small,
          normalOwned: false,
          foilOwned: false
        }));

        setCards(formattedCards);
      } catch (error) {
        console.error("Erreur lors du chargement des cartes", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [selectedSeries]);

  const toggleCardOwnership = (id: string, type: 'normal' | 'foil') => {
    setCards(cards.map(card => {
      if (card.id === id) {
        if (type === 'normal') return { ...card, normalOwned: !card.normalOwned };
        if (type === 'foil') return { ...card, foilOwned: !card.foilOwned };
      }
      return card;
    }));
  };

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => c.normalOwned).length;
  const foilCollected = cards.filter(c => c.foilOwned).length;

  const normalPercent = totalCards > 0 ? Math.round((normalCollected / totalCards) * 100) : 0;
  const foilPercent = totalCards > 0 ? Math.round((foilCollected / totalCards) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          Mon Pokédex de Cartes 📈
        </h1>
        <p className="text-slate-400 text-center mb-8">Sélectionne une extension pour charger et suivre ta collection</p>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {POKEMON_SERIES.map(series => (
            <button
              key={series.id}
              onClick={() => setSelectedSeries(series.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedSeries === series.id
                  ? "bg-yellow-500 text-slate-950 font-bold shadow-lg shadow-yellow-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {series.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-slate-300">Cartes Normales</span>
              <span className="text-yellow-400">{normalCollected} / {totalCards} ({normalPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-yellow-500 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${normalPercent}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-slate-300">Cartes Foils (Brillantes)</span>
              <span className="text-purple-400">{foilCollected} / {totalCards} ({foilPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${foilPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse">
            Chargement de toutes les cartes du set... ⚡
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
                <div>
                  <div className="mb-4 flex justify-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 min-h-[220px] items-center">
                    <img 
                      src={card.imageUrl} 
                      alt={card.name} 
                      className="h-48 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" 
                    />
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold">{card.name}</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">{card.number}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => toggleCardOwnership(card.id, 'normal')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      card.normalOwned 
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {card.normalOwned ? "✓ Normale" : "Normale"}
                  </button>

                  <button
                    onClick={() => toggleCardOwnership(card.id, 'foil')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      card.foilOwned 
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {card.foilOwned ? "✨ Foil" : "Foil"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <p className="text-center text-slate-500 py-12">Aucune carte trouvée pour cette série.</p>
        )}

      </div>
    </main>
  );
}