module.exports = {
  apps: [
    {
      name: 'binance_bot',
      script: 'src/index.js',
      interpreter: 'node', // Specify the node interpreter
      watch: true,
      ignore_watch: ['node_modules'],
      exec_mode: 'cluster',
      instances: '1',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        TYPE: 'module', // Indicate that it's an ES module
      },
      env_dev: {
        NODE_ENV: 'development',
        TYPE: 'module',
      },
      env_test: {
        NODE_ENV: 'test',
        TYPE: 'module',
      },
    },
  ],
};
