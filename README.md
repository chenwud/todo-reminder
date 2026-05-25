# 📋 待办提醒 (Todo Reminder)

基于 React + Express 的全栈待办事项应用，支持用户认证、优先级管理、截止时间提醒和云端数据持久化。

## ✨ 功能特性

- **用户系统** — 注册 / 登录 / JWT 鉴权，支持自动恢复会话
- **待办 CRUD** — 创建、编辑、删除、勾选完成待办事项
- **优先级** — 高 🔴 / 中 🟡 / 低 🟢 三级优先级，支持按优先级排序
- **截止时间** — 设置到期时间，过期和即将到期状态高亮提醒
- **浏览器通知** — 后台定时检查，到期时弹出桌面通知
- **筛选与排序** — 按状态筛选（全部 / 进行中 / 已完成），按创建时间 / 优先级 / 截止时间排序
- **乐观更新** — 创建和完成操作即时反馈，失败自动回滚
- **双数据库支持** — Turso 云端 SQLite（生产） + 本地 SQLite（开发回退）

## 🏗️ 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 19 + Vite 8 |
| 后端框架 | Express 4 |
| 数据库 | Turso (libsql) / SQLite (sql.js) |
| 认证 | JWT + bcryptjs |
| 部署 | Render (Web Service) |
| 包管理 | npm |

## 📁 项目结构

`
todo-reminder/
├── public/                 # 静态资源
├── server/                 # 后端
│   ├── index.js            # Express 入口，静态文件服务
│   ├── db.js               # 数据库层（Turso / SQLite 双模式）
│   ├── middleware/
│   │   └── auth.js         # JWT 生成与验证中间件
│   └── routes/
│       ├── auth.js         # 注册 / 登录 / 获取当前用户
│       └── todos.js        # 待办 CRUD + 批量清除
├── src/                    # 前端
│   ├── main.jsx            # React 入口
│   ├── App.jsx             # 主页面：待办列表、表单、筛选排序
│   ├── App.css             # 全局样式
│   ├── LoginPage.jsx       # 登录 / 注册页面
│   ├── AuthContext.jsx     # 认证状态管理 (Context + JWT)
│   └── api.js              # 前端 API 封装
├── render.yaml             # Render 部署配置
├── vite.config.js          # Vite 配置（代理 API 到后端）
└── package.json
`

## 🚀 本地开发

`ash
# 安装依赖
npm install

# 启动前端开发服务器 (localhost:5173)
npm run dev

# 另开终端启动后端 (localhost:3001)
npm run dev:server
`

前端 /api/* 请求通过 Vite proxy 转发到后端 localhost:3001。

## 🌐 部署

项目部署在 [Render](https://render.com)，配置文件为 ender.yaml。

生产环境使用 [Turso](https://turso.tech) 云数据库，通过 TURSO_URL 和 TURSO_TOKEN 环境变量配置。未设置时自动回退到本地 SQLite。

公开访问地址：[https://todo-reminder-xo0g.onrender.com](https://todo-reminder-xo0g.onrender.com)

## 🔑 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/todos | 获取所有待办 |
| POST | /api/todos | 创建待办 |
| PUT | /api/todos/:id | 更新待办 |
| PATCH | /api/todos/:id/toggle | 切换完成状态 |
| DELETE | /api/todos/:id | 删除待办 |
| DELETE | /api/todos/completed/bulk | 清除已完成 |

## 🛠️ 开发历程

1. **项目初始化** — Vite + React 脚手架，Express 后端搭建
2. **用户认证** — JWT 注册 / 登录，AuthContext 全局状态管理
3. **待办 CRUD** — 完整的创建、编辑、删除、完成切换功能
4. **数据库** — 先本地 SQLite (sql.js)，后迁移到 Turso 云端双模式
5. **乐观更新** — 创建和完成操作即时响应，失败回滚
6. **防抖写盘** — 本地模式下 500ms 防抖批量写入，降低 I/O 开销
7. **部署上线** — Render Web Service 部署，Turso 云端数据库持久化
