import classes from "@/components/classes.module.css";
import { useState } from 'react'; // useStateフックをインポートして状態管理を行う
export function Reception() {
          // APIのステータスを保持するための状態変数
          const [exportJma, setExportJma] = useState(null);
          const [exportP2P, setExportP2P] = useState(null);
        
    function reception() {
        alert("受信しました。!");
        getData()
      }
    async function getData(){
    //apiに受信しに行く
    const APIP2P = new WebSocket('wss://api.p2pquake.net/v2/ws');
    
    APIP2P.onopen = function(event) {
      console.log("OK");
      setExportP2P("OK"); // 接続成功時に状態を更新
    };
    
    APIP2P.onclose = function(event) {
      console.log('Code:', event.code);
      setExportP2P(event.code); // 終了時に状態を更新
    };
    
    const APIJMA = await fetch("https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json")
    if (APIJMA.ok) {
      console.log("OK")
      setExportJma("OK");
      
    }else {
      console.log(APIJMA.status);
      setExportJma(APIJMA.status);
    }
    }



    return (
      <div>
        <main>
          <code>
          <br />
          JMA-API {exportJma}<br />
          P2P-API {exportP2P}<br />
          </code> 
          <button className={classes.button} onClick={reception}>
          受信
        </button>
        </main>
      </div>
    );
  }
  