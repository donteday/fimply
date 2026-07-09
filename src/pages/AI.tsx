import React, { useRef, useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';

interface Message { id: string; role: 'ai' | 'user'; text: string; }

const INITIAL: Message[] = [
  { id: '1', role: 'ai', text: 'Окей, давай без розовых очков. Что хочешь узнать про свои деньги?' },
  { id: '2', role: 'user', text: 'Почему я вечно в минусе к концу месяца?' },
  { id: '3', role: 'ai', text: 'Окей, честный ответ: у тебя 6 подписок (1 998 ₽) и 21 визит в Surf Coffee (8 420 ₽). Минус 10к ежемесячно на вещи, которые ты почти не используешь.\n\nХочу помочь — отменить лишние?' },
];

const CHIPS = ['Да, отменить 5', 'Покажи какие', 'Не сейчас'];

export default function AI() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: text.trim() }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: 'Анализирую данные… Подожди секунду.' }]);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
    }, 800);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: SB.bg }}>
      {/* AI header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1.5px solid ${SB.stroke}` }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: SB.lime, border: `1.5px solid ${SB.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 600, fontSize: 22, color: SB.ink }}>f</span>
        </div>
        <div>
          <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: SB.text, display: 'block' }}>Fimply</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.muted, display: 'block' }}>твой финансовый терапевт</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={m.id}>
            <div style={{
              maxWidth: '85%',
              borderRadius: 20,
              padding: 14,
              border: `1.5px solid ${m.role === 'ai' ? SB.ink : SB.stroke}`,
              backgroundColor: m.role === 'ai' ? SB.lime : SB.card,
              boxShadow: m.role === 'ai' ? `3px 3px 0px ${SB.ink}` : undefined,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginLeft: m.role === 'user' ? 'auto' : undefined,
              marginBottom: 4,
              whiteSpace: 'pre-wrap',
            }}>
              <span style={{ fontFamily: F.sans, fontSize: 14, lineHeight: '20px', color: m.role === 'ai' ? SB.ink : SB.text }}>{m.text}</span>
            </div>
            {m.role === 'ai' && i === messages.length - 1 && (
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 }}>
                {CHIPS.map(c => (
                  <button key={c} onClick={() => sendMessage(c)} style={{ paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8, border: `1.5px solid ${SB.stroke}`, borderRadius: 100, backgroundColor: SB.card }}>
                    <span style={{ fontFamily: F.sansMedium, fontWeight: 500, fontSize: 13, color: SB.text }}>{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: '12px 16px', paddingBottom: 90 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="спросить что-нибудь…"
          rows={1}
          style={{
            flex: 1, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
            borderRadius: 20, padding: '12px 16px', fontFamily: F.sans, fontSize: 14,
            color: SB.text, resize: 'none', maxHeight: 100, overflowY: 'auto',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          style={{
            width: 48, height: 48, borderRadius: 16, backgroundColor: SB.lime,
            border: `1.5px solid ${SB.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `3px 3px 0px ${SB.ink}`, flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 20, color: SB.ink }}>↑</span>
        </button>
      </div>
    </div>
  );
}
