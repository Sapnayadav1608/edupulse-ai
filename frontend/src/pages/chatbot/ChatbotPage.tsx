import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, Trash2, Sparkles, Copy, Check, RotateCcw,
  Mic, MicOff, ImagePlus, X, Smile,
  Download, Search, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'gemini' | 'fallback';
  image?: string;
  reaction?: '👍' | '👎' | '❤️' | '😂' | '😮';
  isStreaming?: boolean;
}

const SUGGESTED = [
  { emoji: '📈', text: 'How can I improve my CGPA?' },
  { emoji: '💼', text: 'Tips for placement interviews' },
  { emoji: '🔧', text: 'Explain Data Structures with examples' },
  { emoji: '📚', text: 'How to prepare for semester exams?' },
  { emoji: '🗄️', text: 'Difference between SQL and NoSQL?' },
  { emoji: '💻', text: 'Best way to learn programming?' },
];

const REACTIONS: Message['reaction'][] = ['👍', '👎', '❤️', '😂', '😮'];

const formatMessage = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.12);padding:1px 6px;border-radius:4px;font-size:0.8em">$1</code>')
    .replace(/^#{1,3}\s(.+)$/gm, '<p class="font-semibold text-white mt-2 mb-0.5">$1</p>')
    .replace(/^•\s(.+)$/gm, '<li style="margin-left:1rem;list-style:disc">$1</li>')
    .replace(/^\d+\.\s(.+)$/gm, '<li style="margin-left:1rem;list-style:decimal">$1</li>')
    .replace(/\n/g, '<br/>');

let msgId = 0;

// ── Speech Recognition type shim ────────────────────────
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const ChatbotPage = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([{
    id: ++msgId,
    role: 'assistant',
    content: `👋 Hi **${user?.name?.split(' ')[0]}**! I'm EduPulse AI — your personal assistant.\n\nI can help you with:\n• 📚 Academic subjects & doubts\n• 💡 Study tips & exam strategies\n• 💼 Placement & interview guidance\n• 💻 Programming & DSA concepts\n• 📊 CGPA improvement strategies\n\nAsk me anything — text, voice, or send an image! 🎤🖼️`,
    timestamp: new Date(),
  }]);

  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState<number | null>(null);
  const [listening, setListening]   = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showReaction, setShowReaction] = useState<number | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const chatRef     = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Auto scroll ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Scroll button visibility ───────────────────────────
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const handler = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // ── Send message ───────────────────────────────────────
  const sendMessage = useCallback(async (text?: string, img?: string) => {
    const messageText = (text || input).trim();
    if ((!messageText && !img) || loading) return;

    const userMsg: Message = {
      id: ++msgId, role: 'user',
      content: messageText || (img ? '📷 Image sent' : ''),
      timestamp: new Date(),
      image: img || imagePreview || undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImagePreview(null);
    setLoading(true);

    // Streaming placeholder
    const streamId = ++msgId;
    setMessages(prev => [...prev, {
      id: streamId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true,
    }]);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const payload = messageText + (userMsg.image ? '\n[User sent an image]' : '');
      const { data } = await chatbotService.sendMessage(payload, history);

      // Simulate streaming word by word
      const words = (data.reply as string).split(' ');
      let built = '';
      for (let i = 0; i < words.length; i++) {
        built += (i === 0 ? '' : ' ') + words[i];
        const snap = built;
        setMessages(prev => prev.map(m =>
          m.id === streamId ? { ...m, content: snap, isStreaming: i < words.length - 1 } : m
        ));
        await new Promise(r => setTimeout(r, 18));
      }
      setMessages(prev => prev.map(m =>
        m.id === streamId ? { ...m, source: data.source, isStreaming: false } : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, content: '⚠️ Something went wrong. Please try again.', isStreaming: false }
          : m
      ));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, imagePreview]);

  // ── Voice input ────────────────────────────────────────
  const toggleVoice = () => {
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  // ── Image upload ───────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Reaction ───────────────────────────────────────────
  const addReaction = (id: number, r: Message['reaction']) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: r } : m));
    setShowReaction(null);
  };

  // ── Copy ──────────────────────────────────────────────
  const copyMsg = (msg: Message) => {
    navigator.clipboard.writeText(msg.content.replace(/\*\*/g, '').replace(/\*/g, ''));
    setCopied(msg.id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Download chat ─────────────────────────────────────
  const downloadChat = () => {
    const text = messages
      .map(m => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'edupulse-chat.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Retry ─────────────────────────────────────────────
  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages(prev => prev.slice(0, -1));
    sendMessage(lastUser.content);
  };

  // ── Clear ─────────────────────────────────────────────
  const clearChat = () => {
    setMessages([{
      id: ++msgId, role: 'assistant',
      content: `Chat cleared! Ask me anything, ${user?.name?.split(' ')[0]} 😊`,
      timestamp: new Date(),
    }]);
  };

  // ── Filtered messages (search) ────────────────────────
  const displayed = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const lastSource = messages[messages.length - 1]?.source;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-none">EduPulse AI Assistant</h2>
            <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="dot-online" />
              {lastSource === 'gemini' ? 'Powered by Gemini AI ✨' : 'AI Assistant Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Search */}
          <button onClick={() => { setSearchMode(s => !s); setSearchQuery(''); }}
            title="Search chat"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: searchMode ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
            <Search size={14} />
          </button>

          {/* Download */}
          <button onClick={downloadChat} title="Download chat"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
            <Download size={14} />
          </button>

          {/* Retry */}
          {messages.length > 2 && (
            <button onClick={retryLast} title="Retry last answer"
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              <RotateCcw size={14} />
            </button>
          )}

          {/* Clear */}
          <button onClick={clearChat}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <AnimatePresence>
        {searchMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="mb-2 flex-shrink-0 overflow-hidden">
            <input
              autoFocus
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field w-full text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Window ── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-5 relative"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>

        <AnimatePresence initial={false}>
          {displayed.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              className={`flex gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              onClick={() => setShowReaction(null)}>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold
                ${msg.role === 'user' ? 'bg-primary-600' : ''}`}
                style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
                {msg.role === 'user' ? user?.name?.charAt(0).toUpperCase() : <Bot size={15} />}
              </div>

              {/* Bubble */}
              <div className="max-w-[80%] relative">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm'}`}
                  style={msg.role === 'user'
                    ? { background: 'rgba(99,102,241,0.8)', border: '1px solid rgba(99,102,241,0.5)' }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.88)' }
                  }>

                  {/* Image */}
                  {msg.image && (
                    <img src={msg.image} alt="shared"
                      className="rounded-xl mb-2 max-w-full max-h-48 object-cover cursor-pointer"
                      onClick={() => window.open(msg.image, '_blank')}
                    />
                  )}

                  {/* Text + streaming cursor */}
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  {msg.isStreaming && (
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}
                      className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                      style={{ background: 'rgba(255,255,255,0.6)' }} />
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 gap-3">
                    <span className="text-xs" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {msg.reaction && <span className="text-sm">{msg.reaction}</span>}
                      {msg.role === 'assistant' && msg.source && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: msg.source === 'gemini' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.08)',
                            color: msg.source === 'gemini' ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                          }}>
                          {msg.source === 'gemini' ? '✨ Gemini' : '💬 Basic'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons on hover */}
                <div className={`absolute ${msg.role === 'user' ? '-left-20' : '-right-20'} top-1 opacity-0 group-hover:opacity-100 transition-all flex gap-1`}>
                  {/* Copy */}
                  <button onClick={() => copyMsg(msg)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                    {copied === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  {/* React */}
                  <div className="relative">
                    <button onClick={e => { e.stopPropagation(); setShowReaction(showReaction === msg.id ? null : msg.id); }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                      <Smile size={11} />
                    </button>
                    <AnimatePresence>
                      {showReaction === msg.id && (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                          className="absolute bottom-8 left-0 flex gap-1 p-2 rounded-2xl z-10"
                          style={{ background: 'rgba(30,30,50,0.98)', border: '1px solid rgba(255,255,255,0.15)' }}
                          onClick={e => e.stopPropagation()}>
                          {REACTIONS.map(r => (
                            <button key={r} onClick={() => addReaction(msg.id, r)}
                              className="text-lg hover:scale-125 transition-transform">{r}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Bot size={15} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.4)' }}
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <ChevronDown size={16} className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Suggested questions ── */}
      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2 flex-shrink-0">
          {SUGGESTED.map((q, i) => (
            <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => sendMessage(q.text)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}>
              <span>{q.emoji}</span> {q.text}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Image preview ── */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mt-2 flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-xl object-cover" />
              <button onClick={() => setImagePreview(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.9)' }}>
                <X size={10} className="text-white" />
              </button>
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Image ready to send</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className="mt-3 flex gap-2 flex-shrink-0 items-center">

        {/* Image upload */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <button onClick={() => fileRef.current?.click()} title="Send image"
          className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: imagePreview ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'white')}
          onMouseLeave={e => (e.currentTarget.style.color = imagePreview ? '#a78bfa' : 'rgba(255,255,255,0.4)')}>
          <ImagePlus size={16} />
        </button>

        {/* Text input */}
        <input ref={inputRef} type="text" className="input-field flex-1"
          placeholder={listening ? '🎤 Listening...' : 'Ask anything...'}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
          style={listening ? { borderColor: 'rgba(239,68,68,0.6)' } : {}}
        />

        {/* Voice button */}
        <button onClick={toggleVoice} title={listening ? 'Stop listening' : 'Voice input'}
          className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
          style={{
            background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
            border: listening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: listening ? '#f87171' : 'rgba(255,255,255,0.4)',
          }}>
          {listening
            ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><MicOff size={16} /></motion.div>
            : <Mic size={16} />}
        </button>

        {/* Send button */}
        <button onClick={() => sendMessage()} disabled={(!input.trim() && !imagePreview) || loading}
          className="btn-primary px-4 py-2.5 disabled:opacity-40 flex-shrink-0">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatbotPage;
