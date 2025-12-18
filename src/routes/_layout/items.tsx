import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { MessageSquarePlus } from "lucide-react" // 아이콘 변경
import { Suspense } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"

// 쿼리 옵션
function getItemsQueryOptions() {
    return {
        queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
        queryKey: ["items"],
    }
}

export const Route = createFileRoute("/_layout/items")({
    component: SuggestionBoard, // 컴포넌트 이름 변경
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

    // 데이터가 없을 때 표시할 화면
    if (items.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                <div className="rounded-full bg-background p-4 mb-4 shadow-sm border">
                    <MessageSquarePlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">등록된 건의사항이 없습니다</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    서비스 개선을 위한 아이디어나 불편한 점이 있다면<br/>
                    오른쪽 상단의 버튼을 눌러 첫 번째 의견을 남겨주세요.
                </p>
            </div>
        )
    }

    return <DataTable columns={columns} data={items.data} />
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
            <div className="bg-background rounded-lg border shadow-sm">
                <SuggestionsTable />
            </div>
        </div>
    )
}