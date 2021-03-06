
WS.Namespace.Create('NovAxis.Numeric', (function ()
{
    var MaxNum = 999999999;

    /**
    @class Numeric
    @namespace NovAxis
    @constructor
    @param {jQuery} element A jQuery object to be replaced by the numeric control.
    @param {number} minimum The minimum value.
    @param {number} maximum The maximum value.
    @param {number} [value] The original value. The minimum value if omitted.
    @param {Object} [options] Options object.
    @param {Array<String>} [options.classes] Array of class names to apply to the control.
    @param {number} [options.nbdecimal] The number of decimal. 2 if omitted.
    @param {boolean} [options.upDownArrows] Whether or not to include Up/Down arrows to change the value. Default false.
    @param {number} [options.upDownIncrement] Increment/Decrement to use when UpDownArrows are clicked. Default to 1.
    @param {boolean} [options.focus] if the control has focus. Default = false
    **/
    var Class = function (element, minimum, maximum, value, options)
    {
        if (!element || element.length == 0) throw "Element cannot be null.";
        if (isNaN(parseInt(minimum))) { minimum = -MaxNum; }
        if (isNaN(parseInt(maximum))) maximum = MaxNum;

        options = options || {};
        options.classes = options.classes || null;
        options.nbdecimal = (options.nbdecimal != null && typeof options.nbdecimal === "number" && options.nbdecimal >= 0) ? options.nbdecimal : 2;
        options.nullable = (options.nullable != undefined) ? options.nullable : false;
        options.placeholder = options.placeholder || null;
        options.upDownArrows = (options.upDownArrows === undefined ? false : options.upDownArrows === true);
        options.upDownIncrement = (options.upDownIncrement != null && typeof options.upDownIncrement === "number" && options.upDownIncrement > 0) ? options.upDownIncrement : 1;
        options.focus = (options.focus != undefined) ? options.focus : false;

        if (!options.nullable && isNaN(parseInt(value)))
        {
            value = minimum;
            if (minimum == -MaxNum) value = 0;
        }

        /**
        Fired when the value is changed.

        @event change
        **/
        WS.EventObject.call(this, ['change']);

        if (options.classes && options.classes.length > 0) this.element.addClass(options.classes.join(" "));

        this._internal = {};
        this._internal.minimum = minimum;
        this._internal.maximum = maximum;
        this._internal.value = value;
        this._internal.disabled = false;
        this._internal.originalElement = element;
        this._internal.nbdecimal = options.nbdecimal;
        this._internal.nullable = options.nullable;
        this._internal.Arrows = null;

        if (options.upDownArrows) this._internal.Arrows = { Increment: options.upDownIncrement };

        this.element = CreateControl.call(this);
        this._input = (this._internal.Arrows ? this.element.find(".naNumeric") : this.element);
        if (options.placeholder) this._input.attr("placeholder", options.placeholder);

        AddEventHandler.apply(this);
        element.after(this.element);
        element.detach();

        if (options.focus) this._input.focus();
    };

    WS.Exts.Inherits(Class, WS.EventObject);

    // Private Method(s)
    var CreateControl = function ()
    {
        var Html = [];

        if (this._internal.Arrows)
        {
            Html.push("<div class=\"naNumericWrapper\">");
        }

        Html.push("<input class=\"naNumeric\" type=\"text\" />")

        if (this._internal.Arrows)
        {
            Html.push("<span name=\"Up\"></span>");
            Html.push("<span name=\"Down\"></span>");
            Html.push("</div>");
        }

        return $(Html.join(""));
    };

    var AddEventHandler = function ()
    {
        var me = this;

        if (this._internal.Arrows)
        {
            this.element.find("[name=Up]").on("click", function ()
            {
                var CurrentNumber = Number(me._input.val());
                CurrentNumber += me._internal.Arrows.Increment;
                ChangeValue.call(me, CurrentNumber);
            });
            this.element.find("[name=Down]").on("click", function ()
            {
                var CurrentNumber = Number(me._input.val());
                CurrentNumber -= me._internal.Arrows.Increment;
                ChangeValue.call(me, CurrentNumber);
            });
        }

        var ManageInput = function (e, sender)
        {
            var Code = e.keyCode ? e.keyCode : e.which;
            var currentChar = String.fromCharCode(Code);

            // Special chars (backspace, delete, end, left, right) FireFox, ...
            if (Code == 8 || Code == 127 || Code == 37 || Code == 39 || Code == 35) e.preventDefault();

            var currentvalue = $(sender).val();
            var priceMinus = Code == 45 && sender.selectionStart == 0;
            var priceDecimal = (Code == 44 || Code == 46);
            if (priceDecimal && currentvalue.contains("-") && sender.selectionStart == 1) priceDecimal = false;

            if ((currentvalue.contains(",") || currentvalue.contains(".")) && priceDecimal) e.preventDefault();
            if (!(Code >= 48 && Code <= 57 || priceDecimal || priceMinus)) e.preventDefault();

            var cutLen = sender.selectionEnd - sender.selectionStart;
            var selectremove = currentvalue.substr(sender.selectionStart, cutLen);
            var lastpart = currentvalue.substr(sender.selectionEnd);
            var Tmp = currentvalue.substr(0, sender.selectionStart) + currentChar + lastpart.replace(selectremove, "");
            var currentvalueNum = Math.abs(Tmp.replace(",", "."));
            if (currentvalueNum > MaxNum) e.preventDefault();
        };

        this._input.on("cut", function (e) { e.preventDefault(); });

        this._input.on("paste", function (e)
        {
            e.preventDefault();

            var text = (e.originalEvent || e).clipboardData.getData("Text") || "";
            text = text.replace(",", ".").trim();
            if (!isNaN(parseFloat(text))) { ChangeValue.call(me, text); }
        });

        this._input.on("keypress", function (e) { ManageInput(e, this); });

        this._input.on("blur", function (e) { ChangeValue.call(me, $(this).val()); });

        this._input.on("focus", function () { $(this).select(); });

        this._input.val((this._internal.nullable) ? this._internal.value : this._internal.value.toFixed(this._internal.nbdecimal));
    };

    var ChangeValue = function (value)
    {
        if (!this._internal.disabled)
        {
            if (this._internal.nullable && value.trim() == "") { value = null; }
            else
            {
                if (isNaN(parseFloat(value))) value = this._internal.minimum.toFixed(this._internal.nbdecimal);

                value = Number.round(value, this._internal.nbdecimal);
                if (value < this._internal.minimum) value = this._internal.minimum;
                else if (value > this._internal.maximum) value = this._internal.maximum;

                this._internal.disabled = true;
                this._input.val(value.toFixed(this._internal.nbdecimal));
                this._internal.disabled = false;
            }

            if (value != this._internal.value)
            {
                this._internal.value = value;
                this.RaiseEvent("change", value);
            }
        }
    };

    // Public Method(s)
    (function (Methods)
    {
        /**
        Get the selected value.
    
        @method GetValue
        **/
        Methods.GetValue = function ()
        {
            return this._internal.value;
        };

        /**
        Set the selected value.
    
        @method SetValue
        **/
        Methods.SetValue = function (value)
        {
            ChangeValue.call(this, value);
        };

        /**
        Set the minimum value
   
        @method SetMinimum
        **/
        Methods.SetMinimum = function (value)
        {
            if (isNaN(parseInt(value))) { value = -MaxNum; }
            this._internal.minimum = value;
        };

        /**
        Set the maximum value
  
        @method SetMaximum
        **/
        Methods.SetMaximum = function (value)
        {
            if (isNaN(parseInt(value))) value = MaxNum;
            this._internal.maximum = value;
        };

        /**
        Check if the control is nullable.

        @method IsNullable
        **/
        Methods.IsNullable = function ()
        {
            return this._internal.nullable;
        };

        /**
        Select the input

        @method Select
        **/
        Methods.Select = function ()
        {
            this._input.select();
        };

        /**
        Disable the control.
   
        @method Disable
        **/
        Methods.Disable = function ()
        {
            this._input.addClass("Disabled");
            this._input.css({ "pointer-events": "none", "color": "#5c5c5c" });
            this._internal.disabled = true;
        };

        /**
        Readonly mode
   
        @method ReadOnly
        **/
        Methods.ReadOnly = function ()
        {
            this._input.addClass("ReadOnly");
            this._input.css({ "pointer-events": "none" });
        };

        /**
        Disable Readonly mode
  
        @method DisableReadOnly
        **/
        Methods.DisableReadOnly = function ()
        {
            this._input.removeClass("ReadOnly");
            this._input.css({ "pointer-events": "" });
        };

        /**
        Enable the control.
  
        @method Enable
        **/
        Methods.Enable = function ()
        {
            this._input.removeClass("Disabled");
            this._input.css({ "pointer-events": "", "color": "" });
            this._internal.disabled = false;
        };

        /**
        Give focus
  
        @method Focus
        **/
        Methods.Focus = function ()
        {
            this._input.focus();
        };

        /**
        Destroy the control.
 
        @method Destroy
        **/
        Methods.Destroy = function ()
        {
            this.element.after(this._internal.originalElement);
            this.element.remove();
            this.element = null;
            this._internal = null;
        };

    })(Class.prototype);

    return Class;
})());