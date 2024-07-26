import Link from "next/link";
import classes from "@/components/Home.module.css";
export default function Home() {
  let jpTime; // グローバル変数として宣言

  function updateTime() {
      const now = new Date();
      let jpTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  }
setInterval(updateTime, 500);
updateTime(); // 初期表示のために最初に呼び出す
  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <div className={`${classes.Title}`}>EarthQuake Live</div>
        <ul>
          <li>
            <div>Wether(今日の天気)</div>
          </li>
          <li>
            <div>Latest Earthquake(履歴)
            <ul>
              <li>震度</li>
              <li>震源地 </li>
              <li>時間</li>
              {/* 日本語フォントを対応させる */}
            </ul>
            </div>
          </li>
          <li>
            <div>Warning/advisory(注意報)</div>
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
            <div className={classes.time}>{jpTime}</div>
            {/*リロードしないと時刻が更新されないため修正する */}
          </li>
          <li>
            {" "}
            <div className={classes.main}>Last data EarthQuake Map(直前の地震と地図)</div>
          </li>
        </ul>
        <div className="Footer"> Copyright © 2024 Takoyaki. All rights reserved.</div>
      </div>
    </div>
  );
}
