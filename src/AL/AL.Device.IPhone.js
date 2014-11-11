Lay.package("AL.Device", function(){
    var $C = Lay.using("LL.Util.Convert");

    var $I = {},
        fIndex = 0;

    var methodNames = {
        Locate:"getLocation"
    };

    $I.locate = function(calc, cacheEnabled, forceUpdate){
        invoke(methodNames.Locate, {cacheEnabled:cacheEnabled, forceUpdate:forceUpdate}, calc);
    };

    function invoke(method, params, callback)
    {
        params = $C.toString(params);

        var calcName = genCalcName();

        bind(calcName, function(data, code, msg){
            if (callback)
                callback(data, code, msg);
            unbind(calcName);
        });

        var req = {
            method:method,
            params:params,
            callback:calcName
        }
        document.location = "cltapp://" + $C.toString(req);
    }

    function genCalcName()
    {
        fIndex++;
        return "__icCalc_" + getRandomNum(0, 10) + "_" + fIndex;
    }

    function getRandomNum(Min,Max)
    {
        var Range = Max - Min;
        var Rand = Math.random();
        return(Min + Math.round(Rand * Range));
    }

    function bind(name, func)
    {
        window[name] = func;
    }

    function unbind(name)
    {
        delete  window[name];
    }

    this.IPhone = $I;
    return $I;
});