
WS.Namespace.Create('WS.LightBox', (function ()
{
    /**
    @class LightBox
    @namespace WS
    @constructor 
    @param {Array of Object} objects list of objects (.src, .width, .height, [.footer{.title, .descr, .link{.href, .text}}]) 
    @param {Object} [container] container to add lightbox, default : body 
    @param {isEdit} bool is the request form the editor
    **/
    var Class = function (objects, container, isEditor)
    {
        // Validation
        if (!objects || objects.length <= 0) throw 'objects invalid!';

        this.Footer = false;

        for (var i = 0; i <= objects.length - 1; i++)
        {
            if (!objects[i].src) throw "image src invalid!";
            if (objects[i].footer) this.Footer = true;
        }

        this.objects = objects;
        this.container = (container) ? container : $("body");
        this.lightboxModal = this.container.find(".wsLightBox.wsModal");
        this.lightbox = this.container.find(".wsLightBox").not(".wsModal");
        this.MaxWidth = Math.floor($(window).width() / 4);
        this.MaxHeight = this.MaxWidth + 35;

        this.isEditor = isEditor && isEditor;
    
        if (this.lightbox.length == 0)
        {
            var editorClass = "";
            if (this.isEditor) editorClass = "editorOnly"
            // Create lightbox
            var Html = [];
            Html.push("<div class=\"wsLightBox " + editorClass + "\">");

            if (window.WS && window.WS.IsMobile) {
                // ToolBar
                Html.push("<div>");
                Html.push("<div class=\"wsToolBar\">");
                Html.push("<div></div>");
                Html.push("</div>");
            }

            Html.push("<div class=\"wsCloseWrapper\"><div class=\"wsClose\">+</div></div>");

            if (window.WS && window.WS.IsMobile)
            {
                Html.push("</div>");
            }

            Html.push("<div class=\"wsLightBoxContentWrapper\">")

            // == Arrow left == //
            Html.push("<div class=\"wsArrowLeftWrapper\">");
            Html.push("<div class=\"wsArrowLeft\"></div>");
            Html.push("</div>");

            // == Content == //
            Html.push("<div class=\"wsContentWrapper\">")

            Html.push("<div>");

            if (window.WS && !window.WS.IsMobile) {
                // ToolBar
                Html.push("<div class=\"wsToolBar\">");
                Html.push("<div></div>");
                Html.push("</div>")
            }

            // ImageContainer, Can be a video later
            Html.push("<div class=\"wsImg\"></div>");

            // Footer
            Html.push("<div class=\"wsFooter\">");
            Html.push("<div></div>");
            Html.push("<div></div>");
            Html.push("<div></div>");
            Html.push("</div>");

            Html.push("</div>");
            Html.push("</div>");

            // == Arrow right == //
         
            Html.push("<div class=\"wsArrowRightWrapper\">");
            Html.push("<div class=\"wsArrowRight\"></div>");
            Html.push("</div>");

            Html.push("</div>");

          
            Html.push("</div>");

            this.lightboxModal = $("<div class=\"wsLightBox wsModal " + editorClass + "\"></div>");
            this.lightbox = $(Html.join(""));

            // Append to Wrapper
            this.container.append(this.lightboxModal);
            this.container.append(this.lightbox);
        }

        if (window.WS && window.WS.IsMobile) {
            this.lightbox.addClass("wsMobile");
        }
        else
        {
            //default value base with the screen reesolution
            this.lightbox.find(".wsImage").css({ "width": this.MaxWidth, "height": this.MaxHeight + 35 });
        }

        if (this.IsEditor)
        {
            this.lightboxModal.addClass("editorOnly");
            this.lightbox.addClass("editorOnly");
        }
    
        //check screen resolution
        CheckIfMobile();

        // Add Handlers
        AddHandler.apply(this);
    };

    // Private Method(s)
    var AddHandler = function ()
    {
        var Me = this;

        this.lightboxModal.off("click");
        this.lightboxModal.on("click", function () { Me.Hide(); });

        var Close;
        if (Me.isEditor) Close = this.lightbox;
        else Close = this.lightbox.find(".wsClose");

        Close.off("click");
        Close.on("click", function () { Me.Hide(); $("body").css("overflow", "visible"); });

        if (!Me.isEditor) {
            var ArrowLeftWrapper = this.lightbox.find(".wsArrowLeftWrapper");
            var ArrowRightWrapper = this.lightbox.find(".wsArrowRightWrapper");

            var Content = this.lightbox.find(".wsLightBoxContentWrapper");

            Content.off("swipeleft, swiperight")
            .on("swipeleft", function () {
                Me.Next();
            })
            .on("swiperight", function () {
                Me.Previous();
            });


            ArrowLeftWrapper.off("click");
            ArrowLeftWrapper.on("click", function () { Me.Previous(); });

            ArrowRightWrapper.off("click");
            ArrowRightWrapper.on("click", function () { Me.Next(); });
        }

    };

    //get the maximun dimention of the image
    var GetDimension = function (width, height)
    {
        // dimensions from screen resolution
        var ScreenY = parseInt(($(window).height() * 0.8));
        var ScreenX = parseInt(($(window).width() * 0.8));
        //maybe check screen rez to see if we need to lower(if screen width < 700) the arrow...dont fit in small cell phone

        // Max Size 
        if (width > ScreenX || height > ScreenY)
        {
            var ratio = 1;
            if (width > height)
            {
                //widthbase
                ratio = height / width;
                if ((ScreenY / ScreenX) < ratio)
                {
                    ratio = width / height;
                    height = ScreenY;
                    width = height * ratio;
                }
                else
                {
                    width = ScreenX;
                    height = width * ratio;
                }
            }
            else
            {
                // heightbase
                ratio = width / height;
                if ((ScreenX / ScreenY) < ratio)
                {
                    ratio = height / width;
                    width = ScreenX;
                    height = width * ratio;
                }
                else
                {
                    height = ScreenY;
                    width = height * ratio;
                }
            }
        }

        return { "width": width, "height": height };
    }

    //calcul the image natural dimenssion and apply it to the object(image)
    var CalculImgDim = function ()
    {
        var Me = this;
        
        //show the lightbox with 
        this.lightboxModal.css("display", "block");
   

        //hide the image div and start the spinner
        $(".wsImg").hide();
        var spinner = $("<div class=\"wsLoadingFlexContainer\"><div class=\"wsLoadingSpinnerBlack\"></div></div>");
        this.lightbox.append(spinner);

        //Image
        var index = this.objects.idx
        var object = this.objects[index];
        var img = new Image();
        img.onload = function ()
        {
            object.width = img.naturalWidth;
            object.height = img.naturalHeight;

            //bind the image and get maxHeight and width
            var dim = Bind(Me.lightbox, Me.lightboxModal, object, index, Me.objects.length, Me.MaxWidth, Me.MaxHeight);
            Me.MaxWidth = dim.width;
            Me.MaxHeight = dim.height;

            //stop loading spinner and show the image div
            spinner.remove();
            $(".wsImg").show();

            //start preload next image
            PreloadNextImage(Me.objects, index, Me.objects.length);
        };

        img.src = object.src;
    }

    //bind the image and the arrow
    var Bind = function (element, elementModal, object, index, nbobject, MaxWidth, MaxHeight)
    {
        // toolbar
        if (nbobject > 1) element.find(".wsToolBar > div:first-child").text(index + 1 + " / " + nbobject);

        // img
        var Dimension = GetDimension(object.width, object.height);
        object.width = Dimension.width;
        object.height = Dimension.height;
        if (object.width > MaxWidth) MaxWidth = object.width;
        if (object.height > MaxHeight) MaxHeight = object.height;

        // LightBox dimensions, position
        var FooterH = 100;
        var HBox = MaxHeight + ((this.Footer) ? FooterH : 0) + 5;
        var Top = ($(window).height() - HBox) / 2;
        element.css({ "width": "100%", "height": HBox, "top": Top });

        if (window.WS && window.WS.IsMobile)
        {
            element.find(".wsImg").css({ "background-image": "url(\"" + object.src + "\")"});
        }
        else {
            element.find(".wsImg").css({ "width": object.width, "height": object.height, "background-image": "url(\"" + object.src + "\")", "background-size": object.width + "px " + object.height + "px" });
        }

        // init footer
        element.find(".wsFooter").css("display", "none");
        var title = element.find(".wsFooter > div:nth-child(1)");
        var descr = element.find(".wsFooter > div:nth-child(2)");
        var link = element.find(".wsFooter > div:nth-child(3)");
        title.empty();
        descr.empty();
        link.empty();



        // arrows
        element.find(".wsArrowRight, .wsArrowLeft").css("display", "none");
        if (nbobject > 1) { element.find(".wsArrowRight, .wsArrowLeft").css("display", "block"); }

        // opacity
        element.find(".wsArrowRight, .wsArrowLeft").css({ "opacity": 1, "cursor": "pointer" });
        if ((index + 1) >= nbobject) element.find(".wsArrowRight").css({ "opacity": 0.5, "cursor": "auto" });
        if ((index - 1) < 0) element.find(".wsArrowLeft").css({ "opacity": 0.5, "cursor": "auto" });

        if (object.footer)
        {
            // display footer
            element.find(".wsFooter").css("display", "block");

            var otitle = (object.footer.title) ? object.footer.title : "";
            var odescr = (object.footer.descr) ? object.footer.descr : "";
            var olink = (object.footer.link && object.footer.link.href && object.footer.link.text) ? $("<a href=\"" + object.footer.link.href + "\" target=\"_blank\">" + object.footer.link.text + "</a>") : "";
            title.text(otitle);
            descr.text(odescr);
            link.html(olink);
        }

        elementModal.css("display", "block");

        element.addClass("open");
        $("body").css("overflow", "hidden");

        //return the max dim value
        return { width: MaxWidth, height: MaxHeight };
    };

    //preload the next image if possible
    var PreloadNextImage = function (objects, index, length)
    {
        if (index + 1 < length)
        {
            var img = new Image();
            img.onload = function () { /*preload completed*/ }

            img.src = objects[index + 1].src;
        }
    };

    //if is mobile add wsMobile to the arrow to make them smaller
    var CheckIfMobile = function ()
    {
        if ($(window).width() < 720)
        {
            $('.wsLightBoxContentWrapper .wsArrowLeft').css({ "width": "25px", "height": "25px" });
            $('.wsLightBoxContentWrapper .wsArrowRight').css({ "width": "25px", "height": "25px" });
            $('.wsLoadingSpinnerBlack').css("font-size", "50%");
        }
        else
        {
            $('.wsLightBoxContentWrapper .wsArrowLeft').css({ "width": "30px", "height": "30px", });
            $('.wsLightBoxContentWrapper .wsArrowRight').css({ "width": "30px", "height": "30px" });
            $('.wsLoadingSpinnerBlack').css("font-size", "70%");
        }

    };

    // Public Method(s)
    (function (Methods)
    {
        /**
        Display the LightBox
        
        @method Show
        @param {Number} [indexstart] position to start (images)
        **/
        Methods.Show = function (indexstart)
        {
            this.objects.idx = (indexstart && indexstart >= 0 && indexstart <= this.objects.length) ? indexstart : 0;

            //calcul the image dimenssion and bind it after
            CalculImgDim.apply(this);
        };

        /**
        Hide the LightBox
        
        @method Hide
        **/
        Methods.Hide = function ()
        {
            this.lightboxModal.css("display", "none");
            this.lightbox.removeClass("open");
            $("body").css("overflow", "initial");
        };

        /**
        Remove LightBox from Container
        
        @method Remove
        **/
        Methods.Remove = function ()
        {
            this.lightboxModal.remove();
            this.lightbox.remove();
        };

        /**
        Display Next Image
        
        @method Next
        **/
        Methods.Next = function ()
        {
            if (!this.objects[this.objects.idx + 1]) return;

            this.objects.idx += 1;
            //calcul the image dimenssion and bind it after
            CalculImgDim.apply(this);
        };

        /**
        Display Previous Image
        
        @method Previous
        **/
        Methods.Previous = function ()
        {
            if (!this.objects[this.objects.idx - 1]) return;

            this.objects.idx -= 1;
            //calcul the image dimenssion and bind it after
            CalculImgDim.apply(this);
        };

    })(Class.prototype);

    return Class;
})());