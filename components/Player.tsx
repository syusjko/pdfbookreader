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
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f8f9ff 0%, #fff 30%, #fffaf5 60%, #f5faff 100%)' }}>
        
        {/* 상단 네비게이션 */}
        <nav className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4285f4, #a259ff)' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">BookReader</span>
          </div>
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            Get API Key →
          </a>
        </nav>

        {/* 메인 히어로 섹션 */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          
          {/* 제목 영역 */}
          <div className="text-center mb-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 tracking-wide border" style={{ background: 'linear-gradient(135deg, #eef2ff, #faf5ff)', borderColor: '#e0d4fc', color: '#6d28d9' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #4285f4, #a259ff)' }} />
              Powered by Gemini AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-gray-900">Read books in</span><br />
              <span style={{ background: 'linear-gradient(135deg, #4285f4, #a259ff, #ea4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>any language.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              PDF를 업로드하면 AI가 문장을 읽어주고, 실시간 번역과<br className="hidden md:block" />
              구문 분석(직독직해)을 제공합니다.
            </p>
          </div>

          {/* 기능 태그 — 각각 다른 색상 */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: '🎧', label: 'TTS 음성 읽기', bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
              { icon: '🌐', label: '실시간 번역', bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
              { icon: '📐', label: '구문 분석', bg: '#fefce8', border: '#fde68a', color: '#a16207' },
              { icon: '📖', label: '챕터 내비게이션', bg: '#fdf2f8', border: '#fbcfe8', color: '#be185d' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: f.bg, borderWidth: 1, borderColor: f.border, color: f.color }}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* 업로드 + API 키 카드 */}
          <div className="w-full max-w-xl space-y-4">
            
            {/* 파일 업로드 영역 */}
            <label className="relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden" style={{ borderColor: '#c7d2fe', background: 'linear-gradient(180deg, #fafaff, #f5f3ff)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(180deg, #eef2ff, #ede9fe)' }} />
              <div className="relative flex flex-col items-center z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-lg transition-all duration-300" style={{ border: '1px solid #ddd6fe' }}>
                  <UploadCloud className="w-7 h-7 text-indigo-400 group-hover:text-indigo-600 transition" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">클릭하여 PDF 파일 업로드</p>
                <p className="text-xs text-gray-400">또는 파일을 여기에 드래그</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>

            {/* API 키 입력 */}
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl" style={{ background: '#fafafa', border: '1px solid #eee' }}>
              <Key className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                type="password" 
                placeholder="Gemini API 키를 입력하세요 (선택 사항)" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium" style={{ color: '#6d28d9' }}>책 본문을 스캔하고 있습니다...</span>
              </div>
            )}
          </div>
        </main>

        {/* 하단 푸터 */}
        <footer className="text-center py-6">
          <p className="text-xs text-gray-400">Built with Next.js · 100% 무료 · 모든 처리는 브라우저에서 수행됩니다</p>
        </footer>
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

  const breakdownList = Array.isArray(analysis?.breakdown) ? analysis.breakdown : [];

  // 모바일 해석 패널 토글
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      
      {/* 좌측 챕터 사이드바 — 데스크톱 전용 */}
      <div className="hidden md:block absolute left-0 top-0 bottom-28 w-72 z-50 group">
        <div className="absolute inset-0 w-16 bg-transparent z-10" />
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

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* 중앙 본문 영역 */}
        <div className="flex-1 relative flex flex-col justify-center items-center p-4 md:p-8 bg-white shadow-sm m-2 md:m-4 rounded-xl md:rounded-2xl border min-h-0">
          <AnimatePresence mode="popLayout">
            {prevSentence && (
              <motion.div
                key={`prev-${currentIndex}`}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0.15, y: -60, scale: 0.95 }}
                exit={{ opacity: 0 }}
                className="absolute text-gray-400 text-sm md:text-xl text-center max-w-3xl px-4 hidden md:block"
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
              className="absolute flex flex-col items-center justify-center max-w-5xl w-full z-10 px-3 md:px-4"
            >
              <div className="text-slate-800 font-bold text-xl sm:text-2xl md:text-3xl lg:text-5xl text-center leading-snug md:leading-tight drop-shadow-sm w-full">
                {currentSentence}
              </div>

              {/* 번역 자막 */}
              {analysis?.translation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 md:mt-8 text-sm sm:text-base md:text-xl lg:text-2xl text-slate-500 font-medium text-center tracking-wide px-2"
                >
                  {analysis.translation}
                </motion.div>
              )}
            </motion.div>

            {nextSentence && (
              <motion.div
                key={`next-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1, y: 60, scale: 0.95 }}
                className="absolute text-gray-300 text-sm md:text-xl text-center max-w-3xl px-4 hidden md:block"
                style={{ bottom: '15%' }}
              >
                {nextSentence}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 우측 패널: 직독직해 — 데스크톱에서만 사이드바 */}
        <div className="hidden md:flex w-96 bg-white border-l shadow-sm flex-col z-10">
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
                <div>
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">Sentence Breakdown</h4>
                  {breakdownList.length > 0 ? (
                    <div className="leading-[2.5rem] text-sm break-words">
                      {breakdownList.map((item, idx) => (
                        <span key={idx} className="inline-block mr-1">
                          <span className="text-slate-800 font-bold">{item.chunk}</span>
                          <span className="text-blue-600 font-medium ml-1">({item.meaning})</span>
                          <sup className="text-gray-400 ml-0.5 tracking-tighter">{item.role}</sup>
                          {idx < breakdownList.length - 1 && (
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

      {/* 🚀 모바일 해석 바텀시트 */}
      <div className="md:hidden">
        {showMobilePanel && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[55vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-800">AI 해석 & 직독직해</h3>
              </div>
              <button onClick={() => setShowMobilePanel(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">×</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {isAnalyzing ? (
                <div className="animate-pulse flex flex-col gap-3">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ) : analysis ? (
                <div>
                  {breakdownList.length > 0 ? (
                    <div className="leading-[2.2rem] text-sm break-words">
                      {breakdownList.map((item, idx) => (
                        <span key={idx} className="inline-block mr-1">
                          <span className="text-slate-800 font-bold">{item.chunk}</span>
                          <span className="text-blue-600 font-medium ml-1">({item.meaning})</span>
                          <sup className="text-gray-400 ml-0.5 tracking-tighter">{item.role}</sup>
                          {idx < breakdownList.length - 1 && (
                            <span className="text-slate-300 mx-1 align-middle">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">분석 결과가 없습니다.</div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>

      {/* 하단 재생 바 */}
      <div className="h-20 md:h-28 bg-white border-t flex flex-col justify-center px-4 md:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
        
        <div className="flex items-center justify-between gap-2 md:gap-4 mb-2 md:mb-4">
          <span className="text-[10px] md:text-xs font-mono text-gray-400 font-medium w-6 md:w-8 text-right">{currentIndex + 1}</span>
          
          <div className="relative flex-1 flex items-center h-4 group">
            <div className="absolute w-full h-1 md:h-1.5 bg-gray-200 rounded-lg pointer-events-none" />
            
            <div 
              className="absolute h-1 md:h-1.5 bg-blue-500 rounded-l-lg pointer-events-none transition-all duration-150"
              style={{ width: `${(currentIndex / Math.max(1, sentences.length - 1)) * 100}%` }} 
            />
            
            {chapters.map((chap) => (
              <div 
                key={chap.index}
                className="absolute w-1 md:w-1.5 h-2 md:h-3 bg-white border border-slate-300 rounded-sm hover:scale-150 hover:bg-blue-500 hover:border-blue-600 transition-all z-10 cursor-pointer shadow-sm"
                style={{ left: `calc(${(chap.index / Math.max(1, sentences.length - 1)) * 100}% - 2px)` }}
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

          <span className="text-[10px] md:text-xs font-mono text-gray-400 font-medium w-6 md:w-8">{sentences.length}</span>
        </div>
        
        <div className="flex justify-center items-center gap-4 md:gap-6">
          <button 
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            className="p-2 md:p-3 rounded-full hover:bg-gray-100 text-slate-600 transition"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          {/* 모바일: 해석 패널 토글 버튼 */}
          <button 
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="md:hidden p-2 rounded-full hover:bg-blue-50 text-blue-500 transition"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button 
            onClick={togglePlay}
            className="p-3 md:p-4 bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-white transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 md:w-7 md:h-7" /> : <Play className="w-5 h-5 md:w-7 md:h-7 ml-0.5" />}
          </button>
          
          <button 
            onClick={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
            className="p-2 md:p-3 rounded-full hover:bg-gray-100 text-slate-600 transition"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
