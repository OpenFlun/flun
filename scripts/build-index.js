import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(__dirname, '..'),
  pkgRoot = path.resolve(root, '..'), indexPath = path.join(root, 'packages.json'),
  expectMajor = process.argv.includes('--expect-major') ? 1 : 0,
  scanPkgs = () => fs.readdirSync(pkgRoot, { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== 'flun')
    .map(d => {
      const pj = path.join(pkgRoot, d.name, 'package.json');
      if (!fs.existsSync(pj)) return null;
      try { return JSON.parse(fs.readFileSync(pj, 'utf8')).name || null; } catch { return null; }
    }).filter(n => n && n.startsWith('@flun/')).sort(),
  cmpVer = (a, b) => {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d;
    }
    return 0;
  },
  buildOne = name => {
    const dir = path.join(pkgRoot, name.replace('@flun/', '')), pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return { version: pkg.version || '0.0.0', desc: pkg.description || '', install: `npm i ${name}` };
  },
  checkMajor = ecoMax => {
    const pkgVer = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
      pkgMajor = Number(pkgVer.split('.')[0]), ecoMajor = Number(ecoMax.split('.')[0]);
    if (pkgMajor + expectMajor < ecoMajor) {
      const target = ecoMajor - 1,
        fix = pkgMajor === target ? `请执行大版本升级指令` : `请手动把版本号改成 ${target},然后执行大版本升级指令`;
      throw new Error(`本包主版本 ${pkgMajor} 落后于生态主版本 ${ecoMajor},${fix}`);
    }
    if (pkgMajor > ecoMajor) console.warn(chalk.yellow(`警告:本包主版本 ${pkgMajor} 大于生态主版本 ${ecoMajor}`));
  }, same = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  /**
   * 生成 packages.json 清单
   * 逐包读取本地 package.json,与现有清单比对;无变化时不写文件;
   */
  main = () => {
    const old = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {}, next = {}, changes = [];
    let maxVer = '0.0.0';
    for (const name of scanPkgs()) {
      const item = buildOne(name);
      if (!item) {
        console.error(chalk.yellow(`跳过 ${name}:本地未找到`));
        if (old[name]) next[name] = old[name];
        continue;
      }
      if (cmpVer(item.version, maxVer) > 0) maxVer = item.version;
      next[name] = item;
      if (!same(old[name], item)) changes.push(name);
    }
    const sorted = Object.fromEntries(Object.keys(next).sort().map(k => [k, next[k]])),
      oldBody = Object.fromEntries(Object.entries(old).filter(([k]) => !k.startsWith('_'))),
      bodyChanged = !same(oldBody, sorted), ecoChanged = old._stats?.ecosystemMax !== maxVer;
    checkMajor(maxVer);
    if (!bodyChanged && !ecoChanged) {
      console.log(chalk.green('packages.json 无变化'));
      return;
    }
    const stats = {
      generatedAt: new Date().toISOString(), ecosystemMax: maxVer, packageCount: Object.keys(sorted).length
    };
    fs.writeFileSync(indexPath, JSON.stringify({ _stats: stats, ...sorted }, null, 2));
    console.log(chalk.green(`packages.json 已更新,ecosystemMax=${maxVer},变化包:${changes.join(', ') || '仅收录信息'}`));
  };

main();