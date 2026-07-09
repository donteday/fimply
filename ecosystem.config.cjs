module.exports = {
  apps: [{
    name: 'fimply',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // YANDEX_API_KEY задаётся на сервере через: pm2 set fimply:YANDEX_API_KEY <key>
      // или создай .env на сервере и используй: pm2 start ecosystem.config.cjs --env production
    },
  }],
};
