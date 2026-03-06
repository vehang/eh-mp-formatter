#!/usr/bin/env node
/**
 * 科技资讯早报卡片生成脚本
 * 用法: node news-card.js [类型]
 * 类型: 早报 | 晚报
 */

const https = require('https');
const http = require('http');

// 从环境变量或参数获取配置
const FEISHU_WEBHOOK = process.env.FEISHU_NEWS_WEBHOOK || '';
const NEWS_TYPE = process.argv[2] || '早报';

// 生成日期标题
function getDateTitle() {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return `${month}月${day}日 星期${weekday}`;
}

// 生成早报卡片内容
function generateMorningNews() {
  const dateTitle = getDateTitle();
  
  return {
    "msg_type": "interactive",
    "card": {
      "header": {
        "title": {
          "tag": "plain_text",
          "content": `☀️ ${NEWS_TYPE} | ${dateTitle}`
        },
        "template": "blue"
      },
      "elements": [
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**🚀 今日科技热点**"
          }
        },
        {
          "tag": "hr"
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**1. VAST完成5000万美元A轮融资**\n通用人工智能公司VAST宣布完成5000万美元A轮融资，由阿里、恒旭资本联合领投。同时发布全新AI 3D大模型家族，Tripo P1.0可在2秒内生成专业建模师级别的3D模型。"
          }
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**2. 中国AI闪耀巴塞罗那MWC展**\n中国AI企业在世界移动通信大会上大放异彩，但小米可能正藏着通往未来的钥匙。"
          }
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**3. OpenClaw引领Agent元年**\n\"龙虾\"狂热持续：ChatGPT们只是AI的后端，OpenClaw让AI真正有了前端，2026被称为Agent元年。"
          }
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**4. 阿里千问进军AI硬件**\n通义千问开始做AI硬件，阿里的闭环活了。这是一件了不得的事。"
          }
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**5. Google发布Nano Banana 2**\n成本砍半！要塞入Google的所有产品里，从一个出圈实验变成覆盖全产品线的基础能力。"
          }
        },
        {
          "tag": "hr"
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**📱 快讯**\n• ChatGPT测试个性化写作模板功能\n• NotebookLM推出\"电影感视频概览\"功能\n• 海信发布UX2026款RGB-Mini LED电视\n• 影石推出Snap手机自拍屏"
          }
        },
        {
          "tag": "hr"
        },
        {
          "tag": "note",
          "elements": [
            {
              "tag": "plain_text",
              "content": `📰 数据来源：爱范儿、品玩 | 生成时间：${new Date().toLocaleTimeString('zh-CN')}`
            }
          ]
        }
      ]
    }
  };
}

// 发送到飞书
async function sendToFeishu(card) {
  if (!FEISHU_WEBHOOK) {
    console.log('未配置飞书Webhook，打印卡片内容：');
    console.log(JSON.stringify(card, null, 2));
    return { success: false, message: '未配置Webhook' };
  }

  return new Promise((resolve, reject) => {
    const url = new URL(FEISHU_WEBHOOK);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const data = JSON.stringify(card);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: e.message, body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  console.log(`📰 生成${NEWS_TYPE}...`);
  
  const card = generateMorningNews();
  const result = await sendToFeishu(card);
  
  if (result.StatusCode === 0 || result.code === 0 || result.success !== false) {
    console.log(`✅ ${NEWS_TYPE}发送成功`);
  } else {
    console.log(`❌ ${NEWS_TYPE}发送失败:`, result);
  }
  
  // 输出摘要供cron日志
  console.log('\n📋 今日早报摘要：');
  console.log('- VAST完成5000万美元A轮融资，发布AI 3D大模型');
  console.log('- 中国AI闪耀MWC，小米暗藏大招');
  console.log('- OpenClaw引领Agent元年');
  console.log('- 阿里千问进军AI硬件');
  console.log('- Google Nano Banana 2成本砍半');
}

main().catch(console.error);
