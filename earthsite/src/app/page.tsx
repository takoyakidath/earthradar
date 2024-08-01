"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import classes from "@/components/Home.module.css";
import axios from "axios";

export default function Home() {
  const [jpTime, setJpTime] = useState("");
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setJpTime(now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const [Tsunami, setTsunami] = useState("");
  useEffect(() => {
    const socket = new WebSocket(
      "wss://api-realtime-sandbox.p2pquake.net/v2/ws"
    );
      socket.addEventListener("open", (event) => {
        console.log("WebSocket is connected:", event);
      });

      socket.addEventListener("message", (event) => {
        let exportP2P = event.data;
        setTsunami(exportP2P.domesticTsunami);
        console.log(Tsunami);
        console.log(exportP2P)
      });

      socket.addEventListener("close", (event) => {
        console.log("WebSocket is closed:", event);
      });

      socket.addEventListener("error", (event) => {
        console.error("WebSocket error observed:", event);
      });

      return () => {
        socket.close();
      };
  });
  return (
    <div className={classes.container}>
      <div className={classes.sidebarleft}>
        <div className={`${classes.Title}`}>EarthQuake Live</div>
        <ul>
          <li>
            <div>
              Wether <br />
              <ul>
                <li>・temp</li>
                <li>・svg</li>
              </ul>
            </div>
          </li>
          <li>
            <div>
              Latest Earthquake
              <ul>
                <li>震度</li>
                <li>震源地 </li>
                <li>時間</li>
                {/* 日本語フォントを対応させる */}
              </ul>
            </div>
          </li>
          <li>
            <div>
              Tsunami <br />
              {Tsunami}
            </div>
          </li>
          <li>
            {" "}
            <Link href="status/">
              <button className={classes.button}>Go to Status</button>
            </Link>
          </li>
        </ul>
      </div>
      <div className={classes.main}>
        <ul>
          <li>
            {" "}
            <div className={classes.main}>Last data EarthQuake Map</div>
          </li>
        </ul>
        <div className="Footer">
          {" "}
          Copyright © 2024 Takoyaki. All rights reserved.
        </div>
      </div>
      <div className={classes.sidebaright}>
        <div className={classes.time}>{jpTime}</div>
      </div>
    </div>
  );
}
