# FileDrop

![FileDrop 界面预览](./client/public/filedrop-demo.png)

FileDrop 是一个基于 WebRTC 的点对点文件传输与实时聊天应用。双方在浏览器之间建立 P2P 连接后，文件不经过业务服务器中转即可直接传输，同时可以在同一连接上进行即时文字聊天。

- 在线地址：https://file-drops.vercel.app/
- 技术栈：Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Node.js + Socket.IO + WebRTC

## 功能特性

- **P2P 文件传输**：基于 `simple-peer`（WebRTC）在两名用户之间建立直连，文件分片后直接发送，服务端只负责信令转发。
- **实时聊天**：连接建立后，聊天消息复用同一条 P2P 数据通道传输。
- **分享链接与二维码**：可复制自己的 Peer ID，或通过分享链接 / 二维码邀请对方发起连接。
- **连接前校验**：发起连接前调用服务端接口确认对端在线，减少无效连接。
- **传输进度展示**：发送端、接收端均显示分片进度，接收完成后一键保存文件。
- **深浅色主题**：支持 Light / Dark 主题切换。
- **响应式界面**：桌面端与移动端均可使用，交互组件统一采用 shadcn/ui 风格。

## 技术架构

| 层 | 技术 | 说明 |
| --- | --- | --- |
| 前端框架 | Next.js 14（App Router）、React 18、TypeScript | 页面路由、元数据、SSR/CSR 渲染 |
| 样式与组件 | Tailwind CSS、shadcn/ui、Radix UI、lucide-react | 主题化 UI 与交互组件 |
| 实时通信 | Socket.IO（客户端 / 服务端） | 房间管理、信令转发、在线用户登记 |
| P2P 传输 | WebRTC（simple-peer） | 文件与聊天数据的点对点通道 |
| 后台服务 | Node.js、Express | 静态健康检查、在线状态统计与查询接口 |
| 二进制处理 | Web Worker | 接收分片后在后台线程合并为 Blob，避免阻塞主线程 |
| 文件保存 | file-saver | 接收完成后触发浏览器下载 |

### 文件传输流程

1. 双方打开 `/transfer` 页面，前端通过 Socket.IO 连接信令服务并登记 `uniqueId`。
2. 发起方输入对方 ID（或通过分享链接自动带入），先请求 `GET /api/peers/:uniqueId` 校验对端在线。
3. 发起方创建 `simple-peer` 实例，通过 `send-signal` 事件把 Offer 发给服务端，服务端按 `uniqueId` 转发给对端（`signaling` 事件）。
4. 对端确认后回传 Answer（`accept-signal` → `callAccepted`），P2P 通道建立。
5. 发送方按 16KB 分片读取文件并通过数据通道发送；接收方的 Web Worker 负责拼接分片并推送进度。
6. 传输结束后接收方得到 Blob，可保存到本地；聊天消息同样走该数据通道。

## 目录结构

```
FileDrop-web
├── client/                     # Next.js 前端
│   ├── app/
│   │   ├── page.tsx            # 首页
│   │   ├── transfer/page.tsx   # 传输页（挂载 SocketProvider）
│   │   ├── layout.tsx          # 全局布局、主题与元数据
│   │   └── globals.css         # 全局样式
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 基础组件及首页组件
│   │   ├── Navbar.tsx          # 顶部导航（Logo、GitHub、主题切换）
│   │   ├── ShareCard.tsx       # 连接管理、收发文件核心逻辑
│   │   ├── Chat.tsx            # P2P 聊天面板
│   │   ├── FileUpload.tsx      # 已选文件与发送进度
│   │   ├── FileUploadBtn.tsx   # 文件选择按钮
│   │   ├── FileDownload.tsx    # 接收进度与下载
│   │   ├── ShareLink.tsx       # 分享链接与二维码弹窗
│   │   ├── ThemeBtn.tsx        # 主题切换下拉菜单
│   │   └── ThemeProvider.tsx   # next-themes 封装
│   ├── context/SocketProvider.tsx  # Socket.IO 连接与 Peer 状态上下文
│   ├── utils/
│   │   ├── constants.ts        # 服务地址、SEO 关键词
│   │   ├── funtions.ts         # 文件名截断等工具函数
│   │   └── worker.ts           # 分片合并 Web Worker
│   └── public/                 # 静态图片资源
├── server/                     # Node.js 信令服务
│   ├── index.js                # Express + Socket.IO 服务入口
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

## 页面说明

### 首页 `/`

- 展示产品定位与使用提示，引导进入传输页。
- 顶部导航包含 GitHub 入口与主题切换。

### 传输页 `/transfer`

- **My ID**：连接建立后展示当前用户 10 位唯一 ID，支持复制。
- **分享弹窗**：根据当前站点地址生成分享链接与二维码。
- **Peer`s ID**：输入对方 ID 发起连接；若 URL 带 `?code=xxx` 会自动填入。
- **Connection Status**：显示当前连接的对端，可主动断开。
- **Upload**：选择文件后开始发送，展示发送进度。
- **Download**：接收过程中显示进度，完成后可下载。
- **Chat**：P2P 通道建立后显示聊天面板，支持 `Ctrl/Cmd + K` 聚焦输入框、`Enter` 发送。
- 对端发起连接时，底部出现接受呼叫按钮。

## 接口设计

### REST 接口（服务端默认端口 8000）

| 方法 | 路径 | 说明 | 响应示例 |
| --- | --- | --- | --- |
| GET | `/` | 服务存活提示 | `hello from server` |
| GET | `/api/health` | 健康检查 | `{ "status": "ok", "uptime": 12.5, "timestamp": 1700000000000 }` |
| GET | `/api/stats` | 在线用户与活跃房间统计 | `{ "onlineUsers": 2, "activeRooms": 1 }` |
| GET | `/api/peers/:uniqueId` | 查询指定用户是否在线 | `{ "uniqueId": "Ab3dE9xYz1", "online": true }` |

### Socket.IO 事件

| 事件 | 方向 | 说明 |
| --- | --- | --- |
| `details` | 客户端 → 服务端 | 登记 `socketId` 与 `uniqueId` 的映射 |
| `joinRoom` | 客户端 → 服务端 | 加入指定房间，服务端回 `ack` |
| `ack` | 服务端 → 客户端 | 加入房间确认 |
| `message` | 客户端 → 服务端 | 向所在房间广播消息（`roomMsg`） |
| `roomMsg` | 服务端 → 客户端 | 房间消息下发 |
| `send-signal` | 客户端 → 服务端 → 对端 | 转发发起方的 Offer / ICE 信令 |
| `signaling` | 服务端 → 客户端 | 对端收到呼叫信令 |
| `accept-signal` | 客户端 → 服务端 → 对端 | 转发接收方的 Answer 信令 |
| `callAccepted` | 服务端 → 客户端 | 呼叫被接受，P2P 通道建立 |

## 环境变量

### 前端 `client`

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | `http://localhost:8000` | Socket.IO 与 REST 接口地址 |

如需自定义，在 `client` 下新建 `.env.local`：

```bash
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:8000
```

### 服务端 `server`

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8000` | HTTP / Socket.IO 服务端口 |
| `URL` | 无 | 允许的前端地址（预留） |

如需自定义，在 `server` 下新建 `.env`：

```bash
PORT=8000
```

> 本项目不需要注册或登录，打开页面后自动生成临时 Peer ID，双方通过 ID 或分享链接建立连接。

## 启动方式

### 环境要求

- Node.js 18 及以上（推荐 20）
- npm 9 及以上

### 安装依赖

```bash
cd server && npm install
cd ../client && npm install
```

### 开发模式

```bash
# 终端一：启动信令服务（默认 8000 端口）
cd server
npm start

# 终端二：启动前端（默认 3000 端口）
cd client
npm run dev
```

浏览器访问 http://localhost:3000 。

### 生产构建

```bash
cd client
npm run build
npm start
```

服务端保持 `npm start`（或使用 `node index.js`）即可，前端默认运行在 3000 端口。

### 使用步骤

1. 打开两个浏览器窗口（或两台设备），分别访问 `/transfer`。
2. 在窗口 A 复制 **My ID**，填入窗口 B 的 **Peer`s ID** 并点击 **Connect**；也可以在 A 中复制分享链接，在 B 中打开，ID 会自动填充。
3. B 端出现接收呼叫按钮，点击后连接建立，状态栏显示对端 ID。
4. 任一端选择文件并点击上传按钮发送，另一端查看进度并下载。
5. 聊天面板可直接发送消息，`Ctrl/Cmd + K` 聚焦输入框。

> 若两端处于不同网络，需要可用的 TURN 服务；当前示例中已内置公共 TURN 配置，公网环境建议替换为自有 TURN 服务。

## License

本项目基于 [MIT License](./LICENSE) 开源。

## 致谢

感谢 Next.js、TypeScript、Node.js、Socket.IO、WebRTC、simple-peer 与 shadcn/ui 等开源项目。
