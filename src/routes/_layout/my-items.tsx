import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
    MessageSquare,
    Search,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react"
import { Suspense, useState, useMemo, useEffect } from "react"

// [수정] ItemsService 제거
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

async function fetchMyItems() {
    const token = localStorage.getItem("access_token")
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/items/mine?skip=0&limit=100`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
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

export const Route = createFileRoute("/_layout/my-items")({
    component: MyItemsBoard,
    head: () => ({ meta: [{ title: "내가 쓴 글" }] }),
})

function MyItemsTableContent() {
    const { data: items } = useSuspenseQuery(getMyItemsQueryOptions())

    // --- (이하 로직은 동일) ---
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all")
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, sortOrder])

    const filteredTotalData = useMemo(() => {
        let result = [...(items.data || [])]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter((item: any) => {
                const titleMatch = item.title.toLowerCase().includes(query)
                return titleMatch
            })
        }

        if (statusFilter === "solved") {
            result = result.filter((item: any) => item.is_solved === true)
        } else if (statusFilter === "unsolved") {
            result = result.filter((item: any) => !item.is_solved)
        }

        result.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB
        })

        return result
    }, [items.data, searchQuery, statusFilter, sortOrder])

    const totalItems = filteredTotalData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTotalData.slice(startIndex, endIndex)
    }, [filteredTotalData, currentPage, itemsPerPage])

    return (
        <div className="space-y-4">
            {/* 상단 컨트롤 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/40 p-4 rounded-lg border">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="내 글 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>
                <div className="flex flex-row gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
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

                    <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
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

            {/* 테이블 표시 */}
            {filteredTotalData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                    <div className="rounded-full bg-background p-4 mb-4 shadow-sm border">
                        <MessageSquare className="h-8 w-8 text-primary/50" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">작성한 글이 없습니다</h3>
                </div>
            ) : (
                <>
                    <DataTable columns={columns} data={paginatedData} />
                    {/* 페이지네이션 컨트롤 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            총 <strong>{totalItems}</strong>개 중{" "}
                            <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> -{" "}
                            <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 mx-auto sm:mx-0">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium mx-2">Page {currentPage} of {totalPages || 1}</div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function MyItemsBoard() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full py-6 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">내가 쓴 글</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        내가 작성한 건의사항들의 처리 상태를 확인하세요.
                    </p>
                </div>
                <div className="shrink-0"><AddItem /></div>
            </div>
            <div className="bg-background rounded-lg border shadow-sm p-1">
                <Suspense fallback={<PendingItems />}>
                    <MyItemsTableContent />
                </Suspense>
            </div>
        </div>
    )
}