/*global window jQuery*/
(function ($) {
    "use strict";
    var cons, jopts, priv = {}, nsgen, ns, prefix,
        defaults;

    defaults = {
        displayError: function (msg) {
            alert(msg);
        },
        displayWarning: function () {
            if (window.console && window.console.warn) {
                window.console.warn.apply(window.console, arguments);
            }
        },
        msgs: {
            cantRemoveMinItems: "Can't remove item, minimum number reached",
            cantAddMaxItems: "Can't add item, maximum number reached"
        }
    };

    nsgen = function (prefix, sep, count, inc) {
        sep = sep || "-";
        count = count || 0;
        inc = inc || 1;

        function nextCount() {
            var next = count;
            count += inc;

            return next;
        }

        function id(suffix, omitCount, count) {
            if (count === undefined) {
                count = nextCount();
            }

            var countSuffix = (omitCount) ? "" : sep + count;
            return prefix + sep + suffix + countSuffix;
        }

        // return a function that can take a list of args as first parameter
        // or spliced, if it takes just one argument and is an array use that
        // as the list, otherwise collect the arguments and use that as the list
        // examples:
        //  foo([1,2,3]) === foo(1,2,3)
        function dualVarArgs(fun) {
            return function () {
                var args = $.makeArray(arguments);

                // if it's just one argument and is an array then take the
                // array as the list of arguments
                // otherwise use all the arguments as the list of arguments
                if (args.length === 1 && $.isArray(args[0])) {
                    args = args[0];
                }

                return fun(args);
            };
        }

        return {
            nextCount: nextCount,
            id: id,
            $id: function (suffix, omitCount, count) {
                return "#" + id(suffix, omitCount, count);
            },
            cls: function (suffix) {
                return id(suffix, true);
            },
            $cls: function (suffix) {
                return "." + id(suffix, true);
            },
            classesList: dualVarArgs(function (suffixes) {
                return $.map(
                    suffixes,
                    function (suffix) {
                        return id(suffix, true);
                    }
                );
            }),
            // return a string with classes separated by spaces
            classes: function () {
                return this.classesList.apply(this, arguments).join(" ");
            },
            _reset: function (value) {
                count = value || 0;
            }
        };
    };

    if (window._jsonEditOpts) {
        jopts = window._jsonEditOpts;
    } else {
        jopts = {};
    }

    prefix = jopts.prefix || "je";
    ns = nsgen(prefix);
    priv.ns = ns;

    priv.getKeys = function (obj, order) {
        if (order) {
            return order;
        } else {
            return $.map(obj, function (value, key) {
                return key;
            });
        }
    };


    priv.genFields = function (order, schema) {
        order = priv.getKeys(schema, order);

        return $.map(order, function (item) {
            var itemSchema = schema[item];

            if (schema[item] === undefined) {
                throw new cons.Error("attribute not found on schema", {
                    "value": item,
                    "schema": schema
                });
            }

            return priv.genField(item, itemSchema);
        });
    };

    cons = function (id, opts) {
        var container = $("#" + id);

        $.each(priv.genFields(opts.order, opts.properties), function (index, lego) {
            container.append($.lego(lego));
        });

        return {
            "collect": function () {
                return cons.collect(id, opts);
            },
            "id": id,
            "opts": opts
        };
    };

    cons.collectResult = function (ok, msg, data) {
        return {
            ok: ok,
            msg: msg,
            data: data
        };
    };

    cons.defaults = defaults;
    cons.collect = function (id, opts) {
        var
            // if can be already a jquery object if called from collectObject
            cont = (typeof id === "string") ? $("#" + id) : id,
            order = priv.getKeys(opts.properties, opts.order),
            result = {ok: true, msg: "ok", data: {}};

        $.each(order, function (i, key) {
            var
                value,
                schema = opts.properties[key],
                selector = "." + priv.genFieldClasses(key, schema, "."),
                field = cont.children(selector);

            if (field.size() !== 1) {
                defaults.displayWarning("expected one item collecting",
                    field.size(), key, selector, cont, field);

                value = cons.collectResult(false,
                    "expected one item collecting", {
                        key: key,
                        size: field.size()
                    });

            } else {
                value = priv.collectField(key, field, schema);
            }

            if (!value.ok) {
                result.ok = false;
                result.msg = "one or more errors in object fields";
            }

            result.data[key] = value;
        });

        return result;
    };

    priv.collectField = function (key, field, schema) {
        if (cons.collectors[schema.type]) {
            return cons.collectors[schema.type](key, field, schema);
        } else {
            return cons.collectDefault(key, field, schema);
        }
    };

    cons.Error = function (reason, args) {
        this.reason = reason;
        this.args = args;
    };

    priv.label = function (label, idFor) {
        return {
            "label": {
                "for": idFor,
                "$childs": label
            }
        };
    };

    priv.inputTypes = {
        "string": "text",
        "number": "number",
        "integer": "number",
        "boolean": "checkbox"
    };

    function makeClickable(type, label, onClick, data) {
        var result = {};

        data = data || {};
        data.$childs = label;

        if (onClick) {
            data.$click = onClick;
        }

        result[type] = data;

        return result;
    }

    function makeButton(label, onClick, data) {
        return makeClickable("button", label, onClick, data);
    }


    function makeLinkAction(label, onClick, data) {
        data = $.extend(true, {href: "#"}, data);

        return makeClickable("a", label, onClick, data);
    }

    function makeArrayItem(opts, name, type, id, schema) {
        var
            cont,
            input = priv.input(name, type, id, schema);

        function onRemoveClick(event) {
            var realMinItems = opts.minItems || 0,
                cont = $("#" + id);

            if (cont.parent().children().size() <= realMinItems) {
                defaults.displayError(defaults.msgs.cantRemoveMinItems);
            } else {
                cont.remove();
            }

            event.preventDefault();
        }

        cont = {
            "div": {
                "id": id,
                "class": ns.cls("array-item"),
                "$childs": [
                    input,
                    {
                        "div": {
                            "class": ns.cls("item-actions"),
                            "$childs": [
                                makeLinkAction(
                                    "remove",
                                    onRemoveClick,
                                    {"class": ns.cls("action")})
                            ]
                        }
                    }
                ]
            }
        };

        return cont;
    }

    function onAddItemClick(opts, id, i) {
        var
            items = $("#" + id + " " + ns.$cls("array-items")),
            item = makeArrayItem(
                opts,
                name,
                opts.items.type || "string",
                id + "-" + i,
                opts.items);

        if (opts.maxItems && items.children().size() >= opts.maxItems) {
            defaults.displayError(defaults.msgs.cantAddMaxItems);
        } else {
            items.append($.lego(item));
        }
    }

    function onClearItemsClick(opts, id) {
        var realMinItems = opts.minItems || 0,
            selectorItems = "#" + id + " " + ns.$cls("array-items"),
            selectorChildsToRemove = ":not(:lt(" + realMinItems + "))";

        $(selectorItems).children(selectorChildsToRemove).remove();
    }

    function formatObject(name, type, id, opts) {
        return {
            "div": {
                "id": id,
                "class": ns.classes("field", "object-fields"),
                "$childs": priv.genFields(opts.order, opts.properties)
            }
        };
    }

    function formatArray(name, type, id, opts) {
        var i, minItems, arrayChild, arrayChilds = [];

        minItems = opts.minItems || 1;

        for (i = 0; i < minItems; i += 1) {
            arrayChild = makeArrayItem(
                opts,
                name,
                opts.items.type || "string",
                id + "-" + i,
                opts.items);

            arrayChilds.push(arrayChild);
        }

        return {
            "div": {
                "id": id,
                "class": priv.genFieldClasses(name, opts),
                "$childs": [
                    {
                        "div": {
                            "class": ns.cls("array-items"),
                            "$childs": arrayChilds
                        }
                    },
                    {
                        "div": {
                            "class": ns.cls("array-actions"),
                            "$childs": [
                                makeButton("add", function () {
                                    i += 1;
                                    onAddItemClick(opts, id, i);
                                }),
                                makeButton("clear", function () {
                                    onClearItemsClick(opts, id);
                                })
                            ]
                        }
                    }
                ]
            }
        };
    }

    function formatEnum(name, type, id, opts) {
        var hasDefault = false, noValueOption,
            obj = {
                "select": {
                    "id": id,
                    "name": name,
                    "$childs": $.map(opts["enum"], function (item, index) {
                        var opt = {
                            "option": {
                                "id": id + "-" + index,
                                "$childs": item
                            }
                        };

                        if (item === opts["default"]) {
                            opt.option.selected = true;
                            hasDefault = true;
                        }

                        return opt;
                    })
                }
            };

        if (!opts.required) {
            noValueOption = {"option": {"class": ns.cls("no-value"), "$childs": ""}};

            if (!hasDefault) {
                noValueOption.option.selected = true;
            }

            obj.select.$childs.unshift(noValueOption);
        }

        if (opts.description) {
            obj.select.title = opts.description;
        }

        return obj;
    }


    function formatDefault(name, type, id, opts) {

        if (opts["enum"]) {
            return formatEnum(name, type, id, opts);
        }

        var inputType = priv.inputTypes[type] || "text", min, max,
            obj = {
                "input": {
                    "id": id,
                    "name": name,
                    "type": inputType
                }
            };

        if (opts["default"]) {
            obj.input.value = opts["default"];
        }

        if (opts.required) {
            obj.input.required = true;
        }

        if (opts.maxLength) {
            // note the difference in capitalization
            obj.input.maxlength = opts.maxLength;
        }

        if (opts.description) {
            obj.input.title = opts.description;
        }

        if (opts.maximum) {
            if (opts.exclusiveMaximum) {
                max = opts.maximum - 1;
            } else {
                max = opts.maximum;
            }

            obj.input.max = max;
        }

        if (opts.minimum) {
            if (opts.exclusiveMinimum) {
                min = opts.minimum + 1;
            } else {
                min = opts.minimum;
            }

            obj.input.min = min;
        }

        if (opts.pattern) {
            obj.input.pattern = opts.pattern;
        }

        return obj;
    }

    priv.validate = function (value, schema) {
        if (cons.validators[schema.type]) {
            return cons.validators[schema.type](value, schema);
        } else {
            return cons.validatorDefault(value, schema);
        }
    };

    function collectObject(name, field, schema) {
        // get the inner child of the object container since collectors look
        // only in the first level childrens
        return cons.collect(field.children(ns.$cls("object-fields")), schema);
    }

    function collectArray(name, field, schema) {
        var itemSchema = schema.items || {};

        return field.find(ns.$cls("array-item")).map(function (i, node) {
            return priv.collectField(name, $(node), itemSchema);
        });
    }

    function collectEnum(name, field, schema) {
        var
            select = field.children("select"),
            option,
            value = select.val();

        // if the selected option is the "no-value" option then set value to null
        if (value === "") {
            option = select.find("option:selected");
            if (option.hasClass(ns.cls("no-value"))) {
                value = null;
            }
        }

        return priv.validate(value, schema);
    }

    function collectDefault(name, field, schema) {
        if (schema["enum"]) {
            return collectEnum(name, field, schema);
        }

        var value = field.children("input").val();

        return priv.validate(value, schema);
    }

    function validateObject(value, schema) {
        return cons.collectResult(true, "ok", value);
    }

    function validateArray(value, schema) {
        return cons.collectResult(true, "ok", value);
    }

    function validateDefault(value, schema) {
        return cons.collectResult(true, "ok", value);
    }

    // functions to call to format a given type of field, you can add your
    // own or modify the existing ones, if none matches cons.formatDefault
    // is called.
    cons.formatters = {
        "object": formatObject,
        "array": formatArray
    };

    cons.formatDefault = formatDefault;

    // function to call to collect the value for a given type of field, you can
    // add your own or modify the existing ones, if none matches
    // cons.collectDefault is called
    cons.collectors = {
        "object": collectObject,
        "array": collectArray
    };

    cons.collectDefault = collectDefault;

    cons.validators = {
        "object": validateObject,
        "array": validateArray
    };

    cons.validateDefault = validateDefault;

    priv.input = function (name, type, id, opts) {
        opts = opts || {};

        if (cons.formatters[type]) {
            return cons.formatters[type](name, type, id, opts);
        } else {
            return cons.formatDefault(name, type, id, opts);
        }
    };

    // return a list of classes for this field separated by sep (" " if not
    // provided)
    priv.genFieldClasses = function (fid, opts, sep) {
        var
            type = opts.type || "string",
            classes = ["field", fid, type];

        if (opts.required) {
            classes.push("required");
        }

        return ns.classesList(classes).join(sep || " ");
    };

    priv.genField = function (fid, opts) {
        var
            id = ns.id(fid),
            inputId = ns.id(fid + "-input"),
            type = opts.type || "string";

        return {
            "div": {
                "id": id,
                "class": priv.genFieldClasses(fid, opts),
                "$childs": [
                    priv.label(opts.title, inputId),
                    priv.input(fid, type, inputId, opts)
                ]
            }
        };
    };

    if (jopts.exportPrivates) {
        window.jsonEdit = cons;
        window.jsonEdit.priv = priv;
    } else if (jopts.global) {
        window.jsonEdit = cons;
    }

    return cons;
}(jQuery));

