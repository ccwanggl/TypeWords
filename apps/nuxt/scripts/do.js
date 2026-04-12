const {SitemapStream, streamToPromise} = require('sitemap')
const {createWriteStream, existsSync, writeFileSync} = require('fs')
const {resolve} = require('path')

function normalizeBaseURL(baseURL = '/') {
  if (!baseURL) return '/'

  let normalizedBaseURL = baseURL.trim()

  if (!normalizedBaseURL.startsWith('/')) {
    normalizedBaseURL = `/${normalizedBaseURL}`
  }
  if (!normalizedBaseURL.endsWith('/')) {
    normalizedBaseURL = `${normalizedBaseURL}/`
  }

  return normalizedBaseURL.replace(/\/{2,}/g, '/')
}

function withBaseURL(path, baseURL) {
  if (!path.startsWith('/')) return path
  if (baseURL === '/') return path
  if (path === '/') return baseURL
  return `${baseURL.slice(0, -1)}${path}`
}

function toSiteURL(path, origin, baseURL) {
  return new URL(withBaseURL(path, baseURL), origin).toString()
}

function resolveOutputDir() {
  const outputDirs = [resolve(__dirname, '../.output/public'), resolve(__dirname, '../dist')]

  return outputDirs.find(dir => existsSync(dir)) || outputDirs[0]
}

async function generateSitemap() {
  const bookList = require('../public/list/article.json')
  const dictList = require('../public/list/word.json')
  const SITE_URL = (process.env.ORIGIN || 'https://typewords.cc').replace(/\/$/, '')
  const APP_BASE_URL = normalizeBaseURL(process.env.NUXT_APP_BASE_URL || '/')
  const outputDir = resolveOutputDir()

  // 静态路由（首页、练习页等）
  const staticPages = [
    {url: withBaseURL('/index.html', APP_BASE_URL), changefreq: 'monthly', priority: 1.0},
    {url: withBaseURL('/', APP_BASE_URL), changefreq: 'daily', priority: 1.0},
    {url: withBaseURL('/words', APP_BASE_URL), changefreq: 'daily', priority: 0.9},
    {url: withBaseURL('/articles', APP_BASE_URL), changefreq: 'daily', priority: 0.9},
    {url: withBaseURL('/setting', APP_BASE_URL), changefreq: 'monthly', priority: 0.3},
    {url: withBaseURL('/qa', APP_BASE_URL), changefreq: 'weekly', priority: 0.3},
    {url: withBaseURL('/doc', APP_BASE_URL), changefreq: 'weekly', priority: 0.3},
    {url: withBaseURL('/feedback', APP_BASE_URL), changefreq: 'weekly', priority: 0.3},
  ]

// 动态页面示例（假设你有文章或单词数据）
  const dynamicPages = bookList.flat().map(book => {
    return {url: withBaseURL('/book-detail/' + book.id, APP_BASE_URL), changefreq: 'weekly', priority: 0.8}
  }).concat(dictList.flat().map(book => {
    return {url: withBaseURL('/practice-words/' + book.id, APP_BASE_URL), changefreq: 'weekly', priority: 0.8}
  }))
  const sitemap = new SitemapStream({hostname: SITE_URL})
  const writeStream = createWriteStream(resolve(outputDir, 'sitemap.xml'))

  sitemap.pipe(writeStream)

  // 添加静态页
  staticPages.forEach(page => sitemap.write(page))

  // 添加动态页
  dynamicPages.forEach(page => sitemap.write(page))

  sitemap.end()

  await streamToPromise(sitemap)
  writeFileSync(
    resolve(outputDir, 'robots.txt'),
    `User-agent: *\nDisallow:\n\nSitemap: ${toSiteURL('/sitemap.xml', SITE_URL, APP_BASE_URL)}\n`
  )
  console.log(`✅ sitemap.xml 已生成在 ${outputDir} 目录`)
}

generateSitemap()
