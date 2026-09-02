"use client";
import { useState } from "react";

// Définition du type d'une carte
interface Card {
  id: number;
  name: string;
  serieId: string;
  number: string;
  normalOwned: boolean;
  foilOwned: boolean;
}

// Liste des séries Pokémon officielles principales
const POKEMON_SERIES = [
  { id: "all", name: "Toutes les séries" },
  { id: "base", name: "Base (1999)" },
  { id: "jungle", name: "Jungle" },
  { id: "fossil", name: "Fossil" },
  { id: "team-rocket", name: "Team Rocket" },
  { id: "gym", name: "Gym Heroes & Challenge" },
  { id: "neo", name: "Neo Genesis / Discovery" }
];

// Exemple de cartes initiales
const INITIAL_CARDS: Card[] = [
  { id: 1, name: "Dracaufeu", serieId: "base", number: "4/102", normalOwned: false, foilOwned: false },
  { id: 2, name: "Pikachu", serieId: "base", number: "58/102", normalOwned: true, foilOwned: false },
  { id: 3, name: "Tortank", serieId: "base", number: "2/102", normalOwned: false, foilOwned: true },
  { id: 4, name: "Voltali", serieId: "jungle", number: "16/64", normalOwned: false, foilOwned: false },
  { id: 5, name: "Ronflex", serieId: "jungle", number: "11/64", normalOwned: true, foilOwned: true },
  { id: 6, name: "Aerodactyl", serieId: "fossil", number: "1/62", normalOwned: false, foilOwned: false }
];

export default function PokedexPage() {
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [selectedSeries, setSelectedSeries] = useState<string>("all");

  // Fonction pour basculer l'état possédés (Normal ou Foil) avec typage strict
  const toggleCardOwnership = (id: number, type: 'normal' | 'foil') => {
    setCards(cards.map(card => {
      if (card.id === id) {
        if (type === 'normal') return { ...card, normalOwned: !card.normalOwned };
        if (type === 'foil') return { ...card, foilOwned: !card.foilOwned };
      }
      return card;
    }));
  };

  // Filtrer les cartes selon la série sélectionnée
  const filteredCards = selectedSeries === "all" 
    ? cards 
    : cards.filter(card => card.serieId === selectedSeries);

  // Calculs pour les barres de progression
  const totalCards = filteredCards.length;
  const normalCollected = filteredCards.filter(c => c.normalOwned).length;
  const foilCollected = filteredCards.filter(c => c.foilOwned).length;

  const normalPercent = totalCards > 0 ? Math.round((normalCollected / totalCards) * 100) : 0;
  const foilPercent = totalCards > 0 ? Math.round((foilCollected / totalCards) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Titre */}
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          Mon Pokédex de Cartes 📈
        </h1>
        <p className="text-slate-400 text-center mb-8">Gère ta collection de cartes et suis ta progression par série</p>

        {/* Sélecteur de Séries */}
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

        {/* Barres de progression (Normales & Foils) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
          {/* Progression Normales */}
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

          {/* Progression Foils */}
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

        {/* Grille des cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCards.map(card => (
            <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold">{card.name}</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">{card.number}</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Série : {card.serieId}</p>
              </div>

              {/* Boutons d'état (Possédé ou non) */}
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

        {filteredCards.length === 0 && (
          <p className="text-center text-slate-500 py-12">Aucune carte trouvée pour cette série.</p>
        )}

      </div>
    </main>
  );
}