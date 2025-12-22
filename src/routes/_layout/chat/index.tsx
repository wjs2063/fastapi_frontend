import { createFileRoute, Link } from '@tanstack/react-router'
import { Utensils, MessageSquare } from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute('/_layout/chat/')({
    component: AgentListPage,
})

// [수정됨] 각 Agent마다 이동할 고정 경로(path)를 지정
const AGENTS = [
    {
        id: "menu-recommend",
        name: "메뉴 추천 에이전트",
        description: "오늘 뭐 먹지? 당신의 취향과 현재 위치를 기반으로 최고의 점심/저녁 메뉴를 추천해드립니다.",
        icon: Utensils,
        color: "text-orange-500",
        path: "/chat/menu-recommend", // 이동할 정적 경로
    },
    // 추후 다른 Agent 추가 시:
    // {
    //     id: "travel-guide",
    //     name: "여행 가이드",
    //     ...
    //     path: "/chat/travel-guide"
    // }
]

function AgentListPage() {
    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
                <p className="text-muted-foreground mt-2">
                    원하는 목적에 맞는 AI Agent를 선택하여 대화를 시작하세요.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AGENTS.map((agent) => (
                    <Link
                        key={agent.id}
                        to={agent.path} // [수정됨] params 없이 path로 직접 이동
                        className="block h-full"
                    >
                        <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer hover:shadow-md">
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${agent.color}`}>
                                    <agent.icon className="w-6 h-6" />
                                </div>
                                <CardTitle>{agent.name}</CardTitle>
                                <CardDescription>{agent.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    대화 시작하기
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}