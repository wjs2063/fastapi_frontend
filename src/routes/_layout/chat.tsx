// frontend/src/routes/_layout/chat.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react' // 아이콘 (shadcn/lucide 사용 시)

// 라우트 생성
export const Route = createFileRoute('/_layout/chat')({
    component: ChatPage,
})

type Message = {
    sender: 'user' | 'bot'
    text: string
}

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const ws = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // WebSocket 연결
    useEffect(() => {
        // 로컬 개발 환경 주소 (환경변수로 관리 권장: import.meta.env.VITE_API_URL 등 활용)
        const wsUrl = "ws://localhost:8000/api/v1/chat/ws"
        ws.current = new WebSocket(wsUrl)

        ws.current.onopen = () => {
            console.log("Connected to Chat Agent")
        }

        ws.current.onmessage = (event) => {
            setMessages((prev) => [...prev, { sender: 'bot', text: event.data }])
        }

        ws.current.onclose = () => {
            console.log("Disconnected")
        }

        return () => {
            ws.current?.close()
        }
    }, [])

    // 스크롤 자동 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const sendMessage = () => {
        if (!input.trim() || !ws.current) return

        // 메시지 전송
        ws.current.send(input)
        setMessages((prev) => [...prev, { sender: 'user', text: input }])
        setInput("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') sendMessage()
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">AI Agent Chat</h1>

    {/* 메시지 리스트 영역 */}
    <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 mb-4 space-y-4">
    {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] p-3 rounded-lg ${
        msg.sender === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 border'
    }`}>
    {msg.text}
    </div>
    </div>
))}
    <div ref={messagesEndRef} />
    </div>

    {/* 입력 영역 */}
    <div className="flex gap-2">
    <input
        type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyPress}
    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
    placeholder="Ask something..."
    />
    <button
        onClick={sendMessage}
    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
    >
    <Send size={20} />
    </button>
    </div>
    </div>
)
}