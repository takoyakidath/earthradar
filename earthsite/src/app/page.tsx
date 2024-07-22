import { Footer } from "@/components/Footer";
import Link from "next/link";
import classes from "@/components/Home.module.css";

export default function Home() {
  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <div className={`${classes.Header}`}>EarthQuake Live</div>
        <ul>
          <li>
            <div>Wether</div>
          </li>
          <li>
            <div>Latest Earthquake</div>
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
        <div className={classes.main}>Last data EarthQuake Map</div>
        <Footer />
      </div>
    </div>
  );
}
