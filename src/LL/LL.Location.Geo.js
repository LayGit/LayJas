Lay.package("LL.Location", function(){
    var $G = {};

    function locate(success, error)
    {
        if (navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(function (pos)
            {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;

                var point = mapFix(lat, lng, false);
                success(point);
            }, function (err)
            {
                //error(err);
                var msg = "未知错误",
                    code = -1;
                switch (error.code)
                {
                    case error.TIMEOUT:
                        msg = "定位超时";
                        code = 102;
                        break;
                    case error.PERMISSION_DENIED:
                        msg = "用户未同意定位";
                        code = 103;
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "无法获取位置";
                        code = 104;
                        break;
                }
                err({
                    code:code,
                    msg:msg
                });
            }, {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000
            });
        }
        else
        {
            error({code:101, msg:"不支持定位"});
        }
    }

    /**
     <func name="mapFix">GPS坐标修正后转百度坐标</func>
     <parm name="lat" type="Float">纬度</parm>
     <parm name="lng" type="Float">精度</parm>
     <return type="Object" struct="{lat,lng}">百度坐标经纬度</return>
     **/
    function mapFix(lat, lng, isGG)
    {
        var pi = 3.14159265358979324;
        var a = 6378245.0;
        var ee = 0.00669342162296594323;
        var x_pi = 3.14159265358979324 * 3000.0 / 180.0;

        function transform(wgLat, wgLon)
        {
            var objPos = new Object();
            //如果在国外不纠偏
            if (outOfChina(wgLat, wgLon))
            {
                objPos.lat = wgLat;
                objPos.lng = wgLon;
            }
            var dLat = transformLat(wgLon - 105.0, wgLat - 35.0);
            var dLon = transformLon(wgLon - 105.0, wgLat - 35.0);
            var radLat = wgLat / 180.0 * pi;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
            objPos.lat = wgLat + dLat;
            objPos.lng = wgLon + dLon;

            return objPos;
        }

        function outOfChina(lat, lon)
        {
            if (lon < 72.004 || lon > 137.8347)
                return true;
            if (lat < 0.8293 || lat > 55.8271)
                return true;
            return false;
        }

        function transformLat(x, y)
        {
            var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
            return ret;
        }

        function transformLon(x, y)
        {
            var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
            return ret;
        }

        function bd_encrypt(gg_lat, gg_lon)
        {
            var pos = new Object();
            var x = gg_lon, y = gg_lat;
            var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
            pos.lng = z * Math.cos(theta) + 0.0065;
            pos.lat = z * Math.sin(theta) + 0.006;

            return pos;
        }

        function bd_decrypt(bd_lat, bd_lon)
        {
            var pos = new Object();
            var x = bd_lon - 0.0065, y = bd_lat - 0.006;
            var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
            pos.lng = z * cos(theta);
            pos.lat = z * sin(theta);

            return pos;
        }

        if (!isGG)
        {
            var pos = transform(lat, lng);
            return bd_encrypt(pos.lat, pos.lng);
        }
        else
        {
            return bd_encrypt(lat, lng);
        }
    }

    $G.locate = locate;
    this.Geo = $G;
    return $G;
});