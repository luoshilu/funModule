
(global => {
  // const suffixJsReg = /.+\.js$/g
  // const JsNameReg = /\.*\/.\.js$/g
  const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/
  const JsFileName = /(^[./*]*)([^\\:*?"<>|]+)(\.js$)/g
  let unfileModule = 0 // 非文件模块，计数命名
  let currentlyAddingScript
  const head = document.getElementsByTagName('head')[0]

  function isArray (it) {
    return Object.prototype.toString.call(it) === '[object Array]'
  }
  function scripts () {
    return document.getElementsByTagName('script')
  }
  // 模块名（文件的相对路径，./a.js需转为a.js,./b/c.js转为成 b/c.js）
  function getJsFileName (src) {
    if (!JsFileName.test(src)) {
      return new Error('模块名不正确，请输入正确的路径')
    }
    return src.replace(JsFileName, (match, $1, $2, $3) => $2 + $3)
  }
  // 模块文件路径
  function getJsFileSrc (base, src) {
    if (!base) return src
    return base + src
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
  // function eachReverse (ary, func) {
  //   if (ary) {
  //     for (let i = ary.length - 1; i > -1; i -= 1) {
  //       if (ary[i] && func(ary[i], i, ary)) {
  //         break
  //       }
  //     }
  //   }
  // }
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
        deps: '', // 前置模块(require被定义后，这些依赖就已进行加载,而不用手动require.它并不堵塞后续的requrie([]))
      }
      this.name = '_@'
      this.globDeps = {} // 当前环境下的全局依赖列表 （{name: Module}）
    }
    loadModule (deps, fun) { // 下载模块

    }
    on () {
      // 监听依赖队列

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
     * @param {*} data 模块的信息
     */
    require (data) {
      if (!data) return
      // 使用已经加载的模块
      if (typeof data === 'string') {
        if (context.globDeps[data]) {
          return context.globDeps[data].result
        }
        return new Error(`模块${data}未加载: 使用requrie([])`)
      }

      // 加载文件模块
      if (typeof data.name === 'string' || typeof data.src === 'string') {
        let name = data.name || data.src
        name = getJsFileName(name)
        const src = getJsFileSrc(this.config.baseUrl, name)

        // 该命名模块已加载
        if (this.globDeps[name]) {
          const parentModuleName = data.beDeps[0]

          // 记录依赖关系，新增被依赖
          this.globDeps[name].beDeps = [...this.globDeps[name].beDeps, ...data.beDeps]
          // console.log(this.globDeps[name]);
          // 通知父模块，该模块已在下载 (注册依赖关系发生在模块加载完成之前，则不同再通知，因为模块加载完成后会自动通知. 否则，则需要手动通知)
          if (this.globDeps[name].status === 2) {
            this.globDeps[parentModuleName].depsCount--
          }
          return this.globDeps[name]
        }

        data = {...data, name, src}
      }
      // 本地模块
      if (typeof data.name === 'undefined') {
        const name = `${context.name}${unfileModule++}`
        data = {...data, name, status: 1}
      }
      return (new Module(data)).init()
    }
    completeLoad (name) {
      // this.globDeps[name]
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
  const cfg = context.config

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
        status: 0, // 0.未下载 1.加载中，2.已加载，3.加载出错）
        cb: () => {}, // 加载成功的回调
        result: undefined, // 模块的回调返回值
        error: () => {}, // 加载失败的回调
      }
      if (data) Object.assign(defaultData, data)
      Object.assign(this, defaultData)
    }
    init () {
      console.log(this);
      this.depsCount = this.deps.length

      // 监听模块状态
      this.onStatus()
      // 监听依赖加载
      this.analyzeDep()

      context.globDeps[this.name] = this
      // 模块未下载
      if (this.status === 0) this.fetch(this.src)

      if (this.status === 1) {
        // 模块已下载且无依赖，代表已加载
        if (this.deps.length === 0) this.status = 2
        // 模块有依赖, 加载其依赖
        if (this.deps.length > 0) this.createDepModule()
      }
      return this
    }
    createDepModule () {
      // 创建依赖模块
      each(this.deps, depName => {
        // console.log({name: depName, beDeps: [this.name]});
        context.require({name: depName, beDeps: [this.name]})
      })
    }
    fetch (src) {
      const node = req.createNode()
      node.src = src
      node.setAttribute('data-requirecontext', context.contextName)
      node.setAttribute('data-requiremodule', this.name)
      node.addEventListener('load', context.onScriptLoad, false)
      node.addEventListener('error', context.onScriptError, false)
      currentlyAddingScript = node
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
            if (depsCount > 0 && this.status === 1) {
              this.createDepModule()
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
            if (newStatus === 1) {
              if (isArray(this.deps)) {
                const length = this.deps.length
                if (length > 0) {
                  this.depsCount = length
                  return
                }
              }
              this.status = 2
            }
            if (newStatus === 2) {
              // 此模块的依赖已加载

              // 执行回调函数
              const arg = this.deps.map(depSrc => {
                const dep = context.globDeps[getJsFileName(depSrc)]
                if (dep) return dep.result
              })
              this.result = this.exec(...arg)
              // console.info(`模块${this.name}的依赖已加载完成`)
              // 通知依赖此模块的模块，该模块已完成加载
              each(context.globDeps[this.name].beDeps, beDepName => {
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
    exec (arg) { // 模块加载完成，开始执行自身的回调
      if (typeof this.cb === 'function') {
        return this.cb(...[arg])
      }
    }
  }

  // ============================================

  // 全局require方法
  const require = (deps, cb) => {
    context.require({deps, cb, status: 1})
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
  const define = (deps, cb) => {
    if (!isArray(deps)) {
      cb = deps
      deps = []
    }
    let name
    if (currentlyAddingScript) {
      name = currentlyAddingScript.getAttribute('data-requiremodule')
    }
    const module = context.globDeps[name]
    if (module) {
      Object.assign(module, {deps, cb, status: 1})
    } else {
      return new Error(`找不到引入该依赖的模板`)
    }
  }
  global.define = define

  // ============================================

  // require的设置入口的两种方式
  // 1. 通过标签属性data-main指定
  // 2. require()调用

  // 获取require.js的标签, 处理data-main
  req.nextTick(() => {
    each(scripts(), script => {
      const dataMain = script.getAttribute('data-main')
      if (dataMain) {
        let src = dataMain
        // 设置默认的baseUrl
        if (!cfg.baseUrl) {
          cfg.baseUrl = getBaseUrl('', src)
        }
        src = src.replace(cfg.baseUrl, '')
        context.require({deps: [src]})
        return true
      }
    })
  })
})(this)
