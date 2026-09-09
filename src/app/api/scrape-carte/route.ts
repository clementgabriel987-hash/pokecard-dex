// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 🧠 Le "Cerveau" traducteur
function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  const exceptions: Record<string, string> = {
    // Promos & Hors-Séries
    'svp': 'PR-SV', 'swshp': 'PR-EB', 'smp': 'PR-SL', 'xyp': 'PR-XY',
    'bwp': 'PR-NB', 'hsp': 'PR-HS', 'dpp': 'PR-DP', 'basep': 'PR-W',
    
    // Détective Pikachu & Célébrations
    'det1': 'DPK',
    'cel25': 'CEL', 
    'cel25c': 'CEL',
    
    // Bloc Diamant & Perle
    'dp1': 'DP', 'dp2': 'MT', 'dp3': 'SW', 'dp4': 'MD', 'dp5': 'LA', 'dp6': 'SF',
    
    // Bloc Platine
    'pl1': 'PL', 'pl2': 'RR', 'pl3': 'SV', 'pl4': 'AR',
    
    // Bloc HeartGold & SoulSilver
    'hgss1': 'HS', 'hgss2': 'UL', 'hgss3': 'UD', 'hgss4': 'TM', 'col1': 'CL',
  };
  
  if (exceptions[id]) return exceptions[id];

  // Blocs modernes
  id = id.replace(/^sv0/, 'EV').replace(/^sv/, 'EV');
  id = id.replace(/^swsh/, 'EB').replace(/^sm/, 'SL').replace(/^bw/, 'NB');
  return id.toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  try {
    const pkxSetId = translateSetId(setId);

    // 🚀 MÉTHODE 1 : Test direct de l'image
    const possibleImages = [
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.png`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${localId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${localId}.png`
    ];

    for (const imgUrl of possibleImages) {
      try {
        const headRes = await fetch(imgUrl, { method: 'HEAD' });
        if (headRes.ok) {
          return NextResponse.json({ imageUrl: imgUrl });
        }
      } catch (e) { /* on ignore */ }
    }

    // 🐢 MÉTHODE 2 : Scraping de la page de la série complète
    const seriesUrl = `https://www.pokecardex.com/series/${pkxSetId}`;
    
    const response = await fetch(seriesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // ✅ La solution magique est ici : on force le type de la variable
      let foundImageUrl: string = "";
      
      $('img').each((i, el) => {
        const src = $(el).attr('src') || "";
        
        if (src.includes(`/${pkxSetId}/`)) {
          const regexStrict = new RegExp(`/${localId}\\.(jpg|png)$`, 'i');
          const regexPadded = new RegExp(`/0+${localId}\\.(jpg|png)$`, 'i'); 
          
          if (regexStrict.test(src) || regexPadded.test(src)) {
             foundImageUrl = src;
             return false; 
          }
        }
      });

      // Maintenant TypeScript sait que foundImageUrl est toujours un string
      if (foundImageUrl.length > 0) {
        if (foundImageUrl.startsWith('/')) {
          foundImageUrl = `https://www.pokecardex.com${foundImageUrl}`;
        }
        return NextResponse.json({ imageUrl: foundImageUrl });
      }
    }
    
    return NextResponse.json({ error: 'Image introuvable sur la page série' }, { status: 404 });
  } catch (error) {
    console.error(`[Scraper] 💥 Erreur API :`, (error as Error).message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}