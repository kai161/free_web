import os
import datetime

# --- 配置区 ---
BASE_URL = "https://freetools.best"  # 你的域名
TARGET_DIR = "."                     # HTML文件所在的目录（当前目录）
OUTPUT_FILE = "sitemap.xml"          # 输出文件名
# 排除不需要进入站点地图的文件
EXCLUDE_FILES = ['index.html', '404.html', 'nav.html']

def generate_sitemap():
    # 获取目录下所有的 .html 文件
    files = [f for f in os.listdir(TARGET_DIR)
             if f.endswith('.html') and f not in EXCLUDE_FILES]

    # 开始构建 XML 字符串
    sitemap_content = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    # 添加首页 (优先级最高)
    sitemap_content.append(f"""
    <url>
        <loc>{BASE_URL}/zh.html</loc>
        <lastmod>{datetime.date.today()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>""")

    # 遍历并添加其他工具页面
    for file in files:
        if file == 'zh.html': continue # 首页已手动添加

        # 获取文件的最后修改日期
        file_path = os.path.join(TARGET_DIR, file)
        mod_time = datetime.date.fromtimestamp(os.path.getmtime(file_path))

        # 构建 URL 条目
        url_entry = f"""
    <url>
        <loc>{BASE_URL}/{file}</loc>
        <lastmod>{mod_time}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>"""
        sitemap_content.append(url_entry)

    sitemap_content.append('</urlset>')

    # 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap_content))

    print(f"成功！已生成包含 {len(files)} 个页面的 {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_sitemap()