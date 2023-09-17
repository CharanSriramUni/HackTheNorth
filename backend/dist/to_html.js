//http://stackoverflow.com/a/12256190/584490

var page = require('webpage').create();
page.onConsoleMessage = function (msg) { console.log(msg); };

var system = require('system');
var address, output, size;


if (system.args.length!=3)
{
    console.log('Usage: save_as_html.js URL filename');
    phantom.exit(1);
}
else
{
    address = system.args[1];
    output = system.args[2];

    page.viewportSize = {    
        width: 1680, 
        height: 1050,
    };

    //SECURITY_ERR: DOM Exception 18: An attempt was made to break through the security policy of the user agent.
    //Enable cross site scripting:
    page.settings.XSSAuditingEnabled=false;
    page.settings.localToRemoteUrlAccessEnabled=true;
    page.settings.webSecurityEnabled=false;

    page.settings.userAgent="Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1";
    page.settings.ignoreSslErrors=true;

    page.open(address, function (status){
        if (status!=='success')
        {
            console.log("Unable to load URL, returned status: "+status);
            phantom.exit(1);
        }
        else
        {
            window.setTimeout(function (){
                page.evaluate(function(){
                    var nodeList=document.getElementsByTagName("*");

                    console.log("hey charan, we found this many elements: ", nodeList.length)

                    var arrEventHandlerAttributes=[
                        "onblur", "onchange", "onclick", "ondblclick", "onfocus", "onkeydown", "onkeyup", "onkeypress", "onkeyup","onload",
                        "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onreset", "onselect", "onsubmit", "onunload"
                    ];


                    //http://stackoverflow.com/a/7372816/584490
                    var base64Encode=function(str)
                    {
                        var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var out = "", i = 0, len = str.length, c1, c2, c3;
                        while (i < len) {
                            c1 = str.charCodeAt(i++) & 0xff;
                            if (i == len) {
                                out += CHARS.charAt(c1 >> 2);
                                out += CHARS.charAt((c1 & 0x3) << 4);
                                out += "==";
                                break;
                            }
                            c2 = str.charCodeAt(i++);
                            if (i == len) {
                                out += CHARS.charAt(c1 >> 2);
                                out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                                out += CHARS.charAt((c2 & 0xF) << 2);
                                out += "=";
                                break;
                            }
                            c3 = str.charCodeAt(i++);
                            out += CHARS.charAt(c1 >> 2);
                            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                            out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
                            out += CHARS.charAt(c3 & 0x3F);
                        }
                        return out;
                    };


                    for(var n=nodeList.length-1; n>0; n--)
                    {
                        try
                        {
                            var el=nodeList[n];

                            if(el.nodeName=="IMG" && el.src.substr(0, 5)!="data:")
                            {
                                /*var canvas=document.createElement("canvas");

                                canvas.width=parseInt(el.width);
                                canvas.height=parseInt(el.height);

                                var ctx=canvas.getContext("2d");
                                ctx.drawImage(el, 0, 0);
                                el.src=canvas.toDataURL();*/

                                var xhr=new XMLHttpRequest();

                                xhr.open(
                                    "get",
                                    el.src,
                                    /*Asynchronous*/ false
                                );

                                xhr.overrideMimeType("text/plain; charset=x-user-defined");

                                xhr.send(null);

                                var strResponseContentType=xhr.getResponseHeader("Content-type").split(";")[0].replace(/[^a-z0-9\/-]/gi, "");
                                el.src="data:"+strResponseContentType+";base64,"+base64Encode(xhr.responseText);
                            }
                            else if(el.nodeName=="LINK")
                            {
                                if(el.rel=="alternate")
                                {
                                    el.parentNode.removeChild(el);
                                }
                                else if(el.href.substr(0, 5)!="data:")
                                {
                                    var xhr=new XMLHttpRequest();

                                    xhr.open(
                                        "get",
                                        el.href,
                                        /*Asynchronous*/ false
                                    );

                                    xhr.overrideMimeType("text/plain; charset=x-user-defined");

                                    xhr.send(null);

                                    //var strResponseContentType=xhr.getResponseHeader("Content-type").split(";")[0].replace(/[^a-z0-9\/-]/gi, "");
                                    
                                    //el.href="data:"+strResponseContentType+";base64,"+base64Encode(xhr.responseText);
                                    el.href="data:"+el.type+";base64,"+base64Encode(xhr.responseText);
                                }

                                continue;
                            }
                            else if(el.nodeName=="SCRIPT")
                            {
                                el.parentNode.removeChild(el);

                                continue;
                            }
                            else if(el.nodeName=="IFRAME")
                            {
                                el.src="about:blank";

                                continue;
                            }

                            for(var z=arrEventHandlerAttributes.length-1; z>=0; z--)
                                el.removeAttribute(arrEventHandlerAttributes[z]);

                            var strBackgroundImageURL=window.getComputedStyle(el).getPropertyValue("background-image").replace("/[\s]/g", "");
                            if(strBackgroundImageURL.substr(0, 4)=="url(" && strBackgroundImageURL.substr(4, 5)!="data:")
                            {
                                strBackgroundImageURL=strBackgroundImageURL.substr(4, strBackgroundImageURL.length-5);

                                /*var imageTemp=document.createElement("img");
                                imageTemp.src=strBackgroundImageURL;

                                imageTemp.onload=function(e){
                                    var canvas=document.createElement("canvas");

                                    canvas.width=parseInt(imageTemp.width);
                                    canvas.height=parseInt(imageTemp.height);

                                    var ctx=canvas.getContext("2d");
                                    ctx.drawImage(imageTemp, 0, 0);
                                    el.style.backgroundImage="url("+canvas.toDataURL()+")";
                                };

                                if (imageTemp.complete)
                                    imageTemp.onload();
                                */

                                var xhr=new XMLHttpRequest();

                                xhr.open(
                                    "get",
                                    strBackgroundImageURL,
                                    /*Asynchronous*/ false
                                );

                                xhr.overrideMimeType("text/plain; charset=x-user-defined");

                                xhr.send(null);

                                var strResponseContentType=xhr.getResponseHeader("Content-type").split(";")[0].replace(/[^a-z0-9\/-]/gi, "");
                                el.style.backgroundImage="url("+"data:"+strResponseContentType+";base64,"+base64Encode(xhr.responseText)+")";
                            }

                            if(el.nodeName=="A")
                            {
                                el.href="#";//TODO convert relative paths to absolute ones (keep URLs);
                                el.setAttribute("onclick", "return false;");//TODO: remove this when the above is fixed.
                            }
                            else if(el.nodeName=="FORM")
                            {
                                el.setAttribute("action", "");
                                el.setAttribute("onsubmit", "return false;");
                            }
                        }
                        catch(error)
                        {
                            //what can be done about it?
                        }
                    }
                    
                    console.log('hey charan, we are done with the loop');
                });

                require("fs").write(output, page.content, "w");

                phantom.exit();
            }, 1000);
        }
    });
}
