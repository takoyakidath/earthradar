import { Footer } from "@/components/Footer";
import Link from "next/link";
import classes from "@/components/Home.module.css";
export default function Home() {
  let jpTime; // グローバル変数として宣言

  function updateTime() {
      const now = new Date();
      let jpTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  }
setInterval(updateTime, 500);
  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <div className={`${classes.Title}`}>EarthQuake Live</div>
        <ul>
          <li>
            <div>Wether</div>
          </li>
          <li>
            <div>Latest Earthquake
            <ul>
              <li>震度</li>
              <li>震源地 </li>
              <li>時間</li>
              {/* 日本語フォントを対応させる */}
            </ul>
            </div>
          </li>
          <li>
            <div>Warning/advisory</div>
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
            <div className={classes.main}>Last data EarthQuake Map</div>
          </li>
        </ul>
        <Footer />
      </div>
    </div>
  );
}
