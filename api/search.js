/**
 * GameRig Finder — Vercel Serverless Function
 * 楽天市場APIへのプロキシ。APIキーをサーバー側で保持し、
 * フロントエンドには一切露出しない。
 *
 * 環境変数:
 *   RAKUTEN_APP_ID  — アプリケーションID（UUID形式）
 *   RAKUTEN_ACCESS_KEY — アクセスキー（2026年2月以降必須）
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!appId || !accessKey) {
    return res.status(500).json({
      error: 'RAKUTEN_APP_ID または RAKUTEN_ACCESS_KEY が設定されていません。'
    });
  }

  const {
    keyword = 'ゲーミングデスクトップPC',
    maxPrice = 500000,
    page = 1,
    sort = '-reviewCount'
  } = req.query;

  const safeMaxPrice = Math.min(Math.max(parseInt(maxPrice) || 500000, 30000), 2000000);
  const safePage = Math.min(Math.max(parseInt(page) || 1, 1), 100);
  const safeSort = ['-reviewCount', '+itemPrice', '-itemPrice', '-reviewAverage'].includes(sort)
    ? sort : '-reviewCount';

  const params = new URLSearchParams({
    applicationId: appId,
    accessKey: accessKey,
    keyword: keyword.substring(0, 64),
    maxPrice: safeMaxPrice,
    minPrice: 30000,
    hits: 30,
    page: safePage,
    sort: safeSort,
    imageFlag: 1,
    format: 'json',
    formatVersion: 2,
  });

  // 2026年2月以降: 新エンドポイント + Refererヘッダーが必須
  const endpoint = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';
  const siteUrl = 'https://gamerig-finder-app.vercel.app';

  try {
    const upstream = await fetch(`${endpoint}?${params}`, {
      headers: {
        'User-Agent': 'GameRigFinder/1.0',
        'Referer': siteUrl,
        'Origin': siteUrl,
      }
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({
        error: `Rakuten API error: ${upstream.status}`,
        detail: errText
      });
    }

    const data = await upstream.json();

    const items = (data.Items || []).map(({ itemName, itemPrice, itemUrl, shopName,
      reviewAverage, reviewCount, mediumImageUrls, itemCaption }) => ({
      itemName,
      itemPrice,
      itemUrl,
      shopName,
      reviewAverage,
      reviewCount,
      imageUrl: mediumImageUrls?.[0]?.imageUrl || null,
      itemCaption: (itemCaption || '').substring(0, 300),
    }));

    return res.status(200).json({
      items,
      count: data.count || 0,
      page: data.page || 1,
      pageCount: data.pageCount || 1,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Fetch failed', detail: err.message });
  }
}
