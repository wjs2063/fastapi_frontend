import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"

// [수정 1] items 속성을 추가하여 재귀적 구조 지원
export type Item = {
    title: string
    path: string
    icon?: LucideIcon // 상위 메뉴엔 아이콘이 없을 수도 있으므로 선택적(?) 혹은 필수 유지
    items?: Item[]    // 하위 메뉴
}

interface MainProps {
    items: Item[]
}

export function Main({ items }: MainProps) {
    const { isMobile, setOpenMobile } = useSidebar()
    const router = useRouterState()
    const currentPath = router.location.pathname

    const handleMenuClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        // 1. 하위 메뉴가 있는 경우 (Collapsible 렌더링)
                        if (item.items && item.items.length > 0) {
                            // 하위 메뉴 중 하나라도 현재 경로와 일치하면 열려있게 설정
                            const isChildActive = item.items.some(sub => sub.path === currentPath)

                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={isChildActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => {
                                                    const isSubActive = currentPath === subItem.path
                                                    return (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                                                                <RouterLink to={subItem.path} onClick={handleMenuClick}>
                                                                    <span>{subItem.title}</span>
                                                                </RouterLink>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    )
                                                })}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            )
                        }

                        // 2. 하위 메뉴가 없는 경우 (기존 방식 렌더링)
                        const isActive = currentPath === item.path
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    isActive={isActive}
                                    asChild
                                >
                                    <RouterLink to={item.path} onClick={handleMenuClick}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </RouterLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}