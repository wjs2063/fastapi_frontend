import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import type { ItemPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, // [추가] MenuItem 필요
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditItem } from "./EditItem" // 경로 확인
// import DeleteItem from "./DeleteItem" // DeleteItem도 같은 방식으로 수정 필요

interface ItemActionsMenuProps {
    item: ItemPublic
}

export const ItemActionsMenu = ({ item }: ItemActionsMenuProps) => {
    // [중요] 다이얼로그 열림 상태를 여기서 관리합니다.
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    return (
        <>
            {/* 1. 드롭다운 메뉴 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <EllipsisVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {/* 수정 버튼 클릭 시 editOpen을 true로 변경 */}
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        수정
                    </DropdownMenuItem>

                    {/* 삭제 버튼 클릭 시 deleteOpen을 true로 변경 */}
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 2. 다이얼로그 (메뉴 바깥에 배치해야 함) */}
            <EditItem
                item={item}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            {/* DeleteItem도 EditItem처럼 open/onOpenChange props를 받도록 수정되어야 합니다. */}
            {/* <DeleteItem
         item={item}
         open={deleteOpen}
         onOpenChange={setDeleteOpen}
      /> */}
        </>
    )
}