const path = require('path');
module.exports = {
  apps: [{
    name: 'dark-factory',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: path.resolve(__dirname),
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
