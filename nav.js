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
    <div class="max-w-6xl mx-auto px-4">
        <div class="flex items-center h-16">
            
            <div class="flex-shrink-0 flex items-center mr-4">
                <a href="index.html" class="flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <span class="text-xl">🧰</span>
                    <span class="font-extrabold text-gray-900 text-base sm:text-lg tracking-tighter uppercase">FreeTools</span>
                </a>
            </div>

            <div class="relative flex-1 h-full flex items-center overflow-hidden">
                <div class="flex flex-nowrap items-center overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar gap-1 py-2 w-full" id="nav-links">
                    <a href="index.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap"> 首页</a>
                    <a href="zh.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">🖼️ 压缩</a>
                    <a href="password.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">🔑 密码</a>
                    <a href="json.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">{ } JSON格式化&比对</a>
                    <a href="qrcode.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">📱 二维码</a>
                    <a href="audio.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">🎵 音感</a>
                    <a href="timer.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">⏳ 倒计时</a>
                    <a href="text_diff.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">📝 文本比对</a>
                    <a href="timestamp.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">🕒 时间戳</a>
                    <a href="base64.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">🖼️ Base64</a>
                    <a href="code-formatter.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">{ } 代码处理</a>
<a href="pdf-to-image.html" class="nav-item px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">📄 PDF转图片</a>
                </div>
                
                <div class="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
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

    // 在 nav.js 逻辑中加入分享功能
    function shareSite() {
        if (navigator.share) {
            navigator.share({
                title: 'FreeTools.best - 隐私优先的极速工具箱',
                text: '发现一个超好用的纯前端工具站，100%本地处理，保护隐私！',
                url: window.location.href,
            });
        } else {
            // 退而求其次：复制链接
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制到剪贴板，快发给小伙伴吧！');
        }
    }

    // 在 nav.js 注入 HTML 后执行
    setTimeout(() => {
        const container = document.getElementById('nav-links');
        const activeItem = container.querySelector('.bg-gray-100'); // 获取当前高亮的按钮
        if (activeItem) {
            // 将高亮项滚动到视野中心
            const offset = activeItem.offsetLeft - (container.offsetWidth / 2) + (activeItem.offsetWidth / 2);
            container.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }, 100);
});