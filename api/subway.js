const API_KEY = "4f626a4844696b6137354d5165487a";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { station, trainNo, type } = req.query;

  try {
    let url;
    if (type === "arrival" && station) {
      url = `http://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(station)}`;
    } else if (type === "congestion" && trainNo) {
      url = `http://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimeCarInfo/0/1/${trainNo}`;
    } else {
      return res.status(400).json({ error: "잘못된 요청" });
    }

    // Node.js 내장 http 모듈로 http:// 호출 (fetch는 https만 지원)
    const http = require("http");
    const data = await new Promise((resolve, reject) => {
      http.get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => body += chunk);
        response.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error("JSON 파싱 실패: " + body.slice(0,100))); }
        });
      }).on("error", reject);
    });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "API 호출 실패", message: e.message });
  }
}
