Lay.package("AL.Device", function(){
    var $N = {},
        $Geo = Lay.using("LL.Location.Geo"),
        $LocCache = Lay.using("LL.Location.Cache");

    /**
     * Web定位
     * @param callback      定位回调
     * @param cacheEnabled  是否启用定位缓存
     * @param forceUpdate   是否强制更新定位
     */
    $N.locate = function(callback, cacheEnabled, forceUpdate){
        var success = function(p){
                callback(0, {point:p}, "GPS定位正常");
            },
            error = function(err){
                callback(err.code, {point:null}, err.msg);
            };
        if (cacheEnabled)
        {
            if (forceUpdate)
                $LocCache.reLocate(success, error);
            else
                $LocCache.getPoint(success, error);
        }
        else
        {
            $Geo.locate(success, error);
        }
    };

    this.None = $N;
    return $N;
});