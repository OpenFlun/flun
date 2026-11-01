#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { list, info, search, stats } from './index.js';
import { resolveLatest } from './net.js';

const GOLD = '#B8860B',
  dispWidth = s => {
    let w = 0;
    for (const ch of s) w += ch.codePointAt(0) > 127 ? 2 : 1;
    return w;
  },
  padWidth = (s, w) => {
    const cur = dispWidth(s);
    return cur >= w ? s : s + ' '.repeat(w - cur);
  },
  styleVer = ver => {
    const [l, r] = ver.split(' → ');
    if (r) return chalk.blue(`${l} → `) + chalk.green(r) + chalk.greenBright(' (最新)');
    return /^(未安装|.*\(内部记录版本)/.test(ver) ? chalk.blue(ver) : chalk.cyan(ver);
  },
  findLocal = name => {
    let dir = process.cwd();
    while (true) {
      const target = path.join(dir, 'node_modules', ...name.split('/'));
      if (fs.existsSync(path.join(target, 'package.json'))) return target;
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  },
  readLocalVersion = name => {
    const dir = findLocal(name);
    if (!dir) return null;
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version || null;
    } catch { return null; }
  },
  formatVer = (local, latest, indexVer, online) => {
    if (online) {
      if (!local) return `未安装 → ${latest}`;
      if (!latest || latest === local) return local;
      const a = local.split('.').map(Number), b = latest.split('.').map(Number);
      for (let i = 0; i < 3; i++)
        if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0) ? local : `${local} → ${latest}`;
      return local;
    }
    if (!local) return indexVer ? `未安装 (内部记录版本: ${indexVer})` : '未安装';
    if (!indexVer || indexVer === local) return local;
    const cmp = local.split('.').map(Number), ref = indexVer.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((cmp[i] || 0) !== (ref[i] || 0))
        return (cmp[i] || 0) > (ref[i] || 0) ? local : `${local} (内部记录版本: ${indexVer})`;
    }
    return local;
  },
  openReadme = (name, pkg) => {
    const dir = findLocal(name);
    if (dir) {
      const readme = path.join(dir, 'README.md');
      if (fs.existsSync(readme)) {
        console.log(chalk.cyan('📖 打开本地文档: ') + chalk.gray(readme));
        execSync(`start "" "${readme}"`, { shell: true, stdio: 'ignore' });
        return;
      }
      return console.log(chalk.yellow(`⚠️ ${name} 已安装但缺少 README.md`));
    }
    const url = `https://www.npmjs.com/package/${name}`;
    console.log(chalk.yellow(`📦 ${name} 未安装`)), console.log(chalk.gray(`   安装: ${pkg.install}`));
    console.log(chalk.gray(`   在线文档: ${url}`));
    execSync(`start "" "${url}"`, { shell: true, stdio: 'ignore' });
  },
  printHelp = () => console.log(`用法: flun <命令> [选项]

  命令:
    pkgs              列出全部包(按已装/未装分组)
    search <关键字>   按包名、描述中的关键字搜索
    info <包名>       查看单包详情(已装打开本地 README,未装打开 npm 页面)
    stats             输出收录包时间、数量与最高版本

  选项:
    -r, --refresh     重新查询 npm 最新版本(忽略 1 小时缓存,仅对 pkgs 与 info 生效)

  无参数、help、-h、--help 输出本帮助。`),
  printList = async refresh => {
    const rows = list(), { data: latest, online } = await resolveLatest(rows.map(r => r.name), refresh),
      width = Math.max(...rows.map(r => r.name.length)), groups = [[], []];

    for (const r of rows) groups[findLocal(r.name) ? 0 : 1].push(r);
    console.log(chalk.green(`\n@flun 官方包列表${online ? '' : ' (离线)'}:\n`));
    for (const [i, title] of [[0, '已装'], [1, '未装']]) {
      if (!groups[i].length) continue;
      console.log((i === 0 ? chalk.cyan : chalk.blue)(`  ${title} (${groups[i].length}):`));
      for (const r of groups[i]) {
        const ver = formatVer(readLocalVersion(r.name), latest[r.name], r.version, online);
        console.log(`    ${chalk.cyanBright(padWidth(r.name, width))}  ${styleVer(ver)}`);
        console.log('      ' + chalk.dim(r.desc || '(无描述)'));
      }
      console.log('');
    }
    console.log(chalk.green(`共 ${rows.length} 个包`) + chalk.gray(';查看详情: flun info <包名>\n'));
  },
  printInfo = async (name, refresh) => {
    const pkg = info(name);
    if (!pkg) console.error(chalk.yellow('✗ 未找到相关包,如果你想查看所有包,请运行 flun pkgs\n')), process.exit(1);

    const { data: latest, online } = await resolveLatest([name], refresh),
      ver = formatVer(readLocalVersion(name), latest[name], pkg.version, online);

    console.log(chalk.blueBright(`\n${pkg.name}`)), console.log(chalk.dim(`  ${pkg.desc || '(无描述)'}`));
    console.log(chalk.gray(`  安装: ${pkg.install}`)), console.log(chalk.cyan('  版本: ') + styleVer(ver));
    console.log(''), openReadme(name, pkg);
  },
  printStats = () => {
    const m = stats();
    if (!m) return console.error(chalk.yellow('收录信息缺失,请重新生成 packages.json')), process.exit(1);
    console.log(chalk.green('\n收录信息:\n'));
    console.log(chalk.cyan('  收录包时间: ') + chalk.gray(String(m.generatedAt || '').slice(0, 10)));
    console.log(chalk.cyan('  收录包数量: ') + chalk.greenBright(String(m.packageCount ?? '未知')));
    console.log(chalk.cyan('  收录最高版本: ') + chalk.hex(GOLD)(String(m.ecosystemMax ?? '未知')));
    console.log('');
  },
  printSearch = kw => {
    const rows = search(kw);
    if (!rows.length) return console.log(chalk.yellow(`未找到匹配 "${kw}" 的包`));
    console.log(chalk.green(`\n匹配 "${kw}" 的包:\n`));
    for (const r of rows) console.log(`  ${chalk.cyanBright(r.name)}  ${chalk.gray(r.desc || '')}`);
    console.log('');
  },
  checkSelfUpdate = async refresh => {
    try {
      const self = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version,
        { data, online } = await resolveLatest(['@flun/flun'], refresh), latest = data['@flun/flun'];
      if (!online || !latest || latest === self) return;
      const x = latest.split('.').map(Number), y = self.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((x[i] || 0) !== (y[i] || 0)) {
          if ((x[i] || 0) > (y[i] || 0)) console.log('\n  ' + chalk.blueBright('当前包有新版:') + chalk.hex(GOLD)(latest)
            + chalk.gray(',更新: npm i -g @flun/flun'));
          return;
        }
      }
    } catch { }
  }, raw = process.argv.slice(2), refresh = raw.some(a => a === '--refresh' || a === '-r'),
  rest = raw.filter(a => a !== '--refresh' && a !== '-r'), [cmd, ...args] = rest;

if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') printHelp(), process.exit(0);
else if (cmd === 'pkgs') await printList(refresh);
else if (cmd === 'search') {
  if (!args.length) { console.error(chalk.cyan('用法: flun search <关键字>')), process.exit(1); }
  printSearch(args.join(' '));
} else if (cmd === 'info') {
  if (!args.length) { console.error(chalk.cyan('用法: flun info <包名>')), process.exit(1); }
  await printInfo(args[0], refresh);
} else if (cmd === 'stats') printStats();
else console.error(chalk.yellow(`✗ 未知命令: ${cmd}\n`)), printHelp(), process.exit(1);

await checkSelfUpdate(refresh);