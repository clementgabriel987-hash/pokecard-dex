"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  seriesName?: string;
}

type UserCollectionJSON = Record<string, { normalOwned: boolean; foilOwned: boolean }>;

// Organisation en Blocs et Séries (avec gestion précise des langues FR/EN)
const POKEMON_BLOCKS = [
  {
    blockName: "Bloc Wizards (Classic)",
    sets: [
      { id: "base1", name: "Base Set (FR)", lang: "fr" },
      { id: "base2", name: "Jungle (FR)", lang: "fr" },
      { id: "base3", name: "Fossile (FR)", lang: "fr" },
      { id: "base4", name: "Base Set 2 (EN)", lang: "en" },
      { id: "gym1", name: "Gym Heroes (EN)", lang: "en" },
      { id: "neo1", name: "Neo Genesis (FR)", lang: "fr" },
      { id: "neo2", name: "Neo Discovery (FR)", lang: "fr" },
      { id: "neo3", name: "Neo Revelation (EN)", lang: "en" },
      { id: "neo4", name: "Neo Destiny (EN)", lang: "en" }
    ]
  },
  {
    blockName: "Bloc EX (Ruby & Sapphire)",
    sets: [
      { id: "ex1", name: "EX Rubis & Saphir (FR)", lang: "fr" },
      { id: "ex2", name: "EX Tempête de Sable (FR)", lang: "fr" },
      { id: "ex3", name: "EX Dragon (FR)", lang: "fr" },
      { id: "ex4", name: "EX Team Magma vs Team Aqua (FR)", lang: "fr" },
      { id: "ex5", name: "EX Légendes Oubliées (FR)", lang: "fr" },
      { id: "ex6", name: "EX Rouge Feu & Vert Feuille (FR)", lang: "fr" },
      { id: "ex7", name: "EX Team Rocket Returns (EN)", lang: "en" }, // Jamais sorti en FR
      { id: "ex8", name: "EX Deoxys (FR)", lang: "fr" },
      { id: "ex9", name: "EX Émeraude (FR)", lang: "fr" },
      { id: "ex10", name: "EX Forces Cachées (FR)", lang: "fr" },
      { id: "ex11", name: "EX Espèces Delta (FR)", lang: "fr" },
      { id: "ex12", name: "EX Créateurs de Légendes (FR)", lang: "fr" },
      { id: "ex13", name: "EX Fantômes Holon (FR)", lang: "fr" },
      { id: "ex14", name: "EX Gardiens de Cristal (FR)", lang: "fr" },
      { id: "ex15", name: "EX Île des Dragons (FR)", lang: "fr" },
      { id: "ex16", name: "EX Gardiens du Pouvoir (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Platine, Diamant & Perle",
    sets: [
      { id: "dp1", name: "Diamant & Perle (FR)", lang: "fr" },
      { id: "dp2", name: "Trésors Mystérieux (FR)", lang: "fr" },
      { id: "dp3", name: "Merveilles Secrètes (FR)", lang: "fr" },
      { id: "dp4", name: "Aube Majestueuse (FR)", lang: "fr" },
      { id: "dp5", name: "Éveil des Légendes (FR)", lang: "fr" },
      { id: "dp6", name: "Tempête (FR)", lang: "fr" },
      { id: "pl1", name: "Platine (FR)", lang: "fr" },
      { id: "pl2", name: "Rivaux Émergents (FR)", lang: "fr" },
      { id: "pl3", name: "Vainqueurs Suprêmes (FR)", lang: "fr" },
      { id: "pl4", name: "Arceus (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Noir & Blanc",
    sets: [
      { id: "bw1", name: "Noir & Blanc (FR)", lang: "fr" },
      { id: "bw2", name: "Pouvoirs Émergents (FR)", lang: "fr" },
      { id: "bw3", name: "Nobles Victoires (FR)", lang: "fr" },
      { id: "bw4", name: "Destinées Futures (FR)", lang: "fr" },
      { id: "bw5", name: "Explorateurs Obscurs (FR)", lang: "fr" },
      { id: "bw6", name: "Dragons Exaltés (FR)", lang: "fr" },
      { id: "bw7", name: "Frontières Franchies (FR)", lang: "fr" },
      { id: "bw8", name: "Tempête Plasma (FR)", lang: "fr" },
      { id: "bw9", name: "Glaciation Plasma (FR)", lang: "fr" },
      { id: "bw10", name: "Explosion Plasma (FR)", lang: "fr" },
      { id: "bw11", name: "Trésors Légendaires (EN)", lang: "en" } // Uniquement en EN physiquement
    ]
  },
  {
    blockName: "Bloc XY",
    sets: [
      { id: "xy1", name: "XY de base (FR)", lang: "fr" },
      { id: "xy2", name: "Étincelles (FR)", lang: "fr" },
      { id: "xy3", name: "Poings Furieux (FR)", lang: "fr" },
      { id: "xy4", name: "Vigueur Spectrale (FR)", lang: "fr" },
      { id: "xy5", name: "Primo-Choc (FR)", lang: "fr" },
      { id: "xy6", name: "Ciel Rugissant (FR)", lang: "fr" },
      { id: "xy7", name: "Origines Antiques (FR)", lang: "fr" },
      { id: "xy8", name: "Impulsion Turbo (FR)", lang: "fr" },
      { id: "xy9", name: "Rupture Turbo (FR)", lang: "fr" },
      { id: "xy10", name: "Impact des Destins (FR)", lang: "fr" },
      { id: "xy11", name: "Offensive Vapeur (FR)", lang: "fr" },
      { id: "xy12", name: "Évolutions (FR)", lang: "fr" },
      { id: "g1", name: "Générations (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Soleil & Lune",
    sets: [
      { id: "sm1", name: "Soleil et Lune (FR)", lang: "fr" },
      { id: "sm2", name: "Gardiens Ascendants (FR)", lang: "fr" },
      { id: "sm3", name: "Ombres Ardentes (FR)", lang: "fr" },
      { id: "sm3.5", name: "Légendes Brillantes (FR)", lang: "fr" },
      { id: "sm4", name: "Invasion Carmin (FR)", lang: "fr" },
      { id: "sm5", name: "Ultra-Prisme (FR)", lang: "fr" },
      { id: "sm6", name: "Lumière Interdite (FR)", lang: "fr" },
      { id: "sm7", name: "Tempête Céleste (FR)", lang: "fr" },
      { id: "sm8", name: "Tonnerre Perdu (FR)", lang: "fr" },
      { id: "sm9", name: "Duo de Choc (FR)", lang: "fr" },
      { id: "sm10", name: "Alliance Infaillible (FR)", lang: "fr" },
      { id: "sm11", name: "Harmonie des Esprits (FR)", lang: "fr" },
      { id: "sm11.5", name: "Destinées Occultes (FR)", lang: "fr" },
      { id: "sm12", name: "Éclipse Cosmique (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Épée & Bouclier",
    sets: [
      { id: "swsh1", name: "Épée et Bouclier (FR)", lang: "fr" },
      { id: "swsh2", name: "Clash des Rebelles (FR)", lang: "fr" },
      { id: "swsh3", name: "Ténèbres Embrasées (FR)", lang: "fr" },
      { id: "swsh3.5", name: "La Voie du Maître (FR)", lang: "fr" },
      { id: "swsh4", name: "Voltage Éclatant (FR)", lang: "fr" },
      { id: "swsh4.5", name: "Destinées Radieuses (FR)", lang: "fr" },
      { id: "swsh5", name: "Styles de Combat (FR)", lang: "fr" },
      { id: "swsh6", name: "Règne de Glace (FR)", lang: "fr" },
      { id: "swsh7", name: "Évolution Céleste (FR)", lang: "fr" },
      { id: "swsh8", name: "Célébrations (FR)", lang: "fr" },
      { id: "swsh9", name: "Stars Étincelantes (FR)", lang: "fr" },
      { id: "swsh10", name: "Astres Radieux (FR)", lang: "fr" },
      { id: "swsh11", name: "Origine Perdue (FR)", lang: "fr" },
      { id: "swsh12", name: "Tempête Argentée (FR)", lang: "fr" },
      { id: "swsh12.5", name: "Zénith Suprême (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Écarlate & Violet (EV)",
    sets: [
      { id: "sv01", name: "Écarlate et Violet (FR)", lang: "fr" },
      { id: "sv02", name: "Évolutions à Paldea (FR)", lang: "fr" },
      { id: "sv03", name: "Flammes Obsidiennes (FR)", lang: "fr" },
      { id: "sv03.5", name: "151 (FR)", lang: "fr" },
      { id: "sv04", name: "Faille Paradoxe (FR)", lang: "fr" },
      { id: "sv04.5", name: "Destinées de Paldea (FR)", lang: "fr" },
      { id: "sv05", name: "Forces Temporelles (FR)", lang: "fr" },
      { id: "sv06", name: "Mascarade Crépusculaire (FR)", lang: "fr" },
      { id: "sv06.5", name: "Fable Nébuleuse (FR)", lang: "fr" },
      { id: "sv07", name: "Couronne Stellaire (FR)", lang: "fr" },
      { id: "sv08", name: "Étincelles Survoltées (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Méga-Évolution (ME)",
    sets: [
      { id: "me01", name: "Méga-Évolution (FR)", lang: "fr" },
      { id: "me02", name: "Flammes Fantasmagoriques (FR)", lang: "fr" },
      { id: "me02.5", name: "Héros Transcendants (FR)", lang: "fr" },
      { id: "me03", name: "Équilibre Parfait (FR)", lang: "fr" },
      { id: "me04", name: "Chaos Ascendant (FR)", lang: "fr" },
      { id: "me05", name: "Nuit Noire (FR)", lang: "fr" }
    ]
  }
];

const ALL_FLAT_SERIES = POKEMON_BLOCKS.flatMap(b => b.sets);

export default function PokedexPage() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(POKEMON_BLOCKS[0].sets[0].id);
  
  const [isGlobalBinder, setIsGlobalBinder] = useState<boolean>(false);
  
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedIllustrator, setSelectedIllustrator] = useState<string>("ALL");
  const [illustratorsList, setIllustratorsList] = useState<string[]>([]);

  // Authentification et Collection
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCollection, setUserCollection] = useState<UserCollectionJSON>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadCollection() {
      if (!currentUser) {
        setUserCollection({});
        return;
      }
      
      const { data } = await supabase
        .from("user_data")
        .select("collection")
        .eq("id", currentUser.id)
        .maybeSingle(); 
        
      if (data && data.collection) {
        setUserCollection(data.collection);
      } else {
        await supabase.from("user_data").upsert({ id: currentUser.id, collection: {} });
        setUserCollection({});
      }
    }
    loadCollection();
  }, [currentUser]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserCollection({});
  };

  const exportCollectionJSON = () => {
    if (!currentUser) return alert("Connecte-toi d'abord !");
    const blob = new Blob([JSON.stringify(userCollection, null, 2)], { type: "json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pokedex-collection-${currentUser.email}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCollectionJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return alert("Connecte-toi et sélectionne un JSON.");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setUserCollection(importedData);
        await supabase.from("user_data").upsert({ id: currentUser.id, collection: importedData });
        alert("Importation réussie !");
      } catch (err) {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  };

  const handleBlockChange = (index: number) => {
    setSelectedBlockIndex(index);
    setSelectedSeriesId(POKEMON_BLOCKS[index].sets[0].id);
    setIsGlobalBinder(false);
    setActiveSearch("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsGlobalBinder(false);
      setActiveSearch(searchInput.trim());
    }
  };

  const handleBackToSeries = () => {
    setIsGlobalBinder(false);
    setActiveSearch("");
    setSearchInput("");
  };

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setSelectedIllustrator("ALL");
      try {
        if (activeSearch) {
          const response = await fetch(`https://api.tcgdex.net/v2/fr/cards?name=${activeSearch}`);
          if (!response.ok) throw new Error("Erreur recherche");
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const searchCardsPromises = data.slice(0, 50).map(async (c: any) => {
              try {
                const cardRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${c.id}`);
                const cardData = await cardRes.json();
                return {
                  id: c.id,
                  name: c.name || "Carte inconnue",
                  localId: c.localId || "?",
                  image: c.image ? `${c.image}/high.png` : "",
                  illustrator: cardData.illustrator || "Inconnu",
                  seriesName: cardData.set?.name || "Série inconnue"
                };
              } catch {
                return {
                  id: c.id,
                  name: c.name || "Carte inconnue",
                  localId: c.localId || "?",
                  image: c.image ? `${c.image}/high.png` : "",
                  illustrator: "Inconnu",
                  seriesName: "Série inconnue"
                };
              }
            });
            const formatted = await Promise.all(searchCardsPromises);
            setCards(formatted);
            extractIllustrators(formatted);
          } else {
            setCards([]);
          }
        } else if (isGlobalBinder) {
          if (!currentUser) {
            setCards([]);
            setLoading(false);
            return;
          }

          const ownedCardIds = Object.keys(userCollection).filter(
            id => userCollection[id]?.normalOwned || userCollection[id]?.foilOwned
          );

          let globalCards: Card[] = [];
          for (const series of ALL_FLAT_SERIES) {
            try {
              const response = await fetch(`https://api.tcgdex.net/v2/${series.lang}/sets/${series.id}`);
              if (!response.ok) continue;
              const data = await response.json();
              if (data && data.cards) {
                data.cards.forEach((card: any) => {
                  if (ownedCardIds.includes(card.id)) {
                    globalCards.push({
                      id: card.id,
                      name: card.name || "Carte inconnue",
                      localId: card.localId || "?",
                      image: card.image ? `${card.image}/high.png` : "",
                      illustrator: card.illustrator || "Inconnu",
                      seriesName: series.name
                    });
                  }
                });
              }
            } catch (err) {}
          }
          setCards(globalCards);
          extractIllustrators(globalCards);
        } else {
          const currentSeries = ALL_FLAT_SERIES.find(s => s.id === selectedSeriesId);
          const lang = currentSeries ? currentSeries.lang : "fr";
          const response = await fetch(`https://api.tcgdex.net/v2/${lang}/sets/${selectedSeriesId}`);
          
          if (!response.ok) {
            setCards([]);
            setLoading(false);
            return;
          }

          const data = await response.json();
          if (data && data.cards) {
            const detailedCardsPromises = data.cards.map(async (c: any) => {
              let illustrator = "Inconnu";
              try {
                const cardRes = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${c.id}`);
                const cardData = await cardRes.json();
                illustrator = cardData.illustrator || "Inconnu";
              } catch {}
              
              return {
                id: c.id,
                name: c.name || "Carte inconnue",
                localId: c.localId || "?",
                image: c.image ? `${c.image}/high.png` : "",
                illustrator
              };
            });

            const formattedCards = await Promise.all(detailedCardsPromises);
            setCards(formattedCards);
            extractIllustrators(formattedCards);
          } else {
            setCards([]);
          }
        }
      } catch (error) {
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeriesId, isGlobalBinder, activeSearch, currentUser]); 

  const extractIllustrators = (cardList: Card[]) => {
    const illsets = new Set<string>();
    cardList.forEach(c => {
      if (c.illustrator && c.illustrator !== "Inconnu") illsets.add(c.illustrator);
    });
    setIllustratorsList(Array.from(illsets).sort());
  };

  const toggleCardOwnership = async (id: string, type: 'normal' | 'foil') => {
    if (!currentUser) return alert("Connecte-toi pour sauvegarder tes cartes !");

    const newCollection = { ...userCollection };
    
    if (!newCollection[id]) {
      newCollection[id] = { normalOwned: false, foilOwned: false };
    }

    if (type === 'normal') {
      newCollection[id].normalOwned = !newCollection[id].normalOwned;
    } else {
      newCollection[id].foilOwned = !newCollection[id].foilOwned;
    }

    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned) {
      delete newCollection[id];
    }

    setUserCollection(newCollection);

    const { error } = await supabase.from("user_data").upsert({
      id: currentUser.id,
      collection: newCollection
    });

    if (error) {
      alert(`Erreur de sauvegarde dans le Cloud : ${error.message}`);
    }
  };

  const filteredCards = cards.filter(card => {
    if (selectedIllustrator === "ALL") return true;
    return card.illustrator === selectedIllustrator;
  });

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => userCollection[c.id]?.normalOwned).length;
  const foilCollected = cards.filter(c => userCollection[c.id]?.foilOwned).length;
  const normalPercent = totalCards > 0 ? Math.round((normalCollected / totalCards) * 100) : 0;
  const foilPercent = totalCards > 0 ? Math.round((foilCollected / totalCards) * 100) : 0;

  const currentBlock = POKEMON_BLOCKS[selectedBlockIndex];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Barre d'auth */}
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4 shadow-md">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Ton Pokédex</h2>
            <p className="text-xs text-slate-500">
              {currentUser ? `Connecté en tant que : ${currentUser.email}` : "Connecte-toi en un clic pour sauvegarder ta collection dans le Cloud."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {currentUser ? (
              <>
                <button onClick={exportCollectionJSON} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer">
                  📥 Exporter JSON
                </button>
                <label className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition cursor-pointer">
                  📤 Importer JSON
                  <input type="file" accept=".json" onChange={importCollectionJSON} className="hidden" />
                </label>
                <button onClick={handleLogout} className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition cursor-pointer ml-2">
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Se connecter avec Google
              </button>
            )}
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          Ta collection de cartes Pokémon
        </h1>
        <p className="text-slate-400 text-center mb-6">Navigation simplifiée par Blocs et Extensions</p>

        {/* Barre de Recherche */}
        <form onSubmit={handleSearchSubmit} className="mb-6 flex justify-center max-w-md mx-auto">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Rechercher une carte (ex: Dracaufeu, Pikachu...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm px-4 py-3 rounded-l-xl text-white outline-none focus:border-yellow-500 transition shadow-inner"
            />
            <button
              type="submit"
              className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-r-xl font-bold hover:bg-yellow-400 transition cursor-pointer"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Boutons Classeur Global / Bouton Retour */}
        <div className="mb-8 flex justify-center gap-4">
          {(!isGlobalBinder && !activeSearch) ? (
            <button
              onClick={() => setIsGlobalBinder(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/60"
            >
              <span>ma collection</span>
            </button>
          ) : (
            <button
              onClick={handleBackToSeries}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
            >
              <span>⬅️ Retour aux séries</span>
            </button>
          )}
        </div>

        {/* Navigation Simplifiée */}
        {(!isGlobalBinder && !activeSearch) && (
          <div className="mb-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">1. Choisis un Bloc :</label>
              <div className="flex flex-wrap gap-2">
                {POKEMON_BLOCKS.map((block, index) => (
                  <button
                    key={block.blockName}
                    onClick={() => handleBlockChange(index)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedBlockIndex === index
                        ? "bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20"
                        : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {block.blockName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">2. Choisis une Extension :</label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full bg-slate-950 text-sm border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-500 cursor-pointer shadow-inner"
              >
                {currentBlock.sets.map(series => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Bannières d'information contextuelle */}
        {activeSearch && (
          <div className="mb-6 text-center bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-blue-300">🔍 Résultats pour "{activeSearch}"</h2>
            <p className="text-xs text-blue-400/80 mt-1">{cards.length} cartes trouvées.</p>
          </div>
        )}

        {isGlobalBinder && (
          <div className="mb-6 text-center bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-purple-300">ma collection</h2>
            <p className="text-xs text-purple-400/80 mt-1">
              {currentUser ? `Tu possèdes un total de ${Object.keys(userCollection).length} cartes uniques enregistrées.` : "Connecte-toi avec Google pour afficher ta collection."}
            </p>
          </div>
        )}

        {/* Filtre par Illustrateur */}
        {illustratorsList.length > 0 && (
          <div className="mb-8 flex items-center justify-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 font-semibold">🎨 Filtrer par Illustrateur :</span>
            <select
              value={selectedIllustrator}
              onChange={(e) => setSelectedIllustrator(e.target.value)}
              className="bg-slate-950 text-xs border border-slate-700 text-white px-3 py-1.5 rounded-lg outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="ALL">Tous les illustrateurs ({cards.length} cartes)</option>
              {illustratorsList.map(ill => (
                <option key={ill} value={ill}>{ill}</option>
              ))}
            </select>
          </div>
        )}

        {/* Barres de progression */}
        {(!isGlobalBinder && !activeSearch) && (
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

        {/* Grille des cartes */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">
            Chargement des cartes en cours... ⚡
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCards.map(card => {
              const isNormalOwned = userCollection[card.id]?.normalOwned || false;
              const isFoilOwned = userCollection[card.id]?.foilOwned || false;

              return (
                <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
                  <div>
                    <div className="mb-4 flex justify-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 min-h-[220px] items-center relative">
                      {(isGlobalBinder || activeSearch) && card.seriesName && (
                        <span className="absolute top-2 left-2 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium text-center z-10 shadow-md">
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

                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold truncate pr-2" title={card.name}>{card.name}</h3>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md shrink-0">#{card.localId}</span>
                    </div>
                    {card.illustrator && (
                      <p className="text-xs text-slate-400 mb-3 italic truncate">Ill. {card.illustrator}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 mt-2">
                    <button
                      onClick={() => toggleCardOwnership(card.id, 'normal')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isNormalOwned 
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {isNormalOwned ? "✓ Normale" : "Normale"}
                    </button>

                    <button
                      onClick={() => toggleCardOwnership(card.id, 'foil')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isFoilOwned 
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {isFoilOwned ? "✨ Foil" : "Foil"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCards.length === 0 && (
          <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-10 mt-8">
            <span className="text-4xl mb-4 block">👀</span>
            <p className="text-slate-400 text-lg">Aucune carte trouvée pour cette recherche ou sélection.</p>
          </div>
        )}

      </div>
    </main>
  );
}