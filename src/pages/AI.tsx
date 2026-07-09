import React, { useEffect, useRef, useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { chatWithAI, ChatMessage } from '../services/deepseek';
import { getTransactions } from '../services/storage';
import { Transaction } from '../types';

interface Message { id: string; role: 'ai' | 'user'; text: string; }

const INITIAL: Message[] = [
  { id: '1', role: 'ai', text: 'Окей, давай без розовых очков. Что хочешь узнать про свои деньги?' },
];

export default function AI() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTransactions(100).then(setTransactions).catch(() => {});
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const history: ChatMessage[] = nextMessages
        .slice(1)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

      const reply = await chatWithAI(history, transactions);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Что-то пошло не так. Проверь интернет или попробуй позже.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: SB.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1.5px solid ${SB.stroke}` }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: SB.lime, border: `1.5px solid ${SB.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 600, fontSize: 22, color: SB.ink }}>f</span>
        </div>
        <div>
          <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: SB.text, display: 'block' }}>Fimply</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.muted, display: 'block' }}>твой финансовый наставник</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(m => (
          <div key={m.id} style={{
            maxWidth: '85%',
            borderRadius: 20,
            padding: 14,
            border: `1.5px solid ${m.role === 'ai' ? SB.ink : SB.stroke}`,
            backgroundColor: m.role === 'ai' ? SB.lime : SB.card,
            boxShadow: m.role === 'ai' ? `3px 3px 0px ${SB.ink}` : undefined,
            marginLeft: m.role === 'user' ? 'auto' : undefined,
            whiteSpace: 'pre-wrap',
          }}>
            <span style={{ fontFamily: F.sans, fontSize: 14, lineHeight: '20px', color: m.role === 'ai' ? SB.ink : SB.text }}>{m.text}</span>
          </div>
        ))}

        {loading && (
          <div style={{
            maxWidth: '85%',
            borderRadius: 20,
            padding: '14px 18px',
            border: `1.5px solid ${SB.ink}`,
            backgroundColor: SB.lime,
            boxShadow: `3px 3px 0px ${SB.ink}`,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: '50%', backgroundColor: SB.ink,
                display: 'inline-block',
                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: '12px 16px', paddingBottom: 90 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="спросить что-нибудь…"
          rows={1}
          disabled={loading}
          style={{
            flex: 1, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
            borderRadius: 20, padding: '12px 16px', fontFamily: F.sans, fontSize: 14,
            color: SB.text, resize: 'none', maxHeight: 100, overflowY: 'auto',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 48, height: 48, borderRadius: 16,
            backgroundColor: loading || !input.trim() ? SB.card : SB.lime,
            border: `1.5px solid ${loading || !input.trim() ? SB.stroke : SB.ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: loading || !input.trim() ? 'none' : `3px 3px 0px ${SB.ink}`,
            flexShrink: 0, cursor: loading || !input.trim() ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 20, color: loading || !input.trim() ? SB.muted : SB.ink }}>↑</span>
        </button>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
