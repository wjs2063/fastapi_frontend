import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// [변경] use-toast 대신 sonner 사용 (설치 에러 해결 및 코드 간소화)
import { toast } from "sonner"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { type ItemPublic, type ItemUpdate, ItemsService } from "@/client"
import { type ApiError } from "@/client/core/ApiError"
import useAuth from "@/hooks/useAuth"

interface EditItemProps {
    item: ItemPublic
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditItem({ item, open, onOpenChange }: EditItemProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const form = useForm<ItemUpdate>({
        mode: "onChange",
        defaultValues: {
            title: item.title,
            description: item.description ?? "",
            is_solved: item.is_solved ?? false,
        },
    })

    const mutation = useMutation({
        mutationFn: (data: ItemUpdate) =>
            ItemsService.updateItem({ id: item.id, requestBody: data }),
        onSuccess: () => {
            // [변경] sonner 문법으로 변경
            toast.success("수정 완료", {
                description: "건의사항이 업데이트되었습니다.",
            })
            onOpenChange(false)
            queryClient.invalidateQueries({ queryKey: ["items"] })
        },
        onError: (err: ApiError) => {
            const errDetail = (err.body as any)?.detail
            toast.error("Error", {
                description: typeof errDetail === "string" ? errDetail : "Something went wrong",
            })
        },
    })

    const onSubmit = (data: ItemUpdate) => {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>건의사항 수정</DialogTitle>
                    <DialogDescription>
                        게시글 내용을 수정하거나 처리 상태를 변경할 수 있습니다.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>제목</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} placeholder="제목을 입력하세요" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>내용</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ""}
                                            placeholder="상세 내용을 입력하세요"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {user?.is_superuser && (
                            <FormField
                                control={form.control}
                                name="is_solved"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-semibold">
                                                해결 완료
                                            </FormLabel>
                                            <FormDescription>
                                                이 건의사항이 처리되었다면 체크해주세요.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value ?? false}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-green-600"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                type="button"
                            >
                                취소
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                저장하기
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}