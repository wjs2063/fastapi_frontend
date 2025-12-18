import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize' // [변경] 라이브러리 임포트

// Shadcn UI 컴포넌트
import { Button } from "@/components/ui/button"
// Input, Textarea 컴포넌트 import는 더 이상 필요 없지만 다른데서 쓴다면 유지

export const Route = createFileRoute('/_layout/chat')({
    component: ChatPage,
})

type Message = {
    sender: 'user' | 'bot'
    text: string
}

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: "안녕하세요! 저는 AI 에이전트입니다. 무엇을 도와드릴까요?" }
    ])
    const [input, setInput] = useState("")
    const ws = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) {
            console.error("No access token found. Redirecting to login.")
            navigate({ to: "/login" })
            return
        }

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
        const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws"
        const cleanUrl = apiUrl.replace(/^https?:\/\//, "")
        const wsUrl = `${wsProtocol}://${cleanUrl}/api/v1/chat/ws?token=${token}`

        ws.current = new WebSocket(wsUrl)

        ws.current.onopen = () => {
            console.log("Connected to Chat Agent")
            setIsConnected(true)
        }

        ws.current.onmessage = (event) => {
            setMessages((prev) => [...prev, { sender: 'bot', text: event.data }])
        }

        ws.current.onclose = (event) => {
            console.log("Disconnected", event.code)
            setIsConnected(false)
            if (event.code === 1008) {
                alert("Session expired. Please login again.")
                navigate({ to: "/login" })
            }
        }

        return () => {
            ws.current?.close()
        }
    }, [navigate])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const sendMessage = () => {
        if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return
        ws.current.send(input)
        setMessages((prev) => [...prev, { sender: 'user', text: input }])
        setInput("")
    }

    // [변경] Shift + Enter는 줄바꿈, 그냥 Enter는 전송
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            if (!e.shiftKey) {
                e.preventDefault()
                sendMessage()
            }
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:max-w-4xl mx-auto w-full bg-background">
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-primary" />
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">AI Agent Chat</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                             <span className={`relative flex h-2 w-2`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            {isConnected ? "Online" : "Disconnected"}
                        </p>
                    </div>
                </div>
            </div>

            {/* 메시지 리스트 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div key={idx} className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-muted/50">
                                    <Bot className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className={`flex max-w-[80%] flex-col gap-1`}>
                                <span className={`text-xs font-medium text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>
                                    {isUser ? 'You' : 'AI Agent'}
                                </span>
                                <div className={`px-4 py-2.5 rounded-xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm
                                    ${isUser
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted/50 text-foreground border rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                            {isUser && (
                                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 (푸터) - [변경됨] */}
            <div className="p-4 border-t bg-background sticky bottom-0">
                <div className="flex items-end gap-2 relative">
                    <TextareaAutosize
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        maxRows={4} // 최대 4줄까지만 늘어나고 그 후엔 스크롤
                        minRows={1}
                        placeholder="메시지를 입력하세요..."
                        disabled={!isConnected}
                        // Shadcn UI의 스타일 클래스들을 직접 적용 + 커스텀 스타일
                        className="flex-1 w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] pr-12 resize-none scrollbar-hide"
                    />
                    <Button
                        onClick={sendMessage}
                        size="icon"
                        className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-full"
                        disabled={!input.trim() || !isConnected}
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                    AI는 부정확한 정보를 제공할 수 있습니다. 중요 정보는 확인이 필요합니다.
                </p>
            </div>
        </div>
    )
}