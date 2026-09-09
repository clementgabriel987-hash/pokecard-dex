// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';

function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  const exceptions: Record<string, string> = {
    'svp': 'PR-SV', 'swshp': 'PR-EB', 'smp': 'PR-SL', 'xyp': 'PR-XY',
    'bwp': 'PR-NB', 'hsp': 'PR-HS', 'dpp': 'PR-DP', 'basep': 'PR-W',
    'det1': 'DPK', 'cel25': 'CEL', 'cel25c': 'CEL',
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
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const pkxSetId = translateSetId(setId);
  
  // On gère proprement les formats de numéros (ex: "13" -> "13" et "013")
  const cleanId = localId.replace(/^0+/, '');
  const paddedId = cleanId.padStart(3, '0'); // ex: "013" pour les séries qui le demandent
  const standardId = cleanId;                // ex: "13"

  const oldBlocks = ['DP', 'MT', 'SW', 'MD', 'LA', 'SF', 'PL', 'RR', 'SV', 'AR', 'HS', 'UL', 'UD', 'TM', 'CL', 'DPK', 'CEL'];
  const basePath = oldBlocks.includes(pkxSetId) 
    ? `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}`
    : `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}`;

  // On privilégie le format standard, mais on s'assure d'envoyer une URL valide
  // Note: Si le navigateur échoue sur le premier lien, ton front-end peut basculer sur un texte de secours.
  const imageUrl = `${basePath}/${standardId}.jpg`;

  return NextResponse.json({ imageUrl });
}