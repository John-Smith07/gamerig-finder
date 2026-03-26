/**
 * GameRig Finder — Vercel Serverless Function
 * 楽天市場APIへのプロキシ。APIキーをサーバー側で保持し、
 * フロントエンドには一切露出しない。
 *
 * 環境変数: RAKUTEN_APP_ID（Vercelのダッシュボードで設定）
 */
export default async function handler(req, res) {
  // CORS: 同一オリジンのみ許可（自分のドメインに制限したい場合は変更）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    return res.status(500).json({ error: 'RAKUTEN_APP_ID is not configured on the server.' });
  }

  // フロントエンドから受け取るパラメータ
  const {
    keyword = 'ゲーミングデスクトップPC',
    maxPrice = 500000,
    page = 1,
    sort = '-reviewCount'
  } = req.query;

  // 入力バリデーション
  const safeMaxPrice = Math.min(Math.max(parseInt(maxPrice) || 500000, 30000), 2000000);
  const safePage = Math.min(Math.max(parseInt(page) || 1, 1), 100);
  const safeSort = ['-reviewCount', '+itemPrice', '-itemPrice', '-affiliateRate', '-reviewAverage'].includes(sort)
    ? sort : '-reviewCount';

  const params = new URLSearchParams({
    applicationId: appId,
    keyword: keyword.substring(0, 128),
    maxPrice: safeMaxPrice,
    minPrice: 30000,
    hits: 30,
    page: safePage,
    sort: safeSort,
    imageFlag: 1,
    format: 'json',
    formatVersion: 2,
  });

  try {
    const upstream = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params}`,
      { headers: { 'User-Agent': 'GameRigFinder/1.0' } }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: `Rakuten API error: ${upstream.status}`, detail: errText });
    }

    const data = await upstream.json();

    // レスポンスを最小化して返す（不要フィールドを除去）
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
