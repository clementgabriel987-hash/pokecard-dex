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

interface CardDetails {
  normalOwned: boolean;
  foilOwned: boolean;
  langs?: string[];
  isWishlist?: boolean;
}

type UserCollectionJSON = Record<string, CardDetails>;

// Organisation complète de tous les blocs, promos et extensions
const POKEMON_BLOCKS = [
  {
    blockName: "⭐ Cartes Promotionnelles",
    sets: [
      { id: "svp", name: "Scarlet & Violet Promos", lang: "fr" },
      { id: "swshp", name: "SWSH Black Star Promos", lang: "fr" },
      { id: "smp", name: "SM Black Star Promos", lang: "fr" },
      { id: "xyp", name: "XY Black Star Promos", lang: "fr" },
      { id: "bwp", name: "BW Black Star Promos", lang: "fr" },
      { id: "hsp", name: "HGSS Black Star Promos", lang: "fr" },
      { id: "dpp", name: "DP Black Star Promos", lang: "en" },
      { id: "basep", name: "Wizards Black Star Promos", lang: "en" }
    ]
  },
  {
    blockName: "📦 Hors-Séries & Spéciales",
    sets: [
      { id: "det1", name: "Détective Pikachu", lang: "fr" },
      { id: "pop1", name: "POP Series 1", lang: "en" },
      { id: "pop2", name: "POP Series 2", lang: "en" },
      { id: "pop3", name: "POP Series 3", lang: "en" },
      { id: "pop4", name: "POP Series 4", lang: "en" },
      { id: "pop5", name: "POP Series 5", lang: "en" },
      { id: "pop6", name: "POP Series 6", lang: "en" },
      { id: "pop7", name: "POP Series 7", lang: "en" },
      { id: "pop8", name: "POP Series 8", lang: "en" },
      { id: "pop9", name: "POP Series 9", lang: "en" },
      { id: "mcd22", name: "McDonald's Collection 2022", lang: "en" },
      { id: "mcd23", name: "McDonald's Collection 2023", lang: "en" },
      { id: "mcd24", name: "McDonald's Collection 2024", lang: "en" }
    ]
  },
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
      { id: "ex7", name: "EX Team Rocket Returns (EN)", lang: "en" },
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
    blockName: "Bloc Diamant & Perle",
    sets: [
      { id: "dp1", name: "Diamant & Perle (FR)", lang: "fr" },
      { id: "dp2", name: "Trésors Mystérieux (FR)", lang: "fr" },
      { id: "dp3", name: "Merveilles Secrètes (FR)", lang: "fr" },
      { id: "dp4", name: "Aube Majestueuse (FR)", lang: "fr" },
      { id: "dp5", name: "Éveil des Légendes (FR)", lang: "fr" },
      { id: "dp6", name: "Tempête (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Platine",
    sets: [
      { id: "pl1", name: "Platine (FR)", lang: "fr" },
      { id: "pl2", name: "Rivaux Émergents (FR)", lang: "fr" },
      { id: "pl3", name: "Vainqueurs Suprêmes (FR)", lang: "fr" },
      { id: "pl4", name: "Arceus (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc HeartGold & SoulSilver (HGSS)",
    sets: [
      { id: "hgss1", name: "HeartGold & SoulSilver (FR)", lang: "fr" },
      { id: "hgss2", name: "HS - Déchaîné (FR)", lang: "fr" },
      { id: "hgss3", name: "HS - Indomptable (FR)", lang: "fr" },
      { id: "hgss4", name: "HS - Triomphant (FR)", lang: "fr" },
      { id: "col1", name: "L'Appel des Légendes (FR)", lang: "fr" }
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
      { id: "bw11", name: "Trésors Légendaires (EN)", lang: "en" }
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
      { id: "sv08", name: "Étincelles Survoltées (FR)", lang: "fr" },
      { id: "sv08.5", name: "Évolutions Prismatiques (FR)", lang: "fr" },
      { id: "sv09", name: "Aventures Ensemble (FR)", lang: "fr" },
      { id: "sv10", name: "Rivalités Destinées (FR)", lang: "fr" },
      { id: "blk", name: "Foudre Noire (FR)", lang: "fr" },
      { id: "wht", name: "Flamme Blanche (FR)", lang: "fr" }
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
  const [binderViewStyle, setBinderViewStyle] = useState<"standard" | "pages">("pages");

  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedIllustrator, setSelectedIllustrator] = useState<string>("ALL");
  const [illustratorsList, setIllustratorsList] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");
  const [raritiesList, setRaritiesList] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");

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

    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const openMysteryCard = () => {
    if (cards.length === 0) return alert("Ouvre d'abord une série contenant des cartes !");
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setMysteryCard(randomCard);
    setIsMysteryOpen(true);
    setIsSidebarOpen(false);
  };

  const handleImageError = (cardId: string, currentImg: string) => {
    if (currentImg && currentImg.includes("/fr/")) {
      const fallbackUrl = currentImg.replace("/fr/", "/en/");
      setCards(prevCards => 
        prevCards.map(c => c.id === cardId ? { ...c, image: fallbackUrl } : c)
      );
      return;
    }
    setImageErrors(prev => ({ ...prev, [cardId]: true }));
  };

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setSelectedIllustrator("ALL");
      setSelectedRarity("ALL");
      setSelectedStatus("ALL");
      setSelectedLanguage("ALL");
      setImageErrors({});
      try {
        if (activeSearch) {
          const response = await fetch(`https://api.tcgdex.net/v2/fr/cards?name=${encodeURIComponent(activeSearch)}`);
          if (!response.ok) throw new Error();
          const data = await response.json();
          if (Array.isArray(data)) {
            const formatted = await Promise.all(data.slice(0, 50).map(async (c: any) => {
              let imageUrl = c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/fr/base1/${c.localId}/high.png`;
              let illustrator = "Inconnu", rarity = "Inconnue", seriesName = "Série inconnue";
              try {
                const cardRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${c.id}`);
                const cardData = await cardRes.json();
                illustrator = cardData.illustrator || "Inconnu";
                rarity = cardData.rarity || "Inconnue";
                seriesName = cardData.set?.name || "Série inconnue";
                if (cardData.image) imageUrl = `${cardData.image}/high.png`;
              } catch {}
              return { id: c.id, name: c.name || "Inconnue", localId: c.localId || "?", image: imageUrl, illustrator, rarity, seriesName };
            }));
            setCards(formatted);
            extractFilters(formatted);
          } else setCards([]);
        } else if (isGlobalBinder) {
          if (!currentUser) { setCards([]); setLoading(false); return; }
          const ownedCardIds = Object.keys(userCollection).filter(id => userCollection[id]?.normalOwned || userCollection[id]?.foilOwned);
          let globalCards: Card[] = [];
          for (const series of ALL_FLAT_SERIES) {
            try {
              const response = await fetch(`https://api.tcgdex.net/v2/${series.lang}/sets/${series.id}`);
              if (!response.ok) continue;
              const data = await response.json();
              if (data && data.cards) {
                for (const card of data.cards) {
                  if (ownedCardIds.includes(card.id)) {
                    globalCards.push({
                      id: card.id, name: card.name || "Inconnue", localId: card.localId || "?",
                      image: card.image ? `${card.image}/high.png` : `https://assets.tcgdex.net/${series.lang}/${series.id}/${card.localId}/high.png`,
                      illustrator: card.illustrator || "Inconnu", rarity: card.rarity || "Inconnue", seriesName: series.name
                    });
                  }
                }
              }
            } catch {}
          }
          setCards(globalCards);
          extractFilters(globalCards);
        } else {
          const currentSeries = ALL_FLAT_SERIES.find(s => s.id === selectedSeriesId);
          const lang = currentSeries ? currentSeries.lang : "fr";
          const response = await fetch(`https://api.tcgdex.net/v2/${lang}/sets/${selectedSeriesId}`);
          if (!response.ok) { setCards([]); setLoading(false); return; }
          const data = await response.json();
          if (data && data.cards) {
            const formattedCards = await Promise.all(data.cards.map(async (c: any) => {
              let imageUrl = c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/${lang}/${selectedSeriesId}/${c.localId}/high.png`;
              let illustrator = "Inconnu", rarity = "Inconnue";
              try {
                const cardRes = await fetch(`https://api.tcgdex.net/${lang}/cards/${c.id}`);
                if (cardRes.ok) {
                  const cardData = await cardRes.json();
                  illustrator = cardData.illustrator || "Inconnu";
                  rarity = cardData.rarity || "Inconnue";
                  if (cardData.image) imageUrl = `${cardData.image}/high.png`;
                }
              } catch {}
              return { id: c.id, name: c.name || "Inconnue", localId: c.localId || "?", image: imageUrl, illustrator, rarity, seriesName: currentSeries?.name };
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

  const toggleCardOwnership = async (id: string, type: 'normal' | 'foil', cardDefaultLang: string) => {
    if (!currentUser) return alert("Connecte-toi pour sauvegarder tes cartes !");
    const newCollection = { ...userCollection };
    if (!newCollection[id]) newCollection[id] = { normalOwned: false, foilOwned: false, langs: [cardDefaultLang] };
    
    if (type === 'normal') newCollection[id].normalOwned = !newCollection[id].normalOwned;
    else newCollection[id].foilOwned = !newCollection[id].foilOwned;
    
    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned && !newCollection[id].isWishlist) delete newCollection[id];
    setUserCollection(newCollection);
    await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection });
  };

  const toggleCardLanguage = async (id: string, langToToggle: string, defaultLang: string) => {
    if (!currentUser) return;
    const newCollection = { ...userCollection };
    if (!newCollection[id]) return;

    let currentLangs = newCollection[id].langs || [defaultLang];
    if (currentLangs.includes(langToToggle)) {
      currentLangs = currentLangs.filter(l => l !== langToToggle);
      if (currentLangs.length === 0) currentLangs = [defaultLang];
    } else {
      currentLangs.push(langToToggle);
    }

    newCollection[id].langs = currentLangs;
    setUserCollection(newCollection);
    await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection });
  };

  const toggleWishlist = async (id: string) => {
    if (!currentUser) return alert("Connecte-toi pour gérer ta wishlist !");
    const newCollection = { ...userCollection };
    if (!newCollection[id]) newCollection[id] = { normalOwned: false, foilOwned: false, isWishlist: true };
    else newCollection[id].isWishlist = !newCollection[id].isWishlist;

    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned && !newCollection[id].isWishlist) delete newCollection[id];

    setUserCollection(newCollection);
    await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection });
  };

  const filteredCards = cards.filter(card => {
    const matchIllustrator = selectedIllustrator === "ALL" || card.illustrator === selectedIllustrator;
    const matchRarity = selectedRarity === "ALL" || card.rarity === selectedRarity;
    const cardData = userCollection[card.id];
    const isNormal = cardData?.normalOwned || false;
    const isFoil = cardData?.foilOwned || false;
    const cardLangs = cardData?.langs || [];
    
    let matchStatus = true;
    let matchLang = true;
    
    if (!isGlobalBinder) {
      if (selectedStatus === "MISSING") matchStatus = !isNormal && !isFoil;
      else if (selectedStatus === "NORMAL") matchStatus = isNormal;
      else if (selectedStatus === "FOIL") matchStatus = isFoil;
    }

    if (selectedLanguage !== "ALL") {
      if (isNormal || isFoil) matchLang = cardLangs.includes(selectedLanguage);
      else matchLang = false;
    }

    return matchIllustrator && matchRarity && matchStatus && matchLang;
  });

  const totalCards = cards.length;
  const normalCollected = cards.filter(c => userCollection[c.id]?.normalOwned).length;
  const foilCollected = cards.filter(c => userCollection[c.id]?.foilOwned).length;
  const isMasterSet = totalCards > 0 && cards.every(c => userCollection[c.id]?.normalOwned && userCollection[c.id]?.foilOwned);
  const currentBlock = POKEMON_BLOCKS[selectedBlockIndex];

  // Helper pour couper les listes par paquets de 9 (pages de classeur 3x3)
  const chunkArray = (arr: Card[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Grouper les cartes par série
  const groupedBySeries = filteredCards.reduce((acc, card) => {
    const sName = card.seriesName || "Série inconnue";
    if (!acc[sName]) acc[sName] = [];
    acc[sName].push(card);
    return acc;
  }, {} as Record<string, Card[]>);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="absolute top-4 left-4 z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 p-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold transition cursor-pointer">
          <span className="text-lg">☰</span> Menu
        </button>
      </div>

      <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`relative w-80 bg-slate-900 border-r border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 ease-out overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-yellow-400">MENU DE NAVIGATION </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">Navigation</span>
                <div className="space-y-2">
                  <button onClick={() => { setIsProgressionOpen(true); setIsSidebarOpen(false); }} className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-yellow-300">
                    <span>👑</span> Progression & Master Sets
                  </button>
                  <button onClick={() => { setIsGlobalBinder(true); setActiveSearch(""); setIsSidebarOpen(false); }} className="w-full text-left bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 p-3.5 rounded-xl font-semibold text-sm text-purple-300 transition flex items-center gap-3 cursor-pointer">
                    <span>✨</span> Ma Collection
                  </button>
                  <Link href="/wishlist" className="w-full text-left bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 p-3.5 rounded-xl font-semibold text-sm text-red-300 transition flex items-center gap-3 cursor-pointer">
                    <span>❤️</span> Chasse aux cartes (Wishlist)
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">OUTILS POUR LES DRESSEURS</span>
                <div className="space-y-2">
                  <Link href="/artistes" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer">
                    <span>🎨</span> Recherche par Artiste
                  </Link>
                  <button onClick={openMysteryCard} className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-blue-300">
                    <span>🎲</span> La Carte Mystère du Jour
                  </button>
                  <Link href="/prix" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-green-300">
                    <span>📈</span> Recherche de Prix
                  </Link>
                  <Link href="/achats" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-emerald-300">
                    <span>🛒</span> Historique des Achats
                  </Link>
                  <Link href="/analyse-sets" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-amber-300">
                    <span>📊</span> Analyse des Coûts (Full Sets)
                  </Link>
                  <Link href="/statistiques" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-indigo-300">
                    <span>📈</span> Tableau de Bord & Stats
                  </Link>
                  <Link href="/budget" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-emerald-400">
                    <span>💰</span> Simulateur de Budget
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">📥 / 📤 Sauvegarde</span>
                <div className="space-y-2">
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
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">Paramètres</span>
                <div className="space-y-2">
                  <Link href="/compte" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer">
                    <span>⚙️</span> Paramètres & Compte
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800">
            {currentUser ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 truncate">Connecté : {currentUser.email}</div>
            ) : (
              <Link href="/compte" className="block text-center bg-white text-slate-900 text-xs font-bold p-3 rounded-xl hover:bg-gray-200 transition shadow-md">Se connecter avec Google</Link>
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
                        <button onClick={() => { setSelectedBlockIndex(POKEMON_BLOCKS.findIndex(b => b.blockName === block.blockName)); setSelectedSeriesId(set.id); setIsGlobalBinder(false); setActiveSearch(""); setIsProgressionOpen(false); }} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1 rounded font-semibold transition cursor-pointer">
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
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">TON CLASSEUR EN LIGNE POKÉMON !</h1>
          <p className="text-slate-400 text-sm">Le site internet ultime pour gérer ta collection de cartes. </p>
          {(!isGlobalBinder && !activeSearch && isMasterSet && totalCards > 0) && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-yellow-500/50 px-4 py-1.5 rounded-full mt-3 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse">
              <span className="text-yellow-400 font-bold text-sm">👑 MASTER SET VALIDÉ !</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-6 flex justify-center max-w-md mx-auto">
          <div className="relative w-full flex items-center">
            <input type="text" placeholder="Chercher une carte..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-sm px-4 py-3 rounded-l-xl text-white outline-none focus:border-yellow-500 transition shadow-inner" />
            <button type="submit" className="bg-yellow-500 text-slate-950 px-5 py-3 rounded-r-xl font-bold hover:bg-yellow-400 transition cursor-pointer">🔍</button>
          </div>
        </form>

        <div className="mb-8 flex justify-center gap-4 items-center flex-wrap">
          {(!isGlobalBinder && !activeSearch) ? (
            <button onClick={() => setIsGlobalBinder(true)} className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/60">
              <span>✨ Ma Collection</span>
            </button>
          ) : (
            <button onClick={handleBackToSeries} className="px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600">
              <span>⬅️ Retour aux séries</span>
            </button>
          )}

          {isGlobalBinder && (
            <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800">
              <button 
                onClick={() => setBinderViewStyle("pages")} 
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${binderViewStyle === "pages" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                📖 Pages de Classeur (3x3)
              </button>
              <button 
                onClick={() => setBinderViewStyle("standard")} 
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${binderViewStyle === "standard" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                🖥️ Grille Standard
              </button>
            </div>
          )}
        </div>

        {(!isGlobalBinder && !activeSearch) && (
          <div className="mb-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">1. Choisis un Bloc :</label>
              <div className="flex flex-wrap gap-2">
                {POKEMON_BLOCKS.map((block, index) => (
                  <button key={block.blockName} onClick={() => handleBlockChange(index)} className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${selectedBlockIndex === index ? "bg-yellow-500 text-slate-950 font-bold shadow-md" : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"}`}>
                    {block.blockName}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">2. Choisis une extension :</label>
              <select value={selectedSeriesId} onChange={(e) => setSelectedSeriesId(e.target.value)} className="w-full bg-slate-950 text-sm border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-500 cursor-pointer shadow-inner">
                {currentBlock.sets.map(series => <option key={series.id} value={series.id}>{series.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {!isGlobalBinder && (
          <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/85 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold shrink-0">🎯 Statut :</span>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                <option value="ALL">Toutes les cartes</option>
                <option value="MISSING">❌ Manquantes</option>
                <option value="NORMAL">✓ Normales possédées</option>
                <option value="FOIL">✨ Foils possédées</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold shrink-0">🌍 Langue :</span>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                <option value="ALL">Toutes</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 Anglais</option>
                <option value="jp">🇯🇵 Japonais</option>
              </select>
            </div>
            {illustratorsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold shrink-0">🎨 Artiste :</span>
                <select value={selectedIllustrator} onChange={(e) => setSelectedIllustrator(e.target.value)} className="bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                  <option value="ALL">Tous ({cards.length})</option>
                  {illustratorsList.map(ill => <option key={ill} value={ill}>{ill}</option>)}
                </select>
              </div>
            )}
            {raritiesList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold shrink-0">💎 Rareté :</span>
                <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} className="bg-slate-950 text-xs border border-slate-700 text-white px-3 py-2 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                  <option value="ALL">Toutes</option>
                  {raritiesList.map(rarity => <option key={rarity} value={rarity}>{rarity}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {(!isGlobalBinder && !activeSearch) && (
          <div className="mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {totalCards > 0 && (
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-purple-300">
                <span className="text-lg shrink-0">🛡️</span>
                <div>
                  <span className="font-bold text-white">Info :</span> Pour ranger cette extension complète de <strong className="text-yellow-400">{totalCards}</strong> cartes (en pages standard 18 poches), il te faut environ <strong className="text-yellow-400">{Math.ceil(totalCards / 18)}</strong> pages Dragon Shield.
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">Chargement de la collection... ⚡</div>
        ) : filteredCards.length > 0 ? (
          <div>
            {/* Si nous sommes en mode "Ma Collection" avec tri par série */}
            {isGlobalBinder ? (
              <div className="space-y-10">
                {Object.entries(groupedBySeries).map(([seriesName, seriesCards]) => {
                  const binderPages = chunkArray(seriesCards, 9);
                  return (
                    <div key={seriesName} className="space-y-4">
                      {/* En-tête de série */}
                      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl shadow-md">
                        <h2 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                          <span>📂</span> {seriesName}
                        </h2>
                        <span className="text-xs bg-slate-950 text-purple-300 px-3 py-1 rounded-lg border border-slate-800 font-semibold">
                          {seriesCards.length} carte(s) possédée(s)
                        </span>
                      </div>

                      {/* Affichage par pages de classeur 3x3 ou grille standard */}
                      {binderViewStyle === "pages" ? (
                        <div className="space-y-6">
                          {binderPages.map((pageCards, pageIndex) => (
                            <div key={pageIndex} className="bg-slate-900/90 border-2 border-purple-900/40 rounded-3xl p-6 md:p-8 shadow-[0_0_20px_rgba(147,51,234,0.1)] relative">
                              <div className="absolute top-4 right-6 text-[11px] text-purple-400 font-semibold uppercase tracking-wider">
                                {seriesName} • Page {pageIndex + 1}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-4">
                                {pageCards.map(card => renderCardItem(card))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                          {seriesCards.map(card => renderCardItem(card))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vue normale pour une seule série ou recherche active */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCards.map(card => renderCardItem(card))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-10 mt-8">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="text-slate-300 text-base font-semibold">Aucune carte trouvée pour cette sélection.</p>
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

  // Helper pour rendre chaque carte proprement
  function renderCardItem(card: Card) {
    const cardData = userCollection[card.id];
    const isNormalOwned = cardData?.normalOwned || false;
    const isFoilOwned = cardData?.foilOwned || false;
    const isWishlisted = cardData?.isWishlist || false;
    const hasError = imageErrors[card.id];

    const cardSeries = ALL_FLAT_SERIES.find(s => s.id === (isGlobalBinder ? card.id.split('-')[0] : selectedSeriesId));
    const cardDefaultLang = cardSeries?.lang || "fr";
    const showLanguageFlags = cardDefaultLang !== "en";

    return (
      <div key={card.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 md:p-4 flex flex-col justify-between shadow-lg relative">
        <button 
          onClick={() => toggleWishlist(card.id)} 
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${isWishlisted ? "bg-red-500/20 text-red-400 border border-red-500/40 scale-110" : "bg-slate-950/60 text-slate-400 hover:text-red-400 border border-slate-800"}`}
          title="Ajouter à la Wishlist"
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>

        <div>
          <div className="mb-3 flex justify-center bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 min-h-[160px] md:min-h-[200px] items-center relative overflow-hidden">
            {card.image && !hasError ? (
              <img 
                src={card.image} 
                alt={card.name} 
                className="h-32 md:h-44 object-contain drop-shadow-md" 
                onError={() => handleImageError(card.id, card.image)} 
              />
            ) : (
              <span className="text-[11px] text-slate-500 italic text-center">Image indisponible</span>
            )}
          </div>
          <div className="flex justify-between items-start mb-1 gap-1">
            <h3 className="text-xs md:text-sm font-bold truncate">{card.name}</h3>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">#{card.localId}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 mt-1">
          <button onClick={() => toggleCardOwnership(card.id, 'normal', cardDefaultLang)} className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${isNormalOwned ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-slate-900 text-slate-400"}`}>
            {isNormalOwned ? "✓ Normale" : "Normale"}
          </button>
          <button onClick={() => toggleCardOwnership(card.id, 'foil', cardDefaultLang)} className={`py-1.5 px-1 rounded-lg text-[10px] md:text-xs font-semibold transition cursor-pointer text-center truncate ${isFoilOwned ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-900 text-slate-400"}`}>
            {isFoilOwned ? "✨ Foil" : "Foil"}
          </button>
        </div>

        {showLanguageFlags && (isNormalOwned || isFoilOwned) && (
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-slate-800/50">
            {['fr', 'en', 'jp'].map(l => {
               const isActive = (cardData?.langs || [cardDefaultLang]).includes(l);
               const flagEmoji = l === 'fr' ? '🇫🇷' : l === 'en' ? '🇬🇧' : '🇯🇵';
               return (
                 <button 
                   key={l}
                   onClick={() => toggleCardLanguage(card.id, l, cardDefaultLang)}
                   className={`text-base transition-all duration-200 cursor-pointer ${isActive ? 'grayscale-0 opacity-100 scale-110 drop-shadow-md' : 'grayscale opacity-30 hover:opacity-70'}`}
                   title={`Marquer comme possédée en ${l.toUpperCase()}`}
                 >
                   {flagEmoji}
                 </button>
               )
            })}
          </div>
        )}
      </div>
    );
  }
}