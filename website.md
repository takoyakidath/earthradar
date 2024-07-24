裏の機能
.envをつくる
IP制限をする
Loadingの画面をつくる

お表の機能
main{
    P2P地震速報
    緊急地震速報(範囲,震度,津波の情報など)→API
    svgを生成
    震度

}
時間{
    
}
sidebar{
    地震の履歴(
        震度
        震源地
        時間
    )
    天気
}
status{
        p2pAPI-v1-earthquake("https://api.p2pquake.net/v2/ws")
        jma-wether("https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json")
    
        1.「受信」を押したとき30分のタイマーをスタートさせる
        ※30分間は受信ボタンを表示させない
        2.APIにリクエストを送る
        3.もしAPIリクエストを取得しできたらReception.tsxにOKを出す(下の方に何々分前でカウントアップする)
        4.30分経ったら受信ボタンを復活させてReception.tsxに3.で書いたOKを「受信」ボタンを押してくださいに書き換える。
        
}

仮起動
```npm run dev```

Port ```2025```