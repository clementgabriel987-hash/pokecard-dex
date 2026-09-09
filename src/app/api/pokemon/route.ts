import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set');

  if (!setId) {
    return NextResponse.json({ error: 'Missing set parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
      headers: {
        // Tu peux ajouter ta clé API pokemontcg.io ici si tu en as une un jour, sinon ça passe en mode public limité
      }
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}