// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';

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

    // Astuce : Certains numéros TCGdex ont des zéros devant ("001"). On les nettoie pour Pokécardex ("1")
    let cleanLocalId = localId;
    if (/^0+\d+$/.test(localId)) {
      cleanLocalId = localId.replace(/^0+/, ''); 
    }

    // 🚀 MÉTHODE 1 : Test direct (On essaie de deviner le lien HD, marche pour 90% des cartes)
    const possibleImages = [
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${cleanLocalId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${cleanLocalId}.png`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${cleanLocalId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${cleanLocalId}.png`
    ];

    for (const imgUrl of possibleImages) {
      try {
        const headRes = await fetch(imgUrl, { method: 'HEAD' });
        if (headRes.ok) {
          return NextResponse.json({ imageUrl: imgUrl });
        }
      } catch (e) { /* On ignore l'erreur et on passe à la suivante */ }
    }

    // 🐢 MÉTHODE 2 : Le Radar (Scraping du texte brut pour contourner le Lazy-Loading)
    const seriesUrl = `https://www.pokecardex.com/series/${pkxSetId}`;
    
    const response = await fetch(seriesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Le Radar : Cherche toute chaîne de texte qui ressemble à " /DP/1.jpg "
      const regexPattern = `[^"'\\\\s]*?/${pkxSetId}/0*${cleanLocalId}\\.(jpg|png)`;
      const matches = Array.from(html.matchAll(new RegExp(regexPattern, 'gi')));
      
      if (matches.length > 0) {
        let bestMatch = matches[0][0];
        
        // S'il trouve plusieurs images (miniatures vs HD), on force à prendre la version non-miniature
        for (const m of matches) {
           if (!m[0].toLowerCase().includes('mini') && !m[0].toLowerCase().includes('thumb')) {
              bestMatch = m[0];
              break;
           }
        }
        
        // Si l'URL n'a pas le "https://..." au début, on le rajoute
        if (bestMatch.startsWith('/')) {
          bestMatch = `https://www.pokecardex.com${bestMatch}`;
        }
        
        return NextResponse.json({ imageUrl: bestMatch });
      }
    }
    
    return NextResponse.json({ error: 'Image introuvable par le radar' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}