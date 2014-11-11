Lay.package("LL.Util", function ()
{
    var $C = {};

    function toString(o)
    {
        try
        {
            return JSON.stringify(o);
        }
        catch (e)
        {
            var r = [];
            if (typeof o == "string") return "\"" + o.replace(/([\'\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
            if (typeof o == "object")
            {
                if (!o.sort)
                {
                    for (var i in o)
                        r.push(i + ":" + obj2str(o[i]));
                    if (!!document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString))
                    {
                        r.push("toString:" + o.toString.toString());
                    }
                    r = "{" + r.join() + "}"
                } else
                {
                    for (var i = 0; i < o.length; i++)
                        r.push(obj2str(o[i]))
                    r = "[" + r.join() + "]"
                }
                return r;
            }
            return o.toString();
        }
    }

    function toObject(str)
    {
        try
        {
            return JSON.parse(str);
        }
        catch (e)
        {
            if (str == "")
                return null;
            return eval("(" + str + ")");
        }
    }

    function toInt(str, radix)
    {
        if (!radix)
            radix = 10;

        try
        {
            return parseInt(String(str), radix);
        }
        catch (e)
        {
            return 0;
        }
    }

    function toFloat(str)
    {
        try
        {
            return parseFloat(String(str));
        }
        catch (e)
        {
            return 0;
        }
    }

    function toDate(s)
    {
        // 针对yyyy-mm-dd hh:MM:ss的时间格式，使用此方法创建Date对象，IOS不支持直接构造转换。
        var aDateAndTime = s.split(' '),
            aTime = aDateAndTime[1].split(':');
        aDate = aDateAndTime[0].split('-');
        date = new Date();
        date.setYear(aDate[0]);
        date.setMonth(aDate[1] - 1);
        date.setDate(aDate[2]);
        date.setHours(aTime[0]);
        date.setMinutes(aTime[1]);
        date.setSeconds(aTime[2]);
        return date;
    }

    $C.toString = toString;
    $C.toObject = toObject;
    $C.toInt = toInt;
    $C.toFloat = toFloat;
    $C.toDate = toDate;
    this.Convert = $C;
    return $C;
});