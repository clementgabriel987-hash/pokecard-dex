'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  // États pour les filtres par rectangles cliquables
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [selectedIllustrator, setSelectedIllustrator] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    setLoading(true)
    const { data, error } = await supabase.from('cards').select('*')
    if (error) {
      console.error('Erreur chargement Supabase:', error)
    } else {
      const sorted = (data || []).sort((a, b) => parseInt(a.number || 0) - parseInt(b.number || 0))
      setCards(sorted)
    }
    setLoading(false)
  }

  async function toggleCardStatus(cardId: string, field: 'is_owned' | 'is_reverse_owned', currentValue: boolean) {
    const newValue = !currentValue

    setCards(prevCards => 
      prevCards.map(c => c.id === cardId ? { ...c, [field]: newValue } : c)
    )

    const { error } = await supabase
      .from('cards')
      .update({ [field]: newValue })
      .eq('id', cardId)

    if (error) {
      console.error('Erreur mise à jour Supabase:', error)
      fetchCards()
    }
  }

  async function importerSetGitHub() {
    setImporting(true)
    setImportMessage("Téléchargement du Set de Base en cours...")
    try {
      const res = await fetch('https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/base1.json')
      const rawCards = await res.json()

      if (Array.isArray(rawCards)) {
        let successCount = 0

        for (const c of rawCards) {
          let rarityText = 'Common'
          if (typeof c.rarity === 'string') {
            rarityText = c.rarity
          } else if (Array.isArray(c.rarity)) {
            rarityText = c.rarity.join(', ')
          }

          // Récupération propre de l'illustrateur si présent dans le JSON GitHub
          const illustratorName = c.artist || c.illustrator || 'Inconnu'

          const cardData = {
            id: String(c.id || `base1-${c.number}`),
            name: String(c.name || 'Inconnu'),
            set_name: String(c.set?.name || 'Base Set'),
            number: String(c.number || '1'),
            image_url: String(c.images?.large || c.images?.small || `https://images.pokemontcg.io/base1/${c.number}_hires.png`),
            rarity: rarityText,
            illustrator: String(illustratorName),
            is_owned: false,
            is_reverse_owned: false
          }

          const { error } = await supabase
            .from('cards')
            .upsert(cardData, { onConflict: 'id' })

          if (!error) {
            successCount++
          } else {
            console.error(`Erreur sur la carte ${c.name}:`, error)
          }
        }

        setImportMessage(`Succès ! ${successCount} cartes importées avec succès.`)
        await fetchCards()
      } else {
        setImportMessage("Erreur : Format de données invalide depuis GitHub.")
      }
    } catch (err) {
      console.error("Erreur GitHub import:", err)
      setImportMessage("Impossible de joindre GitHub.")
    }
    setImporting(false)
  }

  // Extraire la liste unique des Séries et des Illustrateurs pour les rectangles
  const uniqueSets = Array.from(new Set(cards.map(c => c.set_name))).filter(Boolean)
  const uniqueIllustrators = Array.from(new Set(cards.map(c => c.illustrator))).filter(Boolean)

  // Filtrage global des cartes
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name?.toLowerCase().includes(search.toLowerCase()) || 
                          card.number?.includes(search)
    const matchesSet = selectedSet ? card.set_name === selectedSet : true
    const matchesIllustrator = selectedIllustrator ? card.illustrator === selectedIllustrator : true

    return matchesSearch && matchesSet && matchesIllustrator
  })

  const ownedCount = cards.filter(c => c.is_owned || c.is_reverse_owned).length
  const progress = cards.length > 0 ? Math.round((ownedCount / cards.length) * 100) : 0

  return (
    <main className="min-h-screen p-6 sm:p-10 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <p className="text-xs tracking-widest text-yellow-400 font-bold uppercase mb-1">Pokécard Dex Web</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Ma Collection 📦</h1>
        
        <button
          onClick={importerSetGitHub}
          disabled={importing}
          className="mt-4 px-6 py-3 bg-yellow-400 text-gray-950 font-bold rounded-xl shadow-lg hover:bg-yellow-300 transition text-sm cursor-pointer disabled:opacity-50"
        >
          {importing ? "Importation en cours..." : "📥 Importer les 102 cartes via GitHub"}
        </button>

        {importMessage && (
          <p className="mt-3 text-sm text-yellow-400 font-medium">{importMessage}</p>
        )}
      </div>

      {/* Barre de progression */}
      {!loading && cards.length > 0 && (
        <div className="max-w-xl mx-auto mb-8 bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progression globale</span>
            <span className="text-sm font-bold text-yellow-400">{ownedCount} / {cards.length} ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
            <div className="bg-yellow-400 h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* RECTANGLES CLIKABLES : SÉRIES */}
      {uniqueSets.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Filtrer par Série :</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedSet(null)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                selectedSet === null ? 'bg-yellow-400 text-gray-950 shadow-lg' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700'
              }`}
            >
              Toutes les séries
            </button>
            {uniqueSets.map(setName => (
              <button
                key={setName}
                onClick={() => setSelectedSet(setName)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                  selectedSet === setName ? 'bg-yellow-400 text-gray-950 shadow-lg' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700'
                }`}
              >
                📦 {setName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RECTANGLES CLIKABLES : ILLUSTRATEURS */}
      {uniqueIllustrators.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Filtrer par Illustrateur :</h3>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-gray-900/50 rounded-2xl border border-gray-900">
            <button
              onClick={() => setSelectedIllustrator(null)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer ${
                selectedIllustrator === null ? 'bg-cyan-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Tous les illustrateurs
            </button>
            {uniqueIllustrators.map(illustrator => (
              <button
                key={illustrator}
                onClick={() => setSelectedIllustrator(illustrator)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer ${
                  selectedIllustrator === illustrator ? 'bg-cyan-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                🎨 {illustrator}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="max-w-xl mx-auto mb-10">
        <input
          type="text"
          placeholder="Rechercher par nom ou numéro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition"
        />
      </div>

      {/* Grille des cartes */}
      {loading ? (
        <p className="text-center text-gray-400">Chargement des cartes...</p>
      ) : filteredCards.length === 0 ? (
        <p className="text-center text-gray-500">Aucune carte trouvée pour ces filtres.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {filteredCards.map((card) => (
            <div key={card.id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-xl flex flex-col items-center relative group">
              
              <img 
                src={card.image_url} 
                alt={card.name} 
                className="w-full h-auto rounded-xl mb-3 object-contain shadow-md"
                loading="lazy"
              />
              
              <h2 className="text-base font-bold text-white mb-1 text-center truncate w-full">{card.name}</h2>
              <p className="text-xs text-gray-400 mb-1">N° {card.number} • {card.rarity}</p>
              {card.illustrator && (
                <p className="text-[10px] text-cyan-400 mb-3 truncate w-full text-center">🎨 {card.illustrator}</p>
              )}

              {/* Boutons Normal & Reverse */}
              <div className="flex gap-2 w-full mt-auto">
                <button
                  onClick={() => toggleCardStatus(card.id, 'is_owned', card.is_owned)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    card.is_owned ? 'bg-yellow-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  ⭐
                </button>

                <button
                  onClick={() => toggleCardStatus(card.id, 'is_reverse_owned', card.is_reverse_owned)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    card.is_reverse_owned ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  ✨
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </main>
  )
}
<h1>Mon Pokedex Vercel en ligne !</h1>