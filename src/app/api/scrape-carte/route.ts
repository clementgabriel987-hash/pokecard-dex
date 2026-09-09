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

  const pkxSetId = translateSetId(setId);
  let cleanLocalId = localId;
  if (/^0+\d+$/.test(localId)) {
    cleanLocalId = localId.replace(/^0+/, ''); 
  }

  // 🎯 Génération de l'URL sans vérification (le navigateur de l'utilisateur s'en chargera)
  // Les anciens blocs n'ont pas de dossier "/fr/" sur Pokécardex
  const oldBlocks = ['DP', 'MT', 'SW', 'MD', 'LA', 'SF', 'PL', 'RR', 'SV', 'AR', 'HS', 'UL', 'UD', 'TM', 'CL', 'DPK', 'CEL'];
  
  let imageUrl = "";
  if (oldBlocks.includes(pkxSetId)) {
      imageUrl = `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${cleanLocalId}.jpg`;
  } else {
      imageUrl = `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${cleanLocalId}.jpg`;
  }

  // On renvoie l'URL magique instantanément (Temps de réponse : 0.01s au lieu de 2.5s)
  return NextResponse.json({ imageUrl });
}