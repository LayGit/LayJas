/**
 * LayLib Core
 * Author: Zhou Jiannan
 * Email: JserLay@gmail.com
 * Thanks: seajs 玉伯
 */
(function(global, undefined){

    // 如果已经存在其他版本的LayLib,则忽略
    if (global.Lay)
        return;

    var Lay = global.Lay = {
        // 当前版本
        version:"1.0.0",

        // 全局共享环境
        Share:{}
    };

    var data = Lay.config = {
        charset:"utf-8"
    };

    /**
     * 包缓存
     * @type {{}}
     */
    var cachedPackages = Lay.cache = {},
        anonymousPkg,
        fetchingList = {},
        fetchedList = {},
        callbackList = {};

    var nsRoute = {};

    /**
     * 类型判断
     */
    function isType(type) {
        return function(obj) {
            return {}.toString.call(obj) == "[object " + type + "]"
        }
    }
    var isObject = Lay.Share.isObject = isType("Object");
    var isString = Lay.Share.isString = isType("String");
    var isArray = Lay.Share.isArray = Array.isArray || isType("Array");
    var isFunction = Lay.Share.isFunction = isType("Function");
    var isWindow = Lay.Share.isWindow = function (obj) { return obj != null && obj == obj.window; };
    var isPlainObject = Lay.Share.isPlainObject = function (obj) { return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype; };
    var likeArray = Lay.Share.likeArray = function (obj) { return typeof obj.length == 'number'; };

    var doc = document,
        head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement,
        baseElement = head.getElementsByTagName("base")[0],
        scripts = doc.scripts;

    // 默认去找ID为LayLib的script标签,速度更快
    var loaderScript = doc.getElementById("LayLib") ||
        scripts[scripts.length - 1];

    // 设置加载器路径
    var loaderDir = getScriptAbsoluteSrc(loaderScript);

    function getScriptAbsoluteSrc(node) {
        return node.hasAttribute ? // non-IE6/7
            node.src :
            // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            node.getAttribute("src", 4);
    }

    function ns2Path(ns)
    {
        var nsPath = ns.split('.')[0];
        return loaderDir.match(/[^?#]*\//)[0] + nsPath + "/" + ns + ".js";
    }

    var IS_CSS_RE = /\.css(?:\?|$)/i,
        currentlyAddingScript,
        interactiveScript;

    // "onload" 事件不支持 WebKit < 535.23 或 Firefox < 9.0
    // ref:
    //  - https://bugs.webkit.org/show_activity.cgi?id=38995
    //  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
    //  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
    var isOldWebKit = +navigator.userAgent
        .replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536;

    function request(url, callback, charset) {
        var isCSS = IS_CSS_RE.test(url),
            node = doc.createElement(isCSS ? "link" : "script");

        if (charset) {
            var cs = isFunction(charset) ? charset(url) : charset;
            if (cs) {
                node.charset = cs;
            }
        }

        addOnload(node, callback, isCSS, url);

        if (isCSS) {
            node.rel = "stylesheet";
            node.href = url;
        }
        else {
            node.async = true;
            node.src = url;
        }

        // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
        // the end of the insert execution, so use `currentlyAddingScript` to
        // hold current node, for deriving url in `define` call
        currentlyAddingScript = node;

        // ref: #185 & http://dev.jquery.com/ticket/2709
        baseElement ?
            head.insertBefore(node, baseElement) :
            head.appendChild(node);

        currentlyAddingScript = null;
    }

    function addOnload(node, callback, isCSS, url) {
        var supportOnload = "onload" in node;

        // for Old WebKit and Old Firefox
        if (isCSS && (isOldWebKit || !supportOnload)) {
            setTimeout(function() {
                pollCss(node, callback);
            }, 1); // Begin after node insertion
            return;
        }

        if (supportOnload) {
            node.onload = onload;
            node.onerror = function() {
                onload();
            }
        }
        else {
            node.onreadystatechange = function() {
                if (/loaded|complete/.test(node.readyState)) {
                    onload();
                }
            }
        }

        function onload() {
            // Ensure only run once and handle memory leak in IE
            node.onload = node.onerror = node.onreadystatechange = null;

            // Remove the script to reduce memory leak
            if (!isCSS && !data.debug) {
                head.removeChild(node);
            }

            // Dereference the node
            node = null;

            callback();
        }
    }

    function pollCss(node, callback) {
        var sheet = node.sheet,
            isLoaded;

        // for WebKit < 536
        if (isOldWebKit) {
            if (sheet) {
                isLoaded = true;
            }
        }
        // for Firefox < 9.0
        else if (sheet) {
            try {
                if (sheet.cssRules) {
                    isLoaded = true;
                }
            } catch (ex) {
                // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
                // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
                // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
                if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
                    isLoaded = true;
                }
            }
        }

        setTimeout(function() {
            if (isLoaded) {
                // Place callback here to give time for style rendering
                callback();
            }
            else {
                pollCss(node, callback);
            }
        }, 20);
    }

    function getCurrentScript() {
        if (currentlyAddingScript) {
            return currentlyAddingScript;
        }

        // For IE6-9 browsers, the script onload event may not fire right
        // after the script is evaluated. Kris Zyp found that it
        // could query the script nodes and the one that is in "interactive"
        // mode indicates the current script
        // ref: http://goo.gl/JHfFW
        if (interactiveScript && interactiveScript.readyState === "interactive") {
            return interactiveScript;
        }

        var scripts = head.getElementsByTagName("script");

        for (var i = scripts.length - 1; i >= 0; i--) {
            var script = scripts[i];
            if (script.readyState === "interactive") {
                interactiveScript = script;
                return interactiveScript;
            }
        }
    }

    var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*(Lay.using|Lay.include)|(?:^|[^$])\b(Lay.using|Lay.include)\s*\(\s*(["'])(.+?)\1\s*\)/g;
    var SLASH_RE = /\\\\/g;

    /**
     * 分析依赖
     * @param code  代码
     * @returns {Array} 依赖列表
     */
    function getDeps(code){
        var ret = [];

        code.replace(SLASH_RE, "")
            .replace(REQUIRE_RE, function(m, m1, m2,m3,m4) {
                if (m4) {

                    // 去掉最后个双引号，正则待优化
                    var path = m4.substr(0, m4.length - 1);
                    if (m2 == "Lay.using")
                    {
                        path = ns2Path(path);
                    }

                    ret.push(path);
                }
            });

        return ret;
    }

    var STATUS = {
        // 1 - 正在加载模块
        FETCHING: 1,
        // 2 - 模块已被保存至cachedMods
        SAVED: 2,
        // 3 - 模块依赖项已加载
        LOADING: 3,
        // 4 - 模块已准备好编译
        LOADED: 4,
        // 5 - 模块正在编译
        EXECUTING: 5,
        // 6 - 模块已编译
        EXECUTED: 6
    };

    var Package = function(url, deps){
        this.namespace = null;
        this.url = url;
        this.dependencies = deps || [];
        this.exports = null;
        this.status = 0;

        // 模块依赖列表
        this._waitings = {}

        // 待加载模块数
        this._remain = 0
    };

    Package.prototype = {
        load:function(){
            var pkg = this;

            // 如果包正在加载了, 等其加载完
            if (pkg.status >= STATUS.LOADING) {
                return;
            }

            pkg.status = STATUS.LOADING;

            var urls = pkg.dependencies;

            var len = pkg._remain = urls.length,
                m;

            for (var i = 0; i < len; i++) {
                m = Package.get(urls[i]);

                if (m.status < STATUS.LOADED) {
                    // Maybe duplicate: When module has duplicate dependency, it should be it's count, not 1
                    m._waitings[pkg.url] = (m._waitings[pkg.url] || 0) + 1;
                }
                else {
                    pkg._remain--;
                }
            }

            if (pkg._remain === 0) {
                pkg.onload();
                return;
            }

            // 开始并行加载
            var requestCache = {};

            for (i = 0; i < len; i++) {
                m = cachedPackages[urls[i]];

                if (m.status < STATUS.FETCHING) {
                    m.fetch(requestCache);
                }
                else if (m.status === STATUS.SAVED) {
                    m.load();
                }
            }

            // 最后发送所有请求，避免在IE6-9中的缓存BUG.
            for (var requestUri in requestCache) {
                if (requestCache.hasOwnProperty(requestUri)) {
                    requestCache[requestUri]();
                }
            }
        },
        onload:function(){
            var pkg = this;
            pkg.status = STATUS.LOADED;

            if (pkg.callback) {
                pkg.callback();
            }

            // 通知依赖的模块,注销onload事件
            var waitings = pkg._waitings,
                url,
                m;

            for (url in waitings) {
                if (waitings.hasOwnProperty(url)) {
                    m = cachedPackages[url];
                    m._remain -= waitings[url];
                    if (m._remain === 0) {
                        m.onload();
                    }
                }
            }

            // 释放内存
            delete pkg._waitings;
            delete pkg._remain;
        },
        fetch:function(requestCache){
            var pkg = this,
                url = pkg.url;

            pkg.status = STATUS.FETCHING;

            var requestUri = url;

            // 如果包还没在加载
            if (!requestUri || fetchedList[requestUri]) {
                pkg.load();
                return;
            }

            // 如果包已经在加载中
            if (fetchingList[requestUri]) {
                callbackList[requestUri].push(pkg);
                return;
            }

            fetchingList[requestUri] = true;
            callbackList[requestUri] = [pkg];

            requestCache ?
                requestCache[requestUri] = sendRequest :
                sendRequest();

            function sendRequest() {
                request(requestUri, onRequest, data.charset);
            }

            function onRequest() {
                delete fetchingList[requestUri];
                fetchedList[requestUri] = true;

                // Save meta data of anonymous module
                if (anonymousPkg) {
                    Package.save(url, anonymousPkg);
                    anonymousPkg = null;
                }

                // Call callbacks
                var m, mods = callbackList[requestUri];
                delete callbackList[requestUri];
                while ((m = mods.shift())) m.load();
            }
        },
        exec:function(){
            var pkg = this;

            // 如果模块已经编译, 不再重复编译. When module
            // 如果模块正在编译，只要返回module.exports，避免循环调用
            if (pkg.status >= STATUS.EXECUTING) {
                return pkg.exports;
            }

            pkg.status = STATUS.EXECUTING;

            // Create using
            var uri = pkg.uri;

            // 注册命名空间
            var ns = global;
            if (pkg.namespace)
                ns = Package.namespace(pkg.namespace);

            // Exec factory
            var factory = pkg.factory;

            var exports = isFunction(factory) ?
                factory.apply(ns, [Lay.Share]) :
                factory;

            // Reduce memory leak
            delete pkg.factory;

            pkg.exports = exports;
            pkg.status = STATUS.EXECUTED;

            return exports;
        }
    };
    Lay.NSCache = {};
    Package.namespace = function(name){
        var topNS = Lay.NSCache;

        //如果name未定义，返回顶级命名空间
        if (!name)
            return topNS;

        //强制转换字符串
        name = String(name);

        var i, ni, len,
            nis = name.split("."),
            ns = topNS;

        for (i = 0, len = nis.length; i < len; i++)
        {
            ni = nis[i];
            ns[ni] = ns[ni] || {};
            ns = ns[nis[i]];
        }

        return ns;
    };

    Package.save = function(url, data){
        var pkg = Package.get(url);

        // 不覆盖已经保存的包
        if (pkg.status < STATUS.SAVED) {
            pkg.namespace = data.ns;
            pkg.url = url;
            pkg.dependencies = data.deps || [];
            pkg.factory = data.factory;
            pkg.status = STATUS.SAVED;
        }
    };

    // 获取一个包或者创建一个新包
    Package.get = function(url, deps) {
        return cachedPackages[url] || (cachedPackages[url] = new Package(url, deps));
    };

    /**
     * 入口启动方法
     * @param url       入口JS
     * @param callback  回调
     */
    Package.run = function(deps, callback, url){
        var pkg = Package.get(url, isArray(deps) ? deps : [deps]);

        pkg.callback = function() {
            var exports = [];
            var uris = pkg.dependencies;

            for (var i = 0, len = uris.length; i < len; i++) {
                exports[i] = cachedPackages[uris[i]].exec();
            }

            if (callback) {
                callback.apply(global, exports);
            }

            delete pkg.callback;
        }

        pkg.load();
    };

    var _cid = 0;
    function cid()
    {
        return _cid++;
    }

    Lay.asyncInclude = function(url, callback){
        Package.run(url, callback, "LayLib_Async_" + cid());
    };

    Lay.asyncUsing = function(ns, callback){
        Package.run(ns2Path(ns), callback, "LayLib_Async_" + cid());
    };

    Lay.asyncCallback = function(url, callback, calcParmName){

        if (isFunction(callback))
        {
            var _calc = callback;
            callback = "LayLib_Async_" + cid();
            window[callback] = _calc;
            delete  _calc;
            _calc = null;
        }

        if (!calcParmName)
            calcParmName = "callback";

        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url + "&" + calcParmName + "=" + callback;
        head.appendChild(script);
    };

    Lay.run = function(url, callback){
        Package.run(url, callback, "LayLib_Run_" + cid());
    };

    /**
     * 创建包
     * @param ns        命名空间
     * @param factory   包体
     */
    Lay.package = function(ns, factory){
        var argsLen = arguments.length;

        // Lay.package(factory)
        if (argsLen == 1)
        {
            factory = ns;
            ns = undefined;
        }

        var deps = null;
        if (isFunction(factory))
        {
            // 找出依赖
            deps = getDeps(factory.toString());
        }

        var script = getCurrentScript(),
            url;

        if (script) {
            url = script.src;
        }

        var pkgData = {
            ns:ns,
            url:nsRoute[ns] || "",
            deps:deps,
            factory:factory
        };

        if (!pkgData.url && doc.attachEvent) {
            var script = getCurrentScript();

            if (script) {
                pkgData.url = script.src;
            }
        }

        pkgData.url ? Package.save(pkgData.url, pkgData) :
            // Save information for "saving" work in the script onload event
            anonymousPkg = pkgData;
    };

    /**
     * 用于引入类库中的JS
     */
    Lay.using = function(ns){

        var pkg = Package.get(ns2Path(ns));
        if (pkg.status < STATUS.EXECUTING) {
            pkg.onload();
            pkg.exec();
        }
        return pkg.exports;
    };

    /**
     * 用于引入当前项目的JS和CSS
     */
    Lay.include = function(url){
        var pkg = Package.get(url);
        if (pkg.status < STATUS.EXECUTING) {
            pkg.onload();
            pkg.exec();
        }
        return pkg.exports;
    };

})(window);