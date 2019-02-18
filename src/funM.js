
(global => {

  let context = {
    config: {},
  }
  let cfg = context.config

  function isArray (it) {
    return Object.prototype.toString.call(it) === '[object Array]'
  }
  function scripts () {
    return document.getElementsByName('script')
  }
  function eachReverse (ary, func) {
    if (ary) {
      for (let i = ary.length - 1; i > -1; i -= 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break
        }
      }
    }
  }

  class Module {
    constructor (data) {
      const defaultData = {
        id: '', // 模块id
        name: '', // 模块名称
        src: '', // 模块路径
        dep: [], // 模块的依赖
        status: '', // 模块的状态
        cb: () => {},
        error: () => {},
      }
      if (data) Object.assign(defaultData, data)
      Object.assign(this, defaultData)
    }
    init () {
      // 初始化
    }
    fetch () {}
    analyzeDep () {}
    exec () {}
  }

  // 创建首个Module, 入口即为该Module的依赖
  let firstModule = new Module()

  const require = (deps, fun) => {
    if (isArray(deps)) {
      firstModule.dep.concat(deps)
    }
  }
  const req = global.require = require

  req.config = config => {
    if (config) {
      if (!isArray(config) && typeof deps !== 'string') {
        // 配置
        cfg = config
      }
    }
  }

  // Figure out baseUrl. Get it from the script tag with require.js in it.
  eachReverse(scripts(), script => {

    let src = []
    const dataMain = script.getAttribute('data-main')
    if (dataMain) {
      let mainScript = dataMain

      // 若没有配置baseUrl，则从dataMain中获取
      if (!cfg.baseUrl) {
        src = mainScript.split('/')
        mainScript = src.pop()
        const subPath = src.length ? src.join('/') + '/' : './'
        cfg.baseUrl = subPath
      }

      // Put the data-main script in the files to load.
      cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript]

      return true
    }
  })

})(this)
