"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { get, set } from "idb-keyval";
import { supabase } from "../lib/supabase";
import { POKEMON_BLOCKS, ALL_FLAT_SERIES, TCG_IO_ONLY_SETS, PokemonSet, PokemonBlock } from "../constants/pokemonSets";
import { POKEMON_ITEMS, PokemonItem } from "../constants/pokemonItems";
import CardZoomModal from "../components/CardZoomModal";
import CardSkeleton from "../components/CardSkeleton";
import CardItem from "../components/CardItem";
import Header from "../components/Header";

interface Card {
  id: string | number;
  name: string;
  localId: string;
  image: string;
  illustrator?: string;
  rarity?: string;
  seriesName?: string;
  cardmarket?: { prices?: { averageSellPrice?: number; trendPrice?: number; }; };
  pricing?: {
    cardmarket?: { avg?: number; trend?: number; low?: number; avg30?: number; "avg-holo"?: number; };
    tcgplayer?: { normal?: { marketPrice?: number; midPrice?: number }; reverse?: { marketPrice?: number }; holofoil?: { marketPrice?: number }; };
  };
  card_images?: { image_url: string }[];
  card_sets?: { set_name: string; set_code: string; set_rarity: string }[];
}

interface CardDetails {
  normalOwned: boolean;
  foilOwned: boolean;
  langs?: string[];
  isWishlist?: boolean;
}

type UserCollectionJSON = Record<string, CardDetails>;
type UserItemCollection = Record<string, { sealed: number; opened: number }>;

export default function PokedexPage() {
  const [currentTcg, setCurrentTcg] = useState<"pokemon" | "yugioh">("pokemon");

  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(POKEMON_BLOCKS[0].sets[0].id);
  
  const [currentView, setCurrentView] = useState<"EXTENSIONS" | "CARDS" | "ITEMS">("EXTENSIONS");
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);

  const [isGlobalBinder, setIsGlobalBinder] = useState<boolean>(false);
  const [binderViewStyle, setBinderViewStyle] = useState<"standard" | "pages">("standard");
  const [currentGlobalBinderPage, setCurrentGlobalBinderPage] = useState<number>(1);
  const [binderSelectedSeries, setBinderSelectedSeries] = useState<string>("ALL");

  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [selectedIllustrator, setSelectedIllustrator] = useState<string>("ALL");
  const [illustratorsList, setIllustratorsList] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");
  const [raritiesList, setRaritiesList] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");

  const [isProgressionOpen, setIsProgressionOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCollection, setUserCollection] = useState<UserCollectionJSON>({});
  const [userItemCollection, setUserItemCollection] = useState<UserItemCollection>({});
  
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const supabaseSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setCurrentUser(session?.user || null); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { setCurrentUser(session?.user || null); });
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => { authListener.subscription.unsubscribe(); window.removeEventListener("scroll", handleScroll); };
  }, []);

  useEffect(() => {
    async function loadCollection() {
      if (!currentUser) { setUserCollection({}); return; }
      const { data } = await supabase.from("user_data").select("collection").eq("id", currentUser.id).maybeSingle(); 
      if (data && data.collection) setUserCollection(data.collection);
      else { await supabase.from("user_data").upsert({ id: currentUser.id, collection: {} }); setUserCollection({}); }
    }
    loadCollection();
  }, [currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsGlobalBinder(false);
      setCurrentView("CARDS");
      setActiveSearch(searchInput.trim());
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleImageError = (cardId: string | number, currentImg: string) => {
    const stringId = String(cardId);
    if (failedImages[stringId]) return;
    const cardData = cards.find((c) => String(c.id) === stringId);
    if (!cardData) return;
    const targetSeriesId = isGlobalBinder ? stringId.split("-")[0] : selectedSeriesId;
    if (TCG_IO_ONLY_SETS.includes(targetSeriesId)) { setFailedImages((prev) => ({ ...prev, [stringId]: true })); return; }
    if (targetSeriesId.startsWith("me")) {
      if (!currentImg.includes("/en/")) {
        const englishUrl = `https://assets.tcgdex.net/en/${targetSeriesId}/${cardData.localId}/high.png`;
        setCards((prevCards) => prevCards.map((c) => (String(c.id) === stringId ? { ...c, image: englishUrl } : c)));
        return;
      }
    }
    setFailedImages((prev) => ({ ...prev, [stringId]: true }));
  };

  useEffect(() => {
    async function fetchCards() {
      setVisibleCount(40);
      setSelectedIllustrator("ALL");
      setSelectedRarity("ALL");
      setSelectedStatus("ALL");
      setSelectedLanguage("ALL");
      setCurrentGlobalBinderPage(1);
      setBinderSelectedSeries("ALL");
      setFailedImages({});
      setLoading(true);

      if (currentTcg === "yugioh") {
        try {
          const response = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php");
          if (!response.ok) throw new Error();
          const data = await response.json();
          if (data && Array.isArray(data.data)) {
            const formattedYgoCards = data.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              localId: c.id.toString(),
              image: c.card_images?.[0]?.image_url || "",
              rarity: c.card_sets?.[0]?.set_rarity || "Commune",
              seriesName: c.card_sets?.[0]?.set_name || "Extension Yu-Gi-Oh!",
              card_sets: c.card_sets,
            }));
            setCards(formattedYgoCards);
            extractFilters(formattedYgoCards);
          } else {
            setCards([]);
          }
        } catch {
          setCards([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (currentView !== "CARDS" && !isGlobalBinder && !activeSearch) {
        setLoading(false);
        return;
      }

      if (isGlobalBinder) {
        if (!currentUser) { setCards([]); setLoading(false); return; }
        const ownedCardIds = Object.keys(userCollection).filter((id) => userCollection[id]?.normalOwned || userCollection[id]?.foilOwned);
        if (ownedCardIds.length === 0) { setCards([]); setLoading(false); return; }

        const relevantSeries = ALL_FLAT_SERIES.filter((series: PokemonSet) => ownedCardIds.some((cardId) => cardId.startsWith(`${series.id}-`)));
        const cachedResults: Card[] = [];
        const missingSeries: PokemonSet[] = [];

        for (const series of relevantSeries) {
          const cacheKey = `pokedex_series_v4_${series.id}`;
          const seriesCards = await get<Card[]>(cacheKey);
          if (seriesCards && seriesCards.length > 0) {
            const owned = seriesCards.filter((c) => ownedCardIds.includes(String(c.id)));
            cachedResults.push(...owned);
          } else { missingSeries.push(series); }
        }

        if (cachedResults.length > 0) {
          setCards(cachedResults);
          extractFilters(cachedResults);
          if (missingSeries.length === 0) { setLoading(false); return; }
        }

        let currentLoadedCards = [...cachedResults];
        for (let i = 0; i < missingSeries.length; i += 4) {
          const chunk = missingSeries.slice(i, i + 4);
          const fetchedChunk = await Promise.all(
            chunk.map(async (series) => {
              const cacheKey = `pokedex_series_v4_${series.id}`;
              let seriesCards: Card[] = [];
              try {
                if (TCG_IO_ONLY_SETS.includes(series.id)) {
                  const apiCode = series.id === "hgss.p" ? "hsp" : series.id === "rumble" ? "ru1" : series.id;
                  const res = await fetch(`/api/pokemon?set=${apiCode}`);
                  if (res.ok) {
                    const json = await res.json();
                    if (json && Array.isArray(json.data)) {
                      seriesCards = json.data.map((c: any) => ({
                        id: `${series.id}-${c.number}`, name: c.name, localId: String(c.number || ""), image: c.images?.large || c.images?.small || "", illustrator: c.artist || "Inconnu", rarity: c.rarity || "Commune", seriesName: series.name, cardmarket: c.cardmarket,
                      }));
                      await set(cacheKey, seriesCards);
                    }
                  }
                } else {
                  const res = await fetch(`https://api.tcgdex.net/v2/${series.lang}/sets/${series.id}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.cards)) {
                      seriesCards = data.cards.map((c: any) => ({
                        id: c.id, name: c.name || "Inconnue", localId: String(c.localId || "?"), image: c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/${series.lang}/${series.id}/${c.localId}/high.png`, illustrator: "Inconnu", rarity: "Inconnue", seriesName: series.name,
                      }));
                      await set(cacheKey, seriesCards);
                    }
                  }
                }
              } catch (err) {}
              return seriesCards.filter((c) => ownedCardIds.includes(String(c.id)));
            })
          );
          const newCards = fetchedChunk.flat();
          if (newCards.length > 0) {
            currentLoadedCards = [...currentLoadedCards, ...newCards];
            setCards([...currentLoadedCards]);
            extractFilters(currentLoadedCards);
          }
        }
        setLoading(false);
        return;
      }

      if (activeSearch) {
        try {
          const response = await fetch(`https://api.tcgdex.net/v2/fr/cards?name=${encodeURIComponent(activeSearch)}`);
          if (!response.ok) throw new Error();
          const data = await response.json();
          if (Array.isArray(data)) {
            const formatted = await Promise.all(data.slice(0, 50).map(async (c: any) => {
              let imageUrl = c.image ? `${c.image}/high.png` : "";
              let illustrator = "Inconnu", rarity = "Inconnue", seriesName = "Série inconnue";
              try {
                const cardRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${c.id}`);
                const cardData = await cardRes.json();
                illustrator = cardData.illustrator || "Inconnu"; rarity = cardData.rarity || "Inconnue"; seriesName = cardData.set?.name || "Série inconnue";
                if (cardData.image) imageUrl = `${cardData.image}/high.png`;
              } catch {}
              return { id: c.id, name: c.name || "Inconnue", localId: String(c.localId || "?"), image: imageUrl, illustrator, rarity, seriesName };
            }));
            setCards(formatted);
            extractFilters(formatted);
          } else setCards([]);
        } catch { setCards([]); } finally { setLoading(false); }
        return;
      }

      const cacheKey = `pokedex_series_v4_${selectedSeriesId}`;
      const cachedData = await get<Card[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        setCards(cachedData);
        extractFilters(cachedData);
        setLoading(false);
        return;
      }

      try {
        if (TCG_IO_ONLY_SETS.includes(selectedSeriesId)) {
          const setMapCode: Record<string, string> = { dp1: "dp1", pgo: "pgo", rumble: "ru1", det1: "det1", "hgss.p": "hsp", mcd11: "mcd11", mcd12: "mcd12", mcd14: "mcd14", mcd15: "mcd15", mcd16: "mcd16", mcd17: "mcd17", mcd18: "mcd18", mcd19: "mcd19", mcd21: "mcd21", mcd22: "mcd22", "30c": "30c" };
          const apiCode = setMapCode[selectedSeriesId] || selectedSeriesId;
          const res = await fetch(`/api/pokemon?set=${apiCode}`);
          const json = await res.json();
          const currentSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === selectedSeriesId);
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            const formatted = json.data.map((c: any) => ({
              id: `${selectedSeriesId}-${c.number}`, name: c.name, localId: String(c.number || ""), image: c.images?.large || c.images?.small || "", illustrator: c.artist || "Inconnu", rarity: c.rarity || "Commune", seriesName: currentSeries?.name, cardmarket: c.cardmarket
            }));
            await set(cacheKey, formatted);
            setCards(formatted);
            extractFilters(formatted);
          } else { setCards([]); }
        } else {
          const currentSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === selectedSeriesId);
          const lang = currentSeries ? currentSeries.lang : "fr";
          const response = await fetch(`https://api.tcgdex.net/v2/${lang}/sets/${selectedSeriesId}`);
          if (!response.ok) { setCards([]); setLoading(false); return; }
          const data = await response.json();
          if (data && data.cards) {
            const formattedCards = data.cards.map((c: any) => ({
              id: c.id, name: c.name || "Inconnue", localId: String(c.localId || "?"), image: c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/${lang}/${selectedSeriesId}/${c.localId}/high.png`, illustrator: "Inconnu", rarity: "Inconnue", seriesName: currentSeries?.name
            }));
            await set(cacheKey, formattedCards);
            setCards(formattedCards);
            extractFilters(formattedCards);
          } else setCards([]);
        }
      } catch { setCards([]); } finally { setLoading(false); }
    }
    fetchCards();
  }, [selectedSeriesId, isGlobalBinder, activeSearch, currentUser, currentView, currentTcg]);

  const extractFilters = (cardList: Card[]) => {
    const illsets = new Set<string>();
    const raritiesSet = new Set<string>();
    cardList.forEach((c) => {
      if (c.illustrator && c.illustrator !== "Inconnu") illsets.add(c.illustrator);
      if (c.rarity && c.rarity !== "Inconnue") raritiesSet.add(c.rarity);
    });
    setIllustratorsList(Array.from(illsets).sort());
    setRaritiesList(Array.from(raritiesSet).sort());
  };

  const debouncedSupabaseSave = (newCollection: UserCollectionJSON) => {
    if (!currentUser) return;
    if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    supabaseSaveTimeoutRef.current = setTimeout(async () => { await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection }); }, 800);
  };

  const toggleCardOwnership = (id: string | number, type: "normal" | "foil", cardDefaultLang: string) => {
    if (!currentUser) return alert("Connecte-toi pour sauvegarder tes cartes !");
    const stringId = String(id);
    const newCollection = { ...userCollection };
    if (!newCollection[stringId]) newCollection[stringId] = { normalOwned: false, foilOwned: false, langs: [cardDefaultLang] };
    if (type === "normal") newCollection[stringId].normalOwned = !newCollection[stringId].normalOwned;
    else newCollection[stringId].foilOwned = !newCollection[stringId].foilOwned;
    if (!newCollection[stringId].normalOwned && !newCollection[stringId].foilOwned && !newCollection[stringId].isWishlist) delete newCollection[stringId];
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const toggleCardLanguage = (id: string | number, langToToggle: string, defaultLang: string) => {
    if (!currentUser) return;
    const stringId = String(id);
    const newCollection = { ...userCollection };
    if (!newCollection[stringId]) return;
    let currentLangs = newCollection[stringId].langs || [defaultLang];
    if (currentLangs.includes(langToToggle)) {
      currentLangs = currentLangs.filter((l) => l !== langToToggle);
      if (currentLangs.length === 0) currentLangs = [defaultLang];
    } else { currentLangs.push(langToToggle); }
    newCollection[stringId].langs = currentLangs;
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const toggleWishlist = (id: string | number) => {
    if (!currentUser) return alert("Connecte-toi pour gérer ta wishlist !");
    const stringId = String(id);
    const newCollection = { ...userCollection };
    if (!newCollection[stringId]) newCollection[stringId] = { normalOwned: false, foilOwned: false, isWishlist: true };
    else newCollection[stringId].isWishlist = !newCollection[stringId].isWishlist;
    if (!newCollection[stringId].normalOwned && !newCollection[stringId].foilOwned && !newCollection[stringId].isWishlist) delete newCollection[stringId];
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const updateItemCount = (itemId: string, type: "sealed" | "opened", change: number) => {
    setUserItemCollection(prev => {
      const current = prev[itemId] || { sealed: 0, opened: 0 };
      const newValue = Math.max(0, current[type] + change);
      return { ...prev, [itemId]: { ...current, [type]: newValue } };
    });
  };

  const uniqueCardsCount = useMemo(() => {
    return Object.values(userCollection).filter(c => c.normalOwned || c.foilOwned).length;
  }, [userCollection]);

  const uniqueCollectedCount = useMemo(() => {
    return cards.filter((c) => {
      const cardData = userCollection[String(c.id)];
      return cardData?.normalOwned || cardData?.foilOwned;
    }).length;
  }, [cards, userCollection]);

  const filteredCards = cards.filter((card) => {
    if (isGlobalBinder && binderSelectedSeries !== "ALL") {
      const cardSeriesId = String(card.id).split("-")[0];
      if (cardSeriesId !== binderSelectedSeries) return false;
    }
    const matchIllustrator = selectedIllustrator === "ALL" || card.illustrator === selectedIllustrator;
    const matchRarity = selectedRarity === "ALL" || card.rarity === selectedRarity;
    const cardData = userCollection[String(card.id)];
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
  const currentBlock = POKEMON_BLOCKS[selectedBlockIndex];
  const currentSeriesObj = ALL_FLAT_SERIES.find(s => s.id === selectedSeriesId);
  
  const itemsPerGlobalPage = 9;
  const totalGlobalPages = Math.ceil(filteredCards.length / itemsPerGlobalPage) || 1;

  const displayedCards = useMemo(() => {
    if (isGlobalBinder && binderViewStyle === "pages") {
      return filteredCards.slice((currentGlobalBinderPage - 1) * itemsPerGlobalPage, currentGlobalBinderPage * itemsPerGlobalPage);
    }
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, isGlobalBinder, binderViewStyle, currentGlobalBinderPage, visibleCount]);

  useEffect(() => {
    if (isGlobalBinder && binderViewStyle === "pages") return;
    if (visibleCount >= filteredCards.length) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((prev) => Math.min(prev + 40, filteredCards.length)); },
      { rootMargin: "250px" }
    );
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [visibleCount, filteredCards.length, isGlobalBinder, binderViewStyle]);

  const ITEM_TYPES = ["ETB", "DISPLAY", "BOOSTER", "COFFRET", "POKÉBOX", "DECK", "TRIPACK", "AUTRE"];

  return (
    <main className="min-h-screen bg-[#09090B] text-white relative flex flex-col font-sans pb-12 font-['Outfit'] overflow-x-hidden">
      
      <CardZoomModal
        card={zoomedCard ? { ...zoomedCard, id: String(zoomedCard.id), localId: zoomedCard.localId || "" } : null}
        onClose={() => setZoomedCard(null)}
        isNormalOwned={Boolean(zoomedCard && userCollection[String(zoomedCard.id)]?.normalOwned)}
        isFoilOwned={Boolean(zoomedCard && userCollection[String(zoomedCard.id)]?.foilOwned)}
        onToggleOwnership={(id, type) => {
          const sLang = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === selectedSeriesId)?.lang || "fr";
          toggleCardOwnership(id, type, sLang);
        }}
        seriesId={selectedSeriesId}
      />

      {/* SIDEBAR MOBILE */}
      <div className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`relative w-4/5 max-w-[320px] bg-[#18181B] border-r border-white/10 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 ease-out overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-rose-500">MENU</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-white text-2xl">X</button>
            </div>
            <div className="space-y-4">
              <button onClick={() => { setIsProgressionOpen(true); setIsSidebarOpen(false); }} className="w-full text-left bg-[#09090B] hover:bg-white/5 border border-white/10 p-4 rounded-xl text-[15px] transition">Progression & Master Sets</button>
              <button 
                onClick={() => { 
                  setIsGlobalBinder(true); 
                  setCurrentView("CARDS"); 
                  setActiveSearch(""); 
                  setIsSidebarOpen(false); 
                }} 
                className="w-full text-left bg-[#09090B] hover:bg-white/5 border border-white/10 p-4 rounded-xl text-[15px] transition"
              >
                Ma Collection
              </button>
              <Link href="/wishlist" className="w-full block bg-[#09090B] hover:bg-white/5 border border-white/10 p-4 rounded-xl text-[15px] transition">Wishlist</Link>
              <Link href="/statistiques" className="w-full block bg-[#09090B] hover:bg-white/5 border border-white/10 p-4 rounded-xl text-[15px] transition">Statistiques</Link>
            </div>
          </div>
        </div>
      </div>

      {isProgressionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsProgressionOpen(false)}></div>
          <div className="relative bg-[#18181B] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 md:p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h2 className="text-xl font-bold text-white">Progression</h2>
              <button onClick={() => setIsProgressionOpen(false)} className="text-zinc-400 hover:text-white text-2xl">X</button>
            </div>
            <div className="space-y-4">
              {POKEMON_BLOCKS.map((block: PokemonBlock, index: number) => (
                <div key={block.blockName} className="bg-[#09090B] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3">{block.blockName}</h3>
                  <div className="space-y-2">
                    {block.sets.map((set: PokemonSet) => (
                      <div key={set.id} className="flex justify-between items-center text-sm bg-[#18181B] p-3 rounded-xl border border-white/5">
                        <span className="text-zinc-300 truncate mr-2">{set.name}</span>
                        <button onClick={() => { setSelectedBlockIndex(POKEMON_BLOCKS.findIndex((b: PokemonBlock) => b.blockName === block.blockName)); setSelectedSeriesId(set.id); setIsGlobalBinder(false); setActiveSearch(""); setIsProgressionOpen(false); }} className="bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg transition hover:bg-rose-500 hover:text-white shrink-0">
                          Ouvrir
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

      <Header 
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearchSubmit={handleSearchSubmit}
        isGlobalBinder={isGlobalBinder}
        setIsGlobalBinder={(val) => {
          setIsGlobalBinder(val);
          if (val) {
            setCurrentView("CARDS");
            setActiveSearch("");
          }
        }}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        currentView={currentView}
        onGoToExtensions={() => {
          setIsGlobalBinder(false);
          setActiveSearch("");
          setCurrentView("EXTENSIONS");
        }}
        onGoToItems={() => {
          setIsGlobalBinder(false);
          setActiveSearch("");
          const currentBlockName = POKEMON_BLOCKS[selectedBlockIndex]?.blockName.toUpperCase() || "";
          if (currentBlockName.includes("PROMO")) {
            const firstNormalBlockIndex = POKEMON_BLOCKS.findIndex(b => !b.blockName.toUpperCase().includes("PROMO"));
            if (firstNormalBlockIndex !== -1) {
              setSelectedBlockIndex(firstNormalBlockIndex);
              setSelectedSeriesId(POKEMON_BLOCKS[firstNormalBlockIndex].sets[0].id);
            }
          }
          setCurrentView("ITEMS");
          setSelectedItemType(null);
        }}
        currentTcg={currentTcg}
        onToggleTcg={(tcg) => {
          setCurrentTcg(tcg);
          setIsGlobalBinder(false);
          setCurrentView("EXTENSIONS");
          setActiveSearch("");
        }}
      />

      <div className="max-w-[1260px] mx-auto w-full px-4 md:px-8 lg:px-0 pt-6 md:pt-10 flex flex-col gap-6">
        
        {currentTcg === "yugioh" ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="w-full bg-[#18181B] rounded-2xl md:rounded-[24px] border border-white/10 p-5 md:p-8 flex flex-col justify-between items-start">
              <h1 className="text-white text-3xl md:text-[40px] font-normal leading-tight">Catalogue Yu-Gi-Oh!</h1>
              <p className="text-zinc-500 text-base md:text-lg mt-1">Explore toutes les cartes Yu-Gi-Oh! disponibles</p>
            </div>

            {loading ? (
              <CardSkeleton count={10} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {displayedCards.map((card) => (
                  <CardItem 
                    key={card.id} 
                    card={{ ...card, id: String(card.id), localId: card.localId || "" }} 
                    cardData={userCollection[String(card.id)]} 
                    isGlobalBinder={isGlobalBinder} 
                    cardDefaultLang="fr" 
                    hasImageError={Boolean(failedImages[String(card.id)])} 
                    onImageError={handleImageError} 
                    onZoom={(c) => setZoomedCard(c as Card)} 
                    onToggleWishlist={toggleWishlist} 
                    onToggleOwnership={toggleCardOwnership} 
                    onToggleLanguage={toggleCardLanguage} 
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {currentView === "EXTENSIONS" && !activeSearch && !isGlobalBinder && (
              <div className="w-full flex flex-col animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
                  <div>
                    <h1 className="text-white text-3xl md:text-[40px] font-normal leading-tight">Toutes Les Extensions</h1>
                    <p className="text-zinc-500 text-base md:text-lg mt-1">Gérer votre collection a travers les différentes ères</p>
                  </div>
                  <div className="flex bg-[#18181B] border border-white/10 rounded-2xl p-4 gap-4 md:gap-6 w-full md:w-auto shrink-0 justify-around md:justify-start">
                    <div className="flex flex-col items-center px-2 md:px-4 border-r border-white/10 w-1/2 md:w-auto">
                      <span className="text-white text-xs md:text-sm mb-1 font-medium text-center">Séries Complétées</span>
                      <span className="text-zinc-400 text-sm">0/{ALL_FLAT_SERIES.length}</span>
                    </div>
                    <div className="flex flex-col items-center px-2 md:px-4 w-1/2 md:w-auto">
                      <span className="text-white text-xs md:text-sm mb-1 font-medium text-center">Cartes Uniques :</span>
                      <span className="text-rose-500 text-base">{uniqueCardsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-8 md:mb-12">
                  {POKEMON_BLOCKS.map((block, index) => (
                    <button
                      key={block.blockName}
                      onClick={() => setSelectedBlockIndex(index)}
                      className={`py-3 md:py-3.5 px-2 rounded-xl text-center text-xs md:text-sm font-normal transition-all duration-300 ${
                        selectedBlockIndex === index 
                          ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-[1.02] md:scale-105" 
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40"
                      }`}
                    >
                      {block.blockName}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                  {currentBlock.sets.map((set) => (
                    <div
                      key={set.id}
                      onClick={() => {
                        setSelectedSeriesId(set.id);
                        setCurrentView("CARDS");
                        setActiveSearch("");
                      }}
                      className="bg-[#18181B] border border-white/10 rounded-2xl md:rounded-[24px] p-3 md:p-4 flex flex-col items-center justify-between cursor-pointer hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300 aspect-[4/3] group"
                    >
                      <span className="text-zinc-400 text-[11px] md:text-sm mb-2 md:mb-3 text-center w-full truncate px-1">{set.name}</span>
                      <div className="flex-1 w-full relative flex items-center justify-center p-1 md:p-2">
                        <img 
                          src={`/logos/${set.id}.png`} 
                          alt={set.name} 
                          className="max-w-[85%] max-h-[85%] object-contain group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="hidden flex-col items-center text-center w-full h-full justify-center">
                          <span className="text-yellow-500 text-xs md:text-sm font-bold mb-1">En travaux</span>
                          <span className="text-[9px] md:text-[10px] text-zinc-500 leading-tight">Charpenti transporte <br/> des poutres...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === "CARDS" && (
              <div className="flex flex-col gap-4 md:gap-6 animate-fade-in">
                
                {isGlobalBinder && (
                  <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
                    <div>
                      <h1 className="text-white text-3xl md:text-[40px] font-normal leading-tight">Ma Collection</h1>
                      <p className="text-zinc-500 text-base md:text-lg mt-1">Toutes les cartes que tu possèdes</p>
                    </div>
                  </div>
                )}

                {(!isGlobalBinder && !activeSearch) && (
                  <div className="w-full bg-[#18181B] rounded-2xl md:rounded-[24px] border border-white/10 p-5 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center mt-2 gap-6">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full">
                      <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <div 
                          className="w-12 h-12 md:w-14 md:h-14 bg-[#09090B] border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition group shrink-0" 
                          onClick={() => { setCurrentView("EXTENSIONS"); setActiveSearch(""); }}
                        >
                          <span className="text-white text-lg md:text-xl group-hover:-translate-x-1 transition-transform">&larr;</span>
                        </div>
                        <div className="w-20 h-11 md:w-[122px] md:h-[67px] relative flex items-center justify-center shrink-0 bg-white/5 rounded-lg md:bg-transparent">
                          <img src={`/logos/${currentSeriesObj?.id}.png`} alt={currentSeriesObj?.name} className="max-w-[90%] max-h-[90%] object-contain drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-white text-xl md:text-3xl font-normal leading-tight">{currentSeriesObj?.name || "Série Inconnue"}</h1>
                        <p className="text-neutral-500 text-sm md:text-xl font-normal mt-1">Sortie : {(currentSeriesObj as any)?.releaseDate || "Inconnue"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 w-full xl:w-auto xl:justify-end">
                      <div className="flex flex-col items-end gap-1.5 md:gap-2 w-full sm:w-64 md:w-72">
                        <span className="text-white text-lg md:text-xl font-normal tracking-wide">{uniqueCollectedCount} / {totalCards || 0}</span>
                        <div className="w-full h-1.5 md:h-2 bg-white rounded-full overflow-hidden shadow-inner">
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${totalCards > 0 ? (uniqueCollectedCount / totalCards) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      <button onClick={() => alert("Fonctionnalité Wishlist globale à venir !")} className="w-full sm:w-auto bg-rose-500 text-white text-base md:text-xl font-normal px-6 py-2.5 md:px-8 md:py-3 rounded-full outline outline-1 outline-white/10 hover:bg-rose-600 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] flex justify-center items-center gap-2">
                        Wishlist
                      </button>
                    </div>
                  </div>
                )}

                {(!isGlobalBinder) && (
                  <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-5 mt-2 md:mt-4 mb-2 md:mb-4">
                    <div className="relative group shrink-0 w-full sm:w-auto">
                      <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full sm:w-auto appearance-none bg-rose-500 hover:bg-rose-600 text-white text-base md:text-xl font-normal px-6 md:px-8 py-3 md:py-3 pr-12 rounded-full outline outline-1 outline-white/10 cursor-pointer transition-colors shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                        <option value="ALL">Trier par</option>
                        <option value="MISSING">Manquantes</option>
                        <option value="NORMAL">Possédées (Normal)</option>
                        <option value="FOIL">Possédées (Foil)</option>
                      </select>
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white text-lg md:text-xl">&or;</span>
                    </div>
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative h-[48px] md:h-[52px] w-full">
                      <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={`Rechercher dans ${currentSeriesObj?.name || "..."}...`} className="w-full h-full bg-[#18181B] border border-white/10 rounded-full pl-6 md:pl-8 pr-12 md:pr-14 py-2 md:py-3.5 text-neutral-400 text-sm md:text-[16px] font-normal outline-none focus:border-rose-500 transition-colors" />
                      <button type="submit" className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white hover:text-rose-400 transition-colors">
                        <svg width="20" height="20" className="md:w-[22px] md:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </button>
                    </form>
                  </div>
                )}

                {loading && cards.length === 0 ? (
                  <CardSkeleton count={10} />
                ) : !loading && isGlobalBinder && cards.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center bg-[#18181B] border border-white/10 rounded-2xl md:rounded-[24px] p-10 md:p-16 mt-4 shadow-2xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">Ta collection est vide !</h2>
                    <p className="text-zinc-400 text-center max-w-lg mb-8">
                      Tu n'as encore ajouté aucune carte à ta collection. Retourne dans les extensions, ouvre une série et clique sur les cartes que tu possèdes pour les ajouter !
                    </p>
                    <button 
                      onClick={() => { 
                        setIsGlobalBinder(false); 
                        setCurrentView("EXTENSIONS"); 
                      }} 
                      className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full font-medium transition shadow-[0_0_20px_rgba(244,63,94,0.4)] text-lg"
                    >
                      Découvrir les cartes
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                      {displayedCards.map((card) => {
                        const cardSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === (isGlobalBinder ? String(card.id).split("-")[0] : selectedSeriesId));
                        return <CardItem key={card.id} card={{ ...card, id: String(card.id), localId: card.localId || "" }} cardData={userCollection[String(card.id)]} isGlobalBinder={isGlobalBinder} cardDefaultLang={cardSeries?.lang || "fr"} hasImageError={Boolean(failedImages[String(card.id)])} onImageError={handleImageError} onZoom={(c) => setZoomedCard(c as Card)} onToggleWishlist={toggleWishlist} onToggleOwnership={toggleCardOwnership} onToggleLanguage={toggleCardLanguage} />;
                      })}
                    </div>
                    
                    {visibleCount < filteredCards.length && (
                      <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center mt-8">
                        <span className="text-zinc-500 animate-pulse text-sm">Chargement de la suite...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentView === "ITEMS" && !isGlobalBinder && (
              <div className="flex flex-col gap-4 md:gap-6 animate-fade-in">
                {!selectedItemType ? (
                  <>
                    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-4">
                      <div>
                        <h1 className="text-white text-3xl md:text-[40px] font-normal leading-tight">Tous Les Items</h1>
                        <p className="text-zinc-500 text-base md:text-lg mt-1">Explorez votre collection scellée par type</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12">
                      {ITEM_TYPES.map((type) => {
                        const itemsOfType = POKEMON_ITEMS.filter(i => i.type === type);
                        const count = itemsOfType.length;
                        const coverImage = itemsOfType.length > 0 ? itemsOfType[0].image : null;

                        return (
                          <div
                            key={type}
                            onClick={() => setSelectedItemType(type)}
                            className="bg-[#18181B] border border-white/10 rounded-2xl md:rounded-[24px] p-4 md:p-5 flex flex-col items-center justify-between cursor-pointer hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300 aspect-[4/3] group relative"
                          >
                             <div className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 mb-2 md:mb-3">
                               {coverImage ? (
                                 <img src={coverImage} alt={type} className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                               ) : (
                                 <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-white/5 rounded-xl md:rounded-2xl bg-[#09090B]"></div>
                               )}
                             </div>
                             <div className="flex flex-col items-center shrink-0">
                               <h2 className="text-white text-base md:text-xl font-bold mb-0.5 tracking-wide relative z-10 text-center">{type}</h2>
                               <span className="text-zinc-500 text-[11px] md:text-sm font-medium relative z-10">{count} produit{count > 1 ? "s" : ""}</span>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full bg-[#18181B] rounded-2xl md:rounded-[24px] border border-white/10 p-5 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      <div 
                        className="w-12 h-12 md:w-14 md:h-14 bg-[#09090B] border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition group shrink-0" 
                        onClick={() => setSelectedItemType(null)}
                      >
                        <span className="text-white text-lg md:text-xl group-hover:-translate-x-1 transition-transform">&larr;</span>
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-white text-2xl md:text-3xl font-normal">Catégorie : {selectedItemType}</h1>
                        <p className="text-neutral-500 text-sm md:text-xl font-normal mt-1">Gérez vos produits de type {selectedItemType}</p>
                      </div>
                    </div>
                    
                    {(() => {
                      const itemsOfType = POKEMON_ITEMS.filter(item => item.type === selectedItemType);
                      if (itemsOfType.length === 0) {
                         return (
                           <div className="text-center bg-[#18181B] border border-white/10 rounded-2xl md:rounded-[24px] p-8 md:p-12 mt-4">
                             <p className="text-zinc-400 text-base md:text-lg">Aucun item de ce type répertorié pour l'instant.</p>
                           </div>
                         )
                      }
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-2 md:mt-4">
                          {itemsOfType.map(item => {
                             const itemSeries = ALL_FLAT_SERIES.find(s => s.id === item.seriesId);
                             const data = userItemCollection[item.id] || { sealed: 0, opened: 0 };
                             return (
                                <div key={item.id} className="bg-[#18181B] border border-white/10 rounded-2xl md:rounded-[24px] p-5 md:p-6 flex flex-col justify-between hover:border-rose-500/30 transition-colors">
                                  <div className="flex justify-between items-start mb-4">
                                    <span className="bg-[#09090B] text-rose-400 border border-white/10 px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold tracking-wider max-w-[150px] md:max-w-[180px] truncate">
                                      {itemSeries?.name || item.seriesId}
                                    </span>
                                  </div>
                                  
                                  <div className="h-40 md:h-48 w-full flex items-center justify-center mb-5 md:mb-6">
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-105" 
                                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/200x200/09090b/4b5563?text=Image+Manquante"; }} 
                                    />
                                  </div>

                                  <h3 className="text-white text-base md:text-lg font-medium leading-tight mb-5 md:mb-6 h-10 md:h-12 line-clamp-2">{item.name}</h3>

                                  <div className="flex flex-col gap-2 md:gap-3">
                                    <div className="flex items-center justify-between bg-[#09090B] border border-white/10 p-2.5 md:p-3 rounded-xl">
                                      <span className="text-zinc-400 text-xs md:text-sm">Scellées</span>
                                      <div className="flex items-center gap-2 md:gap-3">
                                        <button onClick={() => updateItemCount(item.id, "sealed", -1)} className="text-zinc-500 hover:text-white text-lg md:text-xl px-2">-</button>
                                        <span className="text-white font-medium w-4 text-center">{data.sealed}</span>
                                        <button onClick={() => updateItemCount(item.id, "sealed", 1)} className="text-zinc-500 hover:text-white text-lg md:text-xl px-2">+</button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#09090B] border border-white/10 p-2.5 md:p-3 rounded-xl">
                                      <span className="text-zinc-400 text-xs md:text-sm">Ouvertes</span>
                                      <div className="flex items-center gap-2 md:gap-3">
                                        <button onClick={() => updateItemCount(item.id, "opened", -1)} className="text-zinc-500 hover:text-white text-lg md:text-xl px-2">-</button>
                                        <span className="text-white font-medium w-4 text-center">{data.opened}</span>
                                        <button onClick={() => updateItemCount(item.id, "opened", 1)} className="text-zinc-500 hover:text-white text-lg md:text-xl px-2">+</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                             )
                          })}
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {showScrollTop && (
          <button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-rose-500 hover:bg-rose-400 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center text-lg md:text-xl transition cursor-pointer">&uarr;</button>
        )}
      </div>
    </main>
  );
}