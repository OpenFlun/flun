import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)),
  index = JSON.parse(fs.readFileSync(path.join(__dirname, 'packages.json'), 'utf8'));

/**
 * 列出全部包的元数据
 * >查看定义:@see {@link list}
 * @returns {Array<{name: string, version: string, desc: string, install: string}>}
 */
const list = () => Object.entries(index).filter(([name]) => !name.startsWith('_'))
  .map(([name, entry]) => ({ name, ...entry }));

/**
 * 查询单个包详情
 * >查看定义:@see {@link info}
 * @param {string} name 包名
 * @returns {object|null} 存在时返回包信息,不存在返回 null
 */
const info = name => {
  if (!name || name.startsWith('_')) return null;
  const entry = index[name];
  return entry ? { name, ...entry } : null;
};

/**
 * 按关键字搜索包名与描述
 * >查看定义:@see {@link search}
 * @param {string} keyword 关键字
 * @returns {Array<object>} 匹配的包列表
 */
const search = keyword => {
  const kw = keyword.toLowerCase();
  return list().filter(item => item.name.toLowerCase().includes(kw) || (item.desc || '').toLowerCase().includes(kw));
};

/**
 * 清单元信息
 * >查看定义:@see {@link stats}
 * @returns {{generatedAt: string, ecosystemMax: string, packageCount: number}|null}
 */
const stats = () => index._stats || null;

export { list, info, search, stats };