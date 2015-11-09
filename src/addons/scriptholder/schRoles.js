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

    formatHints.string.schRoles = function (name, type, id, opts, required, priv, util, fromOneOf) {
	
        var
            options = opts["je:schRoles"] || {},
			codeId = id + (options.id || "")+"-schRoles",
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
			if(fromOneOf == true){
				if($(".je-array-item[id*='"+id+"']").length == 0){
					$("div[id*='"+id+"']").parent()[0].selectedType = opts.type || "object";
					$("div[id*='"+id+"']").parent()[0].selectedSchema = JSON.stringify(opts) || "";
				}
				else{
					$(".je-array-item[id*='"+id+"']")[0].selectedType = opts.type || "object";
					$(".je-array-item[id*='"+id+"']")[0].selectedSchema = JSON.stringify(opts) || "";
				}
				
			}
			schGlobal.loadRoles(codeId, content, selector, options);
        });

        return {
            "div": {
                "id": codeId,
				//"class":"",
                "$childs": [{
						"select":{
							"id": codeId,
							"loadtype":"Roles",
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

    collectHints.string.schRoles = function (key, field, schema, priv) {
		var result = [];
		var selected = $(field).find("select[loadtype='Roles']").find('option:selected');
		selected.each(function(i, el){
			result.push(this.value);
		});
		result = result.join(";");
		
		return {result: JsonEdit.makeResult(true, "ok", result), data: result};
    };

    return JsonEdit;
}));
