"use client";
import { Footer } from "@/components/Footer";
import { Reception } from "@/components/Reception";
import Link from "next/link";
import classes from "@/components/classes.module.css";

export default function Home() {
  // true / false
  function reception() {
    //30分以内か前回の取得時間を確認しに行く
    //const ApiTime =

    //とりあえず
    const ApiTime = true;

    if (ApiTime) {
      alert("受信しました。!");
      getapi();
    } else {
      alert("しばらくしてからもう一度お試しください。");
    }
  }
function getapi(){
//apiに受信しに行く
console.log("reception!!")
}
  return (
    <div>
      <main>
        <Reception />
        <button className={classes.button} onClick={reception}>
          受信
        </button>
        <br />
        <Link href="/">
          <button className={classes.button}>Go to Page</button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
