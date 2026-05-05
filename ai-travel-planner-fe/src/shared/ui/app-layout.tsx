import { Outlet } from "react-router-dom"

import { AppHeader } from "@/shared/ui/app-header"

export const AppLayout = () => {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
