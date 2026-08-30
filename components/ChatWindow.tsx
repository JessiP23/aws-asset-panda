'use client'

import { useState } from "react"
import { ChatTurn } from "@/lib/types"

interface Props{
    onSend: (message: string) => Promise<string>
}

export function ChatWindow({ onSend }: Props) {
    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const [input, setInput] = useState(''); 
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!input.trim) return;

        const userTurn: ChatTurn = { role: 'user', content: input };
        setTurns((prev) => [...prev, userTurn]);
        setInput('');
        setSending(true);

        try {
            const answer = await onSend(userTurn.content);
            setTurns((prev) => [...prev, { role: 'assistant', content: answer }]);
        } catch {
            setSending(false);
        }
    }
    
    return (
        <div className="flex flex-col gap-3 max-w-xl">
            <div className="space-y-2 min-h-[200px]">
                {turns.map((t, i) => (
                    <div key={i} className={t.role === 'user' ? 'text-right' : 'text-left'}>
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-sm ${
                            t.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
                        }`}>
                            {t.content}
                        </span>
                    </div>
                ))}
                {sending && <p className="text-xs text-gray-400">Thinking…</p>}
            </div>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about an asset or manual…"
                    className="border rounded-md px-3 py-2 text-sm flex-1"
                />
                <button onClick={handleSend} disabled={sending} className="bg-black text-white text-sm px-4 rounded-md">
                    Send
                </button>
            </div>
        </div>
    );
}