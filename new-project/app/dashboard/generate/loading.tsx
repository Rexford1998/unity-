import { Sparkles } from "lucide-react"

export default function GenerateLoading() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 space-y-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-xl p-6 flex flex-col">
          <div className="h-6 w-24 bg-muted animate-pulse rounded mb-4" />
          <div className="flex-1 min-h-[300px] bg-muted/50 rounded-xl flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
