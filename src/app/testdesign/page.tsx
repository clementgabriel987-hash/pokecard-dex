"use client";

import { useState } from "react";

export default function ExtensionsPage() {
  const [activeTab, setActiveTab] = useState("Écarlate et Violet");

  // Faux de données pour l'exemple
  const extensions = [
    { id: "151", name: "Écarlate et Violet - 151", date: "Septembre 2023", total: 207, collected: 145, icon: "🧬" },
    { id: "paldea", name: "Évolutions à Paldea", date: "Juin 2023", total: 279, collected: 80, icon: "✨" },
    { id: "destinees", name: "Destinées de Paldea", date: "Janvier 2024", total: 245, collected: 210, icon: "🌟" },
    { id: "faille", name: "Faille Paradoxe", date: "Novembre 2023", total: 266, collected: 30, icon: "⏳" },
    { id: "couronne", name: "Couronne Stellaire", date: "Août 2024", total: 175, collected: 10, icon: "👑" },
    { id: "crepuscule", name: "Mascarade Crépusculaire", date: "Mai 2024", total: 226, collected: 150, icon: "🎭" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans pb-12">
      
      {/* 1. HEADER GLOBAL (Simplifié pour l'exemple) */}
      <nav className="sticky top-0 z-50 w-full bg-[#09090B]/80 backdrop-blur-md border-b border-white/10 px-8 flex items-center justify-between h-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F43F5E] to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]">CV</div>
          <span className="font-bold text-lg tracking-wide">Cosmic Vault</span>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button className="w-9 h-9 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">👤</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-10 space-y-8">
        
        {/* Titre et Stats globales */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Toutes les extensions</h1>
            <p className="text-zinc-400">Gérez votre collection à travers les différentes ères Pokémon.</p>
          </div>
          <div className="bg-[#18181B] border border-white/10 rounded-xl px-5 py-3 flex gap-6">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase">Séries complétées</p>
              <p className="text-xl font-bold text-white">0 <span className="text-zinc-500 text-sm">/ 24</span></p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase">Cartes uniques</p>
              <p className="text-xl font-bold text-[#F43F5E]">1,402</p>
            </div>
          </div>
        </div>

        {/* Navigation des ères (Onglets) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Écarlate et Violet", "Épée et Bouclier", "Soleil et Lune", "XY"].map((era) => (
            <button 
              key={era}
              onClick={() => setActiveTab(era)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === era 
                  ? "bg-[#F43F5E] text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                  : "bg-[#18181B] text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
              }`}
            >
              {era}
            </button>
          ))}
        </div>

        {/* Grille des Extensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {extensions.map((ext) => {
            const percent = Math.round((ext.collected / ext.total) * 100);
            
            return (
              <div 
                key={ext.id} 
                className="group relative bg-[#18181B] rounded-2xl border border-white/10 overflow-hidden hover:border-[#F43F5E]/50 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] transition-all duration-300 cursor-pointer h-56 flex flex-col justify-end p-5"
              >
                {/* Image de fond (simulée avec un dégradé ici, à remplacer par une vraie image d'illustration sur Figma) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#18181B] to-[#09090B] opacity-50 group-hover:opacity-80 transition-opacity z-0"></div>
                
                {/* Effet lumineux au survol */}
                <div className="absolute -inset-24 bg-gradient-to-tr from-[#F43F5E]/0 via-[#F43F5E]/10 to-purple-600/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 z-0"></div>

                {/* Contenu de la carte */}
                <div className="relative z-10 w-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                      {ext.icon}
                    </div>
                    <span className="bg-[#09090B]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-zinc-300 border border-white/10">
                      {ext.date}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#F43F5E] transition-colors">{ext.name}</h3>
                  
                  {/* Jauge de progression */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-400">Progression</span>
                      <span className={percent >= 80 ? "text-green-400" : "text-[#F43F5E]"}>{ext.collected} / {ext.total} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#09090B] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percent >= 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.6)]'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}