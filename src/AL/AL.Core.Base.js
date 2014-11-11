Lay.package("AL.Core", function(){
    var $Detector = Lay.using("LL.Util.Detector"),
        $Cookie = Lay.using("LL.Data.Cookie"),
        $DL = Lay.using("AL.Const.DeviceList");

    var $B = {
        inApp: false
    };

    // 检测是否在APP中
    var source = $Cookie.get("s");
    if (source == "app")
        $B.inApp = true;
    else if (location.protocol == "file:")
    {
        $B.inApp = true;
    }

    // 载入对应系统支持包
    var deviceName = $Detector.device.name,
        deviceNameSpace = "None";
    if ($B.inApp)
    {
        switch (deviceName)
        {
            case $DL.IPHONE.key:
                // 需要iphone支持包
                deviceNameSpace = "IPhone";
                break;
            case $DL.IPAD.key:
                // 需要iPad支持包
                deviceNameSpace = "IPad";
                break;
            case $DL.ANDROID.key:
                // 需要android支持包
                deviceNameSpace = "Android";
                break;
            case $DL.WP.key:
                // 需要windows phone支持包
                deviceNameSpace = "WinPhone";
                break;
        }
    }
    Lay.asyncUsing("AL.Device." + deviceNameSpace);

    // 按需加载所需的支持包,确保支持包已经载入完成
    function asyncNS(callback){
        Lay.asyncUsing("AL.Device." + deviceNameSpace, function(dev){
            callback(dev);
        });
    }

    /**
     * 定位
     * @param callback  定位回调
     * @param cacheEnabled  是否启用定位缓存
     * @param forceUpdate   是否强制刷新定位
     */
    $B.locate = function(callback, cacheEnabled, forceUpdate){
        asyncNS(function(dev){
            cacheEnabled = cacheEnabled || false;
            forceUpdate = forceUpdate || false;
            dev.locate(callback, cacheEnabled, forceUpdate);
        });
    };

    /**
     * 跳转URL
     * @param url       URL地址
     * @param target    方式
     */
    $B.navigate = function(url, target){
        asyncNS(function(dev){
            dev.navigate(url, target);
        });
    };

    /**
     * 调用接口
     * @param inf       接口
     * @param param     参数
     * @param success  成功回调
     * @param error     错误回调
     */
    $B.request = function(inf, param, success, error){
        asyncNS(function(dev){
            dev.request(inf, param, success, error);
        });
    };

    /**
     * 返回上一个页面
     */
    $B.back = function(){
        asyncNS(function(dev){
            dev.back();
        });
    };

    /**
     * 拍照
     * @param finished  完成回调
     * @param canceled  取消回调
     */
    $B.camera = function(finished, canceled){
        asyncNS(function(dev){
            dev.camera(finished, canceled);
        });
    };

    /**
     * 二维码扫描
     * @param finished  完成回调
     * @param canceled  取消回调
     */
    $B.scan = function(finished, canceled){
        asyncNS(function(dev){
            dev.scan(finished, canceled);
        });
    };

    this.Base = $B;
    return $B;
});