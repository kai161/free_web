// nav.js
// nav.js 补充代码：动态加载 Vercel Insights 脚本
(function() {
    // 1. 初始化 va 函数
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

    // 2. 动态创建并插入外部 JS 文件
    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    document.head.appendChild(script);
})();

document.addEventListener("DOMContentLoaded", function() {
    // 1. 定义公共导航栏的 HTML 结构 (注意这里用反引号 ` 括起来)
    const navHTML = `
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm mb-8">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                
                <div class="flex-shrink-0 flex items-center">
                    <a href="zh.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span class="text-2xl">🧰</span>
                        <span class="font-extrabold text-gray-900 text-xl tracking-tight">FreeTools<span class="text-blue-600">.best</span></span>
                    </a>
                </div>

                <div class="flex-1 flex justify-end overflow-x-auto no-scrollbar ml-4">
                    <div class="flex space-x-2 py-1" id="nav-links">
                        <a href="zh.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">🖼️ 图片压缩</a>
                        <a href="password.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">🔑 密码生成</a>
                        <a href="text_diff.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">📝 文本比对</a>
                        <a href="json.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">{ } JSON 工具</a>
                        <a href="qrcode.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">📱 二维码生成</a>
                        <a href="audio.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">🎵 音感训练</a>
                        <a href="timer.html" class="nav-item px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">⏳ 倒计时</a>
                    </div>
                </div>

            </div>
        </div>
    </nav>
    `;

    // 2. 将导航栏注入到页面的 <div id="nav-placeholder"></div> 中
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
        placeholder.innerHTML = navHTML;
    }

    // 3. 智能高亮当前页面
    // 获取当前网页的路径名，比如 "/password.html"
    let currentPath = window.location.pathname;
    // 处理根目录默认访问的情况
    if (currentPath === '/' || currentPath === '/index.html') {
        currentPath = '/zh.html'; // 根据你的主打语言跳转
    }

    // 遍历所有导航链接，如果链接的 href 包含当前路径，则应用高亮样式
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        // 匹配逻辑：如果当前路径以该链接结尾 (忽略前缀的 /)
        if (currentPath.endsWith(itemHref)) {
            // 移除默认未选中样式
            item.classList.remove('font-semibold', 'text-gray-600', 'hover:bg-gray-50');
            // 添加高亮选中样式
            item.classList.add('font-bold', 'text-gray-900', 'bg-gray-100', 'hover:bg-gray-200');
        }
    });
});