import Sidebar from "@/components/sidebar"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="container p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
} 