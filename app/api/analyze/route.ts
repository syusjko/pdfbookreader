import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { sentences, apiKey, isAuth, targetLang = "Korean", bookId, chunkIndex } = await req.json();

    const supabase = await createClient();
    
    // Check cache if bookId and chunkIndex are provided
    if (bookId && chunkIndex !== undefined && isAuth) {
      const { data: cached } = await supabase
        .from("book_analysis")
        .select("analysis_json")
        .eq("book_id", bookId)
        .eq("chunk_index", chunkIndex)
        .eq("target_lang", targetLang)
        .single();
        
      if (cached?.analysis_json) {
        return NextResponse.json(cached.analysis_json);
      }
    }

    const finalApiKey = apiKey || (isAuth ? process.env.GEMINI_API_KEY : undefined);
    if (!finalApiKey) {
      return NextResponse.json({ error: "API Key가 필요합니다." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const prompt = `
You are a master literary translator and a rigorous language tutor. Analyze the following JSON array of sentences.
Provide a JSON array response where each element corresponds to the input sentence in the exact same order.
Make sure the output array length matches the input array length exactly.

Each element must be an object with exactly two keys:
1. "translation": A highly polished, beautiful, and completely natural ${targetLang} literary translation. You MUST rearrange the sentence structure to fit natural ${targetLang} grammar perfectly. Absolutely DO NOT mirror the foreign word order. Imagine you are a professional human translator publishing a best-selling novel.
2. "breakdown": A literal, chunk-by-chunk reading guide (translated to ${targetLang}). Break the sentence into logical phrases. Each object must have:
   - "chunk": The exact chunk of the original text.
   - "meaning": The literal translation of just this chunk in ${targetLang}.
   - "role": The grammatical role (e.g., "noun", "verb phrase").

Sentences to analyze:
${JSON.stringify(sentences)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("AI 분석을 실패했습니다.");
    }
    
    // Save to cache
    if (bookId && chunkIndex !== undefined && isAuth) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("book_analysis").upsert({
          book_id: bookId,
          chunk_index: chunkIndex,
          target_lang: targetLang,
          analysis_json: parsed
        });
      }
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
