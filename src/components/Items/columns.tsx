import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Pen } from "lucide-react"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query" // 추가

import { ItemPublic, UserPublic } from "@/client" // UserPublic 추가
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

import { EditItem } from "./EditItem"
import DeleteItem from "./DeleteItem"

// ----------------------------------------------------------------------
// 1. Actions 컴포넌트 (권한 로직 추가)
// ----------------------------------------------------------------------
const ItemActions = ({ item }: { item: ItemPublic }) => {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const queryClient = useQueryClient()

    // 캐시된 현재 사용자 정보 가져오기
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

    // 권한 확인: 슈퍼유저이거나 작성자 본인인 경우만 true
    const canManage = currentUser?.is_superuser || currentUser?.id === item.owner_id

    // 권한이 없으면 버튼을 렌더링하지 않음
    if (!canManage) return null

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
                    <DropdownMenuItem
                        onClick={() => setShowEditDialog(true)}
                        className="cursor-pointer"
                    >
                        <Pen className="mr-2 h-4 w-4" />
                        수정하기
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeleteItem id={item.id} onSuccess={() => {}} />
                </DropdownMenuContent>
            </DropdownMenu>

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