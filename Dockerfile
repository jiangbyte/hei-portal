# 构建：docker build -t registry.cn-beijing.aliyuncs.com/czbyte/hei-portal:latest .
# Compose 使用 registry.cn-beijing.aliyuncs.com/czbyte/hei-portal:${HEI_PORTAL_VERSION:-latest}，不包含 build。
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22-alpine AS build

ENV NODE_OPTIONS="--dns-result-order=ipv4first"

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec vite build --mode production

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

ENV BACKEND_HOST="127.0.0.1" \
    BACKEND_PORT="8000" \
    CLIENT_MAX_BODY_SIZE="10m" \
    CONTENT_SECURITY_POLICY="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" \
    HSTS_HEADER=""

EXPOSE 80
