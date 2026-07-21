import type { SocketStatus } from "@/lib/p2pquake/socket";
import { IconWifi, IconWifiOff } from "./ui/icons";

const statusLabel: Record<SocketStatus, string> = {
  connecting: "接続中",
  live: "リアルタイム受信中",
  degraded: "簡易更新モード",
  closed: "切断",
};

const statusStyle: Record<SocketStatus, { dot: string; text: string; icon: "on" | "off" }> = {
  connecting: { dot: "bg-warning", text: "text-text-secondary", icon: "on" },
  live: { dot: "bg-success", text: "text-text-secondary", icon: "on" },
  degraded: { dot: "bg-warning", text: "text-warning", icon: "off" },
  closed: { dot: "bg-danger", text: "text-danger", icon: "off" },
};

export default function ConnectionStatus({ status }: { status: SocketStatus }) {
  const style = statusStyle[status];
  const Icon = style.icon === "on" ? IconWifi : IconWifiOff;

  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-medium ${style.text}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-3.5 w-3.5" />
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot} ${status === "live" ? "animate-pulse-soft" : ""}`}
      />
      {statusLabel[status]}
    </div>
  );
}
