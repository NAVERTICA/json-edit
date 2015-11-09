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

    formatHints.string.schList = function (name, type, id, opts, required, priv, util) {
	if(typeof(ContextGuids)=="object" && ContextGuids.userlogin == "nvrpoint\\tpilich")debugger;
        var
            options = opts["je:schList"] || {},
			codeId = id + (options.id || "")+ "-schList",
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
			schGlobal.loadList(codeId, content, selector, options);
        });

        return {
            "div": {
                "id": codeId,
                "$childs": [{
						"select":{
							"id": codeId,
							"loadtype":"List",
							"multiple":"multiple",
							"$childs": []}
				},
				{
				"input":{
					"id":codeId,
					"type": "button",
					"value": "Show All Properties"
				}
				}]
            }
        };
    };

    collectHints.string = collectHints.string || {};

    collectHints.string.schList = function (key, field, schema, priv) {
		var selected = $(field).find('select option:selected');
		var results = [];
		selected.each(function(i,el){results.push(this.value)})
		debugger;
		var result = results.join(";");
        return {result: JsonEdit.makeResult(true, "ok", result), data: result};
    };

    return JsonEdit;
}));
