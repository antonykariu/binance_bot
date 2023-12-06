module.exports = {
    apps: [
      {
        name: 'binance-bot',   // Replace with your app's name
        script: 'src/index.js',  // Path to your main script
        watch: true,
        ignore_watch: ['node_modules', 'logs', 'public'],
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
          // Add other environment variables here
        },
      },
    ],
  };
  