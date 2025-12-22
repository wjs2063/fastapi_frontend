import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, MapPin, Loader2, Search, X, ArrowLeft, Settings, Trash2, Calendar as CalendarIcon, Save } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { toast } from "sonner"

export const Route = createFileRoute('/_layout/chat/menu-recommend')({
    component: ChatPage,
})

declare global {
    interface Window {
        kakao: any;
    }
}

type Message = {
    sender: 'user' | 'bot'
    text: string
}

type Location = {
    lat: number
    lng: number
    address?: string
    placeName?: string
}

type KakaoPlace = {
    id: string
    place_name: string
    address_name: string
    road_address_name: string
    x: string
    y: string
    phone: string
    place_url: string
}

type MealLog = {
    id: number
    menu_name: string
    created_at: string
}

// --- [Sub Component] 사용자 취향 관리 시트 ---
function UserPreferenceSheet({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [tastes, setTastes] = useState("")
    const [newMeal, setNewMeal] = useState("")
    const [meals, setMeals] = useState<MealLog[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // 1. 시트가 열릴 때마다 최신 데이터 로드
    useEffect(() => {
        if (isOpen) {
            fetchPreferences()
            fetchMeals()
        }
    }, [isOpen])

    const getApiConfig = () => {
        const url = import.meta.env.VITE_AI_AGENT_URL || "http://localhost:8000"
        const cleanHost = url.replace(/^https?:\/\//, "")
        const protocol = url.startsWith("https") ? "https" : "http"
        return { baseUrl: `${protocol}://${cleanHost}`, token: localStorage.getItem("access_token") }
    }

    // [핵심 수정] 취향 데이터 불러오기
    const fetchPreferences = async () => {
        const { baseUrl, token } = getApiConfig()
        if (!token) return

        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                // [중요] DB에 저장된 값이 있으면 그 값을, 없으면 빈 문자열을 설정
                if (data && typeof data.tastes === 'string') {
                    setTastes(data.tastes)
                } else {
                    setTastes("")
                }
            }
        } catch (error) {
            console.error("Failed to fetch preferences", error)
            setTastes("") // 에러 시 초기화
        }
    }

    const fetchMeals = async () => {
        const { baseUrl, token } = getApiConfig()
        if (!token) return
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/meals`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setMeals(data)
            }
        } catch (error) {
            console.error("Failed to fetch meals", error)
        }
    }

    const handleAddMeal = async () => {
        if (!newMeal.trim()) return
        const { baseUrl, token } = getApiConfig()
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/meals`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ menu_name: newMeal })
            })
            if (res.ok) {
                setNewMeal("")
                fetchMeals()
                toast.success("식사 기록이 추가되었습니다.")
            } else {
                toast.error("추가 실패: 서버 오류")
            }
        } catch (error) {
            toast.error("추가 실패: 네트워크 오류")
        }
    }

    const handleDeleteMeal = async (id: number) => {
        const { baseUrl, token } = getApiConfig()
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/meals/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setMeals(prev => prev.filter(m => m.id !== id))
                toast.success("삭제되었습니다.")
            }
        } catch (error) {
            toast.error("삭제 실패")
        }
    }

    // [수정] 취향 저장 (덮어쓰기)
    const handleSaveTastesOnly = async () => {
        setIsSaving(true)
        const { baseUrl, token } = getApiConfig()
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tastes })
            })

            if (res.ok) {
                toast.success("취향 정보가 업데이트되었습니다.")
            } else {
                toast.error("저장에 실패했습니다.")
            }
        } catch (error) {
            toast.error("네트워크 오류가 발생했습니다.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-background">
                <SheetHeader>
                    <SheetTitle>내 취향 & 식사 기록</SheetTitle>
                    <SheetDescription>
                        AI가 중복되지 않는 메뉴를 추천하도록 정보를 관리하세요.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-8 py-6">
                    {/* 1. 식성/취향 섹션 */}
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="tastes" className="text-base font-semibold text-foreground">
                            😋 식성 / 취향
                        </Label>
                        <Textarea
                            id="tastes"
                            placeholder="예: 매운거 좋아함, 비건, 가성비 중요, 오이 싫어함"
                            value={tastes}
                            onChange={(e) => setTastes(e.target.value)}
                            className="min-h-[100px] bg-background text-foreground border-input resize-none focus-visible:ring-1"
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSaveTastesOnly} disabled={isSaving} size="sm">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                저장하기
                            </Button>
                        </div>
                    </div>

                    {/* 2. 식사 기록 섹션 */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-base font-semibold text-foreground">
                            🍛 최근 먹은 음식
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="예: 오늘 점심 김치찌개"
                                value={newMeal}
                                onChange={(e) => setNewMeal(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
                                className="bg-background text-foreground"
                            />
                            <Button size="sm" onClick={handleAddMeal}>추가</Button>
                        </div>

                        <div className="border rounded-md mt-1 bg-muted/20 max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {meals.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted-foreground">
                                    아직 기록된 식사가 없습니다.<br/>위 입력창에 드신 메뉴를 추가해보세요.
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {meals.map((meal) => (
                                        <li
                                            key={meal.id}
                                            className="flex items-center justify-between p-3 text-sm bg-card border rounded-lg shadow-sm"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-card-foreground">{meal.menu_name}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {new Date(meal.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                onClick={() => handleDeleteMeal(meal.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">
                            닫기
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

// --- [Sub Component] 지도 선택 모달 ---
function LocationPickerModal({ onSelectLocation, isOpen, onOpenChange }: {
    onSelectLocation: (loc: Location) => void,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void
}) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [mapInstance, setMapInstance] = useState<any>(null)
    const [markerInstance, setMarkerInstance] = useState<any>(null)
    const [selectedLoc, setSelectedLoc] = useState<Location | null>(null)
    const [keyword, setKeyword] = useState("")
    const [places, setPlaces] = useState<KakaoPlace[]>([])

    useEffect(() => {
        if (!isOpen) return
        const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY
        if (!apiKey) { console.error("VITE_KAKAO_MAP_API_KEY Missing"); return }

        const scriptId = "kakao-map-script"
        const existingScript = document.getElementById(scriptId)

        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            window.kakao.maps.load(() => initMap())
            return
        }

        if (!existingScript) {
            const script = document.createElement("script")
            script.id = scriptId
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`
            script.async = true
            script.onload = () => window.kakao.maps.load(() => initMap())
            document.head.appendChild(script)
        }
    }, [isOpen])

    const initMap = () => {
        setTimeout(() => {
            if (!mapRef.current) return
            const defaultLat = 37.566826
            const defaultLng = 126.9786567
            const options = { center: new window.kakao.maps.LatLng(defaultLat, defaultLng), level: 3 }
            const map = new window.kakao.maps.Map(mapRef.current, options)
            map.relayout()
            map.setCenter(options.center)
            setMapInstance(map)

            const marker = new window.kakao.maps.Marker({ position: map.getCenter() })
            marker.setMap(map)
            setMarkerInstance(marker)

            window.kakao.maps.event.addListener(map, 'click', function (mouseEvent: any) {
                const latlng = mouseEvent.latLng
                marker.setPosition(latlng)
                setSelectedLoc({ lat: latlng.getLat(), lng: latlng.getLng(), placeName: "지도에서 선택된 위치" })
            })

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const lat = position.coords.latitude
                    const lng = position.coords.longitude
                    const locPosition = new window.kakao.maps.LatLng(lat, lng)
                    map.setCenter(locPosition)
                    marker.setPosition(locPosition)
                    setSelectedLoc({ lat, lng, placeName: "현재 위치" })
                })
            }
        }, 300)
    }

    const handleSearch = () => {
        if (!keyword.trim() || !mapInstance || !window.kakao.maps.services) return
        const ps = new window.kakao.maps.services.Places()
        ps.keywordSearch(keyword, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setPlaces(data)
                const bounds = new window.kakao.maps.LatLngBounds()
                for (let i = 0; i < data.length; i++) {
                    bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x))
                }
                mapInstance.setBounds(bounds)
            } else {
                setPlaces([])
            }
        })
    }

    const handleSelectPlace = (place: KakaoPlace) => {
        if (!mapInstance || !markerInstance) return
        const lat = parseFloat(place.y)
        const lng = parseFloat(place.x)
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng)
        mapInstance.panTo(moveLatLon)
        markerInstance.setPosition(moveLatLon)
        setSelectedLoc({ lat, lng, placeName: place.place_name, address: place.road_address_name })
    }

    const handleConfirm = () => {
        if (selectedLoc) {
            onSelectLocation(selectedLoc)
            onOpenChange(false)
            resetState()
        }
    }

    const resetState = () => {
        setSelectedLoc(null)
        setKeyword("")
        setPlaces([])
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>위치 선택</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2 flex-1 overflow-hidden">
                    <div className="flex gap-2">
                        <Input placeholder="장소 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                        <Button size="icon" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
                    </div>
                    <div ref={mapRef} className="w-full h-[250px] shrink-0 bg-gray-100 rounded-md relative overflow-hidden border">
                        {!mapInstance && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                    </div>
                    <div className="flex-1 overflow-y-auto border rounded-md bg-slate-50 min-h-[100px]">
                        {places.length === 0 ? <div className="p-4 text-xs text-center text-muted-foreground">장소를 검색하세요.</div> : (
                            <ul className="divide-y">
                                {places.map((place) => (
                                    <li key={place.id} className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSelectPlace(place)}>
                                        <div className="font-semibold text-sm">{place.place_name}</div>
                                        <div className="text-xs text-muted-foreground">{place.address_name}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {selectedLoc && <div className="text-xs font-mono bg-muted p-2 rounded">{selectedLoc.placeName} ({selectedLoc.lat.toFixed(4)}, {selectedLoc.lng.toFixed(4)})</div>}
                </div>
                <div className="flex justify-end gap-2 shrink-0 pt-2 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
                    <Button onClick={handleConfirm} disabled={!selectedLoc}>이 위치 첨부하기</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// --- [Main Page] ---
function ChatPage() {
    const agentId = "menu-recommend"
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: `안녕하세요! 메뉴 추천 에이전트입니다. 무엇을 도와드릴까요?` }
    ])
    const [input, setInput] = useState("")
    const ws = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const [isConnected, setIsConnected] = useState(false)
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [attachedLocation, setAttachedLocation] = useState<Location | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) { navigate({ to: "/login" }); return }

        const agentBaseUrl = import.meta.env.VITE_AI_AGENT_URL || "http://localhost:8000"
        const wsProtocol = agentBaseUrl.startsWith("https") ? "wss" : "ws"
        const cleanHost = agentBaseUrl.replace(/^https?:\/\//, "")
        const wsUrl = `${wsProtocol}://${cleanHost}/api/v1/chat/${agentId}/ws?token=${token}`

        ws.current = new WebSocket(wsUrl)
        ws.current.onopen = () => setIsConnected(true)
        ws.current.onmessage = (event) => setMessages((prev) => [...prev, { sender: 'bot', text: event.data }])
        ws.current.onclose = (e) => {
            setIsConnected(false)
            if (e.code === 1008) { alert("세션 만료"); navigate({ to: "/login" }) }
        }
        return () => ws.current?.close()
    }, [navigate, agentId])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

    const attachLocation = (loc: Location) => setAttachedLocation(loc)

    const sendMessage = () => {
        if (!input.trim() && !attachedLocation) return
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return

        const payload = {
            text: input,
            location: attachedLocation,
            agent_id: agentId
        }

        ws.current.send(JSON.stringify(payload))

        let displayText = input
        if (attachedLocation) {
            displayText += `\n📍 [${attachedLocation.placeName}]`
        }

        setMessages((prev) => [...prev, { sender: 'user', text: displayText }])
        setInput("")
        setAttachedLocation(null)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault(); sendMessage()
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:max-w-4xl mx-auto w-full bg-background relative">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/chat" })}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Bot className="w-6 h-6 text-primary" />
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">메뉴 추천 에이전트</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {isConnected ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Online</Badge> : <Badge variant="destructive">Offline</Badge>}
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div key={idx} className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/50"><Bot className="h-5 w-5 text-muted-foreground" /></div>}
                            <div className={`flex max-w-[80%] flex-col gap-1`}>
                                <span className={`text-xs font-medium text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>{isUser ? 'You' : 'AI'}</span>
                                <div className={`px-4 py-2.5 rounded-xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted/50 text-foreground border rounded-tl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                            {isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20"><User className="h-5 w-5 text-primary" /></div>}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-background sticky bottom-0">
                {attachedLocation && (
                    <div className="px-4 py-2 bg-slate-50 border-b flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                            <MapPin className="h-4 w-4" />
                            <span>위치 첨부됨: {attachedLocation.placeName}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAttachedLocation(null)}><X className="h-3 w-3" /></Button>
                    </div>
                )}
                <div className="p-4 flex items-end gap-2 relative">
                    <Button
                        variant={attachedLocation ? "default" : "ghost"}
                        size="icon"
                        className={`mb-0.5 ${!attachedLocation && 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => setIsMapOpen(true)}
                        disabled={!isConnected}
                    >
                        <MapPin className="h-5 w-5" />
                    </Button>
                    <TextareaAutosize
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        maxRows={4} minRows={1}
                        placeholder={attachedLocation ? "메시지를 입력하세요..." : "메시지를 입력하세요..."}
                        disabled={!isConnected}
                        className="flex-1 w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 resize-none scrollbar-hide"
                    />
                    <Button onClick={sendMessage} size="icon" className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-full" disabled={(!input.trim() && !attachedLocation) || !isConnected}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <LocationPickerModal
                isOpen={isMapOpen}
                onOpenChange={setIsMapOpen}
                onSelectLocation={attachLocation}
            />

            <UserPreferenceSheet
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />
        </div>
    )
}