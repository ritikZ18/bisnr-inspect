module.exports = {
  pdf: {
    format: 'Letter',
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  },
  image: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 80
  },
  puppeteer: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  server: {
    port: process.env.PORT || 3000
  }
};