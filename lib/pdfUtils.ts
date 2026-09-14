import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}

/**
 * 목차나 서문을 건너뛰고 본문이 시작되는 첫 위치를 찾아냅니다.
 * 목차의 특징(........ 형태의 점선이나 페이지 번호 연결)을 무시합니다.
 */
export function findStoryStartIndex(text: string): number {
  // 챕터 키워드를 찾습니다.
  const regex = /(Chapter\s*(1|one)|Chapitre\s*(1|I|un)|PREMIER CHAPITRE|제\s*1\s*장|1장|Partie\s*1|Part\s*1)/gi;
  
  const searchArea = text.slice(0, Math.min(text.length, 100000)); 
  let match;
  let bestIndex = 0;
  
  // 찾은 챕터 위치들 중, 바로 뒤에 점선(....)이 없는 곳을 진짜 본문 시작으로 간주합니다.
  while ((match = regex.exec(searchArea)) !== null) {
    const snippet = searchArea.slice(match.index, match.index + 200);
    // 목차 특징: 점이 4개 이상 연속되거나, 바로 뒤에 다른 챕터 이름이 이어짐
    const isTableOfContents = snippet.includes('....') || /CHAPITRE\s*(II|2|III|3)/i.test(snippet);
    
    if (!isTableOfContents) {
      return match.index; // 진짜 본문 시작점 반환
    }
  }
  
  // 실패할 경우 기본 스킵
  return text.length > 2000 ? 500 : 0;
}

export function splitIntoSentences(text: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
  const segments = segmenter.segment(text);
  
  const sentences = [];
  for (const { segment } of segments) {
    const trimmed = segment.trim();
    if (trimmed.length > 1) {
      sentences.push(trimmed);
    }
  }
  return sentences;
}
