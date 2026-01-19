// PM2設定ファイル
// 使用方法: pm2 start ecosystem.r.config.js

module.exports = {
  apps: [
    {
      name: 'fim-prediction-r',
      script: 'server_r_model.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        R_API_URL: 'http://localhost:5000',
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
      max_restarts: 10,
    },
    {
      name: 'r-api-server',
      script: './r_api/start_fastapi.sh',
      interpreter: 'bash',
      instances: 1,
      exec_mode: 'fork',
      cwd: '.',
      env: {
        PYTHONUNBUFFERED: '1',
        PYTHONPATH: './r_api',
      },
      // ログ設定
      error_file: './logs/r-api-error.log',
      out_file: './logs/r-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自動再起動設定
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // クラッシュ時の設定
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
