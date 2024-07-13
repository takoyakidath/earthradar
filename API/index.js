import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import fs from 'fs';

async function fetchDataAndConvert() {
  try {
    const response = await fetch("https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml");
    const xmlData = await response.text();

    parseString(xmlData, (err, result) => {
      if (err) {
        console.error('XMLのパース中にエラーが発生しました:', err);
      } else {
        const jsonData = JSON.stringify(result, null, 2); // JSONに変換し、整形して文字列化
        console.log(jsonData); // JSONデータをコンソールに出力

        // index.jsにJSONデータを書き込む
        fs.writeFileSync('data.json', jsonData); // 例: data.jsonというファイルに書き込む

        console.log('JSONデータをファイルに書き込みました。');
      }
    });

  } catch (error) {
    console.error('データ取得中にエラーが発生しました:', error);
  }
}

// 定期的にデータを取得するための関数
async function fetchPeriodically() {
  await fetchDataAndConvert(); // 初回のデータ取得と変換を実行

// 0.1秒間隔でデータを取得するループ
setInterval(fetchDataAndConvert, 100); // ミリ秒単位で指定するために変換
}

fetchPeriodically(); // プログラムを実行
