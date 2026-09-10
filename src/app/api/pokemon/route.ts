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
        'Accept': 'application/json',
        'X-Api-Key': '7c2bb80f-679f-48a2-a682-da0396517cb2'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Externe (${response.status}):`, errorText);
      return NextResponse.json({ error: `External API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur interne route proxy:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}