import fs from 'fs';
import os from 'os';
import path from 'path';

const CACHE_FILE = path.join(os.homedir(), '.flun-cache.json'), CACHE_TTL = 3600 * 1000,
  readCache = () => {
    try {
      const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return Date.now() - raw.ts > CACHE_TTL ? {} : (raw.data || {});
    } catch { return {}; }
  },
  writeCache = data => {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ ts: Date.now(), data }));
    } catch { }
  },
  fetchLatest = async name => {
    try {
      const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}/latest`,
        res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return (await res.json()).version || null;
    } catch { return null; }
  };

/**
 * 批量查询各包在 npm registry 上的最新版本
 * >查看定义:@see {@link resolveLatest}
 * @param {string[]} names 包名数组
 * @param {boolean} refresh 是否跳过缓存强制刷新
 * @returns {Promise<{data: object, online: boolean}>} 版本映射与是否联网成功
 */
const resolveLatest = async (names, refresh) => {
  const cached = refresh ? {} : readCache(), missing = names.filter(n => !cached[n]);
  if (!missing.length) return { data: cached, online: true };

  const pairs = await Promise.all(missing.map(async n => [n, await fetchLatest(n)])), data = { ...cached };
  let ok = 0;
  for (const [n, v] of pairs) if (v) data[n] = v, ok++;
  if (ok) writeCache(data);
  return { data, online: ok > 0 };
};

export { resolveLatest };