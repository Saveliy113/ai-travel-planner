import { BrowserRouter, Route, Routes } from "react-router-dom"

import { MainPage } from "@/pages/MainPage"
import PlanResultPage from "@/pages/PlanResultPage"
import { AppLayout } from "@/shared/ui/app-layout"

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />} path="/">
        <Route element={<MainPage />} index />
        <Route element={<PlanResultPage />} path="plan/result" />
      </Route>
    </Routes>
  </BrowserRouter>
)
