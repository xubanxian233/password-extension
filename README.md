# 密码生成器 (Password Generator)

一款功能强大、安全易用的浏览器扩展，支持 Chrome、Edge 和 Firefox。帮助您生成高强度的随机密码，保障您的账户安全。

## ✨ 功能特点

*   **自定义复杂度**：
    *   可调整密码长度（4-64位）。
    *   自由选择包含大写字母、小写字母、数字、特殊符号。
*   **高级字符控制**：
    *   **指定包含**：确保密码中包含特定字符（如 `@` `#`）。
    *   **排除字符**：自动排除易混淆字符（如 `l` `1` `O` `0`），也可自定义排除列表。
*   **智能右键菜单**：
    *   **在输入框中右键**：选择“生成密码并填入”，自动生成 -> 填入 -> 复制。
    *   **在其他区域右键**：选择“生成密码并复制”，自动生成 -> 复制。
*   **持久化存储**：自动保存您的配置偏好，下次使用无需重复设置。
*   **国际化支持**：完美支持简体中文 (zh_CN) 和 英语 (en)。
*   **安全纯净**：完全离线运行，不收集任何用户数据。

## 👤 作者
**许半仙 (Xu Banxian)**

## 🚀 安装指南

### Google Chrome / Microsoft Edge
1.  下载本项目源代码。
2.  打开浏览器扩展管理页面：
    *   Chrome: `chrome://extensions/`
    *   Edge: `edge://extensions/`
3.  开启右上角的 **"开发者模式" (Developer mode)**。
4.  点击 **"加载已解压的扩展程序" (Load unpacked)**。
5.  选择本项目根目录 `password-extension`。

### Firefox 火狐浏览器
1.  下载本项目源代码。
2.  在地址栏输入 `about:debugging#/runtime/this-firefox`。
3.  点击 **"临时载入附加组件" (Load Temporary Add-on)**。
4.  选择项目目录下的 `manifest.json` 文件。

## 📂 目录结构

*   `manifest.json`: 扩展核心配置 (Manifest V3)
*   `popup.html/css/js`: 扩展弹出界面
*   `background.js`: 后台服务（右键菜单逻辑）
*   `utils.js`: 核心密码生成算法
*   `_locales/`: 国际化语言包
*   `icons/`: 图标资源

---
*Enjoy your secure browsing!*
