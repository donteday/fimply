export class PcmRecorder {
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
