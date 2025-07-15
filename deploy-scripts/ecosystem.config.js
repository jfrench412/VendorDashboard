// PM2 Ecosystem Configuration for Avahi Dashboard
// This file configures PM2 process manager for production deployment

module.exports = {
  apps: [{
    name: 'avahi-dashboard',
    script: './secure-production-server.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      AWS_REGION: 'us-east-1'
    },
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 80,
      AWS_REGION: 'us-east-1'
    },
    
    // Process management
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log'
    ],
    
    // Restart policy
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced options
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Auto restart on file changes (disabled for production)
    autorestart: true,
    
    // Cron restart (optional - restart daily at 3 AM)
    cron_restart: '0 3 * * *',
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Time zone
    time: true
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ec2-user',
      host: ['your-ec2-instance-ip'],
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/home/ec2-user/avahi-dashboard',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /home/ec2-user/avahi-dashboard/logs'
    }
  }
};
