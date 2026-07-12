import { Routes, Route } from "react-router"
import { TRPCProvider } from "@/providers/trpc"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Dashboard from "./pages/Dashboard"
import { Sidebar } from "./components/Sidebar"
import { TopBar } from "./components/TopBar"
import { Toaster } from "@/components/ui/sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <Dashboard />
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <TRPCProvider>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<AppLayout />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </TRPCProvider>
  )
}
