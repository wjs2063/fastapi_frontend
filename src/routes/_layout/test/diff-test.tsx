import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
// [수정] 일반 Editor 추가 (단일 응답 보기용)
import { DiffEditor, Editor } from "@monaco-editor/react"
import { useMutation } from "@tanstack/react-query"
import { Play, Code2, ArrowRightLeft, Copy, FileText, Split } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// [필수] 라우트 정의
export const Route = createFileRoute('/_layout/test/diff-test')({
    component: ABTestPage,
})

// --- 타입 정의 ---
type MethodType = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "PATCH"

interface RequestConfig {
    url: string
    method: MethodType
    headers: string // JSON string
    params: string  // JSON string
    body: string    // JSON string
}

interface TestFormValues {
    configA: RequestConfig
    configB: RequestConfig
}

const DEFAULT_HEADERS = JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " }, null, 2)
const DEFAULT_PARAMS = JSON.stringify({}, null, 2)
const DEFAULT_BODY = JSON.stringify({}, null, 2)

function ABTestPage() {
    // --- 상태 관리 ---
    const [resultA, setResultA] = useState<string | undefined>(undefined)
    const [resultB, setResultB] = useState<string | undefined>(undefined)

    const [statusA, setStatusA] = useState<number | null>(null)
    const [statusB, setStatusB] = useState<number | null>(null)

    const [durationA, setDurationA] = useState<number | null>(null)
    const [durationB, setDurationB] = useState<number | null>(null)

    // 에디터 언어 설정 (json | html | plaintext)
    const [editorLanguage, setEditorLanguage] = useState<string>("json")

    // --- React Hook Form ---
    const form = useForm<TestFormValues>({
        defaultValues: {
            configA: {
                method: "GET",
                url: "http://localhost:8000/api/v1/",
                headers: DEFAULT_HEADERS,
                params: DEFAULT_PARAMS,
                body: DEFAULT_BODY,
            },
            configB: {
                method: "GET",
                url: "http://localhost:8000/api/v2/",
                headers: DEFAULT_HEADERS,
                params: DEFAULT_PARAMS,
                body: DEFAULT_BODY,
            },
        },
    })

    const { handleSubmit } = form

    // --- 요청 실행 로직 ---
    const executeRequest = async (config: RequestConfig) => {
        const startTime = performance.now()
        try {
            // 1. JSON 파싱
            let paramsObj = {}
            let headersObj = {}

            try {
                paramsObj = JSON.parse(config.params || "{}")
            } catch {
                throw new Error("Invalid JSON in Params")
            }

            try {
                headersObj = JSON.parse(config.headers || "{}")
            } catch {
                throw new Error("Invalid JSON in Headers")
            }

            // 2. URL 생성
            const urlObj = new URL(config.url)
            Object.entries(paramsObj).forEach(([key, value]) => {
                urlObj.searchParams.append(key, String(value))
            })

            // 3. Fetch 옵션
            const options: RequestInit = {
                method: config.method,
                headers: headersObj as Record<string, string>,
            }

            if (config.method !== "GET" && config.method !== "HEAD") {
                try {
                    JSON.parse(config.body)
                    options.body = config.body
                } catch {
                    throw new Error("Invalid JSON in Body")
                }
            }

            // 4. 요청 전송
            const res = await fetch(urlObj.toString(), options)
            const contentType = res.headers.get("content-type") || ""
            const text = await res.text()
            const endTime = performance.now()

            // 5. 응답 처리
            let formattedData = text
            let language = "plaintext"

            try {
                const json = JSON.parse(text)
                formattedData = JSON.stringify(json, null, 2)
                language = "json"
            } catch {
                if (contentType.includes("html") || text.trim().startsWith("<")) {
                    language = "html"
                    formattedData = text
                } else {
                    language = "plaintext"
                }
            }

            return {
                status: res.status,
                data: formattedData,
                duration: Math.round(endTime - startTime),
                language,
            }

        } catch (err: any) {
            return {
                status: 0,
                data: JSON.stringify({ error: err.message }, null, 2),
                duration: 0,
                language: "json",
            }
        }
    }

    // --- Mutation ---
    const mutation = useMutation({
        mutationFn: async (data: TestFormValues) => {
            const [resA, resB] = await Promise.all([
                executeRequest(data.configA),
                executeRequest(data.configB),
            ])
            return { resA, resB }
        },
        onSuccess: (data) => {
            setResultA(data.resA.data)
            setStatusA(data.resA.status)
            setDurationA(data.resA.duration)

            setResultB(data.resB.data)
            setStatusB(data.resB.status)
            setDurationB(data.resB.duration)

            if (data.resA.language === 'html' || data.resB.language === 'html') {
                setEditorLanguage('html')
            } else {
                setEditorLanguage('json')
            }

            toast.success("비교 완료", { description: "두 요청이 완료되었습니다." })
        },
        onError: () => {
            toast.error("요청 실패", { description: "설정을 확인해주세요." })
        },
    })

    const onSubmit = (data: TestFormValues) => {
        mutation.mutate(data)
    }

    const copyAToB = () => {
        const configA = form.getValues("configA")
        form.setValue("configB", { ...configA, url: form.getValues("configB").url })
        toast.success("설정 복사됨", { description: "A의 설정을 B로 복사했습니다." })
    }

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-[1800px]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">API응답 비교 테스트</h2>
                    <p className="text-muted-foreground mt-2">
                        독립적인 설정을 통해 두 API의 응답을 정밀하게 비교합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={copyAToB} type="button">
                        <Copy className="mr-2 h-4 w-4" /> Copy A Config to B
                    </Button>
                    <Button size="lg" onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
                        {mutation.isPending ? "Testing..." : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Run Compare
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* === [왼쪽] 설정 패널 === */}
                <Card className="lg:col-span-5 border-muted h-fit">
                    <CardHeader>
                        <CardTitle>Request Configuration</CardTitle>
                        <CardDescription>
                            각 요청에 대해 Header, Params, Body를 JSON 형식으로 입력하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="configA" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="configA">Original Server</TabsTrigger>
                                <TabsTrigger value="configB">Other Server</TabsTrigger>
                            </TabsList>

                            <TabsContent value="configA">
                                <RequestConfigForm form={form} basePath="configA" label="Original Server" />
                            </TabsContent>

                            <TabsContent value="configB">
                                <RequestConfigForm form={form} basePath="configB" label="Other Server" />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* === [오른쪽] 결과 패널 (Tabs 적용) === */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    {/* 상단 상태 카드 (항상 표시) */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatusCard label="Original Server" status={statusA} duration={durationA} />
                        <StatusCard label="Other Server" status={statusB} duration={durationB} />
                    </div>

                    {/* 뷰어 탭 (Diff / A / B) */}
                    <Tabs defaultValue="diff" className="flex-1 flex flex-col min-h-[700px]">
                        <TabsList className="w-full justify-start h-10 mb-2 bg-muted/50 p-1">
                            <TabsTrigger value="diff" className="gap-2">
                                <Split className="h-4 w-4" /> Diff Comparison
                            </TabsTrigger>
                            <TabsTrigger value="responseA" className="gap-2">
                                <FileText className="h-4 w-4" /> Original Server
                            </TabsTrigger>
                            <TabsTrigger value="responseB" className="gap-2">
                                <FileText className="h-4 w-4" /> Other Server
                            </TabsTrigger>
                        </TabsList>

                        {/* 1. Diff View */}
                        <TabsContent value="diff" className="flex-1 m-0">
                            <Card className="flex-1 h-full overflow-hidden flex flex-col border shadow-md">
                                <div className="bg-muted/40 p-2 border-b flex items-center gap-2 text-xs text-muted-foreground justify-center select-none">
                                    <ArrowRightLeft className="h-3 w-3" />
                                    <span>Left: Original vs Right: Others</span>
                                    <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                                        Format: {editorLanguage}
                                    </Badge>
                                </div>
                                <div className="flex-1 relative w-full h-full min-h-[600px]">
                                    {resultA !== undefined && resultB !== undefined ? (
                                        <DiffEditor
                                            height="100%"
                                            language={editorLanguage}
                                            original={resultA}
                                            modified={resultB}
                                            theme="light"
                                            options={{
                                                readOnly: true,
                                                renderSideBySide: true,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                fontSize: 13,
                                                wordWrap: "on",
                                                originalEditable: false,
                                            }}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* 2. Response A View */}
                        <TabsContent value="responseA" className="flex-1 m-0">
                            <SingleResponseViewer
                                title="Original Server Response"
                                value={resultA}
                                language={editorLanguage}
                            />
                        </TabsContent>

                        {/* 3. Response B View */}
                        <TabsContent value="responseB" className="flex-1 m-0">
                            <SingleResponseViewer
                                title="Others Server Response"
                                value={resultB}
                                language={editorLanguage}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

// --- 하위 컴포넌트: 단일 응답 뷰어 ---
function SingleResponseViewer({ title, value, language }: { title: string, value: string | undefined, language: string }) {
    return (
        <Card className="flex-1 h-full overflow-hidden flex flex-col border shadow-md">
            <div className="bg-muted/40 p-2 border-b flex items-center gap-2 text-xs text-muted-foreground justify-center select-none">
                <FileText className="h-3 w-3" />
                <span>{title}</span>
                <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                    Format: {language}
                </Badge>
            </div>
            <div className="flex-1 relative w-full h-full min-h-[600px]">
                {value !== undefined ? (
                    <Editor
                        height="100%"
                        language={language}
                        value={value}
                        theme="light"
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 13,
                            wordWrap: "on",
                        }}
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </Card>
    )
}

// --- 하위 컴포넌트: 빈 상태 화면 ---
function EmptyState() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 gap-4">
            <Play className="h-10 w-10 opacity-20" />
            <p>상단의 "Run Compare" 버튼을 눌러 비교를 시작하세요.</p>
        </div>
    )
}

// --- 하위 컴포넌트: 설정 폼 ---
function RequestConfigForm({ form, basePath, label }: { form: UseFormReturn<TestFormValues>, basePath: "configA" | "configB", label: string }) {
    const { register, setValue, watch } = form

    const prettifyJson = (fieldName: keyof RequestConfig) => {
        try {
            const path = `${basePath}.${fieldName}` as const
            // @ts-ignore
            const current = watch(path)
            const parsed = JSON.parse(current)
            // @ts-ignore
            setValue(path, JSON.stringify(parsed, null, 2))
            toast.success("JSON Formatted")
        } catch {
            toast.error("Invalid JSON", { description: "형식이 올바르지 않습니다." })
        }
    }

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-muted-foreground">{label} URL</Label>
                <div className="flex gap-2">
                    <div className="w-[110px]">
                        <Select
                            defaultValue="GET"
                            // @ts-ignore
                            onValueChange={(val) => setValue(`${basePath}.method`, val)}
                            // @ts-ignore
                            value={watch(`${basePath}.method`)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="HEAD">HEAD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Input {...register(`${basePath}.url`)} placeholder="https://api..." />
                </div>
            </div>

            <Tabs defaultValue="params" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="params" className="text-xs">Params (JSON)</TabsTrigger>
                    <TabsTrigger value="headers" className="text-xs">Headers (JSON)</TabsTrigger>
                    <TabsTrigger value="body" className="text-xs">Body (JSON)</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="mt-2 relative">
                    <JsonInput
                        register={register}
                        path={`${basePath}.params`}
                        onFormat={() => prettifyJson("params")}
                        placeholder='{ "page": 1, "sort": "desc" }'
                    />
                </TabsContent>

                <TabsContent value="headers" className="mt-2 relative">
                    <JsonInput
                        register={register}
                        path={`${basePath}.headers`}
                        onFormat={() => prettifyJson("headers")}
                        placeholder='{ "Authorization": "Bearer..." }'
                    />
                </TabsContent>

                <TabsContent value="body" className="mt-2 relative">
                    <JsonInput
                        register={register}
                        path={`${basePath}.body`}
                        onFormat={() => prettifyJson("body")}
                        placeholder='{ "key": "value" }'
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// --- 하위 컴포넌트: JSON 입력기 ---
function JsonInput({ register, path, onFormat, placeholder }: any) {
    return (
        <div className="relative">
            <Textarea
                {...register(path)}
                className="font-mono text-xs min-h-[250px] resize-y leading-relaxed"
                placeholder={placeholder}
            />
            <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 h-6 text-xs px-2 opacity-80 hover:opacity-100"
                onClick={onFormat}
            >
                <Code2 className="mr-1 h-3 w-3" /> Format
            </Button>
        </div>
    )
}

// --- 하위 컴포넌트: 결과 상태 카드 ---
function StatusCard({ label, status, duration }: { label: string, status: number | null, duration: number | null }) {
    const isSuccess = status && status >= 200 && status < 300
    return (
        <Card className={`border shadow-sm ${isSuccess ? "bg-green-50/30 border-green-200" : status ? "bg-red-50/30 border-red-200" : ""}`}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <span className="font-semibold text-sm">{label}</span>
                <div className="flex gap-2 items-center">
                    {status && (
                        <Badge variant={isSuccess ? "default" : "destructive"}>
                            {status}
                        </Badge>
                    )}
                    {duration && <span className="text-xs text-muted-foreground font-mono">{duration}ms</span>}
                </div>
            </CardHeader>
        </Card>
    )
}