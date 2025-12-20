import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Pen } from "lucide-react"
import { format } from "date-fns"

import { ItemPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// [중요] 작성하신 컴포넌트 임포트 (경로 확인해주세요)
import { EditItem } from "./EditItem" // export function EditItem 이므로 중괄호 {} 필요
import DeleteItem from "./DeleteItem" // export default DeleteItem 이므로 중괄호 없음

// ----------------------------------------------------------------------
// 1. Actions 컴포넌트 (수정/삭제 로직 분리)
// ----------------------------------------------------------------------
// EditItem이 Dialog 제어권을 외부(부모)에서 받으므로, 여기서 state를 관리합니다.
const ItemActions = ({ item }: { item: ItemPublic }) => {
    const [showEditDialog, setShowEditDialog] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>관리</DropdownMenuLabel>

                    {/* 수정 버튼: 클릭 시 Dialog state를 true로 변경 */}
                    <DropdownMenuItem
                        onClick={() => setShowEditDialog(true)}
                        className="cursor-pointer"
                    >
                        <Pen className="mr-2 h-4 w-4" />
                        수정하기
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* 삭제 컴포넌트: 내부에 DropdownMenuItem이 포함되어 있음 */}
                    <DeleteItem id={item.id} onSuccess={() => {}} />
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 수정 모달 (Dropdown 밖에서 렌더링) */}
            {showEditDialog && (
                <EditItem
                    item={item}
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                />
            )}
        </>
    )
}

// ----------------------------------------------------------------------
// 2. Columns 정의
// ----------------------------------------------------------------------
export const columns: ColumnDef<ItemPublic>[] = [
    {
        accessorKey: "title",
        header: "제목",
        cell: ({ row }) => {
            const item = row.original

            return (
                // [기능: 상세보기] 제목 클릭 시 Read-only Dialog 표시
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="flex flex-col cursor-pointer group select-none">
                            <span className="font-medium truncate max-w-[200px] sm:max-w-[400px] group-hover:text-primary group-hover:underline transition-all">
                                {item.title}
                            </span>
                            {item.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px]">
                                    {item.description}
                                </span>
                            )}
                        </div>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl sm:text-2xl break-keep leading-snug flex items-center gap-2">
                                <Eye className="h-5 w-5 text-muted-foreground" />
                                {item.title}
                            </DialogTitle>
                            <DialogDescription>
                                상세 정보 및 처리 내역입니다.
                            </DialogDescription>
                        </DialogHeader>

                        {/* 상세 정보 Body */}
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center justify-between text-sm border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">상태:</span>
                                    <Badge variant={item.is_solved ? "default" : "secondary"}>
                                        {item.is_solved ? "해결됨" : "검토중"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">작성자:</span>
                                    <span className="font-medium">{item.owner?.full_name || "알 수 없음"}</span>
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-md min-h-[150px] text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                                {item.description || "상세 내용이 없습니다."}
                            </div>

                            <div className="flex justify-end gap-4 text-xs text-muted-foreground pt-2">
                                <span>작성: {format(new Date(item.created_at), "yyyy-MM-dd HH:mm")}</span>
                                <span>수정: {format(new Date(item.updated_at), "yyyy-MM-dd HH:mm")}</span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )
        },
    },
    {
        accessorKey: "is_solved",
        header: "상태",
        cell: ({ row }) => {
            const isSolved = row.getValue("is_solved")
            return (
                <Badge variant={isSolved ? "default" : "secondary"}>
                    {isSolved ? "해결됨" : "검토중"}
                </Badge>
            )
        },
    },
    {
        id: "author",
        header: "작성자",
        cell: ({ row }) => {
            const owner = row.original.owner
            const name = owner?.full_name || "알 수 없음"
            const email = owner?.email || ""

            return (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-[10px] text-muted-foreground">{email}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "created_at",
        header: "작성일",
        cell: ({ row }) => {
            const dateStr = row.getValue("created_at") as string
            return (
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(dateStr), "yyyy-MM-dd")}
                    <br />
                    {format(new Date(dateStr), "HH:mm")}
                </div>
            )
        },
    },
    {
        id: "actions",
        header: "관리",
        cell: ({ row }) => <ItemActions item={row.original} />,
    },
]