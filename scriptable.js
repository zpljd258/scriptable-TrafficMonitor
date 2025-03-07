// --- 配置区域 ---
const servers = [
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#4CAF50",
        name: "Hong Kong"
    },
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#F44336",
        name: "Hong Kong2"
    },
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#2196F3",
        name: "Tokyo"
    },
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#9C27B0",
        name: "Oregon-ZoneA"
    },
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#FF9800",
        name: "Oregon-ZoneB"
    },
    {
        url: "http://ip:5000/traffic?token=your_secret_token",
        color: "#607D8B",
        name: "Iowa-ZoneB"
    }
];

// --- 函数定义 ---
/**
* 获取流量数据
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
*/
function createRoundedProgressBar(stack, percentage, width, height, color, usageText, percentageText) {
    const bg = stack.addStack();
    bg.size = new Size(width, height);
    bg.backgroundColor = new Color("#444444", 0.3);
    bg.cornerRadius = height / 2;
    bg.layoutHorizontally();
    bg.setPadding(1, 4, 1, 4); // 增加左右padding, 优化显示

    const progress = bg.addStack();
    progress.size = new Size(width * percentage / 100, height - 2); // 减少高度
    progress.backgroundColor = new Color(color, 0.9);
    progress.cornerRadius = (height - 2) / 2; // 对应减少高度

    const textStack = bg.addStack();
    textStack.size = new Size(width, height - 2);
    textStack.centerAlignContent();
    const fontSize = 6;
    const combinedText = `${usageText} ${percentageText}`;
    const text = textStack.addText(combinedText);
    text.rightAlignText();
    text.font = Font.systemFont(fontSize);
    text.textColor = new Color("#FFFFFF");
    text.lineLimit = 1;
}

/**
* 创建单个服务器信息块
*/
function createServerBlock(columnStack, server, data, fontSize, barWidth, barHeight) {
    if (data) {
        const nameStack = columnStack.addStack();
        const nameTxt = nameStack.addText(server.name);
        nameTxt.textColor = Color.white();
        nameTxt.font = Font.boldSystemFont(fontSize);
        nameTxt.lineLimit = 1;

        const ipStack = columnStack.addStack();
        const ipTxt = ipStack.addText(data.ip);
        ipTxt.textColor = Color.white();
        ipTxt.font = Font.systemFont(fontSize - 3);
        ipTxt.lineLimit = 1;
        columnStack.addSpacer(2);
        const progressStack = columnStack.addStack();
        const usageText =
            data.total_usage_gb && data.max_traffic_gb
                ? `${data.total_usage_gb}GB/${data.max_traffic_gb}GB`
                : "N/A";
        const percentageText = data.usage_percentage
            ? `${data.usage_percentage}%`
            : "";

        createRoundedProgressBar(
            progressStack,
            parseFloat(data.usage_percentage),
            barWidth,
            barHeight,
            server.color,
            usageText,
            percentageText
        );
    } else {
        const errorStack = columnStack.addStack();
        const errorTxt = errorStack.addText(`无法获取`);
        errorTxt.textColor = Color.red();
        errorTxt.font = Font.systemFont(fontSize - 2);
        errorTxt.lineLimit = 1;
        columnStack.addSpacer(2);
        createRoundedProgressBar(
            columnStack,
            0,
            barWidth,
            barHeight,
            "#888888",
            "0GB/0GB",
            "0%"
        );
    }
}

/**
* 创建小组件
*/
async function createWidget() {
    const widget = new ListWidget();
    widget.backgroundColor = new Color("#222222", 0.8);
    widget.useDefaultPadding();

    const widgetFamily = config.widgetFamily; // 使用 config.widgetFamily
    let rows, cols, fontSize, barWidth, barHeight, maxServers, spacing;

    // --- 根据尺寸和服务器数量设置布局参数 ---
    switch (widgetFamily) { // 使用 widgetFamily
        case 'small':
            maxServers = Math.min(servers.length, 3);
            rows = maxServers;
            cols = 1;
            fontSize = 11;
            barWidth = 130;
            barHeight = 8;
            spacing = 5;
            break;

        case "medium":
            maxServers = 6;
            fontSize = 11;
            barHeight = 9;
            spacing = 12;

            if (servers.length <= 3) {
                rows = 1;
                cols = servers.length;
            } else if (servers.length === 4) {
                rows = 2;
                cols = 2;
            } else {
                rows = 2;
                cols = 3;
            }

            // 根据尺寸估算 barWidth
            if (widgetFamily === 'medium') {
              barWidth = Math.floor((169 * 2 - (cols - 1) * spacing) / cols); // 使用估算的宽度 338 (169*2)
            } else if (widgetFamily === 'large') {
              barWidth = Math.floor((360 * 2 - (cols - 1) * spacing) / cols); // 使用估算的宽度 720 (360*2)
            }


            break;

        case 'large':
            maxServers = 12;
            rows = 4;
            cols = 3;
            fontSize = 11;
            barHeight = 8;
            spacing = 5;
             // 根据尺寸估算 barWidth
            if (widgetFamily === 'medium') {
              barWidth = Math.floor((169 * 2- (cols - 1) * spacing) / cols); // 使用估算的宽度
            } else if (widgetFamily === 'large') {
              barWidth = Math.floor((360 * 2 - (cols - 1) * spacing) / cols); // 使用估算的宽度
            }

            break;

        default:
            maxServers = 1;
            rows = 1;
            cols = 1;
            fontSize = 12;
            barWidth = 100;
            barHeight = 10;
            spacing = 5;
            break;
    }

     // --- 单服务器特殊处理 (仅当只有1个服务器且为小组件时) ---
      if (servers.length === 1 && widgetFamily === 'small') {
        // ... (单服务器处理代码保持不变) ...
         const data = await fetchData(servers[0].url);
      const singleStack = widget.addStack();
      singleStack.layoutVertically();
      singleStack.centerAlignContent();
      if (data) {
          const nameTxt = singleStack.addText(servers[0].name);
          nameTxt.textColor = Color.white();
          nameTxt.font = Font.boldSystemFont(16);
          nameTxt.centerAligned();
          const ipTxt = singleStack.addText(data.ip);
          ipTxt.textColor = Color.white();
          ipTxt.font = Font.systemFont(12);
          ipTxt.centerAligned();
          singleStack.addSpacer(5);
          const progressStack = singleStack.addStack();
          const usageText = data.total_usage_gb && data.max_traffic_gb ? `${data.total_usage_gb}GB/${data.max_traffic_gb}GB` : "N/A";
          const percentageText = data.usage_percentage ? `${data.usage_percentage}%` : "";
          createRoundedProgressBar(progressStack, parseFloat(data.usage_percentage), 270, 12, servers[0].color, usageText, percentageText);
      } else {
          const errorTxt = singleStack.addText(`无法获取`);
          errorTxt.textColor = Color.red();
          errorTxt.font = Font.systemFont(14);
          errorTxt.centerAligned();
          singleStack.addSpacer(5);
          createRoundedProgressBar(singleStack, 0, 270, 12, "#888888", "0GB/0GB", "0%");
      }
      return widget; // 提前返回
    }


    // --- 多服务器布局 ---
    const displayedServers = servers.slice(0, Math.min(servers.length, maxServers));

    const mainVerticalStack = widget.addStack();
    mainVerticalStack.layoutVertically();
    mainVerticalStack.spacing = spacing;

    for (let i = 0; i < rows; i++) {
        const rowStack = mainVerticalStack.addStack();
        rowStack.layoutHorizontally();
        rowStack.spacing = spacing;
        rowStack.topAlignContent();

        for (let j = 0; j < cols; j++) {
            const serverIndex = i * cols + j;
            if (serverIndex < displayedServers.length) {
                const server = displayedServers[serverIndex];
                const data = await fetchData(server.url);

                const columnStack = rowStack.addStack();
                columnStack.layoutVertically();
                createServerBlock(columnStack, server, data, fontSize, barWidth, barHeight);
            } else {
                const emptyStack = rowStack.addStack();
                emptyStack.size = new Size(barWidth, 0);
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
   // widget.presentSmall();
    widget.presentMedium();
}
Script.complete();
