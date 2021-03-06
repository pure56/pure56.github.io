/**
Uploader for website file. See Uploader class for the complete list of parameters.

@class Site
@extends WS.Uploader.Uploader
@namespace WS.Uploader
@constructor
@param {Integer} params.idfileserver Set the file server number.
@param {String} params.idsite Set the website identifier.
@param {String} params.idtypeobject Set the object type to associate to uploaded files.
**/
WS.Namespace.Create("WS.Uploader.Site", (function ()
{
    var _class = function (buttonElements, listElement, params, options, dropElements, listingTemplate, globalProgressElements)
    {
        WS.Uploader.Uploader.call(this, buttonElements, listElement, params, options, dropElements, listingTemplate, globalProgressElements);

        if (!this.params.idfileserver) throw "Missing parameter : idfileserver.";
        if (!this.params.idsite) throw "Missing parameter : idsite.";
        if (!this.params.idtypeobject) throw "Missing parameter : idtypeobject.";

        var _me = this;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function ()
        {
            if (this.status == 200)
            {
                var settings = JSON.parse(this.responseText);
                _me.options.availableDiskSpace = settings.AvailableDiskSpace;
                _me.options.maximumDiskSpace = settings.MaximumDiskSpace;
                _me.options.maximumFileSize = settings.MaximumFileSize;
            }
        }, false);
        xhr.open("GET", this.url.replace("/Site", "/Settings?idfileserver=" + this.params.idfileserver + "&idsite=" + this.params.idsite));
        xhr.send();
    };

    WS.Exts.Inherits(_class, WS.Uploader.Uploader);

    return _class;
})());