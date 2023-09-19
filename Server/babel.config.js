module.exports = {
  // https://babeljs.io/docs/en/assumption
  assumptions: {
    iterableIsArray: true,
  },
  presets: [
    [
      '@babel/preset-env',
      // {
      //   "useBuiltIns": "entry",
      //   "corejs": "3.26",
      //   loose: true,
      // },
      // {targets: {node: 'current'}}
    ]
  ],
};
