"use client"
import { Footer } from "@/components/Footer";
import { Reception } from "@/components/Reception";
import Link from "next/link";
import classes from "@/components/classes.module.css";

export default function Home() {
  function reception() {
    if(true) {
      alert("受信しました。!");
    }else if(false){
      alert("しばらくしてからもう一度お試しください。");
    }
  }

  return (
    <div>
      <main>
        <Reception />
          <button className={classes.button} onClick={reception}>受信</button>
        <br />
        <Link href="/">
          <button className={classes.button}>Go to Page</button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
