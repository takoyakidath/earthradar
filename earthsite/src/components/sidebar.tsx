import Earthquake from "./earthquake";
export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex">
        <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
          <div className="p-4 text-xl font-bold border-b border-gray-700">EarthQuake</div>
          <nav className="flex-1 p-4 space-y-2">
            <div >Historical Earthquake Data</div>
            <Earthquake
              data={{
                id: "eq20250719",
                date: "2025-07-19T08:45:00+09:00",
                location: "茨城県沖",
                magnitude: 5.3,
                depth: 60,
                intensity: "震度4",
              }}
            />
            <Earthquake
              data={{
                id: "eq20250719",
                date: "2025-07-19T08:45:00+09:00",
                location: "茨城県沖",
                magnitude: 5.3,
                depth: 60,
                intensity: "震度4",
              }}
            />
            <Earthquake
              data={{
                id: "eq20250719",
                date: "2025-07-19T08:45:00+09:00",
                location: "茨城県沖",
                magnitude: 5.3,
                depth: 60,
                intensity: "震度4",
              }}
            />
            <Earthquake
              data={{
                id: "eq20250719",
                date: "2025-07-19T08:45:00+09:00",
                location: "茨城県沖",
                magnitude: 5.3,
                depth: 60,
                intensity: "震度4",
              }}
            />


          </nav>

          <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
            &copy; 2025 EarthQuake
          </div>
        </div>

        <div className="flex-1">
          {children}
        </div>
      </div>

    </>
  )
}