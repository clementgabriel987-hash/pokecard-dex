import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Dictionnaire pour traduire les identifiants TCGdex vers les identifiants Pokécardex
const setMapper: Record<string, string> = {
  // --- Cartes Promos ---
  'svp': 'PR-SV',     // Promos Écarlate et Violet
  'swshp': 'PR-EB',   // Promos Épée et Bouclier
  'smp': 'PR-SL',     // Promos Soleil et Lune
  'xyp': 'PR-XY',     // Promos XY
  'bwp': 'PR-NB',     // Promos Noir & Blanc
  'hsp': 'PR-HS',     // Promos HeartGold SoulSilver
  'dpp': 'PR-DP',     // Promos Diamant & Perle
  
  // --- Blocs Récents (TCGdex utilise sv01, Pokécardex utilise EV1) ---
  'sv01': 'EV1', 'sv02': 'EV2', 'sv03': 'EV3', 'sv03.5': 'EV3.5',
  'sv04': 'EV4', 'sv04.5': 'EV4.5', 'sv05': 'EV5', 'sv06': 'EV6',
  'sv06.5': 'EV6.5', 'sv07': 'EV7', 'sv08': 'EV8', 'sv08.5': 'EV8.5',
  'swsh1': 'EB1', 'swsh2': 'EB2', 'swsh3': 'EB3', 'swsh3.5': 'EB3.5',
  'swsh4': 'EB4', 'swsh4.5': 'EB4.5', 'swsh5': 'EB5', 'swsh6': 'EB6',
  'swsh7': 'EB7', 'swsh8': 'EB8', 'swsh9': 'EB9', 'swsh10': 'EB10',
  'swsh11': 'EB11', 'swsh12': 'EB12', 'swsh12.5': 'EB12.5',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Il manque le set ou l\'ID' }, { status: 400 });
  }

  try {
    // 1. On traduit l'identifiant (Si on ne le connaît pas, on le met juste en majuscules)
    const pkxSetId = setMapper[setId.toLowerCase()] || setId.toUpperCase();

    // 2. On fabrique l'URL de la carte
    const url = `https://www.pokecardex.com/series/fr/${pkxSetId}/${localId}`;
    
    // 💡 Astuce : Ceci va s'afficher dans le terminal de ton éditeur (VS Code) pour que tu voies ce qu'il cherche !
    console.log(`[Scraper] Recherche de l'image sur : ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    // Au lieu de planter (500), on renvoie une vraie erreur "Non trouvée" (404)
    if (!response.ok) {
      console.log(`[Scraper] ❌ Page introuvable pour ${url}`);
      return NextResponse.json({ error: 'Page introuvable sur Pokécardex' }, { status: 404 });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // On cherche la balise image HD
    let imageUrl = $('meta[property="og:image"]').attr('content');

    // Alternative si og:image ne marche pas
    if (!imageUrl) {
      imageUrl = $('.card-image img').attr('src'); 
    }

    if (imageUrl) {
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://www.pokecardex.com${imageUrl}`;
      }
      console.log(`[Scraper] ✅ Image trouvée : ${imageUrl}`);
      return NextResponse.json({ imageUrl });
    } else {
      console.log(`[Scraper] ❌ Image non trouvée dans le HTML de ${url}`);
      return NextResponse.json({ error: 'Image introuvable dans le code source' }, { status: 404 });
    }
    
  } catch (error: any) {
    console.error(`[Scraper] ❌ Erreur critique :`, error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}