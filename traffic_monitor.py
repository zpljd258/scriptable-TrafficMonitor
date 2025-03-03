# traffic_monitor.py
import time
import datetime
import requests
import os
import json
import socket
import logging
import sys
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request

# --- 从环境变量读取配置 ---
# TRAFFIC_DIRECTION 流量方向，默认为出站
TRAFFIC_DIRECTION = os.environ.get("TRAFFIC_DIRECTION", "outbound")
# MONTHLY_TRAFFIC_GB 每月流量上限，默认为 1024 GB
MONTHLY_TRAFFIC_GB = int(os.environ.get("MONTHLY_TRAFFIC_GB", 1024))
# RESET_DAY 流量重置日，默认为每月 1 号
RESET_DAY = int(os.environ.get("RESET_DAY", 1))
# NETWORK_INTERFACE 网络接口名称，默认为 eth0
NETWORK_INTERFACE = os.environ.get("NETWORK_INTERFACE", "eth0")
# API_TOKEN 用于 API 认证的 TOKEN
API_TOKEN = os.environ.get("API_TOKEN", "default_token")
# API_PORT API 监听的端口
API_PORT = int(os.environ.get("API_PORT", 5000))
# ENABLE_API 是否启用 API, 默认为启用 (True)
ENABLE_API = os.environ.get("ENABLE_API", "True").lower() == "true"

# --- 常量 ---
MAX_TRAFFIC_GB = MONTHLY_TRAFFIC_GB
# TRAFFIC_DATA_FILE 流量数据文件路径
TRAFFIC_DATA_FILE = "/data/outbound_traffic.json"
# LOG_FILE 日志文件路径
LOG_FILE = "traffic_monitor.log"
# LOG_MAX_SIZE_BYTES 日志文件最大大小，2MB
LOG_MAX_SIZE_BYTES = 2 * 1024 * 1024

# --- 配置日志 ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# 添加 FileHandler，将日志写入文件
file_handler = RotatingFileHandler(LOG_FILE, maxBytes=LOG_MAX_SIZE_BYTES, backupCount=1)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# 添加 StreamHandler，将日志输出到 stdout
stream_handler = logging.StreamHandler(sys.stdout)  # Corrected line
stream_handler.setFormatter(formatter)
logger.addHandler(stream_handler)

# --- 全局变量用于存储上次的流量数据 ---
previous_tx_bytes = 0
previous_rx_bytes = 0

# --- Flask 应用 ---
app = Flask(__name__)

# --- 函数 ---

def get_current_tx_bytes():
    """获取当前发送的字节数"""
    try:
        with open(f"/sys/class/net/{NETWORK_INTERFACE}/statistics/tx_bytes", "r") as f:
            return int(f.read())
    except FileNotFoundError:
        logger.error(f"错误: 找不到网络接口 {NETWORK_INTERFACE} 的发送统计信息。")
        return None

def get_current_rx_bytes():
    """获取当前接收的字节数"""
    try:
        with open(f"/sys/class/net/{NETWORK_INTERFACE}/statistics/rx_bytes", "r") as f:
            return int(f.read())
    except FileNotFoundError:
        logger.error(f"错误: 找不到网络接口 {NETWORK_INTERFACE} 的接收统计信息。")
        return None

def get_traffic_usage_gb(current_tx, current_rx):
    """计算两个时间间隔之间的流量使用量（GB）"""
    global previous_tx_bytes, previous_rx_bytes
    tx_diff = 0
    rx_diff = 0

    if current_tx is not None:
        tx_diff = current_tx - previous_tx_bytes if current_tx >= previous_tx_bytes else 0
        # 记录本次的 tx_bytes, rx_bytes
        previous_tx_bytes = current_tx
    else:
        return 0  # 无法获取发送数据，返回 0

    if current_rx is not None:
        rx_diff = current_rx - previous_rx_bytes if current_rx >= previous_rx_bytes else 0
        previous_rx_bytes = current_rx
    else:
        rx_diff = 0

    if TRAFFIC_DIRECTION == "bidirectional":
        traffic_gb = (tx_diff + rx_diff) / (1024 ** 3)
    else:
        traffic_gb = tx_diff / (1024 ** 3)

    # 添加详细日志
    logger.debug(f"current_tx: {current_tx}, previous_tx_bytes: {previous_tx_bytes}, tx_diff: {tx_diff}")
    logger.debug(f"current_rx: {current_rx}, previous_rx_bytes: {previous_rx_bytes}, rx_diff: {rx_diff}")
    logger.debug(f"Calculated traffic usage: {traffic_gb:.6f} GB")

    return traffic_gb

def get_host_hostname_from_file():
    """从 /etc/host_hostname 文件中获取主机名"""
    try:
        with open("/etc/host_hostname", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        logger.error("错误: 找不到 /etc/host_hostname 文件。")
        return "Unknown"

def get_public_ipv4():
    """获取公网 IPv4 地址"""
    try:
        response = requests.get("https://4.ipw.cn", timeout=5)
        response.raise_for_status()
        return response.text.strip()
    except requests.exceptions.RequestException as e:
        logger.error(f"获取公网 IP 时出错: {e}")
        return "Unknown"

def load_traffic_data():
    """加载流量数据"""
    try:
        with open(TRAFFIC_DATA_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.info("流量数据文件未找到，初始化新文件。")
        return {}
    except json.JSONDecodeError:
        logger.error("解码流量数据文件时出错，将使用新的数据。")
        return {}

def save_traffic_data(data):
    """保存流量数据"""
    with open(TRAFFIC_DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def calculate_current_traffic():
    """计算并返回当前流量信息"""
    now = datetime.datetime.now()
    current_month = now.strftime("%Y-%m")
    current_day = now.day

    traffic_data = load_traffic_data()

    if current_month not in traffic_data:
        traffic_data[current_month] = {
            "cumulative_traffic_gb": 0,
            "last_reset_day": 0,
        }
        logger.info(f"为 {current_month} 创建新的流量记录。")

    cumulative_traffic_gb = traffic_data[current_month]["cumulative_traffic_gb"]
    last_reset_day = traffic_data[current_month].get("last_reset_day", 0)

    # 流量重置逻辑
    if current_day == RESET_DAY and last_reset_day != current_day:
        traffic_data[current_month]["cumulative_traffic_gb"] = 0
        traffic_data[current_month]["last_reset_day"] = current_day
        logger.info(f"{current_month} 流量计数已重置。")

    current_tx_bytes = get_current_tx_bytes()
    current_rx_bytes = get_current_rx_bytes() if TRAFFIC_DIRECTION == "bidirectional" else None

    if current_tx_bytes is not None:
        current_usage_gb = get_traffic_usage_gb(current_tx_bytes, current_rx_bytes)
        total_usage_gb = cumulative_traffic_gb + current_usage_gb
        traffic_data[current_month]["cumulative_traffic_gb"] = total_usage_gb
        save_traffic_data(traffic_data)
        logger.info(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] 本次流量: {current_usage_gb:.6f} GB, 总流量: {total_usage_gb:.2f} GB")
        return total_usage_gb
    else:
        logger.warning("无法获取流量数据，跳过本次检查。")
        return None

# --- API 路由 ---

@app.route("/traffic", methods=["GET"])
def get_traffic():
    """获取流量信息的 API 端点"""
    # 检查 TOKEN
    provided_token = request.args.get("token")
    if provided_token != API_TOKEN:
        return jsonify({"error": "Invalid token"}), 403

    total_usage_gb = calculate_current_traffic()

    if total_usage_gb is None:
        return jsonify({"error": "Failed to get traffic data"}), 500

    usage_percentage = (total_usage_gb / MAX_TRAFFIC_GB) * 100 if MAX_TRAFFIC_GB > 0 else 0
    host_hostname = get_host_hostname_from_file()
    public_ip = get_public_ipv4()

    return jsonify({
        "hostname": host_hostname,
        "ip": public_ip,
        "total_usage_gb": f"{total_usage_gb:.2f}",
        "max_traffic_gb": f"{MAX_TRAFFIC_GB:.2f}",
        "usage_percentage": f"{usage_percentage:.2f}",
    }), 200

if __name__ == "__main__":
    logger.info("流量监控服务已启动。")

    # 首次运行时初始化 previous_tx_bytes 和 previous_rx_bytes
    previous_tx_bytes = get_current_tx_bytes() or 0
    previous_rx_bytes = get_current_rx_bytes() or 0
    logger.info(f"Initial previous_tx_bytes: {previous_tx_bytes}, previous_rx_bytes: {previous_rx_bytes}")

    # 持续计算流量
    if ENABLE_API:
      # 启动 Flask 应用, 0.0.0.0 允许外部访问
      app.run(host="0.0.0.0", port=API_PORT)
    else:
      while True:
        calculate_current_traffic()
        time.sleep(60) # 如果不启用API, 每60秒计算一次流量
