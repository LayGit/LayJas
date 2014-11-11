Lay.package("LL.Mobile", function (L)
{
    var $Z = Lay.using("LL.Extend.Zepto"),
        $Sys = Lay.using("LL.Util.Detector");

    (function ($)
    {
        var mobevents = "tap,doubletap,hold,drag,transform,touchstart,touchmove,touchend,orientationchange,swipeleft,swiperight,swipeup,swipedown",
            types_str = mobevents + "afterprint,beforeprint,beforeonload,blur,error,focus,haschange,load,message,offline,online,pagehide,pageshow,popstate,redo,resize,storage,undo,unload,change,contextmenu,formchange,forminput,input,invalid,reset,select,submit,keydown,keypress,keyup,click,dblclick,drag,dragend,dragenter,dragleave,dragover,dragstart,drop,mousedown,mousemove,mouseout,mouseover,mouseup,mousewheel,scroll,abort,canplay,canplaythrough,durationchange,emptied,ended,loadeddata,loadedmetadata,loadstart,pause,play,playing,progress,ratechange,readystatechange,seeked,seeking,stalled,suspend,timeupdate,volumechange,waiting";
        var EventTypes = (function ()
        {
            //事件类型常量
            var TYPES = {};
            var typesArray = types_str.split(',');
            for (var i in typesArray)
            {
                TYPES[typesArray[i].toUpperCase()] = typesArray[i];
            }
            return TYPES;
        })();

        if ($Sys.device.name == "win" || $Sys.device.name == "mac")
            EventTypes.TAP = "click";

        $.EventTypes = EventTypes;
    })($Z);

    this.Base = $Z;

    return $Z;
});