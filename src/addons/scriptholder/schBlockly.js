//global define, document, CodeMirror, setTimeout
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json.edit', 'jquery'],
               function (JsonEdit, jQuery) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.JsonEdit = factory(JsonEdit, jQuery));
        });
    } else {
        // Browser globals
        root.JsonEdit = factory(root.JsonEdit, root.jQuery);
    }
}(this, function (JsonEdit, $) {
    "use strict";
    var
        cache = {},
        formatHints = JsonEdit.defaults.hintedFormatters,
        collectHints = JsonEdit.defaults.hintedCollectors;

    function load(loadFun, path, id) {
        if (!cache[path]) {
            cache[path] = true;
            loadFun(path, id);
            return false;
        }
        return true;
    }

    formatHints.string = formatHints.string || {};

    formatHints.string.schBlockly = function (name, type, id, opts, required, priv, util) {
	if(typeof(ContextGuids)=="object" && ContextGuids.userlogin == "nvrpoint\\tpilich")debugger;
        var
            options = opts["je:schBlockly"] || {},
			codeId = id + (options.id || "") + "-schBlockly",
			startfn = options.startfn || "",
            path = (options.path || "/"),
            addons = options.addons || [],
            styles = options.styles || [],
            scripts = options.scripts || [],
            content = opts["default"] || "";

        if (path[path.length - 1] !== "/") {
            path += "/";
        }
        scripts.forEach(function (script) {
            load(priv.loadJs, path + script);
        });

        addons.forEach(function (addon) {
            load(priv.loadJs, addon);
        });

        styles.forEach(function (stylePath) {
            load(priv.loadCss, stylePath);
        });
	
        util.events.rendered.handleOnce(function (selector) {
			schGlobal.loadBlockly(codeId, content, selector, options)
        });

        return {
            "iframe": {
                "id": codeId,
				"loadtype":"Blockly",
				"src": options.path,
				"width":"100%",
				"height":"100%",
                "$childs": []
            }
        };
    };

    collectHints.string = collectHints.string || {};

    collectHints.string.schBlockly = function (key, field, schema, priv) {
		if(typeof(ContextGuids)=="object" && ContextGuids.userlogin == "nvrpoint\\tpilich")debugger;
	   
		var result = "";
        return {result: JsonEdit.makeResult(true, "ok", result), data: result};
    };

    return JsonEdit;
}));
