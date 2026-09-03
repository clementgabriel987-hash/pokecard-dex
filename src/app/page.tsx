"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  normalOwned: boolean;
  foilOwned: boolean;
  seriesName?: string;
}

type UserCollectionJSON = Record<string, { normalOwned: boolean; foilOwned: boolean }>;

// Organisation ultime et complète des séries TCG
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
    blockName: "Bloc EX (Ruby & Sapphire Era)",
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
    blockName: "Bloc Platine & Diamant & Perle",
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
    blockName: "Bloc XY (Méga-Évolutions)",
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
      { id: "xy10", name: "Offensive Vapeur (FR)", lang: "fr" },
      { id: "xy11", name: "Évolutions (FR)", lang: "fr" },
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
  }
];

const ALL_FLAT_SERIES = POKEMON_BLOCKS.flatMap(b => b.sets);

export default function PokedexPage() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("base1");
  const [isGlobalBinder, setIsGlobalBinder] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedIllustrator, setSelectedIllustrator] = useState<string>("ALL");
  const [illustratorsList, setIllustratorsList] = useState<string[]>([]);

  // Authentification et Utilisateur
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

  // UPDATE 1 : Forcer Google à demander le compte à utiliser
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account' 
        }
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserCollection({});
    setCards(cards.map(c => ({ ...c, normalOwned: false, foilOwned: false })));
  };

  // UPDATE 2 : Utiliser maybeSingle et upsert pour les nouveaux comptes
  useEffect(() => {
    async function loadCollection() {
      if (!currentUser) {
        setUserCollection({});
        return;
      }
      
      const { data, error } = await supabase
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
        window.location.reload();
      } catch (err) {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setSelectedIllustrator("ALL");
      try {
        if (isGlobalBinder) {
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
                    const savedState = userCollection[card.id];
                    globalCards.push({
                      id: card.id,
                      name: card.name || "Carte inconnue",
                      localId: card.localId || "?",
                      image: card.image ? `${card.image}/high.png` : "",
                      illustrator: card.illustrator || "Inconnu",
                      normalOwned: savedState?.normalOwned || false,
                      foilOwned: savedState?.foilOwned || false,
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
              
              const savedState = userCollection[c.id];
              return {
                id: c.id,
                name: c.name || "Carte inconnue",
                localId: c.localId || "?",
                image: c.image ? `${c.image}/high.png` : "",
                illustrator,
                normalOwned: savedState?.normalOwned || false,
                foilOwned: savedState?.foilOwned || false
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
        console.error("Erreur lors du chargement des cartes", error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeriesId, isGlobalBinder, currentUser]); 

  useEffect(() => {
    setCards(prevCards => 
      prevCards.map(card => {
        const saved = userCollection[card.id];
        return {
          ...card,
          normalOwned: saved?.normalOwned || false,
          foilOwned: saved?.foilOwned || false
        };
      })
    );
  }, [userCollection]);

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

    // ENVOI AU CLOUD AVEC DÉTECTION D'ERREUR :
    const { error } = await supabase.from("user_data").upsert({
      id: currentUser.id,
      collection: newCollection
    });

    if (error) {
      console.error("DÉTAILS DE L'ERREUR SUPABASE :", error);
      alert(`Oups, Supabase a bloqué la sauvegarde ! Raison : ${error.message}`);
    }
  };
    }

    setUserCollection(newCollection);

    await supabase.from("user_data").upsert({
      id: currentUser.id,
      collection: newCollection
    });
  };

  const filteredCards = cards.filter(card => {
    if (selectedIllustrator === "ALL") return true;
    return card.illustrator === selectedIllustrator;
  });

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => c.normalOwned).length;
  const foilCollected = cards.filter(c => c.foilOwned).length;
  const normalPercent = totalCards > 0 ? Math.round((normalCollected / totalCards) * 100) : 0;
  const foilPercent = totalCards > 0 ? Math.round((foilCollected / totalCards) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Barre d'auth (GOOGLE) + JSON Export/Import */}
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4 shadow-md">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Espace Dresseur 🧢</h2>
            <p className="text-xs text-slate-500">
              {currentUser ? `Connecté en tant que : ${currentUser.email}` : "Connecte-toi en un clic pour sauvegarder ta collection dans le Cloud."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {currentUser ? (
              <>
                <button onClick={exportCollectionJSON} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer">
                  📥 Exporter
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
          Mon Pokédex de Cartes 📈
        </h1>
        <p className="text-slate-400 text-center mb-8">Classement par Blocs Officiels & Tri par Illustrateur</p>

        {/* Bouton Classeur Global */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setIsGlobalBinder(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg ${
              isGlobalBinder
                ? "bg-purple-500 text-white shadow-purple-500/30"
                : "bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/60"
            }`}
          >
            <span>✨ Voir mon Classeur Global (Toutes séries confondues)</span>
          </button>
        </div>

        {/* Sélecteur par Blocs et Séries */}
        {!isGlobalBinder && (
          <div className="mb-8 space-y-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl max-h-[400px] overflow-y-auto">
            {POKEMON_BLOCKS.map(block => (
              <div key={block.blockName} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400/90">{block.blockName}</h3>
                <div className="flex flex-wrap gap-2">
                  {block.sets.map(series => (
                    <button
                      key={series.id}
                      onClick={() => { setIsGlobalBinder(false); setSelectedSeriesId(series.id); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedSeriesId === series.id
                          ? "bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      {series.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtre par Illustrateur */}
        {!isGlobalBinder && illustratorsList.length > 0 && (
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
              {currentUser ? `Tu possèdes un total de ${cards.length} cartes enregistrées.` : "Connecte-toi avec Google pour afficher ton classeur."}
            </p>
          </div>
        )}

        {/* Grille des cartes */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse">
            Chargement des cartes par blocs en cours... ⚡
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCards.map(card => (
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

                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold">{card.name}</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">#{card.localId}</span>
                  </div>
                  {card.illustrator && (
                    <p className="text-xs text-slate-400 mb-3 italic">Ill. {card.illustrator}</p>
                  )}
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

        {!loading && filteredCards.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            Aucune carte trouvée pour cette sélection.
          </p>
        )}

      </div>
    </main>
  );
}