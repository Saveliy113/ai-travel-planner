import { BrowserRouter, Route, Routes } from "react-router-dom"

import { MainPage } from "@/pages/MainPage"
import { AppLayout } from "@/shared/ui/app-layout"

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />} path="/">
        <Route element={<MainPage />} index />
      </Route>
    </Routes>
  </BrowserRouter>
)
