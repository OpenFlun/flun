# @flun/flun

## 简介

Flun 生态包索引:列出全部官方包、查看用途与安装命令、一键打开文档;

收录清单见包内 `packages.json`;命令行运行 `npx @flun/flun pkg` 可查看全部包及安装状态;

具体 API 与用法见各包自身文档,本包不重新导出子包功能;

---

## 特性

- 列出全部官方包,按已装/未装分组,显示描述与安装状态;
- 单包详情显示描述、安装命令与版本,已装包打开本地 `README.md`,未装包打开 npm 页面;
- `search` 子命令按包名、描述中的关键字搜索;
- 版本双轨显示:本地已装版本与 npm 最新版本对比,可升级项标为 `旧 → 新 (最新)`;
- 联网失败或超时时降级为清单记录的版本,不中断使用;
- npm 版本查询缓存 1 小时,`-r` 或 `--refresh` 可重新查询最新版本;
- 执行任意命令后检查本包自身是否有新版,有则提示更新命令,避免全局安装长期滞后;

---

## 包目录结构

随包发布的文件:

```
@flun/flun/
├── CHANGELOG.md   更新日志
├── cli.js         命令行入口(bin: flun)
├── flun.js        list / info / search / stats 四个函数
├── index.d.ts     类型声明
├── index.js       库入口,转发 flun.js 的导出
├── LICENSE        许可
├── net.js         联网查询最新版本与本地缓存
├── package.json   包配置
├── packages.json  包清单数据
└── README.md      本文件
```

---

## 安装前准备

### 允许安装脚本执行

本包在安装时可能触发某些依赖包的自动脚本(如 `postinstall` 等);如果你的 npm 全局配置或项目配置禁止了脚本执行(例如设置了
`ignore-scripts=true`),可能会导致安装不完整或运行时异常;

推荐在项目根目录的 `package.json` 中添加 `allowScripts` 字段,显式放行本包及其依赖的脚本:

```json
{
  "allowScripts": {
    "@flun/flun": true
  }
}
```

---

## 安装

项目内安装(作为开发工具):
```sh
npm i -D @flun/flun
```

全局安装(建议):
```sh
npm i -g @flun/flun # 之后使用 `flun` 查看用法

```

---

## 命令行

### 快速开始

```sh
npx @flun/flun pkg
```

### 子命令

| 参数              | 作用                                               |
| ----------------- | -------------------------------------------------- |
| `pkg`             | 列出全部包,按已装/未装分组                         |
| `search <关键字>` | 按包名、描述中的关键字搜索                         |
| `info <包名>`     | 查看单包详情;已装打开本地 README,未装打开 npm 页面 |
| `stats`           | 输出收录包时间、数量与最高版本                     |

### 选项

| 参数              | 作用                                                            |
| ----------------- | --------------------------------------------------------------- |
| `-r`, `--refresh` | 重新查询 npm 最新版本,忽略 1 小时缓存;仅对 `pkg` 与 `info` 生效 |

无参数、`help`、`-h`、`--help` 输出帮助;全局安装后把 `npx @flun/flun` 换成 `flun`;

---

## 函数方式

导入 `list`、`info`、`search`、`stats` 四个函数:

```js
import { list, info, search, stats } from '@flun/flun';

list();                // 全部包的元数据数组
info('@flun/mailer');  // 单包详情,不存在返回 null
search('ssl');         // 按关键字搜索,返回匹配的包列表;
stats();               // 返回收录包时间、收录包数量与收录最高版本;
```

四个库函数只读取包内 `packages.json`,不联网;CLI 会查询 npm registry 显示最新版本,带 1 小时缓存,
联网失败或单次请求超时(5 秒)时降级为本地版本并标注 `(离线)`;

---

## 清单维护

`packages.json` 由 `scripts/build-index.js` 生成,从本地各包的 `package.json` 抽取描述;

执行 `npm run build:index` 重新生成;脚本逐包比对,无变化时不写文件,有新包或描述变更时才更新;

---

## 许可证

ISC

---

## 贡献

- 主页:[npm 包页面](https://www.npmjs.com/package/@flun/flun#readme)
- 源码:[GitHub](https://github.com/OpenFlun/flun)
- 中国:[gitee](https://gitee.com/OpenFlun/flun.git)
- 问题反馈:[Issues](https://github.com/OpenFlun/flun/issues)