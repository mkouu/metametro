// Vercel Serverless Function - 서울 열린데이터 API 프록시
// CORS 문제 해결용

const API_KEY = "4f626a4844696b6137354d5165487a";

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { station, trainNo, type } = req.query;

  try {
    let url;
    if (type === "arrival" && station) {
      // 실시간 열차 도착 정보
      url = `http://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(station)}`;
    } else if (type === "congestion" && trainNo) {
      // 실시간 칸별 혼잡도
      url = `http://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimeCarInfo/0/1/${trainNo}`;
    } else {
      return res.status(400).json({ error: "잘못된 요청이에요" });
    }

    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "API 호출 실패", message: e.message });
  }
}
