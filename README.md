<div align="center">

<img src="public/favicon.svg" width="80" />

# 📋 Todo Reminder

### 全栈待办提醒 · 云端同步 · 多设备访问

[![Deploy](https://img.shields.io/badge/Render-Deployed-46E3B7?style=flat-square&logo=render)](https://todo-reminder-xo0g.onrender.com)
[![Database](https://img.shields.io/badge/Turso-Cloud%20SQLite-4FFFE4?style=flat-square&logo=turso)](https://turso.tech)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

</div>

---

## ✨ 为什么你需要它

> 任务太多记不住？截止日期总错过？Todo Reminder 帮你轻松管理待办事项，支持多设备云同步，到点自动提醒，再也不会忘事。

<table>
<tr>
<td width="70%">

### 🎯 核心功能

- 🔐 **账号系统** — 注册 / 登录，JWT 安全鉴权，自动恢复登录态
- 📝 **待办管理** — 添加、编辑、删除、勾选完成，流畅操作
- 🔴🟡🟢 **三级优先级** — 高 / 中 / 低，一目了然
- 📅 **截止时间** — 到期和即将到期自动高亮提醒 ⚠️
- 🔔 **桌面通知** — 浏览器原生通知，后台定时检查
- 🔀 **智能排序** — 按创建时间 / 优先级 / 截止时间切换
- 🗂️ **筛选视角** — 全部 / 进行中 / 已完成一键切换
- ⚡ **乐观更新** — 操作秒响应，失败自动回滚
- ☁️ **云端同步** — Turso 云数据库，多设备数据一致
- 🌍 **全民访问** — 部署在 Render，任何人打开网址就能用

</td>
<td width="30%" align="center">

`
  ╭──────────────────╮
  │  📋 待办提醒      │
  │                  │
  │  [  添加任务…  ]  │
  │  🔴🟡🟢 📅 [添加] │
  │                  │
  │  全部 进行中 已完成│
  │                  │
  │ ✅ 写周报    🔴 高 │
  │    📅 2026-01-01  │
  │                  │
  │ ⬜ 买奶茶    🟢 低 │
  │                  │
  │    [清除已完成]    │
  ╰──────────────────╯
`

</td>
</tr>
</table>

---

## 🏗️ 技术架构

`mermaid
graph LR
    A[🌐 浏览器] -->|HTTPS| B[Render 云平台]
    B -->|Express| C[后端 API]
    C -->|libsql| D[(Turso 云数据库)]
    C -->|静态服务| E[React 前端]
    
    style A fill:#61DAFB,color:#000
    style B fill:#46E3B7,color:#000
    style C fill:#000,color:#fff
    style D fill:#4FFFE4,color:#000
    style E fill:#61DAFB,color:#000
`

| 层 | 技术 | 说明 |
|---|---|---|
| 🖥️ 前端 | React 19 + Vite 8 | 组件化开发，HMR 热更新 |
| ⚙️ 后端 | Express 4 | RESTful API，JWT 鉴权 |
| 🗄️ 数据库 | Turso / SQLite | 云端双模式，自动切换 |
| 🔑 认证 | JWT + bcryptjs | 七天免登录，密码加密 |
| 🚀 部署 | Render | 自动 CI/CD，Git Push 即部署 |
| 📦 包管理 | npm | 依赖管理 |

---

## 🚀 快速开始

### 本地开发

`ash
# 1. 克隆项目
git clone https://github.com/chenwud/todo-reminder.git
cd todo-reminder

# 2. 安装依赖
npm install

# 3. 启动后端（新终端）
npm run dev:server    # → http://localhost:3001

# 4. 启动前端（另一个终端）
npm run dev           # → http://localhost:5173
`

> 💡 本地默认使用 SQLite 文件数据库，无需额外配置。前端 /api/* 请求自动代理到后端。

### 线上访问

> 🌍 **直接打开** 👉 [todo-reminder-xo0g.onrender.com](https://todo-reminder-xo0g.onrender.com)

第一次加载可能需要 30~60 秒（免费套餐休眠唤醒），之后正常使用。

---

## 🔌 API 一览

`
┌─────────────────────────────────────────────────────────┐
│  POST   /api/auth/register    📝 注册                   │
│  POST   /api/auth/login       🔑 登录                   │
│  GET    /api/auth/me          👤 获取当前用户            │
│─────────────────────────────────────────────────────────│
│  GET    /api/todos            📋 获取所有待办            │
│  POST   /api/todos            ➕ 创建待办                │
│  PUT    /api/todos/:id        ✏️ 更新待办                │
│  PATCH  /api/todos/:id/toggle ✅ 切换完成状态            │
│  DELETE /api/todos/:id        🗑️ 删除待办                │
│  DELETE /api/todos/completed  🧹 批量清除已完成          │
└─────────────────────────────────────────────────────────┘
`

---

## 📁 项目结构

`
todo-reminder/
├── src/                    # 🖥️ React 前端
│   ├── App.jsx             #   主页面 & 待办逻辑
│   ├── App.css             #   全局样式
│   ├── LoginPage.jsx       #   登录 / 注册页
│   ├── AuthContext.jsx     #   认证状态管理
│   ├── api.js              #   API 封装
│   └── main.jsx            #   入口
├── server/                 # ⚙️ Express 后端
│   ├── index.js            #   服务入口 & 静态托管
│   ├── db.js               #   数据库双模式 (Turso / SQLite)
│   ├── middleware/auth.js  #   JWT 中间件
│   └── routes/
│       ├── auth.js         #   认证路由
│       └── todos.js        #   待办 CRUD 路由
├── public/                 # 📦 静态资源
├── render.yaml             # 🚀 Render 部署配置
├── vite.config.js          # ⚡ Vite 配置
└── package.json            # 📦 依赖
`

---

## 🗓️ 开发历程

`
545f2d1  📦 初始化    React + Express 脚手架，项目骨架
   │
f73d4bb  ☁️ 上云      数据库迁移到 Turso 云双模式
   │
3ac8dcc  ⚡ 性能     前端乐观更新 + 500ms 防抖写盘
   │
3816ba4  📚 文档     完善 README，技术栈与架构说明
   │
26ca5ed  🔐 部署     注入 Turso 凭证，Render 自动部署
   │
  HEAD   ✨ 当前      上线运行，对外开放访问
`

---

<div align="center">

**Made with ❤️ by Chen · 用最简单的方式管理你的每一天**

</div>
