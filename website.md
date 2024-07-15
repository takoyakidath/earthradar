裏の機能
.envをつくる
IP制限をする
Loadingの画面をつくる

お表の機能
main{
    P2P地震速報
    気象庁の緊急地震速報(範囲,震度など)→API
    svgを生成
    震度

}
sidebar{
    地震の履歴(
        震度
        震源地
        時間
    )
    天気
    時間
}
status{
    youtube
    APIサーバー(JMA P2P)
    
    受信する時はreCAPTCHAをしてapiを受信する
    クールダウンを追加する　30分
    30分間上のボックスに入れる
}

仮起動
```npm run dev```

Port ```2025```