import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
    MessageSquarePlus,
    Search,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react"
import { Suspense, useState, useMemo, useEffect } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
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

// 쿼리 옵션: 최대 100개를 가져와서 클라이언트에서 페이지네이션 처리
function getItemsQueryOptions() {
    return {
        queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
        queryKey: ["items"],
    }
}

export const Route = createFileRoute("/_layout/items")({
    component: SuggestionBoard,
    head: () => ({
        meta: [
            {
                title: "건의사항 게시판",
            },
        ],
    }),
})

function SuggestionsTableContent() {
    const { data: items } = useSuspenseQuery(getItemsQueryOptions())

    // --- 상태 관리 ---
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all")
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

    // 페이지네이션 상태 (현재 페이지 번호)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // 검색어, 필터, 정렬 변경 시 1페이지로 초기화
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, sortOrder])

    // --- 데이터 필터링 및 정렬 로직 (전체 데이터 대상) ---
    const filteredTotalData = useMemo(() => {
        // [중요] 원본 배열 복사 (React Query 데이터는 불변이므로 복사 후 정렬해야 함)
        let result = [...(items.data || [])]

        // 1. 검색 (제목 or 작성자 이름)
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter((item) => {
                const titleMatch = item.title.toLowerCase().includes(query)
                // 백엔드에서 owner 정보를 보내주므로 이름으로 검색 가능
                const ownerNameMatch = item.owner?.full_name?.toLowerCase().includes(query) || false
                return titleMatch || ownerNameMatch
            })
        }

        // 2. 상태 필터 (해결/미해결)
        if (statusFilter === "solved") {
            result = result.filter((item) => item.is_solved === true)
        } else if (statusFilter === "unsolved") {
            result = result.filter((item) => !item.is_solved)
        }

        // 3. 정렬 (생성일 기준)
        result.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()

            return sortOrder === "newest"
                ? dateB - dateA // 최신순 (내림차순)
                : dateA - dateB // 과거순 (오름차순)
        })

        return result
    }, [items.data, searchQuery, statusFilter, sortOrder])

    // --- 페이지네이션 슬라이싱 로직 ---
    const totalItems = filteredTotalData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTotalData.slice(startIndex, endIndex)
    }, [filteredTotalData, currentPage, itemsPerPage])

    return (
        <div className="space-y-4">
            {/* --- 상단 컨트롤 (검색/필터/정렬) --- */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/40 p-4 rounded-lg border">

                {/* 검색창 */}
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="제목 또는 작성자 이름..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>

                <div className="flex flex-row gap-2 w-full sm:w-auto">
                    {/* 상태 필터 */}
                    <Select
                        value={statusFilter}
                        onValueChange={(val: any) => setStatusFilter(val)}
                    >
                        <SelectTrigger className="w-[140px] bg-background">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <SelectValue placeholder="상태" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 상태</SelectItem>
                            <SelectItem value="solved">해결됨 ✅</SelectItem>
                            <SelectItem value="unsolved">검토중 🔥</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 정렬 필터 */}
                    <Select
                        value={sortOrder}
                        onValueChange={(val: any) => setSortOrder(val)}
                    >
                        <SelectTrigger className="w-[130px] bg-background">
                            <SelectValue placeholder="정렬" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">최신순</SelectItem>
                            <SelectItem value="oldest">과거순</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- 데이터 테이블 및 페이지네이션 영역 --- */}
            {filteredTotalData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                    <div className="rounded-full bg-background p-4 mb-4 shadow-sm border">
                        <MessageSquarePlus className="h-8 w-8 text-primary/50" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">조건에 맞는 게시글이 없습니다</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        검색어를 변경하거나 필터를 초기화해보세요.
                    </p>
                </div>
            ) : (
                <>
                    {/* 테이블에는 현재 페이지 데이터(paginatedData)만 전달 */}
                    <DataTable columns={columns} data={paginatedData} />

                    {/* 페이지네이션 컨트롤 UI */}
                    <div className="flex items-center justify-between py-2">
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            총 <strong>{totalItems}</strong>개 중{" "}
                            <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> -{" "}
                            <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 mx-auto sm:mx-0">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="text-sm font-medium mx-2">
                                Page {currentPage} of {totalPages || 1}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function SuggestionsTable() {
    return (
        <Suspense fallback={<PendingItems />}>
            <SuggestionsTableContent />
        </Suspense>
    )
}

function SuggestionBoard() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full py-6 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">건의사항 게시판</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        자유롭게 의견을 남겨주시면 검토 후 답변 및 반영해 드립니다.
                    </p>
                </div>
                {/* 건의하기 버튼 */}
                <div className="shrink-0">
                    <AddItem />
                </div>
            </div>

            {/* 게시판 테이블 영역 */}
            <div className="bg-background rounded-lg border shadow-sm p-1">
                <SuggestionsTable />
            </div>
        </div>
    )
}