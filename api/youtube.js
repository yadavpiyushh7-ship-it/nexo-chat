import { YOUTUBE_CS_CATALOG, filterAndRankCatalog } from '../src/data/youtubeCatalog.js';

/**
 * Serverless API Route: api/youtube.js
 * Fetches 25+ real playable YouTube search results using YouTube Data API v3 (maxResults=25)
 * or keyless server-side YouTube extraction, backed by a 54-video CSE catalog.
 */

function pushRenderer(v, results, seenIds, maxResults) {
  if (!v?.videoId || seenIds.has(v.videoId)) return;
  seenIds.add(v.videoId);

  const title =
    v?.title?.runs?.map((r) => r.text).join('') ||
    v?.title?.simpleText ||
    'YouTube Lecture';
  const channel =
    v?.ownerText?.runs?.[0]?.text ||
    v?.longBylineText?.runs?.[0]?.text ||
    'YouTube Creator';
  const duration = v?.lengthText?.simpleText || 'HD';
  const thumbnail =
    v?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
    `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

  results.push({
    id: `yt_${v.videoId}`,
    videoId: v.videoId,
    topic: 'YouTube',
    title,
    channel,
    duration,
    thumbnail,
  });
}

function collectVideoRenderers(node, results, seenIds, maxResults) {
  if (!node || typeof node !== 'object' || results.length >= maxResults) return;
  if (node.videoRenderer) {
    pushRenderer(node.videoRenderer, results, seenIds, maxResults);
    if (results.length >= maxResults) return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoRenderers(item, results, seenIds, maxResults);
      if (results.length >= maxResults) break;
    }
    return;
  }
  for (const key of Object.keys(node)) {
    collectVideoRenderers(node[key], results, seenIds, maxResults);
    if (results.length >= maxResults) break;
  }
}

function extractVideosFromHtml(html, maxResults = 25) {
  const marker = 'var ytInitialData = ';
  const startIdx = html.indexOf(marker);
  if (startIdx < 0) return [];

  const jsonStart = startIdx + marker.length;
  const endIdx = html.indexOf(';</script>', jsonStart);
  if (endIdx < 0) return [];

  const data = JSON.parse(html.slice(jsonStart, endIdx));
  const results = [];
  const seenIds = new Set();
  collectVideoRenderers(data, results, seenIds, maxResults);
  return results;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let query = '';
  try {
    if (req.method === 'GET') {
      const urlObj = new URL(req.url, 'http://localhost');
      query = (urlObj.searchParams.get('q') || '').trim();
    } else if (req.method === 'POST') {
      query = (req.body?.q || '').trim();
    }
  } catch {}

  if (!query) {
    return res.status(200).json({
      success: true,
      source: 'curated',
      videos: YOUTUBE_CS_CATALOG,
    });
  }

  const ytKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
  if (ytKey) {
    try {
      const apiRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&type=video&q=${encodeURIComponent(query)}&key=${ytKey}`
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          const videos = json.items.map((item) => ({
            id: `yt_${item.id.videoId}`,
            videoId: item.id.videoId,
            topic: query,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            duration: 'HD',
            thumbnail:
              item.snippet?.thumbnails?.high?.url ||
              `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          }));
          return res.status(200).json({ success: true, source: 'youtube_api_v3', videos });
        }
      }
    } catch {}
  }

  try {
    const pageRes = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (pageRes.ok) {
      const html = await pageRes.text();
      const extracted = extractVideosFromHtml(html, 25);
      if (extracted.length > 0) {
        // Ensure at least 22+ playable results by appending ranked catalog items if YouTube returned fewer
        if (extracted.length < 22) {
          const seen = new Set(extracted.map((v) => v.videoId));
          const extra = filterAndRankCatalog(query, 30);
          for (const item of extra) {
            if (!seen.has(item.videoId)) {
              extracted.push(item);
              seen.add(item.videoId);
            }
            if (extracted.length >= 25) break;
          }
        }
        return res.status(200).json({ success: true, source: 'youtube_live', videos: extracted });
      }
    }
  } catch (err) {
    console.warn('YouTube live search fallback:', err?.message || err);
  }

  return res.status(200).json({
    success: true,
    source: 'curated_catalog',
    videos: filterAndRankCatalog(query, 28),
  });
}
