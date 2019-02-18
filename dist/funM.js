"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

(function (global) {
  var context = {
    config: {}
  };
  var cfg = context.config;

  function isArray(it) {
    return Object.prototype.toString.call(it) === '[object Array]';
  }

  function scripts() {
    return document.getElementsByName('script');
  }

  function eachReverse(ary, func) {
    if (ary) {
      for (var i = ary.length - 1; i > -1; i -= 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  var Module =
  /*#__PURE__*/
  function () {
    function Module(data) {
      _classCallCheck(this, Module);

      var defaultData = {
        id: '',
        // 模块id
        name: '',
        // 模块名称
        src: '',
        // 模块路径
        dep: [],
        // 模块的依赖
        status: '',
        // 模块的状态
        cb: function cb() {},
        error: function error() {}
      };
      if (data) Object.assign(defaultData, data);
      Object.assign(this, defaultData);
    }

    _createClass(Module, [{
      key: "init",
      value: function init() {// 初始化
      }
    }, {
      key: "fetch",
      value: function fetch() {}
    }, {
      key: "analyzeDep",
      value: function analyzeDep() {}
    }, {
      key: "exec",
      value: function exec() {}
    }]);

    return Module;
  }(); // 创建首个Module, 入口即为该Module的依赖


  var firstModule = new Module();

  var require = function require(deps, fun) {
    if (isArray(deps)) {
      firstModule.dep.concat(deps);
    }
  };

  var req = global.require = require;

  req.config = function (config) {
    if (config) {
      if (!isArray(config) && typeof deps !== 'string') {
        // 配置
        cfg = config;
      }
    }
  }; // Figure out baseUrl. Get it from the script tag with require.js in it.


  eachReverse(scripts(), function (script) {
    var src = [];
    var dataMain = script.getAttribute('data-main');

    if (dataMain) {
      var mainScript = dataMain; // 若没有配置baseUrl，则从dataMain中获取

      if (!cfg.baseUrl) {
        src = mainScript.split('/');
        mainScript = src.pop();
        var subPath = src.length ? src.join('/') + '/' : './';
        cfg.baseUrl = subPath;
      } // Put the data-main script in the files to load.


      cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];
      return true;
    }
  });
})(void 0);
//# sourceMappingURL=funM.js.map
