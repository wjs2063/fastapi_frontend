import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
    Send, Bot, User, MapPin, Loader2, Search, X, ArrowLeft, Settings,
    Trash2, Calendar as CalendarIcon, Save, Pencil, RefreshCw
} from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { format } from "date-fns"
import { ko } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"

const MEAL_TYPE_LABELS: Record<MealType, string> = {
    BREAKFAST: "아침",
    LUNCH: "점심",
    DINNER: "저녁",
    SNACK: "간식"
}

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]

type MealLog = {
    id: number
    menu_name: string
    meal_type: MealType
    created_at: string
}

function UserPreferenceSheet({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [tastes, setTastes] = useState("")
    const [meals, setMeals] = useState<MealLog[]>([])

    // [입력 폼 상태]
    const [inputMenu, setInputMenu] = useState("")
    const [inputType, setInputType] = useState<MealType>("LUNCH")
    // [추가] 입력 날짜 상태 (기본값: 오늘)
    const [inputDate, setInputDate] = useState<Date>(new Date())

    const [editingId, setEditingId] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // [필터 상태] - 초기값 undefined (전체 보기)
    const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
    const [filterType, setFilterType] = useState<MealType | "ALL">("ALL")

    useEffect(() => {
        if (isOpen) {
            fetchPreferences()
            fetchMeals()
            resetForm()
            setFilterDate(undefined)
        }
    }, [isOpen])

    const filteredMeals = meals.filter(meal => {
        let dateMatch = true
        if (filterDate) {
            const mealDateStr = format(new Date(meal.created_at), 'yyyy-MM-dd')
            const filterDateStr = format(filterDate, 'yyyy-MM-dd')
            dateMatch = mealDateStr === filterDateStr
        }
        const typeMatch = filterType === "ALL" ? true : meal.meal_type === filterType
        return dateMatch && typeMatch
    })

    const resetForm = () => {
        setInputMenu("")
        setInputType("LUNCH")
        setInputDate(new Date()) // 오늘로 리셋
        setEditingId(null)
    }

    const getApiConfig = () => {
        const url = import.meta.env.VITE_AI_AGENT_URL || "http://localhost:8000"
        const cleanHost = url.replace(/^https?:\/\//, "")
        const protocol = url.startsWith("https") ? "https" : "http"
        return { baseUrl: `${protocol}://${cleanHost}`, token: localStorage.getItem("access_token") }
    }

    const fetchPreferences = async () => {
        const { baseUrl, token } = getApiConfig()
        if (!token) return
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTastes(data?.tastes || "")
            }
        } catch (error) {
            console.error("Failed to fetch preferences", error)
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

    const handleUpsertMeal = async () => {
        if (!inputMenu.trim()) return
        const { baseUrl, token } = getApiConfig()

        const payload = {
            menu_name: inputMenu,
            meal_type: inputType,
            // [추가] 선택한 날짜 전송 (ISO 문자열)
            created_at: inputDate.toISOString()
        }

        try {
            let res;
            if (editingId) {
                res = await fetch(`${baseUrl}/api/v1/users/me/meals/${editingId}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                res = await fetch(`${baseUrl}/api/v1/users/me/meals`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            if (res.ok) {
                toast.success(editingId ? "수정되었습니다." : "추가되었습니다.")
                resetForm()
                fetchMeals()
            } else {
                toast.error("서버 오류가 발생했습니다.")
            }
        } catch (error) {
            toast.error("네트워크 오류가 발생했습니다.")
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
                if (editingId === id) resetForm()
                toast.success("삭제되었습니다.")
            }
        } catch (error) {
            toast.error("삭제 실패")
        }
    }

    const handleEditClick = (meal: MealLog) => {
        setInputMenu(meal.menu_name)
        setInputType(meal.meal_type)
        // [추가] 수정 시 기존 날짜 불러오기
        setInputDate(new Date(meal.created_at))
        setEditingId(meal.id)
    }

    const handleSaveTastesOnly = async () => {
        setIsSaving(true)
        const { baseUrl, token } = getApiConfig()
        try {
            const res = await fetch(`${baseUrl}/api/v1/users/me/preferences`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tastes })
            })
            if (res.ok) toast.success("취향 정보가 저장되었습니다.")
            else toast.error("저장 실패")
        } catch (error) {
            toast.error("오류 발생")
        } finally {
            setIsSaving(false)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "BREAKFAST": return "bg-orange-100 text-orange-700 border-orange-200"
            case "LUNCH": return "bg-blue-100 text-blue-700 border-blue-200"
            case "DINNER": return "bg-indigo-100 text-indigo-700 border-indigo-200"
            case "SNACK": return "bg-pink-100 text-pink-700 border-pink-200"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-background flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>식사 기록 관리</SheetTitle>
                    <SheetDescription>취향과 식사 기록을 바탕으로 메뉴를 추천합니다.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 py-4 flex-1 overflow-hidden">
                    {/* 1. 취향 섹션 */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <Label className="text-sm font-semibold">😋 나의 식성 (AI 참고용)</Label>
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="예: 매운거 좋아함, 오이 싫어함, 가성비 중요"
                                value={tastes}
                                onChange={(e) => setTastes(e.target.value)}
                                className="min-h-[60px] resize-none text-sm"
                            />
                            <Button
                                onClick={handleSaveTastesOnly}
                                disabled={isSaving}
                                size="icon"
                                className="h-[60px] w-[60px] shrink-0"
                                variant="outline"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="h-px bg-border shrink-0" />

                    {/* 2. 입력/수정 폼 */}
                    <div className="flex flex-col gap-3 shrink-0 p-4 border rounded-xl bg-muted/30">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                {editingId ? <><Pencil className="w-3.5 h-3.5" /> 기록 수정</> : <><RefreshCw className="w-3.5 h-3.5" /> 식사 추가</>}
                            </Label>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={resetForm} className="h-6 text-xs px-2 hover:bg-background">
                                    <X className="w-3 h-3 mr-1" /> 취소
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 flex gap-2">
                                {/* [추가] 입력 날짜 선택 */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[110px] justify-start text-left font-normal text-xs px-2 h-9",
                                                !inputDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {inputDate ? format(inputDate, "MM.dd") : <span>날짜</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={inputDate}
                                            // onSelect 시 undefined 방지 (항상 날짜가 있도록)
                                            onSelect={(date) => date && setInputDate(date)}
                                            initialFocus
                                            locale={ko}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Input
                                    placeholder="메뉴 이름 (예: 김치찌개)"
                                    value={inputMenu}
                                    onChange={(e) => setInputMenu(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpsertMeal()}
                                    className="bg-background flex-1 h-9"
                                />
                            </div>
                            <Button onClick={handleUpsertMeal} className={editingId ? "bg-green-600 hover:bg-green-700 w-14" : "w-14"}>
                                {editingId ? "수정" : "등록"}
                            </Button>
                        </div>

                        {/* 식사 유형 선택 */}
                        <div className="flex gap-1">
                            {MEAL_TYPES.map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    variant={inputType === type ? "default" : "outline"}
                                    size="sm"
                                    className={`flex-1 text-xs h-7 ${inputType === type ? '' : 'bg-background text-muted-foreground border-transparent shadow-none hover:bg-background hover:text-foreground'}`}
                                    onClick={() => setInputType(type)}
                                >
                                    {MEAL_TYPE_LABELS[type]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 3. 리스트 및 필터 섹션 */}
                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 shrink-0">
                            <Label className="text-sm font-semibold flex items-center gap-1">
                                🍛 기록 목록
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{filteredMeals.length}</Badge>
                            </Label>

                            {/* 필터 툴바 */}
                            <div className="flex items-center gap-1.5">
                                {/* [필터] 날짜 선택 */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            size="sm"
                                            className={cn(
                                                "h-8 w-[110px] justify-start text-left font-normal text-xs px-2",
                                                !filterDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {filterDate ? format(filterDate, "yyyy-MM-dd") : <span>전체 날짜</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={filterDate}
                                            onSelect={setFilterDate}
                                            initialFocus
                                            locale={ko}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {filterDate && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFilterDate(undefined)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}

                                {/* [필터] 타입 필터 */}
                                <Select value={filterType} onValueChange={(val) => setFilterType(val as MealType | "ALL")}>
                                    <SelectTrigger className="h-8 w-[70px] text-xs px-2 bg-background">
                                        <SelectValue placeholder="전체" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">전체</SelectItem>
                                        {MEAL_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {MEAL_TYPE_LABELS[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-background flex-1 overflow-y-auto p-2">
                            {filteredMeals.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Search className="h-8 w-8 opacity-20" />
                                    <span className="text-xs">
                                        {filterDate ? format(filterDate, "MM월 dd일") : "저장된"} 기록이 없습니다.
                                    </span>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {filteredMeals.map((meal) => (
                                        <li
                                            key={meal.id}
                                            className={`flex items-center justify-between p-3 text-sm border rounded-lg shadow-sm transition-all hover:bg-accent/5 ${editingId === meal.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'bg-card'}`}
                                        >
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{meal.menu_name}</span>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-normal ${getTypeColor(meal.meal_type)}`}>
                                                        {MEAL_TYPE_LABELS[meal.meal_type]}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(new Date(meal.created_at), "yyyy.MM.dd")}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full"
                                                    onClick={() => handleEditClick(meal)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                    onClick={() => handleDeleteMeal(meal.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-2">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">닫기</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

// ... (LocationPickerModal 및 ChatPage는 기존과 동일하게 유지)
function LocationPickerModal({ onSelectLocation, isOpen, onOpenChange }: {
    onSelectLocation: (loc: Location) => void,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void
}) {
    // ... (기존과 동일 - 생략)
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