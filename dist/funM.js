"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

(function (global) {
  var readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
  var JsFileName = /(^[./*]*)([^\\:*?"<>|]+)(\.js$)/g;
  var unfileModule = 0; // 非文件模块，计数命名

  var head = document.getElementsByTagName('head')[0];

  function isArray(it) {
    return Object.prototype.toString.call(it) === '[object Array]';
  }

  function scripts() {
    return document.getElementsByTagName('script');
  } // 模块名（绝对路径）


  function getJsFileName(base, src) {
    if (!JsFileName.test(src)) {
      return new Error('模块名不正确，请输入正确的路径');
    }

    var name = src.replace(JsFileName, function (match, $1, $2, $3) {
      return $2 + $3;
    });
    return base + name;
  } // 规范baseUrl


  function getBaseUrl(base, file) {
    if (base) {
      var baseArg = base.split('/');
      return baseArg.length > 0 ? "".concat(baseArg.join('/'), "/") : '';
    }

    if (file) {
      var fileArg = file.split('/');
      fileArg.pop();
      return fileArg.length > 0 ? "".concat(fileArg.join('/'), "/") : '';
    }

    return '';
  }

  function each(ary, func) {
    if (ary) {
      for (var i = 0; i < ary.length; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  function removeListener(node, func, name, ieName) {
    node.removeEventListener(name, func, false);
  }

  function getScriptData(evt) {
    var node = evt.currentTarget || evt.srcElement;
    removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
    removeListener(node, context.onScriptError, 'error');
    return {
      node: node,
      name: node && node.getAttribute('data-requiremodule')
    };
  } // ============================================
  // 模块下载完成和模块加载完成区别：前者表示模块的文件或代码块已经存在本地，但未执行，后者表示模块文件或代码块已经存在到本地,并且开始执行，其依赖也已经全部加载完成
  // 环境类


  var Context =
  /*#__PURE__*/
  function () {
    function Context() {
      _classCallCheck(this, Context);

      this.config = {
        baseUrl: '',
        // baseUrl
        deps: '' // 前置模块(require被定义后，这些依赖就已进行加载,而不用手动require.它并不堵塞后续的requrie([]))

      };
      this.name = '_@';
      this.globDeps = {}; // 当前环境下的全局依赖列表 （{name: Module}）

      this.depQueue = []; // 模块下载队列

      this.depMap = {};
    } // 初始化配置


    _createClass(Context, [{
      key: "configure",
      value: function configure(cfg) {
        this.config = _objectSpread({}, cfg); // baseUrl

        this.config.baseUrl = getBaseUrl(this.config.baseUrl);

        if (this.config.deps) {
          context.require({
            deps: _toConsumableArray(this.config.deps)
          });
        }

        return this.config;
      }
      /**
       * @param {*} data 模块的信息
       */

    }, {
      key: "require",
      value: function require(data) {
        if (!data) return; // 使用已经加载的模块

        if (typeof data === 'string') {
          if (context.globDeps[data]) {
            return context.globDeps[data].result;
          }

          return new Error("\u6A21\u5757".concat(data, "\u672A\u52A0\u8F7D: \u4F7F\u7528requrie([])\u5148\u52A0\u8F7D"));
        } // 加载文件模块


        if (typeof data.name === 'string' || typeof data.src === 'string') {
          var name = data.name || data.src;
          var src = name;
          data = _objectSpread({}, data, {
            name: name,
            src: src
          });
        } // 本地模块


        if (typeof data.name === 'undefined') {
          var _name = "".concat(context.name).concat(unfileModule++);

          data = _objectSpread({}, data, {
            name: _name
          });
        } // 创建模块


        var module = new Module(data);
        context.globDeps[data.name] = module;
        module.init();
        return module;
      }
    }, {
      key: "completeLoad",
      value: function completeLoad(moduleName) {
        var args, found;

        while (this.depQueue.length > 0) {
          args = this.depQueue.shift();

          if (args.name === null) {
            args.name = moduleName;
            found = true;
          } else if (args.name === moduleName) {
            found = true;
          }

          if (this.depMap[moduleName]) {
            args.beDeps = _toConsumableArray(this.depMap[moduleName]);
            delete this.depMap[moduleName];
          }

          this.require(args);
        }

        if (!found) {
          return new Error("define\u6A21\u5757".concat(moduleName, "\u672A\u627E\u5230"));
        }
      }
      /**
       * 检查循环依赖
       * 若依赖的模块的依赖关系中有自身模块，则先执行自身模块
       * @param {checked：深度检查的模块，glob: 当前模块}
       */

    }, {
      key: "checkCycle",
      value: function checkCycle(child, parent) {
        var _this = this;

        var deps = context.globDeps[child].deps;
        return deps.some(function (dep) {
          if (dep === parent) {
            return true;
          } // 若child的依赖以及加载但状态为1，则需要检查该依赖模块的依赖是否有parent


          if (context.globDeps[dep] && context.globDeps[dep].status === 1) {
            return _this.checkCycle(deps, parent);
          }
        });
      }
    }, {
      key: "onScriptLoad",
      value: function onScriptLoad(evt) {
        if (evt.type === 'load' || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
          var data = getScriptData(evt);
          context.completeLoad(data.name);
        }
      }
    }, {
      key: "onScriptError",
      value: function onScriptError() {}
    }]);

    return Context;
  }();

  var context = new Context(); // ============================================
  // 模块类

  var Module =
  /*#__PURE__*/
  function () {
    function Module(data) {
      _classCallCheck(this, Module);

      var defaultData = {
        name: '',
        // 模块名称
        src: '',
        // 模块路径
        deps: [],
        // 模块的依赖([...name])
        beDeps: [],
        // 被依赖的模块
        depsCount: 0,
        // 未加载的依赖数量
        status: 1,
        // 1.加载中，2.已加载，3.加载出错）
        cb: function cb() {},
        // 加载成功的回调
        result: undefined,
        // 模块的回调返回值
        error: function error() {} // 加载失败的回调

      };
      if (data) Object.assign(defaultData, data);
      Object.assign(this, defaultData);
    }

    _createClass(Module, [{
      key: "init",
      value: function init() {
        void 0;
        this.depsCount = this.deps.length; // 监听模块状态

        this.onStatus(); // 监听依赖加载

        this.analyzeDep(); // 模块无依赖，修改状态

        if (this.deps.length === 0) this.status = 2; // 模块有依赖, 下载依赖

        if (this.deps.length > 0) this.loadDepModule();
        return this;
      }
    }, {
      key: "loadDepModule",
      value: function loadDepModule() {
        var _this2 = this;

        // 下载依赖
        this.deps.forEach(function (depSrc) {
          // 此依赖的模块正在下载
          if (context.depMap[depSrc]) {
            // 记录该依赖模块的被依赖
            context.depMap[depSrc].push(_this2.name);
            return;
          } // 此依赖的模块已经创建


          if (context.globDeps[depSrc]) {
            var moduleExist = context.globDeps[depSrc];

            if (moduleExist.status === 2) {
              // 注入被依赖
              // 记录该依赖模块的被依赖
              moduleExist.beDeps.push(_this2.name);
              _this2.depsCount--;
            } else if (moduleExist.status === 1) {
              // require模块(系统命名)应优先于define模块(自命名)
              new RegExp(context.name).test(_this2.name) ? moduleExist.beDeps.unshift(_this2.name) : moduleExist.beDeps.push(_this2.name); // 深度查询依赖，检查是否存在依赖循环

              var checkRes = context.checkCycle(depSrc, _this2.name);

              if (checkRes) {
                void 0;
                _this2.depsCount--;
              }
            }

            return;
          } // 去下载依赖


          context.depMap[depSrc] = [_this2.name];
          void 0;

          _this2.fetch(depSrc);
        });
      }
    }, {
      key: "fetch",
      value: function fetch(src) {
        var node = req.createNode();
        node.src = src;
        node.setAttribute('data-requirecontext', context.name);
        node.setAttribute('data-requiremodule', src);
        node.addEventListener('load', context.onScriptLoad, false);
        node.addEventListener('error', context.onScriptError, false);
        head.appendChild(node);
      }
    }, {
      key: "analyzeDep",
      value: function analyzeDep() {
        // 监听模块依赖
        var depsCount = this.depsCount;
        Object.defineProperties(this, {
          depsCount: {
            configurable: true,
            get: function get() {
              return depsCount;
            },
            set: function set(newDepsCount) {
              // console.info(`我是模块${this.name},depsCount原来是${depsCount},改变为 => ${newDepsCount}`);
              depsCount = newDepsCount;

              if (depsCount === 0 && this.status === 1) {
                this.status = 2;
              }
            }
          }
        });
      }
    }, {
      key: "onStatus",
      value: function onStatus() {
        // 监听模块状态
        var status = this.status;
        Object.defineProperties(this, {
          status: {
            get: function get() {
              return status;
            },
            set: function set(newStatus) {
              status = newStatus;

              if (newStatus === 2) {
                // 此模块的依赖已加载完成， 执行自己的回调函数
                // 获取依赖返回的参数
                var arg = this.deps.map(function (depSrc) {
                  var dep = context.globDeps[depSrc];
                  if (dep) return dep.result;
                });
                this.result = this.exec.apply(this, _toConsumableArray(arg));
                void 0; // 通知依赖此模块的模块，此模块已完成加载

                each(this.beDeps, function (beDepName) {
                  context.globDeps[beDepName].depsCount--;
                });
              }

              if (newStatus === 3) {
                return new Error("\u6A21\u5757".concat(this.name, "\u52A0\u8F7D\u51FA\u9519"));
              }
            }
          }
        });
      }
    }, {
      key: "exec",
      value: function exec() {
        // 模块加载完成，开始执行自身的回调
        if (typeof this.cb === 'function') {
          return this.cb.apply(this, arguments);
        }
      }
    }]);

    return Module;
  }(); // ============================================
  // 全局require方法


  var require = function require(deps, cb) {
    if (typeof deps === 'string') {
      return context.require(deps);
    }

    if (typeof deps === 'function') {
      cb = deps;
      deps = [];
    }

    void 0;
    deps = deps.map(function (dep) {
      return getJsFileName(context.config.baseUrl, dep);
    });

    context.require({
      deps: deps,
      cb: cb
    });

    return require;
  };

  var req = global.require = require;

  req.config = function (config) {
    if (config) {
      // 配置
      if (!isArray(config) && typeof deps !== 'string') {
        return context.configure(config);
      }
    }
  };

  req.load = function () {};

  req.nextTick = setTimeout ? function (fn) {
    return setTimeout(fn, 4);
  } : function (fn) {
    return fn();
  };

  req.createNode = function (config, moduleName, url) {
    var node = document.createElement('script');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    return node;
  }; // ============================================
  // 全局define方法


  var define = function define(name, deps, cb) {
    if (typeof name !== 'string') {
      cb = deps;
      deps = name;
      name = null;
    }

    if (!isArray(deps)) {
      cb = deps;
      deps = [];
    }

    deps = deps.map(function (dep) {
      return getJsFileName(context.config.baseUrl, dep);
    }); // 检查是否已加载

    context.depQueue.push({
      name: name,
      deps: deps,
      cb: cb
    }); // }
  };

  global.define = define; // ============================================
  // 获取require.js的标签, 处理data-main

  req.nextTick(function () {
    each(scripts(), function (script) {
      var dataMain = script.getAttribute('data-main');

      if (dataMain) {
        var src = dataMain; // 设置默认的baseUrl

        if (!context.config.baseUrl) {
          context.config.baseUrl = getBaseUrl('', src);
        }

        context.require({
          deps: [src]
        });

        return true;
      }
    });
  });
})(window || void 0);