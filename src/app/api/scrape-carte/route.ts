// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 🧠 Le "Cerveau" traducteur
function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  const exceptions: Record<string, string> = {
    'svp': 'PR-SV', 'swshp': 'PR-EB', 'smp': 'PR-SL', 'xyp': 'PR-XY',
    'bwp': 'PR-NB', 'hsp': 'PR-HS', 'dpp': 'PR-DP', 'basep': 'PR-W',
    'det1': 'DET', 'cel25': 'CEL', // Détective Pikachu et Célébrations
    'dp1': 'DP', 'dp2': 'MT', 'dp3': 'SW', 'dp4': 'MD', 'dp5': 'LA', 'dp6': 'SF',
    'pl1': 'PL', 'pl2': 'RR', 'pl3': 'SV', 'pl4': 'AR',
    'hgss1': 'HS', 'hgss2': 'UL', 'hgss3': 'UD', 'hgss4': 'TM', 'col1': 'CL',
  };
  
  if (exceptions[id]) return exceptions[id];

  id = id.replace(/^sv0/, 'EV').replace(/^sv/, 'EV');
  id = id.replace(/^swsh/, 'EB').replace(/^sm/, 'SL').replace(/^bw/, 'NB');
  return id.toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const pkxSetId = translateSetId(setId);

    // 🚀 MÉTHODE 1 : On tente de charger l'image directement (Ultra Rapide)
    const possibleImages = [
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.png`
    ];

    for (const imgUrl of possibleImages) {
      try {
        const headRes = await fetch(imgUrl, { method: 'HEAD' });
        if (headRes.ok) {
          console.log(`[Scraper] ⚡ Image directe trouvée : ${imgUrl}`);
          return NextResponse.json({ imageUrl: imgUrl });
        }
      } catch (e) { /* on ignore */ }
    }

    // 🐢 MÉTHODE 2 : On charge la page HTML (⚠️ CORRECTION : on utilise /cartes/ et non /series/)
    const htmlUrl = `https://www.pokecardex.com/cartes/fr/${pkxSetId}/${localId}`;
    console.log(`[Scraper] 🔍 Scraping de : ${htmlUrl}`);
    
    const response = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let imageUrl = $('meta[property="og:image"]').attr('content') || $('.card-image img').attr('src');

      if (imageUrl) {
        if (imageUrl.startsWith('/')) imageUrl = `https://www.pokecardex.com${imageUrl}`;
        console.log(`[Scraper] ✅ Image HTML trouvée : ${imageUrl}`);
        return NextResponse.json({ imageUrl });
      }
    }
    
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}