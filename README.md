# 🚀 Traffic Monitor Widget for Scriptable

[![GitHub stars](https://img.shields.io/github/stars/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/network/members)
[![GitHub license](https://img.shields.io/github/license/zpljd258/scriptable-TrafficMonitor)](https://github.com/zpljd258/scriptable-TrafficMonitor/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/zpljd/scriptable-trafficmonitor)](https://hub.docker.com/r/zpljd/scriptable-trafficmonitor)

> 这是一个用于 [Scriptable](https://scriptable.app/) 应用的流量监控小组件，可以实时显示服务器的流量使用情况（支持多服务器）。


## ✨ 特性

*   **实时监控:** 实时显示服务器的流量使用情况（已用流量、总流量、百分比）。
*   **多服务器支持:** 支持同时监控多个服务器的流量。
*   **自定义配置:** 可以通过环境变量自定义流量上限、重置日期、API Token、API 端口等。
*   **美观的 UI:** 界面简洁美观，符合 Apple 设计规范。
*   **弹性布局:** 自动适应不同数量的服务器，优化显示效果。
*   **错误处理:** 当无法获取服务器数据时，显示错误信息。
*   **易于部署:** 使用 Docker 部署，方便快捷，也支持直接从 Docker Hub 拉取镜像。

## 🛠️ 部署

### 方法一：使用 Docker Hub 镜像 (推荐)

1.  **拉取镜像:**

    ```bash
    docker pull zpljd/scriptable-trafficmonitor:latest
    ```

2.  **创建并运行容器:**

    ```bash
    docker run -d \
      --name traffic-monitor \
      -e API_TOKEN=your_secret_token \
      -e API_PORT=5000 \
      -e ENABLE_API=True \
      -e TRAFFIC_DIRECTION=outbound \
      -e MONTHLY_TRAFFIC_GB=200 \
      -e RESET_DAY=1 \
      -e NETWORK_INTERFACE=eth0 \
      -v /opt/docker/traffic-monitor/data:/data \
      -v /etc/hostname:/etc/host_hostname:ro \
      --network host \
      --restart always \
      zpljd/scriptable-trafficmonitor:latest
    ```

    **配置说明 (修改上面命令中的`-e`参数):**

    *   **`API_TOKEN`:**  **必须修改**，设置一个安全的、随机生成的字符串作为 API Token。
    *   **`API_PORT`:**  API 监听的端口，可以根据需要修改。
    *   **`ENABLE_API`:** 是否启用API, 默认为启用, 设置为 `"False"` 可以禁用.
    *   **`MONTHLY_TRAFFIC_GB`:**  每月流量上限（GB），根据你的服务器套餐修改。
    *   其他配置一般不需要修改，除非你有特殊需求。

### 方法二：使用 Docker Compose (适合本地构建)

1.  **准备工作:**

    *   服务器已安装 Docker 和 Docker Compose

2.  **获取代码:**

    ```bash
    git clone https://github.com/zpljd258/scriptable-TrafficMonitor.git
    cd scriptable-TrafficMonitor
    ```

3.  **修改配置 (docker-compose.yml):**

    ```yaml
    services:
      traffic-monitor:
        image: traffic-monitor
        build: .
        environment:
          API_TOKEN: your_secret_token  # ⚠️ 必须修改: 设置一个安全的 API Token
          API_PORT: 5000              # API 端口，可以根据需要修改
          ENABLE_API: "True"
          TRAFFIC_DIRECTION: outbound
          MONTHLY_TRAFFIC_GB: 200
          RESET_DAY: 1
          NETWORK_INTERFACE: eth0
        volumes:
          - /opt/docker/traffic-monitor/data:/data
          - /etc/hostname:/etc/host_hostname:ro
        restart: always
        container_name: traffic-monitor
        network_mode: host
    ```

    **配置说明:**

    *   **`API_TOKEN`:**  **必须修改**，设置一个安全的 API Token。
    *   **`API_PORT`:**  API 监听的端口, 默认5000。
    *   **`ENABLE_API`:** 是否启用API, 默认为启用, 设置为 `"False"` 可以禁用.
    *   **`MONTHLY_TRAFFIC_GB`:**  每月流量上限（GB），根据你的服务器套餐修改。
    *   其他配置一般不需要修改，除非你有特殊需求。

4.  **构建并运行:**

    ```bash
    docker compose up -d
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

5.  在 iPhone 主屏幕上添加 Scriptable 小组件，选择你创建的脚本。

**💡 提示:**

*   为了方便阅读，建议修改服务器的 `hostname`（`/etc/hostname` 文件），使其简洁明了。`hostname` 的最大显示长度约为 15 个字符（取决于字体和具体字符）。
*   为了获得最佳显示效果，建议最多配置 **6** 个服务器。 Scriptable 小组件会自动调整布局，但过多的服务器可能会导致显示错位或信息过于拥挤。 2-4个, 或者6个服务器的时候显示效果最佳.

## 🤝 贡献

欢迎提交 Issue 或 Pull Request，一起完善这个项目！

## 📝 License

[MIT License](https://github.com/zpljd258/scriptable-TrafficMonitor/blob/main/LICENSE)

## 🙏 感谢

*   [Scriptable](https://scriptable.app/)
*   [Flask](https://flask.palletsprojects.com/)
*   [Gemini 2.0 Pro](https://ai.google.dev/)👈特别是它勤劳的打黑工

