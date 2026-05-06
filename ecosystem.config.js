module.exports = {
  apps: [{
    name: 'dark-factory',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/home/lich/test/dark-factory-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '3001'
    }
  }]
};
