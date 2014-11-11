Lay.package("AL.Device", function(){
    var $C = Lay.using("LL.Util.Convert");

    var $A = {},
        fIndex = 0;

    var methodNames = {
        Locate:"getLocation"
    };

    $A.locate = function(calc, cacheEnabled, forceUpdate){
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

        window.android[method](params, calcName);
    }

    function genCalcName()
    {
        fIndex++;
        return "__acCalc_" + getRandomNum(0, 10) + "_" + fIndex;
    }

    function bind(name, func)
    {
        window[name] = func;
    }

    function unbind(name)
    {
        delete  window[name];
    }

    this.Android = $A;
    return $A;
});