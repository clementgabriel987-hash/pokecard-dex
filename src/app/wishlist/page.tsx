"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface WishlistCard {
  id: string;
  name: string;
  localId: string;
  image: string;
  rarity?: string;
  seriesName?: string;
}

type UserCollectionJSON = Record<string, { normalOwned: boolean; foilOwned: boolean; isWishlist?: boolean; price?: string; note?: string }>;

export default function WishlistPage() {
  const [wishlistCards, setWishlistCards] = useState<WishlistCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCollection, setUserCollection] = useState<UserCollectionJSON>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadWishlistData() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase.from("user_data").select("collection").eq("id", currentUser.id).maybeSingle();
      
      if (data && data.collection) {
        setUserCollection(data.collection);
        
        const wishIDs = Object.keys(data.collection).filter(id => data.collection[id]?.isWishlist);
        
        let fetchedCards: WishlistCard[] = [];
        for (const cardId of wishIDs) {
          try {
            const lang = "fr";
            const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${cardId}`);
            if (res.ok) {
              const cardData = await res.json();
              fetchedCards.push({
                id: cardData.id,
                name: cardData.name || "Inconnue",
                localId: cardData.localId || "?",
                image: cardData.image ? `${cardData.image}/high.png` : "",
                rarity: cardData.rarity || "Inconnue",
                seriesName: cardData.set?.name || "Extension"
              });
            }
          } catch {}
        }
        setWishlistCards(fetchedCards);
      }
      setLoading(false);
    }

    loadWishlistData();
  }, [currentUser]);

  const removeFromWishlist = async (id: string) => {
    if (!currentUser) return;
    const newCollection = { ...userCollection };
    if (newCollection[id]) {
      newCollection[id].isWishlist = false;
      if (!newCollection[id].normalOwned && !newCollection[id].foilOwned) {
        delete newCollection[id];
      }
    }
    setUserCollection(newCollection);
    setWishlistCards(prev => prev.filter(c => c.id !== id));
    await supabase.from("user_data").upsert({ id: currentUser.id, collection: newCollection });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      {/* Bouton Menu */}
      <div className="absolute top-4 left-4 z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 p-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold transition cursor-pointer">
          <span className="text-lg">☰</span> Menu
        </button>
      </div>

      {/* Sidebar complète restaurée */}
      <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`relative w-80 bg-slate-900 border-r border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 ease-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-yellow-400">Menu Dresseur 🧢</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3">
              <Link href="/" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer">
                <span>📚</span> Mon Pokedex / Classeur
              </Link>
              <Link href="/wishlist" className="w-full text-left bg-purple-950/40 border border-purple-800/50 p-3.5 rounded-xl font-semibold text-sm text-purple-300 transition flex items-center gap-3 cursor-pointer">
                <span>❤️</span> Chasse aux cartes (Wishlist)
              </Link>
              <Link href="/artistes" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer">
                <span>🎨</span> Recherche par Artiste
              </Link>
              <Link href="/prix" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer text-green-300">
                <span>📈</span> Recherche de Prix
              </Link>
              <div className="pt-2">
                <Link href="/compte" className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl font-semibold text-sm transition flex items-center gap-3 cursor-pointer">
                  <span>⚙️</span> Paramètres & Compte
                </Link>
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

      <div className="max-w-6xl mx-auto pt-6 md:pt-0">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">🎯 Ta Chasse aux Cartes (Wishlist)</h1>
          <p className="text-slate-400 text-sm">Toutes les pépites qu'il te manque pour compléter tes extensions</p>
        </div>

        <div className="mb-8 flex justify-center">
          <Link href="/" className="px-6 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2 shadow-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600">
            <span>⬅️ Retour au Pokedex</span>
          </Link>
        </div>

        {!currentUser ? (
          <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-10 mt-8">
            <span className="text-4xl mb-4 block">🔒</span>
            <p className="text-slate-300 text-base font-semibold mb-4">Connecte-toi pour retrouver ta liste de chasse.</p>
            <Link href="/compte" className="inline-block bg-white text-slate-900 text-xs font-bold px-5 py-3 rounded-xl hover:bg-gray-200 transition shadow-md">Se connecter</Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">Chargement de ta liste de souhaits... 🎯</div>
        ) : wishlistCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistCards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group">
                
                <button 
                  onClick={() => removeFromWishlist(card.id)} 
                  className="absolute top-3 right-3 z-10 bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/40 p-2 rounded-full transition cursor-pointer"
                  title="Retirer de la wishlist"
                >
                  ❤️
                </button>

                <div>
                  <div className="mb-3 flex justify-center bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 h-44 items-center">
                    {card.image ? (
                      <img src={card.image} alt={card.name} className="h-40 object-contain drop-shadow-md" />
                    ) : (
                      <span className="text-xs text-slate-500 italic">Image indisponible</span>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <h3 className="text-xs md:text-sm font-bold truncate">{card.name}</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">#{card.localId}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mb-3">{card.seriesName}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Chasser sur :</span>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
                    <a 
                      href={`https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 py-1.5 rounded text-center transition"
                    >
                      Cardmarket
                    </a>
                    <a 
                      href={`https://www.ebay.fr/sch/i.html?_nkw=pokemon+card+${encodeURIComponent(card.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 py-1.5 rounded text-center transition"
                    >
                      eBay
                    </a>
                    <a 
                      href={`https://www.vinted.fr/catalog?search_text=carte+pokemon+${encodeURIComponent(card.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 py-1.5 rounded text-center transition"
                    >
                      Vinted
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-10 mt-8">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-slate-300 text-base font-semibold mb-2">Ta wishlist est vide pour le moment.</p>
            <p className="text-slate-500 text-xs">Va dans ton Pokedex et clique sur le cœur des cartes que tu recherches activement !</p>
          </div>
        )}
      </div>
    </main>
  );
}