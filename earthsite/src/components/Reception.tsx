require("dotenv").config();
import classes from "@/components/classes.module.css";
import { useState, useEffect } from "react";
import nextConfig from "../../next.config.mjs";

export function Reception() {
  // APIのステータスを保持するための状態変数
  const [exportJma, setExportJma] = useState(() => {
    const savedJma = localStorage.getItem("exportJma");
    return savedJma ? JSON.parse(savedJma) : null;
  });

  const [exportP2P, setExportP2P] = useState(() => {
    const savedP2P = localStorage.getItem("exportP2P");
    return savedP2P ? JSON.parse(savedP2P) : null;
  });
  const [exportTime, setexportTime] = useState(() => {
    const savedTime = localStorage.getItem("exportTime");
    return savedTime ? JSON.parse(savedTime) : null;
  });

  useEffect(() => {
    localStorage.setItem("exportJma", JSON.stringify(exportJma));
  }, [exportJma]);

  useEffect(() => {
    localStorage.setItem("exportP2P", JSON.stringify(exportP2P));
  }, [exportP2P]);
  useEffect(() => {
    localStorage.setItem("exportTime", JSON.stringify(exportTime));
  }, [exportTime]);

  function reception() {
    const pass = prompt("パスワードを入力してください", "");
    if (pass === process.env.password) {
      alert("受信しました。!");
      getData();
      getTime();
    } else {
      alert("パスワードが違います");
    }
  }
  async function getTime() {
    const now = new Date();
    const jpTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    console.log("日本時間:", jpTime);
    setexportTime(jpTime);
  }
  async function getData() {
    //apiに受信しに行く
    const APIP2P = new WebSocket("wss://api.p2pquake.net/v2/ws");

    APIP2P.onopen = function (event) {
      console.log("🟢OK");
      setExportP2P("🟢OK"); // 接続成功時に状態を更新
    };

    APIP2P.onclose = function (event) {
      console.log("🔴"+event.code);
      setExportP2P("🔴"+event.code); // 終了時に状態を更新
    };

    const APIJMA = await fetch(
      "https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json"
    );
    if (APIJMA.ok) {
      console.log("🟢OK");
      setExportJma("🟢OK");
    } else {
      console.log("🔴"+APIJMA.status);
      setExportJma("🔴"+APIJMA.status);
    }

    
  }

  return (
    <div>
      <main>
        <code>
          <br />
          JMA-API {exportJma}
          <br />
          P2P-API {exportP2P}
          <br />
          取得時間　{exportTime}
          <br />
        </code>
        P2P-APIが1001になるのは仕様です　気にしないでください！<br />
        <button className={classes.button} onClick={reception}>
          受信
        </button>
      </main>
    </div>
  );
}
