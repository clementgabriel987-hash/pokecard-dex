"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Purchase {
  id: string;
  cardName: string;
  setName: string;
  price: number;
  platform: string;
  condition: string;
  date: string;
}

export default function PurchasesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // Champs du formulaire
  const [cardName, setCardName] = useState("");
  const [setName, setSetName] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState("Cardmarket");
  const [condition, setCondition] = useState("Near Mint");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        loadPurchases(session.user.id);
      }
    });
  }, []);

  const loadPurchases = async (userId: string) => {
    // On récupère depuis la table user_data ou une table dédiée si elle existe
    const { data } = await supabase.from("user_data").select("purchases").eq("id", userId).maybeSingle();
    if (data && data.purchases) {
      setPurchases(data.purchases);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Connecte-toi pour enregistrer tes achats !");
    if (!cardName || !price) return alert("Indique au moins le nom de la carte et le prix.");

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      cardName,
      setName,
      price: parseFloat(price) || 0,
      platform,
      condition,
      date,
    };

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);

    // Sauvegarde dans Supabase (table user_data, colonne purchases)
    await supabase.from("user_data").upsert({ 
      id: currentUser.id, 
      purchases: updatedPurchases 
    }, { onConflict: 'id' });

    // Reset formulaire
    setCardName("");
    setSetName("");
    setPrice("");
  };

  const handleDeletePurchase = async (id: string) => {
    if (!currentUser) return;
    const updatedPurchases = purchases.filter(p => p.id !== id);
    setPurchases(updatedPurchases);

    await supabase.from("user_data").upsert({ 
      id: currentUser.id, 
      purchases: updatedPurchases 
    }, { onConflict: 'id' });
  };

  const totalSpent = purchases.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
            ⬅️ Retour au classeur
          </Link>
          <h1 className="text-2xl font-extrabold text-yellow-400">🛒 Historique des Achats</h1>
        </div>

        {/* Total Dépensé */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 flex justify-between items-center shadow-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Investissement Total</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{totalSpent.toFixed(2)} €</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Cartes achetées</p>
            <p className="text-xl font-bold text-white">{purchases.length} articles</p>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {currentUser ? (
          <form onSubmit={handleAddPurchase} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-500 mb-2">➕ Ajouter un achat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nom de la carte</label>
                <input type="text" placeholder="Ex: Dracaufeu VMAX" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500" required />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Série / Extension</label>
                <input type="text" placeholder="Ex: La Voie du Maître" value={setName} onChange={e => setSetName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prix (€)</label>
                <input type="number" step="0.01" placeholder="Ex: 15.50" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500" required />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Plateforme / Source</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500">
                  <option value="Cardmarket">Cardmarket</option>
                  <option value="Vinted">Vinted</option>
                  <option value="eBay">eBay</option>
                  <option value="Boutique physique">Boutique physique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">État de la carte</label>
                <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500">
                  <option value="Mint (M)">Mint (M)</option>
                  <option value="Near Mint (NM)">Near Mint (NM)</option>
                  <option value="Excellent (EX)">Excellent (EX)</option>
                  <option value="Good (GD)">Good (GD)</option>
                  <option value="Played (PL)">Played (PL)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date d'achat</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-sm px-3 py-2 rounded-xl outline-none focus:border-yellow-500" />
              </div>
            </div>
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer mt-4">
              Enregistrer l'achat
            </button>
          </form>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 text-center text-slate-400 text-xs">
            Connecte-toi pour pouvoir enregistrer et synchroniser ton historique d'achats.
          </div>
        )}

        {/* Liste des achats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">📋 Historique récent</h2>
          {purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-sm text-white">{p.cardName} <span className="text-slate-400 font-normal">({p.setName || "Série non spécifiée"})</span></p>
                    <p className="text-slate-400 mt-1">Plateforme : <span className="text-yellow-400">{p.platform}</span> • État : <span className="text-purple-400">{p.condition}</span> • Le {p.date}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-base font-bold text-emerald-400">{p.price.toFixed(2)} €</span>
                    <button onClick={() => handleDeletePurchase(p.id)} className="text-red-400 hover:text-red-300 font-bold p-1 cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-6">Aucun achat enregistré pour le moment.</p>
          )}
        </div>
      </div>
    </main>
  );
}