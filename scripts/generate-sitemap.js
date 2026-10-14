import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Đọc và phân tích file toolsConfig.ts theo từng object độc lập
function getToolsFromConfig() {
  const configPath = path.join(rootDir, 'src', 'data', 'toolsConfig.ts');
  const content = fs.readFileSync(configPath, 'utf-8');

  // Lấy BASE_SITE_URL
  const siteUrlMatch = content.match(/BASE_SITE_URL\s*=\s*['"]([^'"]+)['"]/);
  const baseUrl = siteUrlMatch ? siteUrlMatch[1] : 'https://tienich.ite.id.vn';

  // Chia theo từng khối object { ... }
  const blockRegex = /\{([^{}]+)\}/g;
  const tools = [];
  let blockMatch;

  while ((blockMatch = blockRegex.exec(content)) !== null) {
    const block = blockMatch[1];
    const pathMatch = block.match(/path:\s*['"]([^'"]+)['"]/);
    if (!pathMatch || !pathMatch[1].startsWith('/')) continue;

    const itemPath = pathMatch[1];
    const priorityMatch = block.match(/priority:\s*([0-9.]+)/);
    const hotMatch = block.match(/isHot:\s*true/);
    const changefreqMatch = block.match(/changefreq:\s*['"]([^'"]+)['"]/);

    const priority = priorityMatch ? parseFloat(priorityMatch[1]) : (hotMatch ? 0.9 : 0.8);
    const changefreq = changefreqMatch ? changefreqMatch[1] : 'weekly';

    tools.push({ path: itemPath, priority, changefreq });
  }

  return { baseUrl, tools };
}

export function generateSitemapXml() {
  const { baseUrl, tools } = getToolsFromConfig();
  const currentDate = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

  // 1. Trang chủ (Ưu tiên tuyệt đối 1.0)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Danh sách toàn bộ công cụ
  const addedPaths = new Set(['/']);

  for (const tool of tools) {
    if (addedPaths.has(tool.path)) continue;
    addedPaths.add(tool.path);

    const priority = tool.priority ? tool.priority.toFixed(1) : '0.8';
    const changefreq = tool.changefreq || 'weekly';

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${tool.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Các trang phụ trợ công khai
  const extraPages = [
    { path: '/login', priority: '0.5', changefreq: 'monthly' },
    { path: '/register', priority: '0.5', changefreq: 'monthly' }
  ];

  for (const page of extraPages) {
    if (addedPaths.has(page.path)) continue;
    addedPaths.add(page.path);

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

export function writeSitemapFiles() {
  const xml = generateSitemapXml();

  // Ghi vào public/sitemap.xml
  const publicPath = path.join(rootDir, 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, xml, 'utf-8');
  console.log(`✅ [Sitemap Generator] Đã cập nhật sitemap tại: ${publicPath}`);

  // Nếu dist/ đã tồn tại, ghi vào dist/sitemap.xml
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distPath, xml, 'utf-8');
    console.log(`✅ [Sitemap Generator] Đã cập nhật sitemap tại: ${distPath}`);
  }
}

// Nếu script được chạy trực tiếp từ dòng lệnh
if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.js')) {
  writeSitemapFiles();
}
