
(global => {
  const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/
  const JsFileName = /(^[./*]*)([^\\:*?"<>|]+)(\.js$)/g
  let unfileModule = 0 // 非文件模块，计数命名
  const head = document.getElementsByTagName('head')[0]

  function isArray (it) {
    return Object.prototype.toString.call(it) === '[object Array]'
  }
  function scripts () {
    return document.getElementsByTagName('script')
  }
  // 模块名(路径)
  function getJsFileName (base, src) {
    if (!JsFileName.test(src)) {
      return new Error('模块名不正确，请输入正确的路径')
    }
    const name = src.replace(JsFileName, (match, $1, $2, $3) => $2 + $3)
    return base + name
  }

  // 规范baseUrl
  function getBaseUrl (base, file) {
    if (base) {
      const baseArg = base.split('/')
      return baseArg.length > 0 ? `${baseArg.join('/')}/` : ''
    }
    if (file) {
      const fileArg = file.split('/')
      fileArg.pop()
      return fileArg.length > 0 ? `${fileArg.join('/')}/` : ''
    }
    return ''
  }
  function each (ary, func) {
    if (ary) {
      for (let i = 0; i < ary.length; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break
        }
      }
    }
  }
  function removeListener (node, func, name, ieName) {
    node.removeEventListener(name, func, false)
  }
  function getScriptData (evt) {
    const node = evt.currentTarget || evt.srcElement
    removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange')
    removeListener(node, context.onScriptError, 'error')
    return {
      node,
      name: node && node.getAttribute('data-requiremodule'),
    }
  }

  // ============================================
  // 模块下载完成和模块加载完成区别：前者表示模块的文件或代码块已经存在本地，但未执行，后者表示模块文件或代码块已经存在到本地,并且开始执行，其依赖也已经全部加载完成

  // 环境类
  class Context {
    constructor () {
      this.config = {
        baseUrl: '', // baseUrl
        deps: '', // 前置依赖模块(require被定义后，这些依赖就已进行加载。好处在于不用手动require.并且它不会堵塞后续的requrie([])操作)
      }
      this.name = '_@'
      this.globDeps = {} // 当前环境下加载的全局依赖列表 （{name: Module}）
      this.depQueue = [] // 模块下载队列
      this.depMap = {}
    }
    // 初始化配置
    configure (cfg) {
      this.config = {...cfg}
      // baseUrl
      this.config.baseUrl = getBaseUrl(this.config.baseUrl)
      if (this.config.deps) {
        context.require({deps: [...this.config.deps]})
      }
      return this.config
    }
    /**
     * @param {*} data 模块的数据
     */
    require (data) {
      if (!data) return
      // 使用已经加载的模块
      if (typeof data === 'string') {
        if (context.globDeps[data]) {
          return context.globDeps[data].result
        }
        return new Error(`模块${data}未加载: 使用requrie([])先加载`)
      }

      // 文件模块
      if (typeof data.name === 'string' || typeof data.src === 'string') {
        const name = data.name || data.src
        const src = name
        data = {...data, name, src}
      }

      // 匿名模块
      if (typeof data.name === 'undefined') {
        const name = `${context.name}${unfileModule++}`
        data = {...data, name}
      }

      // 创建模块
      const module = (new Module(data))
      context.globDeps[data.name] = module
      module.init()
      return module
    }
    completeLoad (moduleName) {
      let args, found
      while (this.depQueue.length > 0) {
        args = this.depQueue.shift()
        if (args.name === null) {
          args.name = moduleName
          found = true
        } else if (args.name === moduleName) {
          found = true
        }
        if (this.depMap[moduleName]) {
          args.beDeps = [...this.depMap[moduleName]]
          delete this.depMap[moduleName]
        }
        this.require(args)
      }
      if (!found) {
        return new Error(`define模块${moduleName}未找到`)
      }
    }
    /**
     * 检查循环依赖
     * 若依赖的模块的依赖关系中有自身模块，则先执行自身模块
     * @param {child：子模块，parent: 当前模块}
     */
    checkCycle (child, parent) {
      const deps = context.globDeps[child].deps
      return deps.some(dep => {
        if (dep === parent) {
          return true
        }

        // 若child的依赖已经加载但状态为1，则需要检查该依赖模块的依赖是否等于parent
        if (context.globDeps[dep] && context.globDeps[dep].status === 1) {
          return this.checkCycle(deps, parent)
        }
      })
    }

    onScriptLoad (evt) {
      if (evt.type === 'load' ||
      (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
        const data = getScriptData(evt)
        context.completeLoad(data.name)
      }
    }
    onScriptError () {}
  }
  const context = new Context()

  // ============================================

  // 模块类
  class Module {
    constructor (data) {
      const defaultData = {
        name: '', // 模块名称
        src: '', // 模块路径
        deps: [], // 模块的依赖([...name])
        beDeps: [], // 被依赖的模块
        depsCount: 0, // 未加载的依赖数量
        status: 1, // 1.加载中，2.已加载，3.加载出错）
        cb: () => {}, // 加载成功的回调
        result: undefined, // 模块的回调返回值
        error: () => {}, // 加载失败的回调
      }
      if (data) Object.assign(defaultData, data)
      Object.assign(this, defaultData)
    }
    init () {
      console.log(this)

      this.depsCount = this.deps.length

      // 监听模块状态
      this.onStatus()
      // 监听依赖加载
      this.analyzeDep()

      // 模块无依赖，修改状态
      if (this.deps.length === 0) this.status = 2
      // 模块有依赖, 下载依赖
      if (this.deps.length > 0) this.loadDepModule()
      return this
    }
    loadDepModule () {
      // 下载依赖
      this.deps.forEach(depSrc => {
        // 此依赖的模块正在下载
        if (context.depMap[depSrc]) {
          // 记录该依赖模块的被依赖
          context.depMap[depSrc].push(this.name)
          return
        }
        // 此依赖的模块已经创建
        if (context.globDeps[depSrc]) {
          const moduleExist = context.globDeps[depSrc]
          if (moduleExist.status === 2) {
            // 注入被依赖
            // 记录该依赖模块的被依赖
            moduleExist.beDeps.push(this.name)
            this.depsCount--
          } else if (moduleExist.status === 1) {
            // require模块(匿名模块)应优先于define模块(文件命名模块)
            (new RegExp(context.name)).test(this.name) ? moduleExist.beDeps.unshift(this.name) : moduleExist.beDeps.push(this.name)
            // 深度查询依赖，检查是否存在依赖循环
            const checkRes = context.checkCycle(depSrc, this.name)
            if (checkRes) {
              console.log(`出现了依赖循环...`)
              this.depsCount--
            }
          }
          return
        }

        // 去下载依赖
        context.depMap[depSrc] = [this.name]
        console.log(depSrc);

        this.fetch(depSrc)
      })
    }
    fetch (src) {
      const node = req.createNode()
      node.src = src
      node.setAttribute('data-requirecontext', context.name)
      node.setAttribute('data-requiremodule', src)
      node.addEventListener('load', context.onScriptLoad, false)
      node.addEventListener('error', context.onScriptError, false)
      head.appendChild(node)
    }
    analyzeDep () {
      // 监听模块依赖
      let depsCount = this.depsCount
      Object.defineProperties(this, {
        depsCount: {
          configurable: true,
          get () {
            return depsCount
          },
          set (newDepsCount) {
            // console.info(`我是模块${this.name},depsCount原来是${depsCount},改变为 => ${newDepsCount}`);
            depsCount = newDepsCount
            if (depsCount === 0 && this.status === 1) {
              this.status = 2
            }
          },
        },
      })
    }
    onStatus () {
      // 监听模块状态
      let status = this.status
      Object.defineProperties(this, {
        status: {
          get () {
            return status
          },
          set (newStatus) {
            status = newStatus
            if (newStatus === 2) {
              // 此模块的依赖已加载完成， 执行自己的回调函数
              // 获取依赖返回的参数
              const arg = this.deps.map(depSrc => {
                const dep = context.globDeps[depSrc]
                if (dep) return dep.result
              })
              this.result = this.exec(...arg)
              console.info(`模块${this.name}已加载完成`)
              // 通知依赖此模块的模块，此模块已完成加载
              each(this.beDeps, beDepName => {
                context.globDeps[beDepName].depsCount--
              })
            }
            if (newStatus === 3) {
              return new Error(`模块${this.name}加载出错`)
            }
          },
        },
      })
    }
    exec (...arg) { // 模块加载完成，开始执行自身的回调
      if (typeof this.cb === 'function') {
        return this.cb(...arg)
      }
    }
  }

  // ============================================

  // 全局require方法
  const require = (deps, cb) => {
    if (typeof deps === 'string') {
      return context.require(deps)
    }
    if (typeof deps === 'function') {
      cb = deps
      deps = []
    }
    console.log(deps);
    deps = deps.map(dep => getJsFileName(context.config.baseUrl, dep))

    context.require({deps, cb})
    return require
  }
  const req = global.require = require

  req.config = config => {
    if (config) {
      // 配置
      if (!isArray(config) && typeof deps !== 'string') {
        return context.configure(config)
      }
    }
  }
  req.load = () => {}

  req.nextTick = setTimeout ? fn => setTimeout(fn, 4) : fn => fn()

  req.createNode = function (config, moduleName, url) {
    const node = document.createElement('script')
    node.type = 'text/javascript'
    node.charset = 'utf-8'
    node.async = true
    return node
  }
  // ============================================

  // 全局define方法
  const define = (name, deps, cb) => {
    if (typeof name !== 'string') {
      cb = deps
      deps = name
      name = null
    }

    if (!isArray(deps)) {
      cb = deps
      deps = []
    }
    deps = deps.map(dep => getJsFileName(context.config.baseUrl, dep))
    context.depQueue.push({name, deps, cb})
  }
  global.define = define

  // ============================================

  // 获取require.js的标签, 处理data-main
  req.nextTick(() => {
    each(scripts(), script => {
      const dataMain = script.getAttribute('data-main')
      if (dataMain) {
        const src = dataMain
        // 设置默认的baseUrl
        if (!context.config.baseUrl) {
          context.config.baseUrl = getBaseUrl('', src)
        }
        context.require({deps: [src]})
        return true
      }
    })
  })
})(window || this)
