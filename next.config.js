module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))

    return config
  },
  async headers() {
    return [
      {
        source: '/',
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=7200, must-revalidate"
          }
        ],
      },
      {
        source: '/:id',
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=7200, must-revalidate"
          }
        ],
      },
    ]
  },
}