"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import classes from "@/components/Home.module.css";
import axios from "axios";
import { io } from 'socket.io-client';


export default function Home() {
  const socket = io('https://api-realtime-sandbox.p2pquake.net', {
    path: '/v2/socket.io'  // エンドポイントのパスを指定
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('message', 'Hello, server!');
  });
  
  socket.on('message', (data) => {
    console.log('Message received:', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('error', (error) => {
    console.error('Error occurred:', error);
  });

  const [jpTime, setJpTime] = useState("");
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setJpTime(now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const [warning, setWarning] = useState("");
  useEffect(() => {
    const intervalId = setInterval(() => {
      let warning = "b"
      setWarning(warning);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []); // 空の依存配列を渡すことで、マウント時とアンマウント時にのみ実行される

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
              Warning/advisory <br />
              {warning}
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
