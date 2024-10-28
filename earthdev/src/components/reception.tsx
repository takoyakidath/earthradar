import { useState, useEffect } from "react";
import Link from "next/link";

export function Reception() {
  const [exportP2P, setExportP2P] = useState("");
  const [exportTime, setExportTime] = useState("");
  const [exportJma, setExportJma] = useState("");
  const [exportSite, setExportSite] = useState("");
  // 値をセッションストレージに保存する関数
  const saveToSessionStorage = (key: string, value: string) => {
    sessionStorage.setItem(key, value);
  };

  // 状態が変わるたびにセッションストレージに保存する
  useEffect(() => {
    if (exportP2P) saveToSessionStorage("ExportP2P", exportP2P);
  }, [exportP2P]);

  useEffect(() => {
    if (exportTime) saveToSessionStorage("ExportTime", exportTime);
  }, [exportTime]);

  useEffect(() => {
    if (exportJma) saveToSessionStorage("ExportJma", exportJma);
  }, [exportJma]);

  useEffect(() => {
    if (exportSite) saveToSessionStorage("ExportSite", exportSite);
  }, [exportSite]);

  useEffect(() => {
    const startup = () => {
      console.log("Startup function has been executed");
    };
    startup();
    getData();
    getTime();
    getSite();
  }, []);

  async function reception() {
    alert("Received!");
    getData();
    getTime();
    getSite();
  }

  function getSite() {
    setExportSite("[UNDER DEVELOPMENT]"); // 絵文字から変更
  }

  function getTime() {
    const now = new Date();
    const jpTime = now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    console.log("Japan Time: " + jpTime);
    setExportTime(jpTime);
  }

  async function getData() {
    const APIP2P = new WebSocket("wss://api.p2pquake.net/v2/ws");

    APIP2P.onopen = function (event) {
      console.log("[OK]");
      setExportP2P("[OK]"); // 接続成功時の表示変更
    };

    APIP2P.onclose = function (event) {
      console.log("[NG] " + event.code);
      setExportP2P("[NG] " + event.code); // エラーコードを表示
    };

    const APIJMA = await fetch(
      "https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json",
    );
    if (APIJMA.ok) {
      console.log("[OK]");
      setExportJma("[OK]");
    } else {
      console.log("[NG] " + APIJMA.status);
      setExportJma("[NG] " + APIJMA.status);
    }
  }

  return (
    <div>
      <main className="font-mono">
        <div className="p-5">
          <code>
            JMA-API {exportJma}
            <br />
            P2P-API {exportP2P}
            <br />
            Earthsite {exportSite}
            <br />
            Time {exportTime}
          </code>
        </div>
        <div className="flex flex-row w-full items-start underline space-x-5 px-5">
          <button onClick={reception}>RECEPTION</button>
          <Link href="https://github.com/takoyaki-desu/earthradar">GITHUB</Link>
        </div>
      </main>
    </div>
  );
}
