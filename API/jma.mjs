// xmlをjsonに変換してindex.jsに出力する
// 2.XMLを定期的にfetchする
// 3.もし変更がない場合は終了する
// 4.jsonに変換する
// 5.変換したjsonをindex.jsに流す

import fetch from 'node-fetch';
import { parseString } from 'xml2js';

let lastXmlData = null;

async function fetchDataAndProcess() {
    try {
        const response = await fetch("https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml");
        const xmlData = await response.text();

        if (xmlData === lastXmlData) {
            console.log("No change in XML data. Exiting...");
            return;
        }

        lastXmlData = xmlData;

        parseString(xmlData, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
            } else {
                const jsonData = JSON.stringify(result);
                // ここでjsonDataをindex.jsに流し込む方法を実装する
                console.log(jsonData); // 例としてコンソールに出力
            }
        });

    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

setInterval(fetchDataAndProcess, 1000); // 1秒ごとにデータを取得する
