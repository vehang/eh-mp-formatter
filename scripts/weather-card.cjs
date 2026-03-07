#!/usr/bin/env node
/**
 * 天气早报卡片生成脚本
 * 用法: node weather-card.cjs [城市]
 * 默认城市: Shanghai
 */

const https = require('https');
const http = require('http');

// 配置
const CITY = process.argv[2] || 'Shanghai';
const FEISHU_WEBHOOK = process.env.FEISHU_WEATHER_WEBHOOK || '';

// 城市坐标
const CITY_COORDS = {
  'Shanghai': { lat: 31.23, lon: 121.47, name: '上海' },
  'Beijing': { lat: 39.90, lon: 116.41, name: '北京' },
  'Shenzhen': { lat: 22.54, lon: 114.06, name: '深圳' },
  'Guangzhou': { lat: 23.13, lon: 113.26, name: '广州' },
  'Hangzhou': { lat: 30.27, lon: 120.15, name: '杭州' },
};

// 获取天气数据 (使用 Open-Meteo)
async function getWeatherData(city) {
  const coords = CITY_COORDS[city] || CITY_COORDS['Shanghai'];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Shanghai`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          json.cityName = coords.name;
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// WMO 天气代码转图标和描述
function getWeatherInfo(code) {
  const weatherMap = {
    0: { icon: '☀️', desc: '晴朗' },
    1: { icon: '🌤️', desc: '大部晴朗' },
    2: { icon: '⛅', desc: '局部多云' },
    3: { icon: '☁️', desc: '多云' },
    45: { icon: '🌫️', desc: '雾' },
    48: { icon: '🌫️', desc: '冻雾' },
    51: { icon: '🌧️', desc: '小毛毛雨' },
    53: { icon: '🌧️', desc: '中毛毛雨' },
    55: { icon: '🌧️', desc: '大毛毛雨' },
    61: { icon: '🌧️', desc: '小雨' },
    63: { icon: '🌧️', desc: '中雨' },
    65: { icon: '🌧️', desc: '大雨' },
    66: { icon: '🌧️', desc: '冻雨' },
    67: { icon: '🌧️', desc: '大冻雨' },
    71: { icon: '🌨️', desc: '小雪' },
    73: { icon: '🌨️', desc: '中雪' },
    75: { icon: '❄️', desc: '大雪' },
    77: { icon: '🌨️', desc: '雪粒' },
    80: { icon: '🌦️', desc: '小阵雨' },
    81: { icon: '🌦️', desc: '中阵雨' },
    82: { icon: '🌦️', desc: '大阵雨' },
    85: { icon: '🌨️', desc: '小阵雪' },
    86: { icon: '🌨️', desc: '大阵雪' },
    95: { icon: '⛈️', desc: '雷暴' },
    96: { icon: '⛈️', desc: '雷暴伴小冰雹' },
    99: { icon: '⛈️', desc: '雷暴伴大冰雹' },
  };
  return weatherMap[code] || { icon: '🌤️', desc: '未知' };
}

// 风向角度转方位
function degToDirection(deg) {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

// 生成日期标题
function getDateTitle() {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return `${month}月${day}日 星期${weekday}`;
}

// 格式化时间
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 生成天气卡片
async function generateWeatherCard(city) {
  try {
    const weather = await getWeatherData(city);
    const current = weather.current;
    const daily = weather.daily;
    const cityName = weather.cityName;
    const dateTitle = getDateTitle();
    
    const weatherInfo = getWeatherInfo(current.weather_code);
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windDir = degToDirection(current.wind_direction_10m);
    const windSpeed = current.wind_speed_10m;
    
    const maxTemp = daily.temperature_2m_max[0];
    const minTemp = daily.temperature_2m_min[0];
    const sunrise = formatTime(daily.sunrise[0]);
    const sunset = formatTime(daily.sunset[0]);
    
    // 估算体感温度（简化版）
    const feelsLike = temp; // Open-Meteo 免费版不提供体感温度，用实际温度代替

    return {
      "msg_type": "interactive",
      "card": {
        "header": {
          "title": {
            "tag": "plain_text",
            "content": `🌤️ 天气早报 | ${dateTitle}`
          },
          "template": "blue"
        },
        "elements": [
          {
            "tag": "div",
            "text": {
              "tag": "lark_md",
              "content": `**${cityName}** ${weatherInfo.icon} **${temp}°C**\n${weatherInfo.desc} | 体感 ${feelsLike}°C`
            }
          },
          {
            "tag": "hr"
          },
          {
            "tag": "div",
            "fields": [
              {
                "is_short": true,
                "text": {
                  "tag": "lark_md",
                  "content": `**🌡️ 温度范围**\n${minTemp}°C ~ ${maxTemp}°C`
                }
              },
              {
                "is_short": true,
                "text": {
                  "tag": "lark_md",
                  "content": `**💧 湿度**\n${humidity}%`
                }
              }
            ]
          },
          {
            "tag": "div",
            "fields": [
              {
                "is_short": true,
                "text": {
                  "tag": "lark_md",
                  "content": `**💨 风力**\n${windDir} ${windSpeed}km/h`
                }
              },
              {
                "is_short": true,
                "text": {
                  "tag": "lark_md",
                  "content": `**🌅 日出日落**\n${sunrise} / ${sunset}`
                }
              }
            ]
          },
          {
            "tag": "hr"
          },
          {
            "tag": "note",
            "elements": [
              {
                "tag": "plain_text",
                "content": `🌡️ 数据来源：Open-Meteo | 更新时间：${new Date().toLocaleTimeString('zh-CN')}`
              }
            ]
          }
        ]
      }
    };
  } catch (error) {
    throw new Error(`获取天气数据失败: ${error.message}`);
  }
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
  console.log(`🌤️ 获取${CITY}天气数据...`);
  
  try {
    const weather = await getWeatherData(CITY);
    const current = weather.current;
    const daily = weather.daily;
    const cityName = weather.cityName;
    const weatherInfo = getWeatherInfo(current.weather_code);
    
    const card = await generateWeatherCard(CITY);
    const result = await sendToFeishu(card);
    
    if (result.StatusCode === 0 || result.code === 0 || result.success !== false) {
      console.log(`✅ 天气早报发送成功`);
    } else {
      console.log(`⚠️ 天气卡片已生成，但发送失败:`, result.message || result);
    }
    
    // 输出摘要
    console.log('\n📋 今日天气摘要：');
    console.log(`- 城市: ${cityName}`);
    console.log(`- 当前温度: ${current.temperature_2m}°C`);
    console.log(`- 温度范围: ${daily.temperature_2m_min[0]}°C ~ ${daily.temperature_2m_max[0]}°C`);
    console.log(`- 天气状况: ${weatherInfo.icon} ${weatherInfo.desc}`);
    console.log(`- 湿度: ${current.relative_humidity_2m}%`);
    console.log(`- 风力: ${degToDirection(current.wind_direction_10m)} ${current.wind_speed_10m}km/h`);
    console.log(`- 日出: ${formatTime(daily.sunrise[0])} | 日落: ${formatTime(daily.sunset[0])}`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
