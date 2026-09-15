import { useState, useEffect, useRef } from 'react';

export type NoiseType = 'none' | 'white' | 'brown' | 'pink' | 'rain' | 'heavy_rain' | 'ocean' | 'fan';

export function useWhiteNoise() {
  const [noiseType, setNoiseType] = useState<NoiseType>('none');
  const [volume, setVolume] = useState(0.2);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  useEffect(() => {
    if (noiseType === 'none') {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      nodesRef.current.forEach(n => { try { n.disconnect() } catch(e){} });
      nodesRef.current = [];
      return;
    }

    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
      sourceRef.current.disconnect();
    }
    nodesRef.current.forEach(n => { try { n.disconnect() } catch(e){} });
    nodesRef.current = [];

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      
      if (noiseType === 'brown' || noiseType === 'ocean' || noiseType === 'fan') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
      } else if (noiseType === 'pink' || noiseType === 'rain' || noiseType === 'heavy_rain') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      } else {
        // pure white
        output[i] = white * 0.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    sourceRef.current = source;
    nodesRef.current.push(source);

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;
    nodesRef.current.push(gainNode);

    let lastNode: AudioNode = source;

    if (noiseType === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      lastNode.connect(filter);
      lastNode = filter;
      nodesRef.current.push(filter);
    } else if (noiseType === 'heavy_rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      lastNode.connect(filter);
      lastNode = filter;
      nodesRef.current.push(filter);
    } else if (noiseType === 'ocean') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // 10s cycle
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      
      lfo.connect(lfoGain.gain);
      lfo.start();
      
      lastNode.connect(filter);
      filter.connect(lfoGain);
      lastNode = lfoGain;
      
      nodesRef.current.push(filter, lfo, lfoGain);
    } else if (noiseType === 'fan') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      lastNode.connect(filter);
      lastNode = filter;
      nodesRef.current.push(filter);
    }

    lastNode.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
        sourceRef.current.disconnect();
      }
      nodesRef.current.forEach(n => { try { n.disconnect() } catch(e){} });
      nodesRef.current = [];
    };
  }, [noiseType]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
    }
  }, [volume]);

  return { noiseType, setNoiseType, volume, setVolume };
}
