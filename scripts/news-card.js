#!/usr/bin/env node

/**
 * Morning Tech News Card Generator
 * Fetches latest technology news and formats as a morning briefing
 */

const FETCH_COUNT = 8;

async function fetchTechNews() {
  // Use Brave Search API via environment or fallback to manual search
  const query = 'technology news today';
  
  // Note: This script is designed to be called by OpenClaw
  // The actual news fetching will be done by the agent running this script
  return {
    query,
    count: FETCH_COUNT,
    timestamp: new Date().toISOString()
  };
}

async function main() {
  const config = await fetchTechNews();
  
  // Output instruction for the agent
  console.log(JSON.stringify({
    action: 'fetch_news',
    query: config.query,
    count: config.count,
    format: 'morning_card',
    language: 'zh-CN'
  }, null, 2));
}

main().catch(console.error);
