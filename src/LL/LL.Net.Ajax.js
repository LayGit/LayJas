Lay.package("LL.Net", function (L)
{
    var $A = {},
        jsonpID = 0,
        document = window.document,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html';

    function each(elements, callback)
    {
        var i, key;
        if (L.likeArray(elements))
        {
            for (i = 0; i < elements.length; i++)
            {
                if (callback.call(elements[i], i, elements[i]) === false)
                    return elements;
            }
        }
        else
        {
            for (key in elements)
            {
                if (callback.call(elements[key], key, elements[key]) === false)
                    return elements;
            }
        }

        return elements;
    }

    function appendQuery(url, query)
    {
        if (query == '')
            return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    }

    function serializeData(options)
    {
        if (options.processData && options.data && L.type(options.data) != "string")
            options.data = paramFormat(options.data, options.traditional);

        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
        {
            options.url = appendQuery(options.url, options.data);
            options.data = undefined;
        }
    }

    function serialize(params, obj, traditional, scope)
    {
        var type,
            array = L.isArray(obj),
            hash = L.isPlainObject(obj);

        each(obj, function (key, value)
        {
            type = L.type(value);

            if (scope)
                key = traditional ? scope : scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';

            if (!scope && array)
                params.add(value.name, value.value)

            else if (type == "array" || (!traditional && type == "object"))
                serialize(params, value, traditional, key);
            else
                params.add(key, value);
        });
    }

    function paramFormat(obj, traditional)
    {
        var params = [];
        params.add = function (k, v)
        {
            this.push(escape(k) + '=' + escape(v))
        };
        serialize(params, obj, traditional)
        return params.join('&').replace(/%20/g, '+');
    }

    // MIME 转 DataType
    function mimeToDataType(mime)
    {
        if (mime)
            mime = mime.split(';', 2)[0];
        return mime && (mime == htmlType ? 'html' :
            mime == jsonType ? 'json' :
                scriptTypeRE.test(mime) ? 'script' :
                    xmlTypeRE.test(mime) && 'xml') || 'text';
    }

    // 为get和post快速请求创建标准化参数
    function parseArguments(url, data, success, dataType)
    {
        if (L.isFunction(data))
        {
            dataType = success;
            success = data;
            data = undefined;
        }

        if (!L.isFunction(success))
        {
            dataType = success;
            success = undefined;
        }
        return { url: url, data: data, success: success, dataType: dataType };
    }

    function empty() { };

    // 请求开始（发送前之前）
    function ajaxStart(settings)
    {
        // 全局事件广播
    }

    // 请求结束（完成之后）
    function ajaxStop(settings)
    {
        //全局事件广播
    }

    // 请求发送前
    function ajaxBeforeSend(xhr, settings)
    {
        return settings.beforeSend.call(settings.context, xhr, settings);
    }

    // 请求成功
    function ajaxSuccess(data, xhr, settings)
    {
        var status = 'success',
            context = settings.context;
        settings.success.call(settings.context, data, status, xhr);

        // 同时调用请求完成回调
        ajaxComplete(status, xhr, settings);
    }

    // 请求失败
    function ajaxError(error, type, xhr, settings)
    {
        // 错误类型有：
        // timeout      请求超时
        // error        请求错误
        // abort        取消请求
        // parsererror  转换错误
        settings.error.call(settings.context, xhr, type, error);

        //同时调用请求完成回调
        ajaxComplete(type, xhr, settings);
    }

    //请求完成
    function ajaxComplete(status, xhr, settings)
    {
        //完成状态有：
        // success      请求成功
        // notmodified  原封缓存
        // timeout      请求超时
        // error        请求错误
        // abort        取消请求
        // parsererror  转换错误
        settings.complete.call(settings.context, xhr, status);

        //同时调用请求结束回调
        ajaxStop(settings);
    }

    $A.settings = {
        // 请求类型 POST/GET
        type: 'GET',
        // 发送请求前回调
        beforeSend: empty,
        // 请求成功时回调
        success: empty,
        // 请求失败时回调
        error: empty,
        // 请求完成时回调
        complete: empty,
        // 回调函数上下文
        context: null,
        // 请求对象
        xhr: function ()
        {
            return new window.XMLHttpRequest()
        },
        // MIME 类型
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // 是否跨域请求
        crossDomain: false,
        // 请求超时时间
        timeout: 0,
        // 是否将数据转换为string
        processData: true,
        // 是否缓存GET请求
        cache: true
    };

    // JSONP跨域请求
    function jsonp(options)
    {
        if (!('type' in options))
            return request(options);

        var _callbackName = options.jsonpCallback,
            callbackName = (L.isFunction(_callbackName) ?
                _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            xhr = { abort: function () { } },
            abortTimeout;

        // JS载入完成
        script.addEventListener("load", function (e, errorType)
        {
            clearTimeout(abortTimeout);

            // 注销事件
            script.removeEventListener("load", arguments.callee);

            if (e.type == 'error' || !responseData)
            {
                ajaxError(null, errorType || 'error', xhr, options)
            } else
            {
                ajaxSuccess(responseData[0], xhr, options)
            }

            window[callbackName] = originalCallback;

            if (responseData && L.isFunction(originalCallback))
                originalCallback(responseData[0]);

            originalCallback = responseData = undefined;

        }, false);

        if (ajaxBeforeSend(xhr, options) === false)
        {
            xhr.abort();
            ajaxError(null, 'abort', xhr, options);
            return xhr;
        }

        // 获取返回数据
        window[callbackName] = function ()
        {
            responseData = arguments;
        }

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);

        //超时
        if (options.timeout > 0)
        {
            abortTimeout = setTimeout(function ()
            {
                ajaxError(null, 'timeout', xhr, options);
            }, options.timeout);
        }

        return xhr;
    }

    function request(options)
    {
        /// <summary>
        /// Ajax请求
        /// </summary>
        /// <param name="options" type="String">请求参数</param>
        /// <returns type="Object">Ajax请求对象</returns>

        var settings = options || {};

        // 合并全局设置和选项
        for (var key in $A.settings)
        {
            if (typeof settings[key] === 'undefined')
            {
                settings[key] = $A.settings[key];
            }
        }

        // 准备开始请求
        ajaxStart();

        // 跨域检测
        if (!settings.crossDomain)
            settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host;

        // 如果请求url为空,则默认为当前URL
        if (!settings.url)
            settings.url = window.location.toString();

        // 请求数据转换
        serializeData(settings);

        // 如果不缓存GET请求,给URL加上时间戳
        if (settings.cache === false)
            settings.url = appendQuery(settings.url, '_=' + Date.now());

        var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url);

        // 验证是否jsonp请求,同时判断是否有回调函数名
        if (dataType == 'jsonp' || hasPlaceholder)
        {
            if (!hasPlaceholder)
                settings.url = appendQuery(settings.url, settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?');
            return jsonp(settings);
        }

        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function (name, value) { headers[name.toLowerCase()] = [name, value] },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout;

        // 请求头设置
        if (!settings.crossDomain)
            setHeader('X-Requested-With', 'XMLHttpRequest');
        setHeader('Accept', mime || '*/*');

        if (mime = settings.mimeType || mime)
        {
            if (mime.indexOf(',') > -1)
                mime = mime.split(',', 2)[0];
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }

        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');

        if (settings.headers)
        {
            for (name in settings.headers)
                setHeader(name, settings.headers[name]);
            xhr.setRequestHeader = setHeader;
        }

        // 设置请求
        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState == 4)
            {
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout);
                var result, error = false;
                //根据状态来判断请求是否成功
                //状态>=200 && < 300 表示成功
                //状态 == 304 表示文件未改动过，也可认为成功
                //如果是取要本地文件那也可以认为是成功的，xhr.status == 0是在直接打开页面时发生请求时出现的状态，也就是不是用localhost的形式访问的页面的情况
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:'))
                {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
                    result = xhr.responseText;

                    try
                    {
                        // 如果是js,取得运行后的结果
                        if (dataType == 'script')
                            (1, eval)(result);
                        else if (dataType == 'xml')
                            result = xhr.responseXML;
                        else if (dataType == 'json')
                            result = /^\s*$/.test(result) ? null : JSON.parse(result);
                    } catch (e) { error = e }

                    if (error)
                        ajaxError(error, 'parsererror', xhr, settings);
                    else
                        ajaxSuccess(result, xhr, settings);
                } else
                {
                    ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings);
                }
            }
        }

        // 请求前回调返回false可以取消请求
        if (ajaxBeforeSend(xhr, settings) === false)
        {
            xhr.abort();
            ajaxError(null, 'abort', xhr, settings);
            return xhr;
        }

        if (settings.xhrFields)
        {
            for (name in settings.xhrFields)
                xhr[name] = settings.xhrFields[name];
        }

        // 建立请求
        var async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async, settings.username, settings.password);

        for (name in headers)
            nativeSetHeader.apply(xhr, headers[name]);

        // 超时计时器
        if (settings.timeout > 0)
        {
            abortTimeout = setTimeout(function ()
            {
                xhr.onreadystatechange = empty;
                xhr.abort();
                ajaxError(null, 'timeout', xhr, settings);
            }, settings.timeout);
        }

        // 发送请求
        xhr.send(settings.data ? settings.data : null);

        return xhr;
    }

    function get(url, data, success, dataType)
    {
        /// <summary>
        /// Get请求
        /// </summary>
        /// <param name="url" type="String">Url</param>
        /// <param name="data" type="Object">请求参数</param>
        /// <param name="success" type="Function">请求成功回调</param>
        /// <param name="dataType" type="String">请求数据类型</param>
        /// <returns type="Object">Ajax请求对象</returns>

        var options = parseArguments(url, data, success, dataType);
        return request(options);
    }

    function post(url, data, success, dataType)
    {
        /// <summary>
        /// Post请求
        /// </summary>
        /// <param name="url" type="String">Url</param>
        /// <param name="data" type="Object">请求参数</param>
        /// <param name="success" type="Function">请求成功回调</param>
        /// <param name="dataType" type="String">请求数据类型</param>
        /// <returns type="Object">Ajax请求对象</returns>

        var options = parseArguments(url, data, success, dataType);
        options.type = 'POST';
        return request(options);
    }

    function cross(url, data, success)
    {
        /// <summary>
        /// 跨域请求（JSONP）
        /// </summary>
        /// <param name="url" type="String">Url</param>
        /// <param name="data" type="Object">请求参数</param>
        /// <param name="success" type="Function">请求成功回调</param>
        /// <returns type="Object">Ajax请求对象</returns>

        var options = parseArguments(url, data, success);
        options.dataType = 'jsonp';
        return request(options);
    }

    function getJSON(url, data, success)
    {
        /// <summary>
        /// Get请求Json
        /// </summary>
        /// <param name="url" type="String">Url</param>
        /// <param name="data" type="Object">请求参数</param>
        /// <param name="success" type="Function">请求成功回调</param>
        /// <returns type="Object">Ajax请求对象</returns>

        var options = parseArguments(url, data, success);
        options.dataType = 'json';
        return request(options);
    }

    $A.request = request;
    $A.get = get;
    $A.post = post;
    $A.getjson = getJSON;
    $A.jsonp = cross;
    this.Ajax = $A;
    return this;
});