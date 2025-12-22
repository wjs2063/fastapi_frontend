import { Briefcase, Home, Users, Bot, FlaskConical, Split } from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
// SideLink 인터페이스 제거 (Item 타입을 사용하므로 불필요)
import { type Item, Main } from "./Main"
import { User } from "./User"

// [수정 포인트]
// 1. href -> path (기존 아이템들과 통일)
// 2. icon: <Icon /> -> icon: Icon (컴포넌트 자체 전달)
// 3. sub -> items (보통 재귀적 구조에서 items 키를 사용. *하단 주의사항 참조)

const baseItems: Item[] = [
    {
        icon: Home,
        title: "Dashboard",
        path: "/"
    },
    {
        icon: Briefcase,
        title: "Items",
        path: "/items"
    },
    {
        icon: Bot,
        title: "AI Chat",
        path: "/chat",
    },
    // [수정] Test 메뉴 추가 (하위 메뉴 포함)
    {
        title: 'Test',
        path: '#', // 상위 메뉴는 이동하지 않으므로 '#' 처리
        icon: FlaskConical, // 주의: <FlaskConical /> 아님, FlaskConical 자체 전달
        items: [
            {
                title: 'API Diff Test',
                path: '/test/diff-test',
                // 하위 메뉴는 아이콘이 필수가 아니게 Main.tsx 타입을 짰다면 생략 가능
                // 만약 필수라면 아이콘 추가 필요
                icon: Split,
            },
        ],
    },
]

export function AppSidebar() {
    const { user: currentUser } = useAuth()

    const items = currentUser?.is_superuser
        ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
        : baseItems

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader
                className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
                <Logo variant="responsive" />
            </SidebarHeader>
            <SidebarContent>
                {/* Main 컴포넌트가 중첩(items) 구조를 지원해야 하위 메뉴가 보입니다 */}
                <Main items={items} />
            </SidebarContent>
            <SidebarFooter>
                <SidebarAppearance />
                <User user={currentUser} />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar