import React, { useRef, useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { transcribeAudio } from '../services/yandexStt';
import { parseVoiceInput } from '../services/deepseek';
import { ParsedTransaction } from '../types';

interface Props { onResult: (parsed: ParsedTransaction) => void; }

// Records raw 16kHz mono PCM — works on all browsers, accepted by Yandex as lpcm
class PcmRecorder {
  private ctx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private samples: Int16Array[] = [];

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } });
    this.ctx = new AudioContext({ sampleRate: 16000 });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.samples = [];

    this.processor.onaudioprocess = (e) => {
      const f32 = e.inputBuffer.getChannelData(0);
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
      }
      this.samples.push(i16);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
  }

  async stop(): Promise<Blob> {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    await this.ctx?.close();

    const total = this.samples.reduce((s, a) => s + a.length, 0);
    const out = new Int16Array(total);
    let offset = 0;
    for (const s of this.samples) { out.set(s, offset); offset += s.length; }

    return new Blob([out.buffer], { type: 'audio/lpcm' });
  }
}

export function VoiceButton({ onResult }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef(new PcmRecorder());

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Микрофон недоступен. Убедись что сайт открыт по HTTPS.');
      return;
    }
    try {
      await recorder.current.start();
      setState('recording');
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError'
        ? 'Нет доступа к микрофону — разреши в настройках браузера'
        : 'Не удалось запустить запись');
    }
  };

  const stopRecording = async () => {
    if (state !== 'recording') return;
    setState('processing');
    try {
      const blob = await recorder.current.stop();
      recorder.current = new PcmRecorder();

      const text = await transcribeAudio(blob);
      if (!text) throw new Error('Пустой ответ от Yandex');

      const parsed = await parseVoiceInput(text);
      if (parsed) {
        onResult(parsed);
      } else {
        setError('Не понял. Попробуй: «потратил 340 на кофе»');
        setState('idle');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Что-то пошло не так');
      setState('idle');
    }
  };

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {isRecording && (
        <>
          <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, border: `1.5px solid ${SB.lime}`, animation: 'ringPulse 1.5s ease-out infinite' }} />
          <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, border: `1.5px solid ${SB.lime}`, animation: 'ringPulse 1.5s ease-out 0.5s infinite' }} />
        </>
      )}
      <button
        onPointerDown={state === 'idle' ? startRecording : undefined}
        onPointerUp={isRecording ? stopRecording : undefined}
        onPointerLeave={isRecording ? stopRecording : undefined}
        disabled={isProcessing}
        style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: isRecording ? SB.danger : SB.lime,
          border: `1.5px solid ${SB.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isProcessing ? 'none' : `4px 4px 0px ${SB.ink}`,
          opacity: isProcessing ? 0.6 : 1,
          cursor: isProcessing ? 'default' : 'pointer',
          userSelect: 'none', touchAction: 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        <span style={{ fontSize: 32 }}>{isProcessing ? '…' : '🎤'}</span>
      </button>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: SB.dim, letterSpacing: 1.5, marginTop: 16, textAlign: 'center' }}>
        {isRecording ? '● ОТПУСТИ ЧТОБЫ ОТПРАВИТЬ' : isProcessing ? 'ОБРАБАТЫВАЮ…' : 'ДЕРЖИ И ГОВОРИ'}
      </span>
      {error && (
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255,119,102,0.15)', border: `1px solid ${SB.danger}`, maxWidth: 260, textAlign: 'center' }}>
          <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.danger }}>{error}</span>
        </div>
      )}
    </div>
  );
}
