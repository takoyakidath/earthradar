import type { SocketStatus } from "@/lib/p2pquake/socket";

const statusLabel: Record<SocketStatus, string> = {
  connecting: "接続中...",
  live: "リアルタイム受信中",
  degraded: "簡易更新モード(再接続中)",
  closed: "切断",
};

const statusColor: Record<SocketStatus, string> = {
  connecting: "bg-yellow-500",
  live: "bg-green-500",
  degraded: "bg-orange-500",
  closed: "bg-gray-500",
};

export default function ConnectionStatus({ status }: { status: SocketStatus }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300 px-4 py-2">
      <span className={`inline-block w-2 h-2 rounded-full ${statusColor[status]}`} />
      {statusLabel[status]}
    </div>
  );
}
