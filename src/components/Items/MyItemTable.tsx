import { useSuspenseQuery } from "@tanstack/react-query"
import {
    MessageSquare,
    Search,
    ChevronLeft,
    ChevronRight,
    // 사용하지 않는 아이콘 제거 (SlidersHorizontal, ChevronsLeft, ChevronsRight)
} from "lucide-react"
import { useState, useMemo, useEffect, Suspense } from "react"

// ItemsService 제거 (fetch를 직접 사용하므로 불필요)
import { DataTable } from "@/components/Common/DataTable"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// [API 호출 함수] 백엔드에 추가한 /items/mine 호출
async function fetchMyItems() {
    const token = localStorage.getItem("access_token")
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/items/mine?skip=0&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to fetch my items")
    return response.json()
}

function getMyItemsQueryOptions() {
    return {
        queryFn: fetchMyItems,
        queryKey: ["items", "mine"],
    }
}

function MyItemsContent() {
    const { data: items } = useSuspenseQuery(getMyItemsQueryOptions())

    // --- 상태 관리 ---
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all")
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, sortOrder])

    // --- 필터링 로직 ---
    const filteredTotalData = useMemo(() => {
        let result = [...(items.data || [])]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter((item: any) =>
                item.title.toLowerCase().includes(query)
            )
        }

        if (statusFilter === "solved") result = result.filter((item: any) => item.is_solved === true)
        else if (statusFilter === "unsolved") result = result.filter((item: any) => !item.is_solved)

        result.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB
        })
        return result
    }, [items.data, searchQuery, statusFilter, sortOrder])

    // --- 페이지네이션 ---
    const totalItems = filteredTotalData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const paginatedData = filteredTotalData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-4">
            {/* 컨트롤 바 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/40 p-4 rounded-lg border">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="제목 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(v:any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="상태" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            <SelectItem value="solved">해결됨</SelectItem>
                            <SelectItem value="unsolved">검토중</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(v:any) => setSortOrder(v)}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="정렬" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">최신순</SelectItem>
                            <SelectItem value="oldest">과거순</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 테이블 및 페이징 */}
            {filteredTotalData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border rounded-lg border-dashed text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p>작성한 글이 없습니다.</p>
                </div>
            ) : (
                <>
                    <DataTable columns={columns} data={paginatedData} />
                    {/* 심플한 페이지네이션 */}
                    <div className="flex items-center justify-end gap-2 py-2">
                        <span className="text-sm text-muted-foreground mr-2">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}><ChevronLeft className="h-4 w-4"/></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}><ChevronRight className="h-4 w-4"/></Button>
                    </div>
                </>
            )}
        </div>
    )
}

export default function MyItemsTable() {
    return (
        <Suspense fallback={<PendingItems />}>
            <MyItemsContent />
        </Suspense>
    )
}