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
      getData()
    } else {
      alert("しばらくしてからもう一度お試しください。");
    }
  }
async function getData(){
//apiに受信しに行く
const APIP2P = new WebSocket('wss://api.p2pquake.net/v2/ws');

APIP2P.onopen = function(event) {
  console.log("OK");
  const ExportP2P ="OK"
};

APIP2P.onclose = function(event) {
  console.log('Code:', event.code);
};


const APIJMA = await fetch("https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json")
if (APIJMA.ok) {
  console.log("OK")
  const ExportJma = "OK"
}else {
  console.log(APIJMA.status);
}
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
function io(arg0: { autoConnect: boolean; }) {
  throw new Error("Function not implemented.");
}

