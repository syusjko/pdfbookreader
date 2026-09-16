import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js?v=4';
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = '';
    let lastY = -1;

    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') {
        pageText += ' ';
        continue;
      }

      const y = Math.round(item.transform[5]);
      
      // If Y changes significantly, it's a new line
      if (lastY !== -1 && Math.abs(y - lastY) > 4) {
        // If it's a large gap (e.g. between Chapter title and body), treat as paragraph break
        if (Math.abs(y - lastY) > 15) {
          pageText += '\n\n';
        } else {
          pageText += '\n';
        }
      } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
        pageText += ' ';
      }

      pageText += item.str;
      lastY = y;
    }
    
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
  // 1. 노이즈 제거 (URL, 웹 링크, [1], (1) 같은 각주)
  let cleanText = text.replace(/https?:\/\/[^\s]+/g, ''); // URL 제거
  cleanText = cleanText.replace(/www\.[^\s]+/g, '');
  cleanText = cleanText.replace(/\[\d+\]/g, ''); // [1] 형태 각주 제거
  
  // 2. 문단(단락) 단위로 먼저 쪼개기 (제목/챕터명 고립시키기)
  // 줄바꿈이 2번 이상 연속되면(단락 바뀜) 독립된 문장으로 간주
  const blocks = cleanText.split(/\n\s*\n/);
  
  const sentences: string[] = [];

  for (const block of blocks) {
    // block 내부에 있는 단일 줄바꿈은 공백으로 치환하여 문장이 끊어지지 않게 함
    const normalizedBlock = block.replace(/\n/g, ' ').trim();
    if (normalizedBlock.length < 2) continue;

    // 3. 브라우저 내장 Intl.Segmenter로 문장 분리
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
        const segments = segmenter.segment(normalizedBlock);
        
        for (const step of segments) {
          const trimmed = step.segment.trim();
          if (trimmed.length > 1) {
            sentences.push(trimmed);
          }
        }
        continue;
      } catch (e) {
        console.warn("Intl.Segmenter failed", e);
      }
    }

    // 4. 구형 브라우저 / Safari 에러 대비용 (정규식 기반 문장 분리)
    const regex = /[^.!?]+[.!?]+(?:\s|$)/g;
    let match;
    let found = false;
    while ((match = regex.exec(normalizedBlock)) !== null) {
      found = true;
      const trimmed = match[0].trim();
      if (trimmed.length > 1) sentences.push(trimmed);
    }
    // 마지막에 마침표 없이 끝난 문장 처리 (ex: 챕터 제목)
    if (!found || regex.lastIndex < normalizedBlock.length) {
      const remainder = normalizedBlock.slice(regex.lastIndex).trim();
      if (remainder.length > 1) {
        sentences.push(remainder);
      }
    }
  }
  
  return sentences.length > 0 ? sentences : [cleanText.trim()];
}
