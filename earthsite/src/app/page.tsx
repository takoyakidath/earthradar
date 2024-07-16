import { Footer } from "@/components/Footer";
import Link from "next/link";
import classes from "@/components/Home.module.css";
export default function Home() {
  return (
    <div>
      <div className={classes.Footer}>
        EarthQuake Live
      </div>
      <main>
        <div className={classes.main}>
        Last data
        EarthQuake Map
        </div>
      </main>
      <div className={classes.sidebar}>
            <div>Latest Earthquake</div>
            <div>Warning/advisory</div>
      </div>
      <Link href="status/">
          <button className={classes.button}>Go to Status</button>
        </Link>
      <Footer />
    </div>
  );
}
