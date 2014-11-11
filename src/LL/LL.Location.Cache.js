Lay.package("LL.Location", function(){
    var $C = {},
        keyOfCookie = "LayLib_LocationCache_Point",
        $G = Lay.using("LL.Location.Geo"),
        $Convert = Lay.using("LL.Util.Convert"),
        $Cookie = Lay.using("LL.Data.Cookie");

    /**
     * 获取缓存位置
     * @param success  获取成功回调
     * @param error    获取失败回调
     */
    function get(success, error)
    {
        // 判断是否有缓存位置
        var cachePoint = $Cookie.get(keyOfCookie);
        if(cachePoint)
        {
            success($Convert.toObject(cachePoint));
        }
        else
        {
            renew(success, error);
        }
    }

    /**
     * 重新定位
     * @param success   定位成功回调
     * @param error     定位失败回调
     */
    function renew(success, error)
    {
        clear();
        $G.locate(function(pos){
            $Cookie.set(keyOfCookie, $Convert.toString(pos));
            success(pos);
        }, error);
    }

    /**
     * 清除缓存位置
     */
    function clear()
    {
        $Cookie.remove(keyOfCookie);
    }

    $C.getPoint = get;
    $C.reLocate = renew;
    $C.clear = clear;

    this.Cache = $C;
    return $C;
});