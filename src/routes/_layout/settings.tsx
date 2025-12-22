import { createFileRoute } from "@tanstack/react-router"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
// [추가] 앞서 만든 '내가 쓴 글' 컴포넌트 임포트
import MyItemsTable from "@/components/Items/MyItemTable"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth from "@/hooks/useAuth"

// [수정] tabsConfig에 'my-items' 추가
const tabsConfig = [
    { value: "my-profile", title: "My profile", component: UserInformation },
    { value: "password", title: "Password", component: ChangePassword },
    // 여기에 추가 (Danger zone 보다 위에 배치하는 것이 자연스럽습니다)
    { value: "my-items", title: "My Posts", component: MyItemsTable },
    { value: "danger-zone", title: "Danger zone", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
    component: UserSettings,
    head: () => ({
        meta: [
            {
                title: "Settings - FastAPI Cloud",
            },
        ],
    }),
})

function UserSettings() {
    const { user: currentUser } = useAuth()

    // [로직 설명]
    // is_superuser인 경우 slice(0, 3)을 하면 index 0, 1, 2만 가져옵니다.
    // 0: Profile, 1: Password, 2: My Items
    // 즉, 관리자는 'Danger zone(계정 삭제)' 탭이 보이지 않게 됩니다. (의도된 로직 유지)
    const finalTabs = currentUser?.is_superuser
        ? tabsConfig.slice(0, 3)
        : tabsConfig

    if (!currentUser) {
        return null
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="my-profile">
                <TabsList>
                    {finalTabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {finalTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <tab.component />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}