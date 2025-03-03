# 🚀 Traffic Monitor Widget for Scriptable

[![GitHub stars](https://img.shields.io/github/stars/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/zpljd258/scriptable-TrafficMonitor?style=social)](https://github.com/zpljd258/scriptable-TrafficMonitor/network/members)
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
        image: traffic-monitor  # 最终生成的镜像名称
        build: .              # 使用当前目录下的 Dockerfile 构建镜像
        environment:
          API_TOKEN: your_secret_token  # ⚠️ 必须修改: 设置一个安全的 API Token
          API_PORT: 5000              # API 监听的端口，可以根据需要修改
          ENABLE_API: "True"          # 是否启用 API，默认为启用，设置为 "False" 可以禁用
          TRAFFIC_DIRECTION: outbound  # 流量方向，可选值：outbound（出站，默认）、bidirectional（双向）
          MONTHLY_TRAFFIC_GB: 200     # 每月流量上限（GB），根据你的服务器套餐修改
          RESET_DAY: 1              # 流量重置日期，默认为每月 1 号
          NETWORK_INTERFACE: eth0    # 网络接口名称，通常不需要修改
        volumes:
          - /opt/docker/traffic-monitor/data:/data  # 将容器内的 /data 目录挂载到宿主机的 /opt/docker/traffic-monitor/data 目录，用于持久化存储流量数据
          - /etc/hostname:/etc/host_hostname:ro    # 将容器内的 /etc/host_hostname 文件挂载到宿主机的 /etc/hostname 文件，只读模式，用于获取主机名
        restart: always            # 容器自动重启策略，始终重启
        container_name: traffic-monitor  # 容器名称
        network_mode: host          # 使用 host 网络模式，容器将共享宿主机的网络栈，可以直接使用宿主机的 IP 地址和端口
    ```

    **配置说明:**

    *   **`image`:**  指定构建后生成的镜像名称。
    *   **`build`:**  指定 Dockerfile 所在的路径，`.` 表示当前目录。
    *   **`environment`:**  设置环境变量，用于配置容器内的应用程序。
        *   **`API_TOKEN`:**  **必须修改**，设置一个安全的 API Token，用于 Scriptable 小组件访问 API 时的身份验证。
        *   **`API_PORT`:**  API 监听的端口，Scriptable 小组件将通过这个端口访问 API。
        *   **`ENABLE_API`:** 是否启用 API, 默认为 `True` (启用), 设置为 `"False"` 可以禁用. 如果禁用, 将不会启动 Flask Web 服务, 仅在后台持续计算流量.
        *   **`TRAFFIC_DIRECTION`:**  流量计算方向，`outbound` 表示只计算出站流量，`bidirectional` 表示计算双向流量（出站和入站）。
        *   **`MONTHLY_TRAFFIC_GB`:**  每月流量上限，单位为 GB。
        *   **`RESET_DAY`:**  流量重置日期，设置为每月几号重置流量计数。
        *   **`NETWORK_INTERFACE`:**  网络接口名称，通常是 `eth0`，如果你的服务器有多个网卡，可能需要根据实际情况修改。
    *   **`volumes`:**  配置数据卷，用于持久化存储数据。
        *   **`/opt/docker/traffic-monitor/data:/data`:**  将容器内的 `/data` 目录（用于存储流量数据）映射到宿主机的 `/opt/docker/traffic-monitor/data` 目录。这样，即使容器被删除，流量数据也不会丢失。
        *   **`/etc/hostname:/etc/host_hostname:ro`:** 将容器内的 `/etc/host_hostname` 文件（用于获取主机名）映射到宿主机的 `/etc/hostname` 文件，并设置为只读模式 (`ro`)。
    *   **`restart`:**  设置容器的重启策略。`always` 表示无论容器退出状态如何，都会自动重启。
    *   **`container_name`:**  设置容器的名称。
    *   **`network_mode`:**  设置容器的网络模式。`host` 表示容器使用宿主机的网络栈，这样容器可以直接使用宿主机的 IP 地址和端口，无需进行端口映射。

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

