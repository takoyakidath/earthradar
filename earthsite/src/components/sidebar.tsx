export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
    <div className="flex">
  <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
    <div className="p-4 text-xl font-bold border-b border-gray-700">EarthQuake</div>
    <nav className="flex-1 p-4 space-y-2">
        <div >過去の地震データ</div>
    </nav>
    <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
      &copy; 2025 EarthQuake
    </div>
  </div>

  <div className="flex-1 p-6">
    {children}
  </div>
</div>

    </>
  )
}