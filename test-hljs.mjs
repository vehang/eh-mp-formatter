import hljs from 'highlight.js'

const code = `function hello() {
  console.log("Hello, World!");
  return 42;
}`

const highlighted = hljs.highlight(code, { language: 'javascript' }).value
console.log('=== Highlighted HTML ===')
console.log(highlighted)
