"use client";

import { useState, useEffect, useRef } from 'react';
import { extractTextFromPdf, findStoryStartIndex, splitIntoSentences } from '../lib/pdfUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, UploadCloud, Key, BookOpen, Loader2 } from 'lucide-react';

export default function Player() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isAudioLoading, setIsAudioLoading] = useState(false); 
  const [prefetchStatus, setPrefetchStatus] = useState<string>('');
  
  const [apiKey, setApiKey] = useState('');
  
  const [analysis, setAnalysis] = useState<{
    translation?: string; 
    grammar?: string[] | string;
    breakdown?: { chunk: string; meaning: string; role: string }[];
  } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bookLang, setBookLang] = useState('en-US');

  const [chapters, setChapters] = useState<{index: number, title: string}[]>([]);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState(1.0); 

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 3500); 
    } else if (!isPlaying) {
      setShowControls(true);
    }
    return () => clearTimeout(timeoutId);
  }, [isPlaying, showControls]);
  
  const CHUNK_SIZE = 10;
  const [cacheTrigger, setCacheTrigger] = useState(0);
  const analysisCache = useRef<Record<number, any>>({});
  
  const audioCache = useRef<Record<number, Promise<string | null>>>({});
  const activeFetches = useRef<Set<number>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAbortRef = useRef<AbortController | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingText('Extracting PDF text...');
    
    try {
      await new Promise(r => setTimeout(r, 100));
      
      const text = await extractTextFromPdf(file);
      
      setLoadingText('Analyzing chapters...');
      await new Promise(r => setTimeout(r, 50));
      
      const startIndex = findStoryStartIndex(text);
      const storyText = text.slice(startIndex);
      const split = splitIntoSentences(storyText);
      
      const frCount = (storyText.match(/[éèàùçâêîôû]/gi) || []).length;
      const koCount = (storyText.match(/[가-힣]/g) || []).length;
      const jaCount = (storyText.match(/[ぁ-んァ-ン一-龥]/g) || []).length;
      
      if (jaCount > 50) setBookLang('ja-JP');
      else if (koCount > 50) setBookLang('ko-KR');
      else if (frCount > 20) setBookLang('fr-FR');
      else setBookLang('en-US');

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
      
      Object.values(audioCache.current).forEach(p => {
        p.then(url => { if (url) URL.revokeObjectURL(url); }).catch(() => {});
      });
      audioCache.current = {};
      activeFetches.current.clear();
      
      setCacheTrigger(0);
      
      if (apiKey.trim()) {
        setShowMobilePanel(true);
      }
    } catch (err: any) {
      console.error(err);
      alert('PDF 파싱 중 오류가 발생했습니다: ' + (err?.message || String(err)));
    }
    setIsLoading(false);
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

  const fetchAudioForIndex = (index: number): Promise<string | null> => {
    if (index >= sentences.length) return Promise.resolve(null);
    if (index in audioCache.current) return audioCache.current[index];
    if (activeFetches.current.has(index)) return Promise.resolve(null);

    activeFetches.current.add(index);
    setPrefetchStatus('Buffering AI Voice...');
    const text = sentences[index];
    
    const apiUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(bookLang)}&speed=${encodeURIComponent(readingSpeed)}`;

    const promise = fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        activeFetches.current.delete(index);
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return URL.createObjectURL(blob);
      })
      .catch(err => {
        console.error(`Prefetch error for index ${index}:`, err);
        activeFetches.current.delete(index);
        delete audioCache.current[index]; 
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return null;
      });

    audioCache.current[index] = promise;
    return promise;
  };

  useEffect(() => {
    if (sentences.length === 0) return;
    
    let isCancelled = false;
    
    const prefetchAhead = async () => {
      for (let i = 0; i <= 7; i++) {
        if (isCancelled) break;
        const targetIdx = currentIndex + i;
        if (targetIdx >= sentences.length) break;
        
        if (!(targetIdx in audioCache.current) && !activeFetches.current.has(targetIdx)) {
          await fetchAudioForIndex(targetIdx);
        }
      }
    };
    
    prefetchAhead();
    
    return () => { isCancelled = true; };
  }, [currentIndex, sentences, bookLang, readingSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = readingSpeed;
    }
  }, [readingSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || sentences.length === 0) return;

    if (!isPlaying) {
      audio.pause();
      playAbortRef.current?.abort();
      return;
    }

    if (currentIndex >= sentences.length) {
      setIsPlaying(false);
      return;
    }
    
    const abortCtrl = new AbortController();
    playAbortRef.current = abortCtrl;
    setIsAudioLoading(true);

    (async () => {
      try {
        const blobUrl = await fetchAudioForIndex(currentIndex);
        if (abortCtrl.signal.aborted) return;

        if (!blobUrl) {
          throw new Error("Failed to load audio");
        }

        audio.src = blobUrl;
        audio.playbackRate = readingSpeed;
        setIsAudioLoading(false);
        await audio.play();
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('TTS play error:', e);
        setIsAudioLoading(false);
        setIsPlaying(false);
      }
    })();

    return () => {
      abortCtrl.abort();
    };
  }, [currentIndex, isPlaying, sentences]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIdx = parseInt(e.target.value);
    setCurrentIndex(newIdx);
  };

  const togglePlay = () => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(prev => !prev);
  };

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-black relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin mb-4 text-black" />
             <p className="font-mono text-sm uppercase tracking-widest text-black">{loadingText}</p>
             <p className="text-[10px] text-gray-400 mt-2">Depending on the size, this may take a moment.</p>
          </div>
        )}
        
        <nav className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-base font-bold tracking-tight">BookReader <span className="text-xs text-gray-400 font-mono">v23</span></span>
          </div>
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-mono text-gray-500 hover:text-black transition-colors"
          >
            [ GET_API_KEY ]
          </a>
        </nav>

        <main className="flex-1 overflow-y-auto flex flex-col px-6 py-10">
          <div className="m-auto w-full flex flex-col items-center justify-center max-w-2xl">
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4 md:mb-6">
                READ.<br />
                <span className="text-gray-400">TRANSLATE.</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
                PDF 문서를 업로드하면 기계가 문장을 소리 내어 읽고, 구조를 해체하여 직독직해를 제공합니다.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-10 md:mb-12">
              {['TEXT-TO-SPEECH', 'TRANSLATION', 'SYNTAX-ANALYSIS', 'CHAPTER-NAV'].map((label) => (
                <div key={label} className="px-3 py-1 border border-gray-300 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wider">
                  {label}
                </div>
              ))}
            </div>

            <div className="w-full max-w-md space-y-3 pb-8">
              <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group">
                <div className="flex flex-col items-center text-center px-4">
                  <UploadCloud className="w-6 h-6 text-black mb-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-semibold text-black mb-1">UPLOAD PDF</p>
                  <p className="text-[10px] md:text-xs text-gray-500">Click or drag and drop</p>
                </div>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>

              <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 bg-white">
                <Key className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="password" 
                  placeholder="Enter API Key (Optional)" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono text-black placeholder:text-gray-400 outline-none"
                />
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center py-5 border-t border-gray-200 shrink-0">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Built with Next.js · Powered by AI Voices</p>
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

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-black relative overflow-hidden">
      
      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => {
          if (isPlaying) {
            // 자연스러운 문장 간 숨쉬기(띄어읽기) 간격 400ms 추가
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
            }, 400);
          }
        }}
        onError={(e) => {
          console.error('Audio element error:', e);
          setIsPlaying(false);
        }}
      />

      <div className="hidden md:block absolute left-0 top-0 bottom-24 w-72 z-50 group">
        <div className="absolute inset-0 w-12 bg-transparent z-10" />
        <div className="absolute inset-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-y-auto scrollbar-hide flex flex-col pointer-events-none group-hover:pointer-events-auto bg-white/95 border-r border-gray-200">
          <h2 className="text-[10px] font-mono tracking-widest text-gray-400 mb-8 uppercase">Index</h2>
          <div className="space-y-4">
            {chapters.length === 0 ? (
              <div className="text-gray-400 text-xs font-mono">NO CHAPTERS</div>
            ) : (
              chapters.map((chap, i) => {
                const isCurrent = currentIndex >= chap.index && (i === chapters.length - 1 || currentIndex < chapters[i+1].index);
                return (
                  <button
                    key={chap.index}
                    onClick={() => setCurrentIndex(chap.index)}
                    className={`block w-full text-left text-xs font-mono transition-all duration-200 uppercase ${
                      isCurrent 
                        ? 'text-black font-bold pl-2 border-l-2 border-black' 
                        : 'text-gray-400 hover:text-black hover:pl-1'
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

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-gray-200">
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showMobilePanel ? 'h-[40vh] md:h-full' : 'h-full'}`}>
          <div 
            className="flex-1 relative flex flex-col justify-center items-center p-4 md:p-8 bg-[#fafafa] min-h-0 cursor-pointer md:cursor-default"
            onClick={() => {
              if (isPlaying) setShowControls(!showControls);
            }}
          >
            {prefetchStatus && (
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1 bg-white/80 border border-gray-200 rounded-full shadow-sm pointer-events-none">
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{prefetchStatus}</span>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {prevSentence && (
                <motion.div
                  key={`prev-${currentIndex}`}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0.1, y: -60, scale: 0.98 }}
                  exit={{ opacity: 0 }}
                  className={`absolute text-black text-center max-w-3xl px-4 hidden md:block tracking-tight ${showMobilePanel ? 'text-xs' : 'text-sm md:text-lg'}`}
                  style={{ top: '15%' }}
                >
                  {prevSentence}
                </motion.div>
              )}

              <motion.div
                key={`current-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "tween", duration: 0.3 }}
                className="absolute flex flex-col items-center justify-center max-w-5xl w-full z-10 px-4 md:px-8"
              >
                <div className={`text-black font-bold text-center leading-snug md:leading-tight tracking-tighter w-full transition-all duration-300 ${showMobilePanel ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'}`}>
                  {currentSentence}
                </div>

                {analysis?.translation && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`mt-4 md:mt-10 text-gray-500 font-mono text-center tracking-wide px-2 uppercase transition-all duration-300 ${showMobilePanel ? 'text-[10px]' : 'text-xs sm:text-sm md:text-base'}`}
                  >
                    {analysis.translation}
                  </motion.div>
                )}
              </motion.div>

              {nextSentence && (
                <motion.div
                  key={`next-${currentIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.05, y: 60, scale: 0.98 }}
                  className={`absolute text-black text-center max-w-3xl px-4 hidden md:block tracking-tight ${showMobilePanel ? 'text-xs' : 'text-sm md:text-lg'}`}
                  style={{ bottom: '15%' }}
                >
                  {nextSentence}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {showMobilePanel && (
            <div className="md:hidden h-[45vh] bg-white border-t border-black flex flex-col shadow-inner">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-black">Syntax Analysis</h3>
                <button onClick={() => setShowMobilePanel(false)} className="text-black text-lg leading-none px-2 font-mono">×</button>
              </div>
              <div className="flex-1 p-5 overflow-y-auto">
                {isAnalyzing ? (
                  <div className="animate-pulse flex flex-col gap-3">
                    <div className="h-2 bg-gray-200 w-3/4"></div>
                    <div className="h-2 bg-gray-200 w-full"></div>
                  </div>
                ) : analysis ? (
                  <div>
                    {breakdownList.length > 0 ? (
                      <div className="leading-[2rem] text-sm break-words">
                        {breakdownList.map((item, idx) => (
                          <span key={idx} className="inline-block mr-1">
                            <span className="text-black font-semibold">{item.chunk}</span>
                            <span className="text-gray-500 text-xs ml-1 font-mono">[{item.meaning}]</span>
                            {idx < breakdownList.length - 1 && (
                              <span className="text-gray-300 mx-1 align-middle">/</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">No data</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col z-10">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-black">Syntax Analysis</h3>
            <span className="w-2 h-2 bg-black rounded-full" />
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {!apiKey ? (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-xs font-mono uppercase tracking-widest mb-2">[ API_KEY_REQUIRED ]</p>
                <p className="text-[10px] text-gray-400">Settings &gt; API Key</p>
              </div>
            ) : isAnalyzing ? (
              <div className="animate-pulse flex flex-col gap-3 mt-4">
                <div className="h-2 bg-gray-200 w-3/4"></div>
                <div className="h-2 bg-gray-200 w-full"></div>
                <div className="h-2 bg-gray-200 w-5/6"></div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div>
                  {breakdownList.length > 0 ? (
                    <div className="leading-[2.2rem] text-sm break-words">
                      {breakdownList.map((item, idx) => (
                        <span key={idx} className="inline-block mr-1">
                          <span className="text-black font-semibold">{item.chunk}</span>
                          <span className="text-gray-500 text-xs ml-1 font-mono">[{item.meaning}]</span>
                          {idx < breakdownList.length - 1 && (
                            <span className="text-gray-300 mx-2 align-middle">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : grammarList.length > 0 ? (
                    <ul className="space-y-3">
                      {grammarList.map((point: string, idx: number) => (
                        <li key={idx} className="text-xs font-mono text-gray-600 flex items-start gap-2">
                          <span className="text-black">-</span>
                          <span>{point.replace(/^- /g, '')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 py-4">No data</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div 
        className={`
          absolute md:relative bottom-0 inset-x-0
          h-24 md:h-24 bg-white flex flex-col justify-center px-4 md:px-10 z-30
          border-t border-gray-200
          transition-transform duration-300 ease-in-out
          ${showControls ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{currentIndex + 1}</span>
          
          <div className="relative flex-1 flex items-center h-2 group">
            <div className="absolute w-full h-[2px] bg-gray-200 pointer-events-none" />
            
            <div 
              className="absolute h-[2px] bg-black pointer-events-none transition-all duration-150"
              style={{ width: `${(currentIndex / Math.max(1, sentences.length - 1)) * 100}%` }} 
            />
            
            {chapters.map((chap) => (
              <div 
                key={chap.index}
                className="absolute w-[2px] h-[8px] bg-white border border-gray-400 hover:border-black hover:bg-black transition-all z-10 cursor-pointer"
                style={{ left: `calc(${(chap.index / Math.max(1, sentences.length - 1)) * 100}% - 1px)` }}
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

          <span className="text-[10px] font-mono text-gray-400 w-8">{sentences.length}</span>
        </div>
        
        <div className="flex justify-center items-center gap-6 md:gap-10">
          <button 
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className={`md:hidden p-2 transition-colors ${showMobilePanel ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button 
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors"
          >
            {isAudioLoading && isPlaying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-1" />
            )}
          </button>
          
          <button 
            onClick={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setReadingSpeed(prev => {
                if (prev === 0.65) return 0.85;
                if (prev === 0.85) return 1.0;
                return 0.65;
              });
            }}
            className="w-10 text-[10px] font-mono font-bold text-gray-400 hover:text-black transition-colors"
          >
            {readingSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
}
