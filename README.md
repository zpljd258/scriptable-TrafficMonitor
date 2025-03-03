```markdown
# 🚀 Traffic Monitor Widget for Scriptable

[![GitHub stars](https://img.shields.io/github/stars/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/network/members)
[![GitHub license](https://img.shields.io/github/license/zpljd258/scriptable-TrafficMonitor)](https://github.com/zpljd258/scriptable-TrafficMonitor/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/zpljd/scriptable-trafficmonitor)](https://hub.docker.com/r/zpljd/scriptable-trafficmonitor)

> 这是一个用于 [Scriptable](https://scriptable.app/) 应用的流量监控小组件，可以实时显示服务器的流量使用情况（支持多服务器）。

<img src="https://your-image-hosting-service.com/your-widget-screenshot.png" width="300">

## ✨ 特性

*   **实时监控:** 实时显示服务器的流量使用情况（已用流量、总流量、百分比）。
*   **多服务器支持:** 支持同时监控多个服务器的流量。
*   **自定义配置:** 可以通过环境变量自定义流量上限、重置日期、API Token、API 端口等。
*   **美观的 UI:** 界面简洁美观，符合 Apple 设计规范。
*   **弹性布局:** 自动适应不同数量的服务器，优化显示效果。
*   **错误处理:** 当无法获取服务器数据时，显示错误信息。
*   **易于部署:** 使用 Docker 部署，方便快捷。
*   **Docker Hub 支持:** 可以直接从 Docker Hub 拉取镜像，无需手动构建。

## 🛠️ 部署

### 方法一：使用 Docker Hub 镜像 (推荐)

1.  **准备工作:**
    *   一台或多台服务器。
    *   服务器上已安装 Docker 和 Docker Compose。

2.  **创建 `docker-compose.yml` 文件:**

```yaml
version: '3.8'
services:
  traffic-monitor:
    image: zpljd/scriptable-trafficmonitor:latest # 使用 Docker Hub 镜像
    environment:
      API_TOKEN: your_secret_token  # ⚠️ 必须修改: 设置一个安全的 API Token
      API_PORT: 5000              # API 端口，可以根据需要修改
      ENABLE_API: "True"          # 是否启用 API，设置为 "False" 可以禁用
      TRAFFIC_DIRECTION: outbound  # 流量方向，可选: outbound, bidirectional
      MONTHLY_TRAFFIC_GB: 200     # 每月流量上限 (GB)，根据实际情况修改
      RESET_DAY: 1              # 流量重置日，默认为每月 1 号
      NETWORK_INTERFACE: eth0    # 网络接口名称，通常不需要修改
    volumes:
      - /opt/docker/traffic-monitor/data:/data  # 流量数据存储路径，可以根据需要修改
      - /etc/hostname:/etc/host_hostname:ro   # 用于获取主机名
    restart: always
    container_name: traffic-monitor
    network_mode: host
```
   *   **`API_TOKEN`:**  **必须修改**，设置一个安全的、随机生成的字符串作为 API Token。
    *   **`API_PORT`:**  API 监听的端口，可以根据需要修改。
    *   **`ENABLE_API`:** 是否启用API, 默认为启用, 设置为 `"False"` 可以禁用.
    *   **`MONTHLY_TRAFFIC_GB`:**  每月流量上限（GB），根据你的服务器套餐修改。
    *   其他配置一般不需要修改，除非你有特殊需求。

3.  **修改服务器 `hostname` (可选，但强烈建议):**

    为了在小组件中更好地显示服务器名称，建议修改服务器的 `hostname` 为一个简短、易于识别的名称，**最大长度建议不超过 15 个字符**。

    ```bash
    sudo hostnamectl set-hostname your-new-hostname # 将 your-new-hostname 替换为你想要的名称
    ```
    修改后, 重启服务器或者重启docker容器以应用更改.

4.  **运行:**

```bash
docker compose up -d
```

### 方法二：手动构建镜像

1.  **准备工作:**
    *   一台或多台服务器。
    *   服务器上已安装 Docker 和 Docker Compose。

2.  **获取代码:**

```bash
git clone https://github.com/zpljd258/scriptable-TrafficMonitor.git
cd scriptable-TrafficMonitor
```

3.  **修改配置 (docker-compose.yml):**  (同方法一的第 2 步)

4.  **修改服务器 `hostname` (可选，但强烈建议):** (同方法一的第 3 步)

5.  **构建并运行:**

```bash
docker compose up -d --build
```

### 验证

在浏览器中访问 `http://your_server_ip:5000/traffic?token=your_secret_token` （将 `your_server_ip` 替换为你的服务器 IP 地址，`5000` 替换为 `API_PORT` 设置的端口，`your_secret_token` 替换为 `API_TOKEN` 设置的 Token）。如果一切正常，你应该会看到类似以下的 JSON 数据：

```json
{
  "hostname": "your-hostname",
  "ip": "your-ip-address",
  "max_traffic_gb": "200.00",
  "total_usage_gb": "0.25",
  "usage_percentage": "0.13"
}
```

## 📱 Scriptable 配置

1.  在 iPhone 上安装 [Scriptable](https://scriptable.app/) 应用。
2.  打开 Scriptable 应用，创建一个新的脚本。
3.  将 [scriptable.js](https://github.com/zpljd258/scriptable-TrafficMonitor/blob/main/scriptable.js) 文件中的代码复制到 Scriptable 脚本中。
4.  修改 `scriptable.js` 文件中的 `servers` 数组：

```javascript
const servers = [
    {
        url: "http://your_server_ip_1:5000/traffic?token=your_secret_token_1", // 服务器1的API地址
        color: "#4CAF50" // 进度条颜色
    },
    {
        url: "http://your_server_ip_2:5000/traffic?token=your_secret_token_2",
        color: "#2196F3"
    },
    // 添加更多服务器...
];
```

*   **`url`:**  服务器的 API 地址，格式为 `http://your_server_ip:port/traffic?token=your_secret_token`。  请替换 `your_server_ip`、`port` 和 `your_secret_token` 为实际的值。
*   **`color`:**  进度条的颜色，可以使用十六进制颜色代码。
*   **建议最多配置 6 台服务器**，以获得最佳显示效果。如果服务器数量过多，可能会导致小组件显示错位。

5.  在 iPhone 主屏幕上添加 Scriptable 小组件，选择你创建的脚本。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request，一起完善这个项目！

## 📝 License

[MIT License](https://github.com/zpljd258/scriptable-TrafficMonitor/blob/main/LICENSE)

## 🙏 感谢

*   [Scriptable](https://scriptable.app/)
*   [Flask](https://flask.palletsprojects.com/)
*   Gemini 2.0 Pro 协助生成代码

---

**注意:**

*   请将 `your-username`、`your-repo-name`、`your-widget-screenshot.png`、`your_server_ip`、`your_secret_token`、`your-new-hostname` 等替换为你自己的信息。
*   你可以根据需要修改 README.md 中的内容，例如添加更多功能说明、使用示例、常见问题解答等。
*   建议添加一个 `LICENSE` 文件（例如 MIT License）。
*   如果你有多个服务器, 记得修改 `scriptable.js` 中的 `servers` 数组, 添加多个服务器的配置.
*   `your-widget-screenshot.png` 是一张小组件的预览图, 你需要自己制作并上传到图床, 然后将链接替换到这里.
*   Docker Hub 链接: [https://hub.docker.com/r/zpljd/scriptable-trafficmonitor](https://hub.docker.com/r/zpljd/scriptable-trafficmonitor)
*   GitHub 仓库链接: [https://github.com/zpljd258/scriptable-TrafficMonitor](https://github.com/zpljd258/scriptable-TrafficMonitor)
```

