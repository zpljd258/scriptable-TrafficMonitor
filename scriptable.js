// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: chart-bar;
// --- 配置区域 ---
const servers = [
  {
      url: "http://ip:5000/traffic?token=your_secret_token", // 服务器1的API地址
      color: "#4CAF50" // 进度条颜色
  },
  {
      url: "http://ip:5000/traffic?token=your_secret_token",
      color: "#2196F3"
  },
  {
      url: "http://ip:5000/traffic?token=your_secret_token",
      color: "#F44336"
  },
  {
      url: "http://ip:5000/traffic?token=your_secret_token",
      color: "#9C27B0"
  },
  {
      url: "http://ip:5000/traffic?token=your_secret_token",
      color: "#FF9800"
  },
//   {
//       url: "http://ip:5000/traffic?token=your_secret_token",
//       color: "#607D8B"
//   }
  // 添加更多服务器...
];

// --- 函数定义 ---

/**
*  获取流量数据
* @param {string} url API 地址
*/
async function fetchData(url) {
  try {
      const req = new Request(url);
      const json = await req.loadJSON();
      return json;
  } catch (error) {
      console.error(`Error fetching data from ${url}: ${error}`);
      return null;
  }
}

/**
* 创建带圆角的进度条
* @param {WidgetStack} stack 容器
* @param {number} percentage 百分比
* @param {number} width 宽度
* @param {number} height 高度
* @param {string} color 颜色
*/
function createRoundedProgressBar(stack, percentage, width, height, color) {
  const bg = stack.addStack();
  bg.size = new Size(width, height);
  bg.backgroundColor = new Color("#444444", 0.5); // 浅灰色背景
  bg.cornerRadius = height / 2;

  const progress = stack.addStack();
  progress.size = new Size(width * percentage / 100, height);
  progress.backgroundColor = new Color(color);
  progress.cornerRadius = height / 2;

  // 为了保证绝对定位, 需要一个空的 stack
  const emptyStack = stack.addStack();
  emptyStack.size = new Size(0, height);
}

/**
* 创建小组件
*/
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#222222"); // 深灰色背景

  // 添加标题
  const titleStack = widget.addStack();
  const titleTxt = titleStack.addText("服务器流量监控");
  titleTxt.textColor = Color.white();
  titleTxt.font = Font.boldSystemFont(16);
  widget.addSpacer(5);

  // 使用网格布局
  let gridStack = widget.addStack();
  gridStack.layoutHorizontally();

  // 1 台服务器时的特殊处理
  if (servers.length === 1) {
    const data = await fetchData(servers[0].url);
    const singleStack = widget.addStack();
    singleStack.layoutVertically();
    singleStack.size = new Size(280, 0); // 接近小组件最大宽度
    singleStack.centerAlignContent();

      if (data) {
          const nameStack = singleStack.addStack();
          const nameTxt = nameStack.addText(data.hostname ? `${data.hostname}` : "N/A");
          nameTxt.textColor = Color.white();
          nameTxt.font = Font.boldSystemFont(14); // 字体加大
          nameTxt.centerAligned();

          const usageStack = singleStack.addStack();
          const usageTxt = usageStack.addText(data.total_usage_gb && data.max_traffic_gb ? `${data.total_usage_gb}GB/${data.max_traffic_gb}GB` : "N/A");
          usageTxt.textColor = Color.white();
          usageTxt.font = Font.systemFont(12);
          usageTxt.centerAligned();

          const percentageStack = singleStack.addStack();
          const percentageText = percentageStack.addText(data.usage_percentage ? `${data.usage_percentage}%` : "");
          percentageText.font = Font.systemFont(12);
          percentageText.textColor = Color.white();
          percentageText.centerAligned();

          singleStack.addSpacer(2);
          const progressStack = singleStack.addStack();
          createRoundedProgressBar(progressStack, parseFloat(data.usage_percentage), 270, 10, servers[0].color); // 加长进度条

      } else {
          const errorStack = singleStack.addStack();
          const errorTxt = errorStack.addText(`无法获取`);
          errorTxt.textColor = Color.red();
          errorTxt.font = Font.systemFont(12);
          errorTxt.centerAligned();
          singleStack.addSpacer(2);
          createRoundedProgressBar(singleStack, 0, 270, 10, "#888888");
      }

  } else { // 其他数量服务器的处理
      for (let i = 0; i < servers.length; i++) {
          const server = servers[i];
          const data = await fetchData(server.url);

          // 每三个服务器换行
          if (i % 3 === 0 && i > 0) {
              widget.addSpacer(10);
              gridStack = widget.addStack();
              gridStack.layoutHorizontally();
          }

          const columnStack = gridStack.addStack();
          columnStack.layoutVertically();
          columnStack.size = new Size(100, 0);
          columnStack.setPadding(5, 5, 5, 5);

          if (data) {
              const nameStack = columnStack.addStack();
              const nameTxt = nameStack.addText(data.hostname ? `${data.hostname}` : "N/A");
              nameTxt.textColor = Color.white();
              nameTxt.font = Font.boldSystemFont(11);
              nameTxt.lineLimit = 1;

              const usageStack = columnStack.addStack();
              const usageTxt = usageStack.addText(data.total_usage_gb && data.max_traffic_gb ? `${data.total_usage_gb}GB/${data.max_traffic_gb}GB` : "N/A");
              usageTxt.textColor = Color.white();
              usageTxt.font = Font.systemFont(9);

              const percentageStack = columnStack.addStack();
              const percentageText = percentageStack.addText(data.usage_percentage ? `${data.usage_percentage}%` : "");
              percentageText.font = Font.systemFont(10);
              percentageText.textColor = Color.white();

              columnStack.addSpacer(2);
              const progressStack = columnStack.addStack();
              createRoundedProgressBar(progressStack, parseFloat(data.usage_percentage), 90, 8, server.color);

          } else {
              const errorStack = columnStack.addStack();
              const errorTxt = errorStack.addText(`无法获取`);
              errorTxt.textColor = Color.red();
              errorTxt.font = Font.systemFont(9);
              columnStack.addSpacer(2);
              createRoundedProgressBar(columnStack, 0, 90, 8, "#888888");
          }
            if (i % 3 < 2) {
            gridStack.addSpacer(); // 列间距, 最后一列不需要
            }
      }
  }

  return widget;
}

// --- 主程序 ---
const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();
