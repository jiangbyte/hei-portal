# HEI Portal

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Supported-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Ant Design](https://img.shields.io/badge/UI-Ant%20Design-0170FE?logo=antdesign&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)
![Version](https://img.shields.io/badge/version-1.0.0--beta-orange)

**HEI Portal** 是 HEI 系列的**通用门户前端**（React 19）：账号体系为 **PORTAL**，请求前缀 `/api/v1/portal/*`。同一份前端可对接任一姊妹后端，通过环境变量切换代理目标即可。

> 当前版本：`1.0.0-beta`

## 姊妹后端

| 项目 | 说明 |
| --- | --- |
| [hei-boot](https://github.com/jiangbyte/hei-boot) | Spring Boot |
| [hei-fastapi](https://github.com/jiangbyte/hei-fastapi) | FastAPI |
| [hei-gin](https://github.com/jiangbyte/hei-gin) | Go / Gin |

三端 API 契约对齐（`/api/v1/admin|portal|internal/...`）。默认演示账号见各后端仓库根 README。

## 功能

- 全页认证：登录 / 注册 / 找回与重置密码（`/auth/*`），可配置三方登录入口
- Cookie 会话（可关，仅 Header）
- 首页、公告、意见反馈
- 个人主页、账号中心（资料、密码、邮箱、手机、消息、OAuth 绑定）
- 页脚版权与备案信息（从后端 `GET /api/v1/public/site-footer` 拉取）

## 技术栈

React 19 · Vite · TypeScript · Ant Design 6 · React Router · Zustand · axios · UnoCSS

主题 token：[`src/theme/tokens.ts`](src/theme/tokens.ts)。

## 快速开始

```bash
# 建议先启动任一姊妹后端：http://127.0.0.1:8000
pnpm install
pnpm dev
```

开发地址默认：http://127.0.0.1:5174

### 环境变量

参考 [`.env.example`](.env.example)：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `VITE_APP_TITLE` | 站点标题 | `HEI` |
| `VITE_PORT` | 开发端口 | `5174` |
| `VITE_HOME_PATH` | 登录后首页 | `/` |
| `VITE_API_URL` | API 基址；**留空**则走同源 `/api` | 空 |
| `VITE_API_PROXY_TARGET` | Vite 代理目标（指向本地后端） | `http://127.0.0.1:8000` |
| `VITE_COPYRIGHT_INFO` 等 | 页脚兜底文案（可选，优先用后端配置） | — |

生产构建使用 [`.env.production`](.env.production)：`VITE_API_URL` 置空，由 nginx 反代 `/api`。

## 常用命令

```bash
pnpm dev          # 本地开发
pnpm build        # 类型检查 + 构建
pnpm preview      # 预览构建产物
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Docker

本目录提供 `Dockerfile` + `nginx/`（监听 **80**）。

```bash
pnpm build   # 可选；镜像内也会执行 vite build

docker build -t hei-portal .
docker run -d \
  -e BACKEND_URL="http://host.docker.internal:8000" \
  -p 8082:80 \
  hei-portal
```

常用环境变量：`BACKEND_URL`、`CLIENT_MAX_BODY_SIZE`（默认 `10m`）。

## 目录结构

```text
src/
  api/          接口封装
  assets/       静态资源
  components/   通用组件
  constants/    常量
  hooks/        Hooks
  layouts/      布局
  pages/        页面（auth / home / announcements / feedback / usercenter）
  router/       路由与守卫
  stores/       Zustand
  styles/       全局样式
  theme/        主题 token
  typing/       类型
  utils/        工具
nginx/          生产 nginx 模板
```

## 说明

- 开发期 Cookie 会话依赖 Vite 同源代理；勿轻易把 `VITE_API_URL` 指到跨域后端，除非已配好 CORS 与 Cookie `SameSite`
- 与管理端共用同一后端进程，端口与 Cookie Path 按端隔离（`/api/v1/portal`）
- 姊妹管理端：[hei-admin](../hei-admin)
- 姊妹移动端：[hei-admin-uniapp](../hei-admin-uniapp)
