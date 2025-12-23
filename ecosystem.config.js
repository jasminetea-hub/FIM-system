// PM2設定ファイル
// 使用方法: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'fim-prediction',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // ログ設定
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自動再起動設定
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // クラッシュ時の設定
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};

