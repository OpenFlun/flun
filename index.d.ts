import { list, info, search, stats } from './flun.js';

// =================================== index.js ===================================
/**
 * @flun/flun - Flun 生态包索引
 * ```js
 * // 文件导出内容
 * list()      // 列出全部包;
 * info(name)  // 查询单个包详情;
 * search(kw)  // 按关键字搜索;
 * stats()     // 收录包时间、数量与最高版本;
 * ```
 * >查看定义:@see {@link list}、{@link info}、{@link search}、{@link stats}
 */
declare module './index.js' {
  export * from './index.js';
}