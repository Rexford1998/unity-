import { Box } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Box className="w-12 h-12 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 rounded-lg animate-ping" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
