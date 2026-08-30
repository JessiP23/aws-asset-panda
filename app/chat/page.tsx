'use client'

import { ChatWindow } from "@/components/ChatWindow"
import { sendChatMessage } from "@/lib/api-client"

export default function ChatPage() {
    const handleSend = async(message: string) => {
        const { answer } = await sendChatMessage(message);
        return answer
    }

    return (
        <main className="max-w-2xl mx-auto p-8">
            <h1 className="text-xl font-semibold mb-4">Ask AssetIQ</h1>
            <ChatWindow onSend={handleSend} />
        </main>
    );
}