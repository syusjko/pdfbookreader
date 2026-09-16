import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sentences, apiKey, isAuth } = await req.json();

    const finalApiKey = apiKey || (isAuth ? process.env.GEMINI_API_KEY : undefined);

    if (!finalApiKey) {
      return NextResponse.json({ error: 'API Key가 필요합니다.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    const prompt = `
You are a master literary translator and a rigorous language tutor. Analyze the following JSON array of sentences.
Provide a JSON array response where each element corresponds to the input sentence in the exact same order.
Make sure the output array length matches the input array length exactly.

Each element must be an object with exactly two keys:
1. "translation": A highly polished, beautiful, and completely natural Korean literary translation (완벽한 소설식 의역). You MUST rearrange the sentence structure to fit natural Korean grammar perfectly. Absolutely DO NOT mirror the foreign word order. (e.g., Do not write "...본 적이 있다, 멋진 그림을", you must write "...멋진 그림을 본 적이 있다"). Imagine you are a professional human translator publishing a best-selling novel.
2. "breakdown": A literal, chunk-by-chunk reading guide (직독직해). Break the sentence into logical phrases. Each object must have:
   - "chunk": The exact chunk of the original text.
   - "meaning": The literal translation of just this chunk (직역).
   - "role": The grammatical role (e.g., "주어+동사", "전치사구").

Sentences to analyze:
${JSON.stringify(sentences)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from Gemini');
    
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw text:', text);
      throw new Error('AI 응답을 해석할 수 없습니다.');
    }
    
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
