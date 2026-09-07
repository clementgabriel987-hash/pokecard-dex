"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  rarity?: string;
  seriesName?: string;
}

type UserCollectionJSON = Record<string, { normalOwned: boolean; foilOwned: boolean }>;

// Organisation en Blocs et Séries avec les identifiants officiels pokemontcg.io
const POKEMON_BLOCKS = [
  {
    blockName: "⭐ Bloc Promos & Hors-Séries",
    sets: [
      { id: "svp", name: "Scarlet & Violet Promos", lang: "en" },
      { id: "swshp", name: "SWSH Black Star Promos", lang: "en" },
      { id: "smp", name: "SM Black Star Promos", lang: "en" },
      { id: "xyp", name: "XY Black Star Promos", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Wizards (Classic)",
    sets: [
      { id: "base1", name: "Base Set", lang: "en" },
      { id: "base2", name: "Jungle", lang: "en" },
      { id: "base3", name: "Fossil", lang: "en" },
      { id: "base4", name: "Base Set 2", lang: "en" },
      { id: "gym1", name: "Gym Heroes", lang: "en" },
      { id: "neo1", name: "Neo Genesis", lang: "en" },
      { id: "neo2", name: "Neo Discovery", lang: "en" },
      { id: "neo3", name: "Neo Revelation", lang: "en" },
      { id: "neo4", name: "Neo Destiny", lang: "en" }
    ]
  },
  {
    blockName: "Bloc EX (Ruby & Sapphire)",
    sets: [
      { id: "ex1", name: "Ruby & Sapphire", lang: "en" },
      { id: "ex2", name: "Sandstorm", lang: "en" },
      { id: "ex3", name: "Dragon", lang: "en" },
      { id: "ex4", name: "Team Magma vs Team Aqua", lang: "en" },
      { id: "ex5", name: "Hidden Legends", lang: "en" },
      { id: "ex6", name: "FireRed & LeafGreen", lang: "en" },
      { id: "ex7", name: "Team Rocket Returns", lang: "en" },
      { id: "ex8", name: "Deoxys", lang: "en" },
      { id: "ex9", name: "Emerald", lang: "en" },
      { id: "ex10", name: "Unseen Forces", lang: "en" },
      { id: "ex11", name: "Delta Species", lang: "en" },
      { id: "ex12", name: "Legend Maker", lang: "en" },
      { id: "ex13", name: "Holon Phantoms", lang: "en" },
      { id: "ex14", name: "Crystal Guardians", lang: "en" },
      { id: "ex15", name: "Dragon Frontiers", lang: "en" },
      { id: "ex16", name: "Power Keepers", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Diamant & Perle & Platine",
    sets: [
      { id: "dp1", name: "Diamond & Pearl", lang: "en" },
      { id: "dp2", name: "Mysterious Treasures", lang: "en" },
      { id: "dp3", name: "Secret Wonders", lang: "en" },
      { id: "dp4", name: "Great Encounters", lang: "en" },
      { id: "dp5", name: "Majestic Dawn", lang: "en" },
      { id: "dp6", name: "Legends Awakened", lang: "en" },
      { id: "dp7", name: "Stormfront", lang: "en" },
      { id: "pl1", name: "Platinum", lang: "en" },
      { id: "pl2", name: "Rising Rivals", lang: "en" },
      { id: "pl3", name: "Supreme Victors", lang: "en" },
      { id: "pl4", name: "Arceus", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Noir & Blanc",
    sets: [
      { id: "bw1", name: "Black & White", lang: "en" },
      { id: "bw2", name: "Emerging Powers", lang: "en" },
      { id: "bw3", name: "Noble Victories", lang: "en" },
      { id: "bw4", name: "Next Destinies", lang: "en" },
      { id: "bw5", name: "Dark Explorers", lang: "en" },
      { id: "bw6", name: "Dragons Exalted", lang: "en" },
      { id: "bw7", name: "Boundaries Crossed", lang: "en" },
      { id: "bw8", name: "Plasma Storm", lang: "en" },
      { id: "bw9", name: "Plasma Freeze", lang: "en" },
      { id: "bw10", name: "Plasma Blast", lang: "en" },
      { id: "bw11", name: "Legendary Treasures", lang: "en" }
    ]
  },
  {
    blockName: "Bloc XY",
    sets: [
      { id: "xy1", name: "XY Base", lang: "en" },
      { id: "xy2", name: "Flashfire", lang: "en" },
      { id: "xy3", name: "Furious Fists", lang: "en" },
      { id: "xy4", name: "Phantom Forces", lang: "en" },
      { id: "xy5", name: "Primal Clash", lang: "en" },
      { id: "xy6", name: "Roaring Skies", lang: "en" },
      { id: "xy7", name: "Ancient Origins", lang: "en" },
      { id: "xy8", name: "BREAKthrough", lang: "en" },
      { id: "xy9", name: "BREAKpoint", lang: "en" },
      { id: "xy10", name: "Fates Collide", lang: "en" },
      { id: "xy11", name: "Steam Siege", lang: "en" },
      { id: "xy12", name: "Evolutions", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Soleil & Lune",
    sets: [
      { id: "sm1", name: "Sun & Base", lang: "en" },
      { id: "sm2", name: "Guardians Rising", lang: "en" },
      { id: "sm3", name: "Burning Shadows", lang: "en" },
      { id: "sm4", name: "Crimson Invasion", lang: "en" },
      { id: "sm5", name: "Ultra Prism", lang: "en" },
      { id: "sm6", name: "Forbidden Light", lang: "en" },
      { id: "sm7", name: "Celestial Storm", lang: "en" },
      { id: "sm8", name: "Lost Thunder", lang: "en" },
      { id: "sm9", name: "Team Up", lang: "en" },
      { id: "sm10", name: "Unbroken Bonds", lang: "en" },
      { id: "sm11", name: "Unified Minds", lang: "en" },
      { id: "sm12", name: "Cosmic Eclipse", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Épée & Bouclier",
    sets: [
      { id: "swsh1", name: "Sword & Shield", lang: "en" },
      { id: "swsh2", name: "Rebel Clash", lang: "en" },
      { id: "swsh3", name: "Darkness Ablaze", lang: "en" },
      { id: "swsh4", name: "Vivid Voltage", lang: "en" },
      { id: "swsh5", name: "Battle Styles", lang: "en" },
      { id: "swsh6", name: "Chilling Reign", lang: "en" },
      { id: "swsh7", name: "Evolving Skies", lang: "en" },
      { id: "swsh8", name: "Celebrations", lang: "en" },
      { id: "swsh9", name: "Brilliant Stars", lang: "en" },
      { id: "swsh10", name: "Astral Radiance", lang: "en" },
      { id: "swsh11", name: "Lost Origin", lang: "en" },
      { id: "swsh12", name: "Silver Tempest", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Écarlate & Violet (SV)",
    sets: [
      { id: "sv1", name: "Scarlet & Violet", lang: "en" },
      { id: "sv2", name: "Paldea Evolved", lang: "en" },
      { id: "sv3", name: "Obsidian Flames", lang: "en" },
      { id: "sv3pt5", name: "151", lang: "en" },
      { id: "sv4", name: "Paradox Rift", lang: "en" },
      { id: "sv5", name: "Temporal Forces", lang: "en" },
      { id: "sv6", name: "Twilight Masquerade", lang: "en" },
      { id: "sv7", name: "Stellar Crown", lang: "en" },
      { id: "sv8", name: "Surging Sparks", lang: "en" }
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

  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");
  const [raritiesList, setRaritiesList] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [isProgressionOpen, setIsProgressionOpen] = useState<boolean>(false);
  const [mysteryCard, setMysteryCard] = useState<Card | null>(null);
  const [isMysteryOpen, setIsMysteryOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCollection, setUserCollection] = useState<UserCollectionJSON>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    async function loadCollection() {
      if (!currentUser) {
        setUserCollection({});
        return;
      }
      const { data } = await supabase.from("user_data").select("collection").eq("id", currentUser.id).maybeSingle(); 
      if (data && data.collection) setUserCollection(data.collection);
      else {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openMysteryCard = () => {
    if (cards.length === 0) return alert("Ouvre d'abord une série contenant des cartes !");
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setMysteryCard(randomCard);
    setIsMysteryOpen(true);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setSelectedIllustrator("ALL");
      setSelectedRarity("ALL");
      setSelectedStatus("ALL");
      setImageErrors({});
      try {
        if (activeSearch) {
          const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(activeSearch)}*&pageSize=50`);
          if (!response.ok) throw new Error();
          const json = await response.json();
          if (json && json.data) {
            const formatted = json.data.map((c: any) => ({
              id: c.id,
              name: c.name || "Inconnue",
              localId: c.number || "?",
              image: c.images?.large || c.images?.small || "",
              illustrator: c.artist || "Inconnu",
              rarity: c.rarity || "Inconnue",
              seriesName: c.set?.name || "Série inconnue"
            }));
            setCards(formatted);
            extractFilters(formatted);
          } else setCards([]);
        } else if (isGlobalBinder) {
          if (!currentUser) { setCards([]); setLoading(false); return; }
          const ownedCardIds = Object.keys(userCollection).filter(id => userCollection[id]?.normalOwned || userCollection[id]?.foilOwned);
          if (ownedCardIds.length === 0) { setCards([]); setLoading(false); return; }
          
          // Requête groupée par IDs pour pokemontcg.io
          const query = ownedCardIds.map(id => `id:${id}`).join(" OR ");
          const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=250`);
          if (!response.ok) { setCards([]); setLoading(false); return; }
          const json = await response.json();
          if (json && json.data) {
            const formatted = json.data.map((c: any) => ({
              id: c.id,
              name: c.name || "Inconnue",
              localId: c.number || "?",
              image: c.images?.large || c.images?.small || "",
              illustrator: c.artist || "Inconnu",
              rarity: c.rarity || "Inconnue",
              seriesName: c.set?.name || "Série inconnue"
            }));
            setCards(formatted);
            extractFilters(formatted);
          } else setCards([]);
        } else {
          const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${selectedSeriesId}&pageSize=250`);
          if (!response.ok) { setCards([]); setLoading(false); return; }
          const json = await response.json();
          if (json && json.data) {
            // Tri naturel par numéro de carte localId
            const sortedData = json.data.sort((a: any, b: any) => {
              return parseInt(a.number) - parseInt(b.number) || a.number.localeCompare(b.number);
            });

            const formattedCards = sortedData.map((c: any) => ({
              id: c.id,
              name: c.name || "Inconnue",
              localId: c.number || "?",
              image: c.images?.large || c.images?.small || "",
              illustrator: c.artist || "Inconnu",
              rarity: c.rarity || "Inconnue"
            }));

            setCards(formattedCards);
            extractFilters(formattedCards);
          } else setCards([]);
        }
      } catch {
        setCards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeriesId, isGlobalBinder, activeSearch, currentUser]);

  const extractFilters = (cardList: Card[]) => {
    const illsets = new Set<string>();
    const raritiesSet = new Set<string>();
    cardList.forEach(c => {
      if (c.illustrator && c.illustrator !== "Inconnu") illsets.add(c.illustrator);
      if (c.rarity && c.rarity !== "Inconnue") raritiesSet.add(c.rarity);
    });
    setIllustratorsList(Array.from(illsets).sort());
    setRaritiesList(Array.from(raritiesSet).sort());
  };

  const toggleCardOwnership = async (id: string, type: 'normal' | 'foil') => {
    if (!currentUser) return alert("Connecte-toi pour sauvegarder tes cartes !");
    const newCollection = { ...userCollection };
    if (!newCollection[id]) newCollection[id] = { normalOwned: false, foilOwned: false };
    if (type === 'normal') newCollection[id].normalOwned = !newCollection[id].normalOwned;
    else newCollection[id].foilOwned = !newCollection[id].foilOwned;
    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned) delete newCollection[id];
    setUserCollection(newCollection);
    await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection });
  };

  const filteredCards = cards.filter(card => {
    const matchIllustrator = selectedIllustrator === "ALL" || card.illustrator === selectedIllustrator;
    const matchRarity = selectedRarity === "ALL" || card.rarity === selectedRarity;
    const isNormal = userCollection[card.id]?.normalOwned || false;
    const isFoil = userCollection[card.id]?.foilOwned || false;
    let matchStatus = true;
    
    if (!isGlobalBinder) {
      if (selectedStatus === "MISSING") matchStatus = !isNormal && !isFoil;
      else if (selectedStatus === "NORMAL") matchStatus = isNormal;
      else if (selectedStatus === "FOIL") matchStatus = isFoil;
    }

    return matchIllustrator && matchRarity && matchStatus;
  });

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => userCollection[c.id]?.normalOwned).length;
  const foilCollected = cards.filter(c => userCollection[c.id]?.foilOwned).length;
  const isMasterSet = totalCards > 0 && cards.every(c => userCollection[c.id]?.normalOwned && userCollection[c.id]?.foilOwned);
  const currentBlock = POKEMON_BLOCKS[selectedBlockIndex];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="absolute top-4 left-4 z-40">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 p-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold transition cursor-pointer"
        >
          <span className="text-lg">☰</span> Menu
        </button>
      </div>

      <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <div className={`relative w-80 bg-slate-900 border-r border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 ease-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-yellow-400">Menu Dresseur 🧢</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setIsProgressionOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-yellow-300"
              >
                <span>👑</span> Progression & Master Sets
              </button>

              <button
                onClick={() => { setIsGlobalBinder(true); setActiveSearch(""); setIsSidebarOpen(false); }}
                className="w-full text-left bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 p-3.5 rounded-xl font-semibold text-sm text-purple-300 transition flex items-center gap-3 cursor-pointer"
              >
                <span>✨</span> Ma Collection
              </button>

              <Link
                href="/artistes"
                className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer"
              >
                <span>🎨</span> Recherche par Artiste
              </Link>

              <button
                onClick={openMysteryCard}
                className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-blue-300"
              >
                <span>🎲</span> La Carte Mystère du Jour
              </button>

              <Link
                href="/prix"
                className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-green-300"
              >
                <span>📈</span> Recherche de Prix
              </Link>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">📥 / 📤 Sauvegarde</span>
                {currentUser && (
                  <>
                    <button onClick={exportCollectionJSON} className="w-full text-left bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 p-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2">
                      <span>📥</span> Exporter le JSON
                    </button>
                    <label className="w-full text-left bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 p-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 block">
                      <span>📤</span> Importer le JSON
                      <input type="file" accept=".json" onChange={importCollectionJSON} className="hidden" />
                    </label>
                  </>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href="/compte"
                  className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer"
                >
                  <span>⚙️</span> Paramètres & Compte
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            {currentUser ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 truncate">
                Connecté : {currentUser.email}
              </div>
            ) : (
              <Link href="/compte" className="block text-center bg-white text-slate-900 text-xs font-bold p-3 rounded-xl hover:bg-gray-200 transition shadow-md">
                Se connecter avec Google
              </Link>
            )}
          </div>
        </div>
      </div>

      {isProgressionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsProgressionOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-yellow-400">👑 Progression & Master Sets</h2>
              <button onClick={() => setIsProgressionOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              {POKEMON_BLOCKS.map((block) => (
                <div key={block.blockName} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 mb-3">{block.blockName}</h3>
                  <div className="space-y-2">
                    {block.sets.map((set) => (
                      <div key={set.id} className="flex justify-between items-center text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-medium text-slate-300">{set.name}</span>
                        <button 
                          onClick={() => {
                            setSelectedBlockIndex(POKEMON_BLOCKS.findIndex(b => b.blockName === block.blockName));
                            setSelectedSeriesId(set.id);
                            setIsGlobalBinder(false);
                            setActiveSearch("");
                            setIsProgressionOpen(false);
                          }}
                          className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1 rounded font-semibold transition cursor-pointer"
                        >
                          Ouvrir ➔
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isMysteryOpen && mysteryCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMysteryOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 text-center">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-blue-400">🎲 Carte Mystère du Jour</h2>
              <button onClick={() => setIsMysteryOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-center min-h-[220px] items-center">
              <img src={mysteryCard.image} alt={mysteryCard.name} className="h-56 object-contain drop-shadow-lg" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">{mysteryCard.name}</h3>
            <p className="text-xs text-slate-400 mb-4">#{mysteryCard.localId} {mysteryCard.rarity ? `• ${mysteryCard.rarity}` : ""}</p>
            <button onClick={openMysteryCard} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
              🔄 Piocher une autre carte
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto pt-6 md:pt-0">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
            Ta collection de cartes Pokémon ⚡
          </h1>
          <p className="text-slate-400 text-sm">Le sanctuaire ultime pour traquer ton carton brillant</p>
          {(!isGlobalBinder && !activeSearch && isMasterSet && totalCards > 0) && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-yellow-500/50 px-4 py-1.5 rounded-full mt-3 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse">
              <span className="text-yellow-400 font-bold text-sm">👑 MASTER SET VALIDÉ !</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-6 flex justify-center max-w-md mx-auto">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Chercher une carte (ex: Charizard, Pikachu...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm px-4 py-3 rounded-l-xl text-white outline-none focus:border-yellow-500 transition shadow-inner"
            />
            <button type="submit" className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-r-xl font-bold hover:bg-yellow-400 transition cursor-pointer">
              🔍
            </button>
          </div>
        </form>

        <div className="mb-8 flex justify-center gap-4">
          {(!isGlobalBinder && !activeSearch) ? (
            <button onClick={() => setIsGlobalBinder(true)} className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/60">
              <span>✨ Ma Collection</span>
            </button>
          ) : (
            <button onClick={handleBackToSeries} className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600">
              <span>⬅️ Retour aux séries</span>
            </button>
          )}
        </div>

        {(!isGlobalBinder && !activeSearch) && (
          <div className="mb-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">1. Choisis une époque (Bloc) :</label>
              <div className="flex flex-wrap gap-2">
                {POKEMON_BLOCKS.map((block, index) => (
                  <button
                    key={block.blockName}
                    onClick={() => handleBlockChange(index)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${selectedBlockIndex === index ? "bg-yellow-500 text-slate-950 font-bold shadow-md" : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"}`}
                  >
                    {block.blockName}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">2. Choisis une extension :</label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full bg-slate-950 text-sm border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-500 cursor-pointer shadow-inner"
              >
                {currentBlock.sets.map(series => (
                  <option key={series.id} value={series.id}>{series.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isGlobalBinder && (
          <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/85">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-semibold shrink-0">🎯 Statut :</span>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full md:w-auto bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                <option value="ALL">Toutes les cartes</option>
                <option value="MISSING">❌ Manquantes</option>
                <option value="NORMAL">✓ Normales possédées</option>
                <option value="FOIL">✨ Foils possédées</option>
              </select>
            </div>
            {illustratorsList.length > 0 && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-400 font-semibold shrink-0">🎨 Artiste :</span>
                <select value={selectedIllustrator} onChange={(e) => setSelectedIllustrator(e.target.value)} className="w-full md:w-auto bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                  <option value="ALL">Tous ({cards.length})</option>
                  {illustratorsList.map(ill => <option key={ill} value={ill}>{ill}</option>)}
                </select>
              </div>
            )}
            {raritiesList.length > 0 && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-400 font-semibold shrink-0">💎 Rareté :</span>
                <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} className="w-full md:w-auto bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                  <option value="ALL">Toutes</option>
                  {raritiesList.map(rarity => <option key={rarity} value={rarity}>{rarity}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {(!isGlobalBinder && !activeSearch) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-300">Cartes Normales</span>
                <span className="text-yellow-400">{normalCollected} / {totalCards} ({Math.round((normalCollected/totalCards)*100 || 0)}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full transition-all duration-500 rounded-full" style={{ width: `${Math.round((normalCollected/totalCards)*100 || 0)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-300">Cartes Foils (Brillantes)</span>
                <span className="text-purple-400">{foilCollected} / {totalCards} ({Math.round((foilCollected/totalCards)*100 || 0)}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500 rounded-full" style={{ width: `${Math.round((foilCollected/totalCards)*100 || 0)}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">Chargement depuis Pokemon TCG IO... ⚡</div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredCards.map(card => {
              const isNormalOwned = userCollection[card.id]?.normalOwned || false;
              const isFoilOwned = userCollection[card.id]?.foilOwned || false;
              const hasError = imageErrors[card.id];

              return (
                <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-5 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="mb-3 flex justify-center bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 min-h-[160px] md:min-h-[220px] items-center relative overflow-hidden">
                      {card.image && !hasError ? (
                        <img src={card.image} alt={card.name} className="h-36 md:h-48 object-contain drop-shadow-md" onError={() => setImageErrors(prev => ({ ...prev, [card.id]: true }))} />
                      ) : (
                        <span className="text-[11px] text-slate-500 italic text-center">Image indisponible</span>
                      )}
                    </div>
                    <div className="flex justify-between items-start mb-1 gap-1">
                      <h3 className="text-xs md:text-sm font-bold truncate">{card.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">#{card.localId}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 mt-1">
                    <button onClick={() => toggleCardOwnership(card.id, 'normal')} className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${isNormalOwned ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-slate-800 text-slate-400"}`}>
                      {isNormalOwned ? "✓ Normale" : "Normale"}
                    </button>
                    <button onClick={() => toggleCardOwnership(card.id, 'foil')} className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${isFoilOwned ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-800 text-slate-400"}`}>
                      {isFoilOwned ? "✨ Foil" : "Foil"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-10 mt-8">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="text-slate-300 text-base font-semibold">Aucune carte trouvée.</p>
          </div>
        )}

        {showScrollTop && (
          <button onClick={scrollToTop} className="fixed bottom-6 right-6 z-40 bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-3.5 rounded-full shadow-2xl transition cursor-pointer">
            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path></svg>
          </button>
        )}
      </div>
    </main>
  );
}