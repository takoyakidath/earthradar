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
    const socket = new WebSocket("wss://api-realtime-sandbox.p2pquake.net/v2/ws");
      socket.addEventListener("open", (event) => {
        console.log("WebSocket is connected:", event);
      });

      socket.addEventListener("message", (event) => {
        try {
          const exportP2P = JSON.parse(event.data);
          if (exportP2P.domesticTsunami) {
            setTsunami(exportP2P.domesticTsunami);
          } else {
            console.log("No domesticTsunami field in message:", exportP2P);
          }
        } catch (error) {
          console.error("Error parsing message data:", error);
        }
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
  },[]);
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
              {Tsunami} <br />
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
