#!/usr/bin/env node
/**
 * 天气早报卡片推送脚本
 * 使用 Open-Meteo API 获取天气数据并发送飞书交互式卡片
 */

const https = require('https');

// 配置
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8',
  latitude: 30.77,
  longitude: 111.33,
  locationName: '宜昌夷陵区',
  timezone: 'Asia/Shanghai'
};

// 获取飞书 access_token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: CONFIG.appId,
      app_secret: CONFIG.appSecret
    });
    
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code === 0) resolve(json.tenant_access_token);
          else reject(new Error(json.msg));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 获取天气数据（Open-Meteo API）
async function fetchWeather() {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=${encodeURIComponent(CONFIG.timezone)}&forecast_days=3&lang=zh`;
    
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// WMO天气代码转描述和emoji
function weatherCodeToInfo(code) {
  const weatherMap = {
    0: { desc: '晴', emoji: '☀️' },
    1: { desc: '大部晴朗', emoji: '🌤️' },
    2: { desc: '局部多云', emoji: '⛅' },
    3: { desc: '多云', emoji: '☁️' },
    45: { desc: '雾', emoji: '🌫️' },
    48: { desc: '雾凇', emoji: '🌫️' },
    51: { desc: '小毛毛雨', emoji: '🌧️' },
    53: { desc: '中毛毛雨', emoji: '🌧️' },
    55: { desc: '大毛毛雨', emoji: '🌧️' },
    56: { desc: '冻毛毛雨', emoji: '🌨️' },
    57: { desc: '强冻毛毛雨', emoji: '🌨️' },
    61: { desc: '小雨', emoji: '🌧️' },
    63: { desc: '中雨', emoji: '🌧️' },
    65: { desc: '大雨', emoji: '🌧️' },
    66: { desc: '冻雨', emoji: '🌨️' },
    67: { desc: '强冻雨', emoji: '🌨️' },
    71: { desc: '小雪', emoji: '🌨️' },
    73: { desc: '中雪', emoji: '❄️' },
    75: { desc: '大雪', emoji: '❄️' },
    77: { desc: '雪粒', emoji: '❄️' },
    80: { desc: '小阵雨', emoji: '🌦️' },
    81: { desc: '中阵雨', emoji: '🌦️' },
    82: { desc: '大阵雨', emoji: '🌧️' },
    85: { desc: '小阵雪', emoji: '🌨️' },
    86: { desc: '大阵雪', emoji: '❄️' },
    95: { desc: '雷暴', emoji: '⛈️' },
    96: { desc: '雷暴伴小冰雹', emoji: '⛈️' },
    99: { desc: '雷暴伴大冰雹', emoji: '⛈️' }
  };
  return weatherMap[code] || { desc: '未知', emoji: '🌤️' };
}

// 风向角度转中文
function windDegreeToChinese(degree) {
  const directions = [
    { min: 337.5, max: 360, name: '北' },
    { min: 0, max: 22.5, name: '北' },
    { min: 22.5, max: 67.5, name: '东北' },
    { min: 67.5, max: 112.5, name: '东' },
    { min: 112.5, max: 157.5, name: '东南' },
    { min: 157.5, max: 202.5, name: '南' },
    { min: 202.5, max: 247.5, name: '西南' },
    { min: 247.5, max: 292.5, name: '西' },
    { min: 292.5, max: 337.5, name: '西北' }
  ];
  for (const d of directions) {
    if (degree >= d.min && degree < d.max) return d.name;
  }
  return '北';
}

// 构建卡片 JSON
function buildCard(weatherData) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 当前天气
  const current = weatherData.current;
  const currentTemp = current.temperature_2m;
  const feelsLike = current.apparent_temperature;
  const humidity = current.relative_humidity_2m;
  const windSpeed = current.wind_speed_10m;
  const windDir = windDegreeToChinese(current.wind_direction_10m);
  const weatherInfo = weatherCodeToInfo(current.weather_code);
  
  // 今日预报
  const daily = weatherData.daily;
  const todayMax = daily.temperature_2m_max[0];
  const todayMin = daily.temperature_2m_min[0];
  const sunrise = daily.sunrise[0].split('T')[1];
  const sunset = daily.sunset[0].split('T')[1];
  
  // 未来两天预报
  const tomorrow = { 
    min: daily.temperature_2m_min[1], 
    max: daily.temperature_2m_max[1],
    weather: weatherCodeToInfo(daily.weather_code[1])
  };
  const dayAfter = { 
    min: daily.temperature_2m_min[2], 
    max: daily.temperature_2m_max[2],
    weather: weatherCodeToInfo(daily.weather_code[2])
  };
  
  // 生活建议
  const suggestions = [];
  const temp = currentTemp;
  if (temp <= 5) suggestions.push('🥶 天气寒冷，注意保暖');
  else if (temp <= 15) suggestions.push('🧥 天气较凉，建议穿外套');
  else if (temp <= 25) suggestions.push('👕 天气温和，穿着舒适');
  else suggestions.push('🥵 天气炎热，注意防暑');
  
  if (humidity >= 80) suggestions.push('💧 湿度较高，体感闷热');
  if (windSpeed >= 30) suggestions.push('💨 风力较大，外出注意');
  
  // 检查是否有雨
  const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  if (rainyCodes.includes(current.weather_code)) {
    suggestions.push('☔ 当前有雨，出门带伞');
  } else if (rainyCodes.includes(daily.weather_code[0])) {
    suggestions.push('🌂 今日可能有雨，建议带伞');
  }
  
  const elements = [
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `📅 ${dateStr} ${weekDay}` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `---` }
    },
    // 当前天气
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `${weatherInfo.emoji} **当前天气**: ${weatherInfo.desc}` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `🌡️ **温度**: ${currentTemp}°C (体感 ${feelsLike}°C)` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `📊 **今日**: ${todayMin}°C ~ ${todayMax}°C` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `💧 **湿度**: ${humidity}%  |  🌬️ **风力**: ${windDir}风 ${windSpeed}km/h` }
    },
    {
      tag: 'div',
      text: { tag: 'lark_md', content: `🌅 **日出**: ${sunrise}  |  🌇 **日落**: ${sunset}` }
    }
  ];
  
  // 未来预报
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `---` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `📆 **未来预报**` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `${tomorrow.weather.emoji} **明天**: ${tomorrow.min}°C ~ ${tomorrow.max}°C (${tomorrow.weather.desc})` }
  });
  elements.push({
    tag: 'div',
    text: { tag: 'lark_md', content: `${dayAfter.weather.emoji} **后天**: ${dayAfter.min}°C ~ ${dayAfter.max}°C (${dayAfter.weather.desc})` }
  });
  
  // 生活建议
  if (suggestions.length > 0) {
    elements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: `---` }
    });
    elements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: `💡 **生活建议**` }
    });
    suggestions.forEach(s => {
      elements.push({
        tag: 'div',
        text: { tag: 'lark_md', content: s }
      });
    });
  }
  
  // 底部
  elements.push({
    tag: 'note',
    elements: [
      { tag: 'plain_text', content: `Weather Bot · ${timeStr} | 数据来源: Open-Meteo` }
    ]
  });
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: { tag: 'plain_text', content: `🌤️ ${CONFIG.locationName} 天气早报` }
    },
    elements: elements
  };
}

// 发送卡片消息
async function sendCard(token, card) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      receive_id: CONFIG.chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card)
    });
    
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code === 0) resolve(json.data);
          else reject(new Error(`飞书API错误: ${json.msg} (code: ${json.code})`));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  try {
    console.log(`🌤️ 获取 ${CONFIG.locationName} 天气数据...`);
    
    // 获取天气数据
    const weatherData = await fetchWeather();
    console.log(`✅ 天气数据获取成功`);
    
    // 获取 token
    console.log('🎫 获取飞书 Token...');
    const token = await getAccessToken();
    console.log('✅ Token 获取成功');
    
    // 构建卡片
    console.log('📦 构建天气卡片...');
    const card = buildCard(weatherData);
    
    // 发送
    console.log('📤 发送卡片到飞书...');
    const result = await sendCard(token, card);
    
    console.log('✅ 天气卡片发送成功! message_id:', result.message_id);
    
    // 输出天气摘要
    const current = weatherData.current;
    const daily = weatherData.daily;
    const weatherInfo = weatherCodeToInfo(current.weather_code);
    console.log(`📊 天气摘要: ${current.temperature_2m}°C, ${weatherInfo.desc}, ${daily.temperature_2m_min[0]}°C ~ ${daily.temperature_2m_max[0]}°C`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ 发送失败:', err.message);
    process.exit(1);
  }
}

main();
