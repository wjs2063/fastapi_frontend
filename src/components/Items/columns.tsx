import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy, CheckCircle2, Clock } from "lucide-react"

import type { ItemPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // shadcn/ui Badge 컴포넌트 필요
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { ItemActionsMenu } from "./ItemActionsMenu"

function CopyId({ id }: { id: string }) {
    const [copiedText, copy] = useCopyToClipboard()
    const isCopied = copiedText === id

    return (
        <div className="flex items-center gap-1.5 group">
            <span className="font-mono text-xs text-muted-foreground">{id.slice(0, 8)}...</span>
            <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copy(id)}
            >
                {isCopied ? (
                    <Check className="size-3 text-green-500" />
                ) : (
                    <Copy className="size-3" />
                )}
                <span className="sr-only">Copy ID</span>
            </Button>
        </div>
    )
}

export const columns: ColumnDef<ItemPublic>[] = [
    // 1. ID 컬럼 (공간 절약을 위해 축소)
    {
        accessorKey: "id",
        header: "ID",
        size: 80,
        cell: ({ row }) => <CopyId id={row.original.id} />,
    },

    // 2. 상태 컬럼 (새로 추가됨: 완료 여부 체크)
    {
        accessorKey: "is_solved", // 백엔드 모델에 이 필드가 있어야 함
        header: "진행 상태",
        cell: ({ row }) => {
            // @ts-ignore: 백엔드 모델 업데이트 전이라도 에러 방지 (실제로는 타입 정의 필요)
            const isSolved = row.original.is_solved

            return (
                <Badge
                    variant={isSolved ? "default" : "secondary"}
                    className={cn(
                        "w-fit flex items-center gap-1",
                        isSolved ? "bg-green-600 hover:bg-green-700" : "bg-zinc-500 hover:bg-zinc-600 text-white"
                    )}
                >
                    {isSolved ? (
                        <>
                            <CheckCircle2 className="size-3" />
                            <span>해결됨</span>
                        </>
                    ) : (
                        <>
                            <Clock className="size-3" />
                            <span>검토중</span>
                        </>
                    )}
                </Badge>
            )
        },
    },

    // 3. 제목 컬럼
    {
        accessorKey: "title",
        header: "건의 제목",
        cell: ({ row }) => (
            <span className="font-semibold text-base text-foreground">
        {row.original.title}
      </span>
        ),
    },

    // 4. 내용 컬럼
    {
        accessorKey: "description",
        header: "상세 내용",
        cell: ({ row }) => {
            const description = row.original.description
            return (
                <span
                    className={cn(
                        "max-w-[300px] truncate block text-muted-foreground text-sm",
                        !description && "italic text-muted-foreground/50",
                    )}
                >
          {description || "내용 없음"}
        </span>
            )
        },
    },

    // 5. 액션 컬럼 (수정/삭제)
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <ItemActionsMenu item={row.original} />
            </div>
        ),
    },
]