"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  normalOwned: boolean;
  foilOwned: boolean;
  seriesName?: string;
}

const POKEMON_SERIES = [
  { id: "base1", name: "Base Set (FR)", lang: "fr" },
  { id: "base2", name: "Jungle (FR)", lang: "fr" },
  { id: "base3", name: "Fossile (FR)", lang: "fr" },
  { id: "base4", name: "Base Set 2 (EN)", lang: "en" },
  { id: "gym1", name: "Gym Heroes (EN)", lang: "en" },
  { id: "neo1", name: "Neo Genesis (FR)", lang: "fr" }
];

export default function PokedexPage() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("base1");
  const [isGlobalBinder, setIsGlobalBinder] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pokedex_pseudo");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage("");
    const cleanPseudo = username.trim().toLowerCase();

    if (!cleanPseudo || !password) return;

    if (isSignUp) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", cleanPseudo)
        .single();

      if (existingUser) {
        setAuthMessage("Ce pseudo est déjà pris ! Choisis-en un autre.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .insert([{ username: cleanPseudo, password }]);

      if (error) {
        setAuthMessage("Erreur : " + error.message);
      } else {
        localStorage.setItem("pokedex_pseudo", cleanPseudo);
        setCurrentUser(cleanPseudo);
        setAuthMessage("Compte créé avec succès ! 🎉");
      }
    } else {
      const { data: userRecord, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanPseudo)
        .eq("password", password)
        .single();

      if (error || !userRecord) {
        setAuthMessage("Pseudo ou mot de passe incorrect.");
      } else {
        localStorage.setItem("pokedex_pseudo", cleanPseudo);
        setCurrentUser(cleanPseudo);
        setAuthMessage("Connexion réussie ! 🚀");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pokedex_pseudo");
    setCurrentUser("");
    setUsername("");
    setPassword("");
  };

  useEffect(() => {
    async function fetchCardsAndCollection() {
      setLoading(true);
      try {
        let userCollectionsMap: Record<string, { normalOwned: boolean; foilOwned: boolean }> = {};

        if (currentUser) {
          const { data: dbData, error } = await supabase
            .from("user_collections")
            .select("card_id, normal_owned, foil_owned")
            .eq("user_id", currentUser);

          if (!error && dbData) {
            dbData.forEach(item => {
              userCollectionsMap[item.card_id] = {
                normalOwned: item.normal_owned,
                foilOwned: item.foil_owned
              };
            });
          }
        }

        if (isGlobalBinder) {
          if (!currentUser) {
            setCards([]);
            setLoading(false);
            return;
          }

          const ownedCardIds = Object.keys(userCollectionsMap).filter(
            cardId => userCollectionsMap[cardId].normalOwned || userCollectionsMap[cardId].foilOwned
          );

          let globalCards: Card[] = [];
          for (const series of POKEMON_SERIES) {
            try {
              const response = await fetch(`https://api.tcgdex.net/v2/${series.lang}/sets/${series.id}`);
              if (!response.ok) continue;
              const data = await response.json();
              if (data && data.cards) {
                data.cards.forEach((card: any) => {
                  if (ownedCardIds.includes(card.id)) {
                    const savedState = userCollectionsMap[card.id];
                    globalCards.push({
                      id: card.id,
                      name: card.name || "Carte inconnue",
                      localId: card.localId || "?",
                      image: card.image ? `${card.image}/high.png` : "",
                      normalOwned: savedState ? savedState.normalOwned : false,
                      foilOwned: savedState ? savedState.foilOwned : false,
                      seriesName: series.name
                    });
                  }
                });
              }
            } catch (err) {
              console.error(`Erreur série ${series.name}`, err);
            }
          }
          setCards(globalCards);

        } else {
          const currentSeries = POKEMON_SERIES.find(s => s.id === selectedSeriesId);
          const lang = currentSeries ? currentSeries.lang : "fr";

          const response = await fetch(`https://api.tcgdex.net/v2/${lang}/sets/${selectedSeriesId}`);
          
          if (!response.ok) {
            setCards([]);
            setLoading(false);
            return;
          }

          const data = await response.json();
          
          if (data && data.cards) {
            const formattedCards: Card[] = data.cards.map((card: any) => {
              const savedState = userCollectionsMap[card.id];
              return {
                id: card.id,
                name: card.name || "Carte inconnue",
                localId: card.localId || "?",
                image: card.image ? `${card.image}/high.png` : "",
                normalOwned: savedState ? savedState.normalOwned : false,
                foilOwned: savedState ? savedState.foilOwned : false
              };
            });
            setCards(formattedCards);
          } else {
            setCards([]);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des cartes", error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCardsAndCollection();
  }, [selectedSeriesId, isGlobalBinder, currentUser]);

  const toggleCardOwnership = async (id: string, type: 'normal' | 'foil') => {
    let updatedCards = cards.map(card => {
      if (card.id === id) {
        if (type === 'normal') return { ...card, normalOwned: !card.normalOwned };
        if (type === 'foil') return { ...card, foilOwned: !card.foilOwned };
      }
      return card;
    });

    setCards(updatedCards);

    if (currentUser) {
      const targetCard = updatedCards.find(c => c.id === id);
      if (targetCard) {
        await supabase.from("user_collections").upsert({
          user_id: currentUser,
          card_id: targetCard.id,
          normal_owned: targetCard.normalOwned,
          foil_owned: targetCard.foilOwned,
          updated_at: new Date()
        }, { onConflict: 'user_id,card_id' });
      }
    }
  };

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => c.normalOwned).length;
  const foilCollected = cards.filter(c => c.foilOwned).length;

  const normalPercent = totalCards > 0 ? Math.round((normalCollected / totalCards) * 100) : 0;
  const foilPercent = totalCards > 0 ? Math.round((foilCollected / totalCards) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Barre de connexion */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Espace Dresseur 🧢</h2>
            <p className="text-xs text-slate-500">
              {currentUser ? `Connecté : ${currentUser}` : "Connecte-toi avec ton pseudo et ton mot de passe."}
            </p>
          </div>

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition cursor-pointer"
            >
              Se déconnecter
            </button>
          ) : (
            <form onSubmit={handleAuth} className="flex flex-wrap gap-2 items-center justify-end">
              <input
                type="text"
                placeholder="Pseudo..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white outline-none focus:border-yellow-500"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white outline-none focus:border-yellow-500"
                required
              />
              <button
                type="submit"
                className="bg-yellow-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition cursor-pointer"
              >
                {isSignUp ? "S'inscrire" : "Se connecter"}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-slate-400 underline hover:text-yellow-400 ml-1"
              >
                {isSignUp ? "Déjà un compte ?" : "Créer un compte"}
              </button>
            </form>
          )}
        </div>
        {authMessage && <p className="text-xs text-center text-yellow-400 mb-6">{authMessage}</p>}

        {/* Titre */}
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          Mon Pokédex de Cartes 📈
        </h1>
        <p className="text-slate-400 text-center mb-8">Gère ta collection de cartes multilingue</p>

        {/* Sélecteur de Séries */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {POKEMON_SERIES.map(series => (
            <button
              key={series.id}
              onClick={() => { setIsGlobalBinder(false); setSelectedSeriesId(series.id); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                !isGlobalBinder && selectedSeriesId === series.id
                  ? "bg-yellow-500 text-slate-950 font-bold shadow-lg shadow-yellow-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {series.name}
            </button>
          ))}

          <button
            onClick={() => setIsGlobalBinder(true)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
              isGlobalBinder
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                : "bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/60"
            }`}
          >
            <span>✨ Mon Classeur Global</span>
          </button>
        </div>

        {/* Barres de progression */}
        {!isGlobalBinder && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-300">Cartes Normales</span>
                <span className="text-yellow-400">{normalCollected} / {totalCards} ({normalPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full transition-all duration-500 rounded-full" style={{ width: `${normalPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-300">Cartes Foils (Brillantes)</span>
                <span className="text-purple-400">{foilCollected} / {totalCards} ({foilPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500 rounded-full" style={{ width: `${foilPercent}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {isGlobalBinder && (
          <div className="mb-8 text-center bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-purple-300">✨ Vue de ton Classeur Global</h2>
            <p className="text-xs text-purple-400/80 mt-1">
              {currentUser ? `Tu possèdes un total de ${cards.length} cartes enregistrées dans toutes les séries.` : "Connecte-toi pour afficher ton classeur global."}
            </p>
          </div>
        )}

        {/* Grille des cartes */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse">
            Chargement des cartes en cours... ⚡
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
                <div>
                  <div className="mb-4 flex justify-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 min-h-[220px] items-center relative">
                    {card.seriesName && (
                      <span className="absolute top-2 left-2 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium">
                        {card.seriesName}
                      </span>
                    )}
                    {card.image ? (
                      <img 
                        src={card.image} 
                        alt={card.name} 
                        className="h-48 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Image indisponible</span>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold">{card.name}</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">#{card.localId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => toggleCardOwnership(card.id, 'normal')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      card.normalOwned 
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {card.normalOwned ? "✓ Normale" : "Normale"}
                  </button>

                  <button
                    onClick={() => toggleCardOwnership(card.id, 'foil')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
          <p className="text-center text-slate-500 py-12">
            {isGlobalBinder ? "Aucune carte possédée pour l'instant dans ton classeur global." : "Aucune carte trouvée pour cette série."}
          </p>
        )}

      </div>
    </main>
  );
}