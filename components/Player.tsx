"use client";

import { useState, useEffect, useRef } from 'react';
import { extractTextFromPdf, findStoryStartIndex, splitIntoSentences } from '../lib/pdfUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, UploadCloud, Key, BookOpen, Volume2, Menu } from 'lucide-react';

export default function Player() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [apiKey, setApiKey] = useState('');
  
  const [analysis, setAnalysis] = useState<{
    translation?: string; 
    grammar?: string[] | string;
    breakdown?: { chunk: string; meaning: string; role: string }[];
  } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bookLang, setBookLang] = useState('en-US');

  const [chapters, setChapters] = useState<{index: number, title: string}[]>([]);

  const CHUNK_SIZE = 10;
  const [cacheTrigger, setCacheTrigger] = useState(0);
  const analysisCache = useRef<Record<number, any>>({});

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await extractTextFromPdf(file);
      const startIndex = findStoryStartIndex(text);
      const storyText = text.slice(startIndex);
      const split = splitIntoSentences(storyText);
      
      const frCount = (storyText.match(/[éèàùçâêîôû]/gi) || []).length;
      const koCount = (storyText.match(/[가-힣]/g) || []).length;
      setBookLang(koCount > 50 ? 'ko-KR' : (frCount > 20 ? 'fr-FR' : 'en-US'));

      // 🚀 개선된 챕터 추출 알고리즘 (문장 앞머리 매칭)
      const extractedChapters: {index: number, title: string}[] = [];
      const chRegex = /^(PREMIER|DEUXI[ÈE]ME|TROISI[ÈE]ME|QUATRI[ÈE]ME|CINQUI[ÈE]ME|SIXI[ÈE]ME|SEPTI[ÈE]ME|HUITI[ÈE]ME|NEUVI[ÈE]ME|DIXI[ÈE]ME)\s+CHAPITRE|^(CHAPITRE|CHAPTER)\s*(?:[IVX]+|\d+)|^제\s*\d+\s*장/i;
      const romanStandalone = /^([IVXL]+)\.?$/i;

      for (let i = 0; i < split.length; i++) {
        const s = split[i].trim();
        const match = s.match(chRegex);
        
        if (match) {
          extractedChapters.push({ index: i, title: match[0].toUpperCase() });
        } else if (s.length < 10 && romanStandalone.test(s)) {
          extractedChapters.push({ index: i, title: s.toUpperCase() });
        }
      }
      
      setChapters(extractedChapters);
      setSentences(split);
      setCurrentIndex(0);
      analysisCache.current = {}; 
      setCacheTrigger(0);
    } catch (err) {
      console.error(err);
      alert('PDF 파싱 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  const getBestVoice = () => {
    const langVoices = availableVoices.filter(v => v.lang.startsWith(bookLang.split('-')[0]));
    
    if (selectedVoice && selectedVoice.lang.startsWith(bookLang.split('-')[0])) {
      return selectedVoice;
    }

    const premiumVoice = langVoices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Neural') || 
      v.name.includes('Premium') || 
      v.name.includes('Google')
    );

    return premiumVoice || langVoices[0] || availableVoices[0];
  };

  const fetchChunk = (chunkIdx: number) => {
    if (!apiKey || chunkIdx * CHUNK_SIZE >= sentences.length) return;
    if (analysisCache.current[chunkIdx]) return; 
    
    const chunkSentences = sentences.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);
    
    const promise = fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentences: chunkSentences, apiKey })
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        analysisCache.current[chunkIdx] = data; 
        setCacheTrigger(prev => prev + 1);   
      } else {
        delete analysisCache.current[chunkIdx]; 
      }
    })
    .catch(() => {
      delete analysisCache.current[chunkIdx];
    });

    analysisCache.current[chunkIdx] = promise;
  };

  useEffect(() => {
    if (sentences.length === 0 || !apiKey) return;

    const currentChunkIdx = Math.floor(currentIndex / CHUNK_SIZE);
    const relativeIndex = currentIndex % CHUNK_SIZE;
    
    const currentChunkData = analysisCache.current[currentChunkIdx];

    if (currentChunkData && Array.isArray(currentChunkData)) {
      setAnalysis(currentChunkData[relativeIndex] || null);
      setIsAnalyzing(false);
    } else {
      setAnalysis(null);
      setIsAnalyzing(true);
      if (!currentChunkData) {
        fetchChunk(currentChunkIdx);
      }
    }

    fetchChunk(currentChunkIdx + 1);
  }, [currentIndex, sentences, apiKey, cacheTrigger]); 

  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    if (sentences.length === 0 || currentIndex >= sentences.length) {
      setIsPlaying(false);
      return;
    }

    const currentText = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(currentText);
    
    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    
    utterance.rate = 0.75; 
    
    utterance.onend = () => {
      if (isPlaying) {
        setCurrentIndex((prev) => prev + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted') return;
      console.error('TTS Error', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, isPlaying, sentences, availableVoices, bookLang]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value));
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  if (sentences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-lg mb-8 bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Key className="w-6 h-6" />
            <h2 className="font-semibold text-lg">Gemini API 키 입력 (선택)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">문법 분석과 번역 기능을 사용하려면 구글 AI 스튜디오에서 무료 API 키를 발급받아 입력해주세요.</p>
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <label className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-blue-50 transition group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-12 h-12 mb-4 text-gray-400 group-hover:text-blue-500 transition" />
            <p className="mb-2 text-gray-700"><span className="font-semibold">클릭하거나 드래그하여 책(PDF) 업로드</span></p>
            <p className="text-sm text-gray-500">목차를 제외한 본문을 자동으로 찾아 읽기 시작합니다.</p>
          </div>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
        </label>
        {isLoading && <p className="mt-6 text-blue-600 font-medium animate-pulse">📚 책 본문을 스캔하고 있습니다...</p>}
      </div>
    );
  }

  const prevSentence = currentIndex > 0 ? sentences[currentIndex - 1] : '';
  const currentSentence = sentences[currentIndex];
  const nextSentence = currentIndex < sentences.length - 1 ? sentences[currentIndex + 1] : '';

  const grammarList = Array.isArray(analysis?.grammar) 
    ? analysis.grammar 
    : (typeof analysis?.grammar === 'string' 
        ? (analysis.grammar as string).split('\n').filter(s => s.trim().length > 0) 
        : []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      
      {/* 🚀 완전히 투명하고 심리스한 좌측 챕터 사이드바 */}
      <div className="absolute left-0 top-0 bottom-28 w-72 z-50 group">
        {/* 보이지 않는 호버 트리거 영역 */}
        <div className="absolute inset-0 w-16 bg-transparent z-10" />
        
        {/* 챕터 목록 (마우스를 올리면 텍스트만 스르륵 나타남) */}
        <div className="absolute inset-0 p-8 pl-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-y-auto scrollbar-hide flex flex-col pointer-events-none group-hover:pointer-events-auto">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 mb-8 uppercase">Contents</h2>
          <div className="space-y-6">
            {chapters.length === 0 ? (
              <div className="text-slate-400 text-sm">감지된 챕터가 없습니다.</div>
            ) : (
              chapters.map((chap, i) => {
                const isCurrent = currentIndex >= chap.index && (i === chapters.length - 1 || currentIndex < chapters[i+1].index);
                return (
                  <button
                    key={chap.index}
                    onClick={() => setCurrentIndex(chap.index)}
                    className={`block w-full text-left text-sm transition-all duration-300 ${
                      isCurrent 
                        ? 'text-blue-600 font-extrabold translate-x-2 scale-105 origin-left' 
                        : 'text-slate-400 hover:text-slate-700 hover:translate-x-1'
                    }`}
                  >
                    {chap.title}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 중앙 본문 영역 */}
        <div className="flex-1 relative flex flex-col justify-center items-center p-8 bg-white shadow-sm m-4 rounded-2xl border">
          <AnimatePresence mode="popLayout">
            {prevSentence && (
              <motion.div
                key={`prev-${currentIndex}`}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0.15, y: -100, scale: 0.95 }}
                exit={{ opacity: 0 }}
                className="absolute text-gray-400 text-xl text-center max-w-3xl px-4"
                style={{ top: '15%' }}
              >
                {prevSentence}
              </motion.div>
            )}

            <motion.div
              key={`current-${currentIndex}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="absolute flex flex-col items-center justify-center max-w-5xl w-full z-10 px-4"
            >
              <div className="text-slate-800 font-bold text-3xl md:text-5xl text-center leading-tight drop-shadow-sm w-full">
                {currentSentence}
              </div>

              {/* 번역 자막 */}
              {analysis?.translation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-xl md:text-2xl text-slate-500 font-medium text-center tracking-wide"
                >
                  {analysis.translation}
                </motion.div>
              )}
            </motion.div>

            {nextSentence && (
              <motion.div
                key={`next-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1, y: 100, scale: 0.95 }}
                className="absolute text-gray-300 text-xl text-center max-w-3xl px-4"
                style={{ bottom: '15%' }}
              >
                {nextSentence}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 우측 패널: 직독직해 UI */}
        <div className="w-96 bg-white border-l shadow-sm flex flex-col z-10">
          <div className="p-4 border-b bg-blue-50/50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">AI 해석 & 직독직해</h3>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {!apiKey ? (
              <div className="text-center text-gray-500 mt-10">
                <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">API 키를 입력하면 이곳에<br/>해석이 나타납니다.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="animate-pulse flex flex-col gap-4 mt-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                
                {/* 컴팩트한 슬래시 표기법 직독직해 */}
                <div>
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">Sentence Breakdown</h4>
                  {Array.isArray(analysis.breakdown) && analysis.breakdown.length > 0 ? (
                    <div className="leading-[2.5rem] text-sm break-words">
                      {analysis.breakdown.map((item, idx) => (
                        <span key={idx} className="inline-block mr-1">
                          <span className="text-slate-800 font-bold">{item.chunk}</span>
                          <span className="text-blue-600 font-medium ml-1">({item.meaning})</span>
                          <sup className="text-gray-400 ml-0.5 tracking-tighter">{item.role}</sup>
                          {idx < analysis.breakdown.length - 1 && (
                            <span className="text-slate-300 mx-1.5 align-middle">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : grammarList.length > 0 ? (
                    <ul className="space-y-3">
                      {grammarList.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{point.replace(/^- /g, '')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400 py-4">구문 분석 결과가 없습니다.</div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 하단 재생 바 */}
      <div className="h-28 bg-white border-t flex flex-col justify-center px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
        
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-xs font-mono text-gray-400 font-medium w-8 text-right">{currentIndex + 1}</span>
          
          <div className="relative flex-1 flex items-center h-4 group">
            <div className="absolute w-full h-1.5 bg-gray-200 rounded-lg pointer-events-none" />
            
            <div 
              className="absolute h-1.5 bg-blue-500 rounded-l-lg pointer-events-none transition-all duration-150"
              style={{ width: `${(currentIndex / Math.max(1, sentences.length - 1)) * 100}%` }} 
            />
            
            {chapters.map((chap) => (
              <div 
                key={chap.index}
                className="absolute w-1.5 h-3 bg-white border border-slate-300 rounded-sm hover:scale-150 hover:bg-blue-500 hover:border-blue-600 transition-all z-10 cursor-pointer shadow-sm group-hover:h-4 group-hover:w-2"
                style={{ left: `calc(${(chap.index / Math.max(1, sentences.length - 1)) * 100}% - 3px)` }}
                title={chap.title}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(chap.index);
                }}
              />
            ))}

            <input
              type="range"
              min={0}
              max={sentences.length - 1}
              value={currentIndex}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>

          <span className="text-xs font-mono text-gray-400 font-medium w-8">{sentences.length}</span>
        </div>
        
        <div className="flex justify-center items-center gap-6">
          <button 
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            className="p-3 rounded-full hover:bg-gray-100 text-slate-600 transition"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="p-4 bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-white transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          
          <button 
            onClick={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
            className="p-3 rounded-full hover:bg-gray-100 text-slate-600 transition"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
