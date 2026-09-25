"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { get, set } from "idb-keyval";
import { supabase } from "../lib/supabase";
import { POKEMON_BLOCKS, ALL_FLAT_SERIES, TCG_IO_ONLY_SETS, PokemonSet, PokemonBlock } from "../constants/pokemonSets";
import CardZoomModal from "../components/CardZoomModal";
import CardSkeleton from "../components/CardSkeleton";
import CardItem from "../components/CardItem";
import Header from "../components/Header";

interface Card {
  id: string;
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
}

interface CardDetails {
  normalOwned: boolean;
  foilOwned: boolean;
  langs?: string[];
  isWishlist?: boolean;
}

type UserCollectionJSON = Record<string, CardDetails>;

export default function PokedexPage() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(POKEMON_BLOCKS[0].sets[0].id);
  
  const [showExtensionMenu, setShowExtensionMenu] = useState<boolean>(true);

  const [isGlobalBinder, setIsGlobalBinder] = useState<boolean>(false);
  const [binderViewStyle, setBinderViewStyle] = useState<"standard" | "pages">("pages");
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
  
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const [isCalculatingCost, setIsCalculatingCost] = useState<boolean>(false);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [costProgress, setCostProgress] = useState<string>("");

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

  useEffect(() => {
    setCalculatedCost(null);
    setCostProgress("");
  }, [selectedSeriesId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsGlobalBinder(false);
      setShowExtensionMenu(false);
      setActiveSearch(searchInput.trim());
    }
  };

  const handleBackToSeries = () => {
    setIsGlobalBinder(false);
    setActiveSearch("");
    setSearchInput("");
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleImageError = (cardId: string, currentImg: string) => {
    if (failedImages[cardId]) return;
    const cardData = cards.find((c) => c.id === cardId);
    if (!cardData) return;
    const targetSeriesId = isGlobalBinder ? cardId.split("-")[0] : selectedSeriesId;
    if (TCG_IO_ONLY_SETS.includes(targetSeriesId)) { setFailedImages((prev) => ({ ...prev, [cardId]: true })); return; }
    if (targetSeriesId.startsWith("me")) {
      if (!currentImg.includes("/en/")) {
        const englishUrl = `https://assets.tcgdex.net/en/${targetSeriesId}/${cardData.localId}/high.png`;
        setCards((prevCards) => prevCards.map((c) => (c.id === cardId ? { ...c, image: englishUrl } : c)));
        return;
      }
    }
    setFailedImages((prev) => ({ ...prev, [cardId]: true }));
  };

  useEffect(() => {
    if (showExtensionMenu && !isGlobalBinder && !activeSearch) return;

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
            const owned = seriesCards.filter((c) => ownedCardIds.includes(c.id));
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
                        id: `${series.id}-${c.number}`, name: c.name, localId: c.number, image: c.images?.large || c.images?.small || "", illustrator: c.artist || "Inconnu", rarity: c.rarity || "Commune", seriesName: series.name, cardmarket: c.cardmarket,
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
                        id: c.id, name: c.name || "Inconnue", localId: c.localId || "?", image: c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/${series.lang}/${series.id}/${c.localId}/high.png`, illustrator: "Inconnu", rarity: "Inconnue", seriesName: series.name,
                      }));
                      await set(cacheKey, seriesCards);
                    }
                  }
                }
              } catch (err) {}
              return seriesCards.filter((c) => ownedCardIds.includes(c.id));
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
              return { id: c.id, name: c.name || "Inconnue", localId: c.localId || "?", image: imageUrl, illustrator, rarity, seriesName };
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
              id: `${selectedSeriesId}-${c.number}`, name: c.name, localId: c.number, image: c.images?.large || c.images?.small || "", illustrator: c.artist || "Inconnu", rarity: c.rarity || "Commune", seriesName: currentSeries?.name, cardmarket: c.cardmarket
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
              id: c.id, name: c.name || "Inconnue", localId: c.localId || "?", image: c.image ? `${c.image}/high.png` : `https://assets.tcgdex.net/${lang}/${selectedSeriesId}/${c.localId}/high.png`, illustrator: "Inconnu", rarity: "Inconnue", seriesName: currentSeries?.name
            }));
            await set(cacheKey, formattedCards);
            setCards(formattedCards);
            extractFilters(formattedCards);
          } else setCards([]);
        }
      } catch { setCards([]); } finally { setLoading(false); }
    }
    fetchCards();
  }, [selectedSeriesId, isGlobalBinder, activeSearch, currentUser, showExtensionMenu]);

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

  const toggleCardOwnership = (id: string, type: "normal" | "foil", cardDefaultLang: string) => {
    if (!currentUser) return alert("Connecte-toi pour sauvegarder tes cartes !");
    const newCollection = { ...userCollection };
    if (!newCollection[id]) newCollection[id] = { normalOwned: false, foilOwned: false, langs: [cardDefaultLang] };
    if (type === "normal") newCollection[id].normalOwned = !newCollection[id].normalOwned;
    else newCollection[id].foilOwned = !newCollection[id].foilOwned;
    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned && !newCollection[id].isWishlist) delete newCollection[id];
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const toggleCardLanguage = (id: string, langToToggle: string, defaultLang: string) => {
    if (!currentUser) return;
    const newCollection = { ...userCollection };
    if (!newCollection[id]) return;
    let currentLangs = newCollection[id].langs || [defaultLang];
    if (currentLangs.includes(langToToggle)) {
      currentLangs = currentLangs.filter((l) => l !== langToToggle);
      if (currentLangs.length === 0) currentLangs = [defaultLang];
    } else { currentLangs.push(langToToggle); }
    newCollection[id].langs = currentLangs;
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const toggleWishlist = (id: string) => {
    if (!currentUser) return alert("Connecte-toi pour gérer ta wishlist !");
    const newCollection = { ...userCollection };
    if (!newCollection[id]) newCollection[id] = { normalOwned: false, foilOwned: false, isWishlist: true };
    else newCollection[id].isWishlist = !newCollection[id].isWishlist;
    if (!newCollection[id].normalOwned && !newCollection[id].foilOwned && !newCollection[id].isWishlist) delete newCollection[id];
    setUserCollection(newCollection);
    debouncedSupabaseSave(newCollection);
  };

  const calculateRealMissingCost = async () => {
    if (cards.length === 0 || isCalculatingCost) return;
    const missingCards = cards.filter((c) => { const cData = userCollection[c.id]; return !cData?.normalOwned && !cData?.foilOwned; });
    if (missingCards.length === 0) { setCalculatedCost(0); return; }
    setIsCalculatingCost(true);
    let totalCost = 0;
    const currentSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === selectedSeriesId);
    const lang = currentSeries?.lang || "fr";

    for (let i = 0; i < missingCards.length; i += 6) {
      const chunk = missingCards.slice(i, i + 6);
      const prices = await Promise.all(
        chunk.map(async (card) => {
          const cacheKey = `tcgdex_real_price_${card.id}`;
          const cached = await get<number>(cacheKey);
          if (cached !== undefined && cached !== null) return cached;
          try {
            const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${card.id}`);
            if (!res.ok) return 0;
            const data = await res.json();
            const cm = data?.pricing?.cardmarket;
            const tcg = data?.pricing?.tcgplayer;
            let cardPrice = 0;
            if (cm) cardPrice = cm.avg || cm.trend || cm.avg30 || cm.low || cm["avg-holo"] || 0;
            if (cardPrice <= 0 && tcg) {
              const usd = tcg.normal?.marketPrice || tcg.normal?.midPrice || tcg.reverse?.marketPrice || tcg.holofoil?.marketPrice || 0;
              cardPrice = (usd || 0) * 0.92;
            }
            const finalPrice = Math.max(0, parseFloat(cardPrice.toFixed(2)));
            await set(cacheKey, finalPrice);
            return finalPrice;
          } catch (e) { return 0; }
        })
      );
      totalCost += prices.reduce((acc, p) => acc + p, 0);
    }
    setCalculatedCost(totalCost);
    setIsCalculatingCost(false);
  };

  const ownedSeriesList = useMemo(() => {
    if (!isGlobalBinder || cards.length === 0) return [];
    const setIds = new Set<string>();
    cards.forEach((c) => { const sId = c.id.split("-")[0]; if (sId) setIds.add(sId); });
    return ALL_FLAT_SERIES.filter((s: PokemonSet) => setIds.has(s.id));
  }, [isGlobalBinder, cards]);

  const uniqueCardsCount = useMemo(() => {
    return Object.values(userCollection).filter(c => c.normalOwned || c.foilOwned).length;
  }, [userCollection]);

  const filteredCards = cards.filter((card) => {
    if (isGlobalBinder && binderSelectedSeries !== "ALL") {
      const cardSeriesId = card.id.split("-")[0];
      if (cardSeriesId !== binderSelectedSeries) return false;
    }
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
  const normalCollected = cards.filter((c) => userCollection[c.id]?.normalOwned).length;
  const foilCollected = cards.filter((c) => userCollection[c.id]?.foilOwned).length;
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

  return (
    <main className="min-h-screen bg-[#09090B] text-white relative flex flex-col font-sans pb-12 font-['Outfit']">
      
      <CardZoomModal
        card={zoomedCard}
        onClose={() => setZoomedCard(null)}
        isNormalOwned={Boolean(zoomedCard && userCollection[zoomedCard.id]?.normalOwned)}
        isFoilOwned={Boolean(zoomedCard && userCollection[zoomedCard.id]?.foilOwned)}
        onToggleOwnership={(id, type) => {
          const sLang = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === selectedSeriesId)?.lang || "fr";
          toggleCardOwnership(id, type, sLang);
        }}
        seriesId={selectedSeriesId}
      />

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`relative w-80 bg-[#18181B] border-r border-white/10 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 ease-out overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-rose-500">MENU</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <button onClick={() => { setIsProgressionOpen(true); setIsSidebarOpen(false); }} className="w-full text-left bg-[#09090B] hover:bg-white/5 border border-white/10 p-3.5 rounded-xl text-sm transition">👑 Progression & Master Sets</button>
              <button onClick={() => { setIsGlobalBinder(true); setActiveSearch(""); setIsSidebarOpen(false); }} className="w-full text-left bg-[#09090B] hover:bg-white/5 border border-white/10 p-3.5 rounded-xl text-sm transition">✨ Ma Collection</button>
              <Link href="/wishlist" className="w-full block bg-[#09090B] hover:bg-white/5 border border-white/10 p-3.5 rounded-xl text-sm transition">❤️ Wishlist</Link>
              <Link href="/statistiques" className="w-full block bg-[#09090B] hover:bg-white/5 border border-white/10 p-3.5 rounded-xl text-sm transition">📈 Statistiques</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Progression */}
      {isProgressionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsProgressionOpen(false)}></div>
          <div className="relative bg-[#18181B] border border-white/10 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h2 className="text-xl font-bold text-white">Progression</h2>
              <button onClick={() => setIsProgressionOpen(false)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              {POKEMON_BLOCKS.map((block: PokemonBlock, index: number) => (
                <div key={block.blockName} className="bg-[#09090B] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3">{block.blockName}</h3>
                  <div className="space-y-2">
                    {block.sets.map((set: PokemonSet) => (
                      <div key={set.id} className="flex justify-between items-center text-sm bg-[#18181B] p-3 rounded-xl border border-white/5">
                        <span className="text-zinc-300">{set.name}</span>
                        <button onClick={() => { setSelectedBlockIndex(POKEMON_BLOCKS.findIndex((b: PokemonBlock) => b.blockName === block.blockName)); setSelectedSeriesId(set.id); setIsGlobalBinder(false); setActiveSearch(""); setIsProgressionOpen(false); }} className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-lg transition hover:bg-rose-500 hover:text-white">
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
        setIsGlobalBinder={setIsGlobalBinder}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onGoToExtensions={() => {
          setIsGlobalBinder(false);
          setActiveSearch("");
          setShowExtensionMenu(true);
        }}
      />

      <div className="max-w-[1260px] mx-auto w-full px-6 md:px-0 pt-10 flex flex-col gap-6">
        
        {/* VUE 1 : MENU DES EXTENSIONS */}
        {showExtensionMenu && !activeSearch && !isGlobalBinder ? (
          <div className="w-full flex flex-col animate-fade-in">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
              <div>
                <h1 className="text-white text-[32px] md:text-[40px] font-normal leading-tight">Toutes Les Extensions</h1>
                <p className="text-zinc-500 text-lg mt-1">Gérer votre collection a travers les différentes ères de Pokémon</p>
              </div>
              <div className="flex bg-[#18181B] border border-white/10 rounded-2xl p-4 gap-6 shrink-0">
                <div className="flex flex-col items-center px-4 border-r border-white/10">
                  <span className="text-white text-sm mb-1 font-medium">Séries Complétées</span>
                  <span className="text-zinc-400 text-sm">0/{ALL_FLAT_SERIES.length}</span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-white text-sm mb-1 font-medium">Cartes Uniques :</span>
                  <span className="text-rose-500 text-base">{uniqueCardsCount}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
              {POKEMON_BLOCKS.map((block, index) => (
                <button
                  key={block.blockName}
                  onClick={() => setSelectedBlockIndex(index)}
                  className={`py-3.5 px-2 rounded-xl text-center text-sm font-normal transition-all duration-300 ${
                    selectedBlockIndex === index 
                      ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105" 
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40"
                  }`}
                >
                  {block.blockName}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {currentBlock.sets.map((set) => (
                <div
                  key={set.id}
                  onClick={() => {
                    setSelectedSeriesId(set.id);
                    setShowExtensionMenu(false);
                    setActiveSearch("");
                  }}
                  className="bg-[#18181B] border border-white/10 rounded-[24px] p-4 flex flex-col items-center justify-between cursor-pointer hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300 aspect-[4/3] group"
                >
                  <span className="text-zinc-400 text-xs md:text-sm mb-3 text-center w-full truncate px-2">{set.name}</span>
                  
                  <div className="flex-1 w-full relative flex items-center justify-center p-2">
                    {/* On charge le logo localement depuis le dossier public/logos/ */}
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
                      <span className="text-yellow-500 text-sm font-bold mb-1">Zone en travaux 🚧</span>
                      <span className="text-[10px] text-zinc-500 leading-tight">Charpenti transporte <br/> actuellement les poutres...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* VUE 2 : LA VUE DÉTAILLÉE (CARTES ET FILTRES) */
          <div className="flex flex-col gap-6 animate-fade-in">
            {(!isGlobalBinder && !activeSearch) && (
              <div className="w-full bg-[#18181B] rounded-[24px] border border-white/10 px-10 py-8 flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-6">
                
                <div className="flex items-center gap-6">
                  {/* LE NOUVEAU BLOC LOGO DYNAMIQUE */}
                  <div className="w-[122px] h-[67px] relative flex items-center justify-center shrink-0">
                    <img 
                      src={`/logos/${currentSeriesObj?.id}.png`} 
                      alt={currentSeriesObj?.name} 
                      className="max-w-full max-h-full object-contain drop-shadow-md transition-transform hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none'; // Cache l'image si elle n'est pas trouvée
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex'; // Affiche le fallback
                        }
                      }}
                    />
                    {/* Fallback de secours (affiché uniquement si tu n'as pas encore mis le logo dans le dossier) */}
                    <div className="hidden flex-col items-center justify-center w-full h-full border border-white/5 bg-[#09090B] rounded-xl">
                      <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">{currentSeriesObj?.id}</span>
                    </div>
                  </div>
                  
                  {/* TITRE ET DATE DE SORTIE OFFICIELLE */}
                  <div className="flex flex-col">
                    <h1 className="text-white text-3xl font-normal">
                      {currentSeriesObj?.name || "Série Inconnue"}
                    </h1>
                    <p className="text-neutral-500 text-2xl font-normal mt-1">
                      Date de sortie : {currentSeriesObj?.releaseDate || "Inconnue"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-end gap-2 w-72">
                    <span className="text-white text-xl font-normal tracking-wide">
                      {normalCollected + foilCollected}/{totalCards || 0}
                    </span>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${totalCards > 0 ? ((normalCollected + foilCollected) / totalCards) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button onClick={() => alert("Fonctionnalité Wishlist globale à venir !")} className="bg-rose-500 text-white text-xl font-normal px-8 py-3 rounded-full outline outline-1 outline-white/10 hover:bg-rose-600 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-2">
                    Whislist <span>🤍</span>
                  </button>
                </div>
              </div>
            )}

            {activeSearch && (
              <div className="bg-[#18181B] border border-white/10 p-6 rounded-[24px] flex items-center justify-between">
                <h2 className="text-xl">Résultats pour : <span className="text-rose-500">{activeSearch}</span></h2>
                <button onClick={handleBackToSeries} className="px-6 py-2 bg-[#09090B] rounded-full border border-white/10 hover:border-white/30 transition">
                  Fermer la recherche
                </button>
              </div>
            )}

            {(!isGlobalBinder) && (
              <div className="w-full flex items-center gap-5 mt-4 mb-4">
                <div className="relative group shrink-0">
                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)} 
                    className="appearance-none bg-rose-500 hover:bg-rose-600 text-white text-xl font-normal px-8 py-3 pr-12 rounded-full outline outline-1 outline-white/10 cursor-pointer transition-colors shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  >
                    <option value="ALL">Trier par</option>
                    <option value="MISSING">Manquantes</option>
                    <option value="NORMAL">Possédées (Normal)</option>
                    <option value="FOIL">Possédées (Foil)</option>
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white text-xl">⌄</span>
                </div>
                <form onSubmit={handleSearchSubmit} className="flex-1 relative h-[52px]">
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Rechercher dans la série ${currentSeriesObj?.name || "30 ans"} (#001 Noeuneuf...)`}
                    className="w-full h-full bg-[#18181B] border border-white/10 rounded-full pl-8 pr-14 py-3.5 text-neutral-500 text-[16px] font-normal outline-none focus:border-rose-500 transition-colors"
                  />
                  <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-rose-400 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                </form>
              </div>
            )}

            {isGlobalBinder && (
               <div className="flex items-center justify-between bg-[#18181B] p-4 rounded-[24px] border border-white/10 mt-2 mb-4">
                 <select value={binderSelectedSeries} onChange={(e) => { setBinderSelectedSeries(e.target.value); setCurrentGlobalBinderPage(1); }} className="bg-[#09090B] border border-white/10 text-white px-4 py-2 rounded-full outline-none focus:border-rose-500">
                    <option value="ALL">Toutes mes séries ({cards.length} cartes)</option>
                    {ownedSeriesList.map((s: PokemonSet) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setBinderViewStyle("pages")} className={`px-4 py-2 rounded-full text-sm transition ${binderViewStyle === "pages" ? "bg-rose-500 text-white" : "bg-[#09090B] text-zinc-400 border border-white/10"}`}>Mode Classeur</button>
                    <button onClick={() => setBinderViewStyle("standard")} className={`px-4 py-2 rounded-full text-sm transition ${binderViewStyle === "standard" ? "bg-rose-500 text-white" : "bg-[#09090B] text-zinc-400 border border-white/10"}`}>Mode Grille</button>
                  </div>
               </div>
            )}

            {loading && cards.length === 0 ? (
              <CardSkeleton count={10} />
            ) : filteredCards.length > 0 ? (
              <div className="mb-12">
                {isGlobalBinder && binderViewStyle === "pages" ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-[#18181B] border border-white/10 p-4 rounded-3xl">
                      <button onClick={() => setCurrentGlobalBinderPage((p) => Math.max(1, p - 1))} disabled={currentGlobalBinderPage === 1} className="px-4 py-2 bg-[#09090B] border border-white/10 rounded-xl disabled:opacity-30">Précédent</button>
                      <span className="text-zinc-400">Page <span className="text-white font-bold">{currentGlobalBinderPage}</span> / {totalGlobalPages}</span>
                      <button onClick={() => setCurrentGlobalBinderPage((p) => Math.min(totalGlobalPages, p + 1))} disabled={currentGlobalBinderPage === totalGlobalPages} className="px-4 py-2 bg-[#09090B] border border-white/10 rounded-xl disabled:opacity-30">Suivant</button>
                    </div>
                    <div className="bg-[#18181B]/50 border-2 border-rose-500/20 rounded-[32px] p-6 md:p-10 relative">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {displayedCards.map((card) => {
                          const cardSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === (isGlobalBinder ? card.id.split("-")[0] : selectedSeriesId));
                          return <CardItem key={card.id} card={card} cardData={userCollection[card.id]} isGlobalBinder={isGlobalBinder} cardDefaultLang={cardSeries?.lang || "fr"} hasImageError={Boolean(failedImages[card.id])} onImageError={handleImageError} onZoom={(c) => setZoomedCard(c as Card)} onToggleWishlist={toggleWishlist} onToggleOwnership={toggleCardOwnership} onToggleLanguage={toggleCardLanguage} />;
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      {displayedCards.map((card) => {
                        const cardSeries = ALL_FLAT_SERIES.find((s: PokemonSet) => s.id === (isGlobalBinder ? card.id.split("-")[0] : selectedSeriesId));
                        return <CardItem key={card.id} card={card} cardData={userCollection[card.id]} isGlobalBinder={isGlobalBinder} cardDefaultLang={cardSeries?.lang || "fr"} hasImageError={Boolean(failedImages[card.id])} onImageError={handleImageError} onZoom={(c) => setZoomedCard(c as Card)} onToggleWishlist={toggleWishlist} onToggleOwnership={toggleCardOwnership} onToggleLanguage={toggleCardLanguage} />;
                      })}
                    </div>
                    {visibleCount < filteredCards.length && (
                      <div ref={sentinelRef} className="py-12 flex justify-center">
                        <div className="px-6 py-3 bg-[#18181B] border border-white/10 rounded-full animate-pulse text-zinc-400">Chargement de la suite...</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center bg-[#18181B] border border-white/10 rounded-[24px] p-12 mt-8">
                <span className="text-4xl mb-4 block opacity-50">📭</span>
                <p className="text-zinc-400 text-lg">Aucune carte trouvée pour cette sélection.</p>
              </div>
            )}
          </div>
        )}
        
        {showScrollTop && (
          <button onClick={scrollToTop} className="fixed bottom-8 right-8 z-50 bg-rose-500 hover:bg-rose-400 text-white w-12 h-12 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center text-xl transition cursor-pointer">↑</button>
        )}
      </div>
    </main>
  );
}