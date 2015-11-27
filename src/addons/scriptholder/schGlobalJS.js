//global module

window.schGlobal = (function () {
	var _host = window.location.protocol +'//'+window.location.host;
    var _executor = new SP.RequestExecutor(_host + "/");
	
	var showLoading = function() {
		/***
		if(schGlobal.loadingInProgress) return false;
		schGlobal.loadingInProgress = true;
		var options = {};
		options.title = "Loading . . .";
		options.width = 350;
		options.height = 208;
		options.url = "/_layouts/15/NVR.SPTools/libs/json-edit/src/addons/scriptholder/load.gif";
		options.showClose = false;
		
		SP.UI.ModalDialog.showModalDialog(options);
		/***/
        SP.UI.ModalDialog.showWaitScreenWithNoClose('', '', 75, 45);
    };
    var closeLoading = function() {
		if(schGlobal.loadingInProgress) schGlobal.loadingInProgress = false;
		
        SP.UI.ModalDialog.commonModalDialogClose(true);
    };
	var iterateObj = function(obj, name, prevKey, form){
		//create list
		if(!form){
			var form = document.createElement('form');
			form.action = "";
		}
		
		for(var key in obj){
			if(typeof(obj[key]) == "object"){
				if(prevKey){
					schGlobal.iterateObj(obj[key], name, (prevKey+" > "+key), form);
				}else{
					schGlobal.iterateObj(obj[key], name, key, form);
				}
			}else{
				var radioInput = document.createElement('input');
				radioInput.name = name;
				radioInput.type = 'radio';
				radioInput.value = obj[key];
				
				form.appendChild(radioInput);
				
				var span = document.createElement('span');
				
				if(prevKey){
					if(key == "uri"){
						span.innerHTML = prevKey + " > " +key+" = ";
					}else{
						span.innerHTML = prevKey + " > " +key+" = \""+obj[key].toString()+"\"";
					}
				}else{
					span.innerHTML = key+" = \""+obj[key].toString()+"\"";
				}
				
				form.appendChild(span);
				if(key == "uri"){
					form.appendChild(schGlobal.getButton(obj[key]));
				}
				form.appendChild(document.createElement('br'));
			}
		}
		return form;
	};

	var customRestCall = function(url, success, idc){
		var result;
		return schGlobal.executor.executeAsync({
			url: url,
			method: "GET",
			headers: { "Accept": "application/json;odata=verbose" },
			success: function (data) {
				if(typeof(JSON.parse(data.body).d.results)=="object"){
					result = JSON.parse(data.body).d.results;
				}else{
					result = JSON.parse(data.body).d;
				}
				success(result, idc);
			},
			error: function (data, errCode, ErrMess) {
				console.log("executor error occured: ");
				console.log(ErrMess);
			}
		});
	};

	var getButton = function(url, id){
		var button = document.createElement('input');
		button.type = 'button';
		button.value = 'Show Me More';
		button.url = url;
		button.onclick = function(){/*debugger;*/ schGlobal.getButtonOnClick("", this.url, $(this).parent().parent()[0].id); }; //this could be better...
		return button;
	};
	var customRestCallSuccess = function(result, idc){
		var dialog = document.createElement('div');
		dialog.id = "AdditionalDialog";
		dialog.appendChild(document.createElement('ul'));
	
		$(result).each(function(i, el){
			//Create tabs HTML
			var tabLi = document.createElement('li');
			var tabA = document.createElement('a');
			tabA.href = ("#"+idc+i.toString());//TODO: check for invalid characters
			tabA.innerHTML = idc+i.toString();
			tabLi.appendChild(tabA);
			$(dialog).find('ul')[0].appendChild(tabLi);
			
			var tabDiv = document.createElement('div');
			tabDiv.id = idc+i.toString();
			var form = schGlobal.iterateObj(this, idc+i.toString());
			tabDiv.appendChild(form);
			
			dialog.appendChild(tabDiv);
		});
		$(dialog).tabs();
		$(dialog).dialog({
			height:600,
			width:800,
			close: schGlobal.closeDialogEvent
		});
	}
	var getButtonOnClick = function(mouseEvent, url, idc){
		if(!url){
			//get selected option... select and button have the same id
			var selection = $('#'+this.id+' select option:selected');
			
			var dialog = document.createElement('div');
			dialog.id = this.id+"-DIALOG";
			dialog.appendChild(document.createElement('ul'));
			
			selection.each(function(i, el){
				//Create tabs HTML
				var tabLi = document.createElement('li');
				var tabA = document.createElement('a');
				tabA.href = ("#"+this.value).replace( /(:|\.|\[|\]|,|\&|\?|\ )/g, "_" ) || ("#"+this.label).replace( /(:|\.|\[|\]|,|\&|\?|\ )/g, "_" ) ;
				tabA.innerHTML = ("#"+this.value) || ("#"+this.label);
				tabLi.appendChild(tabA);
				$(dialog).find('ul')[0].appendChild(tabLi);
				
				var tabDiv = document.createElement('div');
				tabDiv.id = this.label.replace( /(:|\.|\[|\]|,|\&|\?|\ )/g, "_" )  || this.value.replace( /(:|\.|\[|\]|,|\&|\?|\ )/g, "_" ) ;
				var form = schGlobal.iterateObj(JSON.parse(this.json), this.value || this.label)
				tabDiv.appendChild(form);
				
				dialog.appendChild(tabDiv);
				
			});
			
			$(dialog).tabs();
			$(dialog).dialog({
				height:600,
				width:800,
				beforeClose: schGlobal.beforeCloseDialogEvent,
				close: schGlobal.closeDialogEvent
			});
		}else{
			if(url && idc)
			schGlobal.customRestCall(url, schGlobal.customRestCallSuccess, idc);
		}
	}
	
	var beforeCloseDialogEvent = function(event, ui){
		var checked = $(this).find('input:checked');
	};
	var closeDialogEvent = function(event, ui){
		$(this).dialog('destroy');
		$(this).remove();
	};
	
	var getExecutorCallPromise = function(url){
		return new Promise(function(resolve, reject){
			schGlobal.executor.executeAsync({
				url: url,
				method: "GET",
				headers: { "Accept": "application/json;odata=verbose" },
				success: function (data) {
					resolve(data);
				},
				error: function (data, errCode, ErrMess) {
					reject(data, ErrMess);
				}
			});
		});
	};
	
	var getClosestParentId = function(id, type){
		//find closest number in array
		function closest(num, arr){
			var curr = arr[0];
			var diff = Math.abs (num - curr);
			for (var val = 0; val < arr.length; val++) {
				var newdiff = Math.abs (num - arr[val]);
				if (newdiff < diff) {
					diff = newdiff;
					curr = arr[val];
				}
			}
			return curr;
		}
		//get array
		var idsArray = [];
		var array = [];
		$("#"+id)
			.parents()
			.find("select[id*='"+type+"']")
			.each(function(){
				array.push(parseInt(this.id.replace(/.*\D(?=\d)|\D+$/g, "")));
				idsArray.push(this.id);
		});
		var actualParent = idsArray[array.indexOf(closest(id.replace(/.*\D(?=\d)|\D+$/g, ""),array))];
		//var actualParent = closest(id.replace(/.*\D(?=\d)|\D+$/g, ""),array).toString();
		return actualParent;
	};
	
	return {
		host: _host,
        executor: _executor,
		
        showLoading: showLoading,
        closeLoading: closeLoading,
		
		iterateObj: iterateObj,
		getButton: getButton,
		getButtonOnClick: getButtonOnClick,
		customRestCall: customRestCall,
		customRestCallSuccess: customRestCallSuccess,
		beforeCloseDialogEvent: beforeCloseDialogEvent,
		closeDialogEvent: closeDialogEvent,
		getExecutorCallPromise: getExecutorCallPromise,
		getClosestParentId: getClosestParentId

    };
})();

//module updates

var schWeb = (function (schGlobal) {	
	
	schGlobal.webOnchange = function (thisElement, id, selector, opt){
		if(opt.childID){
			var correctIds = [];
			$('select[id*="'+opt.childID+'"]').each(function(i,el){
				if(schGlobal.getClosestParentId(this.id,"schWeb") == id){
					correctIds.push(this.id);
				}
			});
			$(correctIds).each(function(i,el){
				$('select[id="'+this+'"]').children().remove();
				schGlobal.loadList(this, "","","", id);
			});
			
			/***
			//if child ID is specified remove only direct children options
			$('select[id*="'+opt.childID+'"]').children().remove();
			$('select[id*="'+opt.childID+'"]').each(function(i,el){
				schGlobal.loadList(this.id, "","","", id);
			});
			/***/
		}else{
			//remove all of the children options
			var affectedGroup = $(thisElement).parent().parent().parent().children().find('select');
			$(affectedGroup).each(function(i,el){
				if(el.id != thisElement.id) $(this).children().remove();
			});
			//load lists within group
			var directChildren = $(thisElement).parent().parent().parent().children().find("select[id$='-schList']");
			$(directChildren).each(function(i,el){
				schGlobal.loadList(this.id, "","","", id);
			});
		}
	}
	
	schGlobal.loadWeb = function(id, defaults, selector, opt){
		var reqUrl = schGlobal.host + '/_api/web';
		var options = [];
		
		schGlobal.loadWeb[id] = schGlobal.getExecutorCallPromise(reqUrl)
		.then(function(data){
			/**Opts Creating**/
			var result = JSON.parse(data.body).d
			options.push({"listsUrl" : result.Lists.__deferred.uri, "title" : result.Title || result.Url, "relurl" : result.ServerRelativeUrl, "json":JSON.stringify(result)});
			/****/
			return schGlobal.getExecutorCallPromise(reqUrl+'/webs');
		})
		.then(function(data){
			/**Opts Creating**/
			var results = JSON.parse(data.body).d.results;
			$.each(results, function(){
				options.push({"listsUrl" : this.Lists.__deferred.uri, "title" : this.Title || this.Url, "relurl" : this.ServerRelativeUrl, "json":JSON.stringify(this)});
			});
			/****/
			$.each(options, function(){
				var option = document.createElement("option");
				option.value = this.relurl;
				option.listsUrl = this.listsUrl;
				option.innerHTML = this.title;
				option.json = this.json;
				$('#'+id+' select')[0].appendChild(option);
			});
			/****/
			return "Options Created"
		})
		.then(function(data){
			console.log(data);
			console.log(id);
			console.log(defaults);
			console.log(opt);
			if(!$.isEmptyObject(defaults)){
				if(defaults.indexOf('[')==0){
					$.each(JSON.parse(defaults),function(i,el){
						if($('#'+id+' select option').filter("option[value='"+this+"']").length != 0){
							$('#'+id+' select option').filter("option[value='"+this+"']").each(function(){
								this.selected = 'selected';
							});
						}
					});
				}else{
					if($('#'+id+' select option').filter("option[value='"+defaults+"']").length != 0){
						$('#'+id+' select option').filter("option[value='"+defaults+"']").each(function(){
							this.selected = 'selected';
						});
					}
				}
			}
			$('#'+id+' select')[0].onchange = function(){schGlobal.webOnchange(this, id, selector, opt);};
			$('#'+id+' input')[0].onclick = schGlobal.getButtonOnClick;
			$('#'+id+' select').multiselect({
				header: "Select webs",
			}).multiselectfilter();
			return "OnChangeAssigned, Defaults selected"
		});
	};
	
	schGlobal.webLoadSuccess = function(){
		
	};
	
	return schGlobal;

})(schGlobal);

var schList = (function (schGlobal) {

	schGlobal.listOnchange = function (thisElement, id, selector, opt){
		if(opt.childID){
			var correctIds = [];
			$('select[id*="'+opt.childID+'"]').each(function(i,el){
				if(schGlobal.getClosestParentId(this.id,"schList") == id){
					correctIds.push(this.id);
				}
			});
			$(correctIds).each(function(i,el){
			
				$('select[id="'+this+'"]').children().remove();
				var loadtype = "load"+$($('select[id="'+this+'"]')[0]).attr("loadtype");//call load fn. by element type
				schGlobal[loadtype](this, "","","", id);
			});
			/***
			$('select[id*="'+opt.childID+'"]').children().remove();//?each
			$('select[id*="'+opt.childID+'"]').each(function(i,el){
				var loadtype = "load"+$(this).attr("loadtype");//call load fn. by element type
				schGlobal[loadtype](this.id, "","","", id);
			});
			/***/
		}else{
			//remove all of the children options and reload
			var affectedGroup = $(thisElement).parent().parent().parent().children().find('select[id*="-sch"]');
			$(affectedGroup).each(function(i,el){
				if(el.id != thisElement.id){
					$(this).children().remove();
					
					var loadtype = "load"+$(this).attr("loadtype");
					schGlobal[loadtype](this.id, "","","", id);
				}
			});
		}
	}
	
	schGlobal.loadList = function(id, defaults, selector, opt, parentId){
		var pId = "";
		if(!parentId){
			pId = schGlobal.getClosestParentId(id, "schWeb");
		}
		else{
			pId = parentId;
		}
		var options = [];
		
		schGlobal.loadList[id] = schGlobal.loadWeb[pId]
			.then(function(data){
				console.log(data);
				console.log("starting loading List id: "+id);
				var pId = parentId||schGlobal.getClosestParentId(id, "schWeb")
				var selectedWeb = $('select[id*="'+pId+'"] option:selected');
				if(selectedWeb.length == 0)return false;
				return Q.all(selectedWeb.map(function(i,el){
					return schGlobal.getExecutorCallPromise(el.listsUrl)
						.then(function(data){
							var results = JSON.parse(data.body).d.results;
							$.each(results, function(){
								options.push({"fieldsUrl" : this.Fields.__deferred.uri, "entityName" : this.EntityTypeName, "title" : this.Title || this.Id, "baseTemplate": this.BaseTemplate, "json":JSON.stringify(this)});
							});
						});
				}));
			})
			.then(function(data){
			
				if(data != false){
				
					var appendOption = function(opt, ido){
						var option = document.createElement("option");
						option.value = opt.entityName;
						option.fieldsUrl = opt.fieldsUrl;
						option.innerHTML = opt.title;
						option.category = opt.baseTemplate;
						option.json = opt.json;
						$('#'+id+' optgroup[id="'+ido+'"]')[0].appendChild(option);
					};
					var appendOptGroup = function(opt){
						var optgroup = document.createElement("optgroup");
						optgroup.id = opt.baseTemplate;
						optgroup.label = "Base Template: "+opt.baseTemplate;
						$('#'+id+' select')[0].appendChild(optgroup);
					};
					options.sort(function(a,b){
						var keyA = parseInt(a.baseTemplate);
						var keyB = parseInt(b.baseTemplate);
						if(keyA < keyB)return -1;
						if(keyA > keyB)return 1;
						return 0;
					});
					var tempOptGroupId = "";
					for(var i = 0; i<options.length; i++){
						if(i == 0){
							appendOptGroup(options[i]);
							tempOptGroupId = options[i].baseTemplate;
						}else if(parseInt(options[i-1].baseTemplate) != parseInt(options[i].baseTemplate)){
							appendOptGroup(options[i]);
							tempOptGroupId = options[i].baseTemplate;
						}
						appendOption(options[i], tempOptGroupId);
					}
					if(defaults == ""){
						try{
							$('#'+id+' select').multiselect('refresh');
						}catch(err){
							console.log(err);
						}
						//fire onchange on self
						$('#'+id+' select')[0].onchange();
						
						
					}else{
						if(defaults.indexOf('[')==0){
							$.each(JSON.parse(defaults),function(i,el){
								if($('#'+id+' select option').filter("option[value='"+/*defaults*/this+"']").length != 0){
									$('#'+id+' select option').filter("option[value='"+/*defaults*/this+"']").each(function(){
										this.selected = 'selected';
									});
								}
							});
						}else{
							if($('#'+id+' select option').filter("option[value='"+defaults+"']").length != 0){
								$('#'+id+' select option').filter("option[value='"+defaults+"']").each(function(){
									this.selected = 'selected';
								});
							}
						}
						$('#'+id+' select').multiselect({
							header: "Select lists",
						}).multiselectfilter();
						
						$('#'+id+' select')[0].onchange = function(){schGlobal.listOnchange(this, id, selector, opt);};
						$('#'+id+' input')[0].onclick = schGlobal.getButtonOnClick;
						
					}
					return "List id: "+id+" Loaded";
				}
				else{
					if(!parentId){
						$('#'+id+' select').multiselect({
								header: "Select lists",
						}).multiselectfilter();
							
						$('#'+id+' select')[0].onchange = function(){schGlobal.listOnchange(this, id, selector, opt);};
						$('#'+id+' input')[0].onclick = schGlobal.getButtonOnClick;
						
						return "List id: "+id+" Loaded";
					}else{
						$('#'+id+' select').multiselect('refresh');
						
						//fire onchange on self
						$('#'+id+' select')[0].onchange();
						return "List id: "+id+" Loaded";
					}
					
				}
			});
	};
	
	schGlobal.listLoadSuccess = function(){
		
	};
	
	return schGlobal;

})(schGlobal);

var schField = (function (schGlobal) {	
	
	schGlobal.loadField = function(id, defaults, selector, opt, parentId){
		schGlobal.showLoading();
		if(!parentId){
			var parentId = schGlobal.getClosestParentId(id, "schList");
		}
		var options = [];
		var selectedList = "";
		
		if(opt.fromURLField){
			//wait for urlField...
			if(window.urlfield==undefined){
				console.log("... waiting for URLField . . .")
				setTimeout(function(){
					schGlobal.loadField(id, defaults, selector, opt, parentId);
				},100);
				return;
			}
			schGlobal.loadField[id] = window.urlfield
				.then(firstFieldsLoad)
				.then(afterFieldsLoad)
				.then(addAdditionalFilters)
				.then(loadLookupMechanics)
				.then(schGlobal.fieldLoadSuccess)
				.catch(function (err) {
					schGlobal.closeLoading();
					console.log(err);
				});
		}else{
			schGlobal.loadField[id] = schGlobal.loadList[parentId]
				.then(firstFieldsLoad)
				.then(afterFieldsLoad)
				.then(addAdditionalFilters)
				.then(loadLookupMechanics)
				.then(schGlobal.fieldLoadSuccess)
				.catch(function (err) {
					schGlobal.closeLoading();
					console.log(err);
				});
		}
		function firstFieldsLoad(data){
			console.log(data);
			console.log("starting loading Field id: "+id);
			
			if(opt.fromURLField){
				selectedList = schGlobal.findFieldUrl();
			}else{
				selectedList = $('select[id*="'+parentId+'"] option:selected');
			}
			if(selectedList != "" || selectedList.length != 0){
				return Q.all(selectedList.map(function(i,el){
					//the old switcheroo
					if(typeof(i)=="object"){
						var tmp = el;
						el=i;
						i=tmp;
					}
					var value = el.value;
					if(!opt.fromURLField){
						value = el.fieldsUrl;
					}
					//Type filter option (divider: ',')
					if(opt.loadTypes && opt.loadTypes != ""){
						$(opt.loadTypes.split(",")).each(function(j,elem){
							if(j==0){
								value += "?$filter=(TypeAsString eq '"+elem+"')";
							}
							else{
								value += " or (TypeAsString eq '"+elem+"')";
							}
						});
					}
					return schGlobal.getExecutorCallPromise(value)
						.then(function(data){
							var results = JSON.parse(data.body).d.results
							$.each(results, function(){
								options.push({"type" : this.TypeAsString, "title" : this.Title || this.Id, "internalName":this.InternalName, "json":JSON.stringify(this)});
							});
						});
				}));
			}else{
				throw new Error('no selected list');
			}		
		}
		function afterFieldsLoad(data){
			var appendOption = function(opt, ido){
				var option = document.createElement("option");
				option.value = opt.internalName;
				option.label = opt.type;
				option.innerHTML = opt.internalName;
				option.json = opt.json;
				if(selectedList.length > 1){
					if($('#'+id+' optgroup[id="'+ido+'"] option[value="'+opt.internalName+'"]').length == (selectedList.length -1)){
						$('#'+id+' optgroup[id="'+ido+'"] option[value="'+opt.internalName+'"]').remove();
					}else{
						option.disabled = "disabled";
						if($('#'+id+' optgroup[id="'+ido+'"] option[value="'+opt.internalName+'"]').length == 1){
						}
					}
				}
				
				$('#'+id+' optgroup[id="'+ido+'"]')[0].appendChild(option);
			};
			var appendOptGroup = function(opt){
				var optgroup = document.createElement("optgroup");
				optgroup.id = opt.type;
				optgroup.label = "Type : "+opt.type;
				$('#'+id+' select')[0].appendChild(optgroup);
			};
			//sort options based on type
			options.sort(function(a,b){
				var keyA = a.type;
				var keyB = b.type;
				if(keyA < keyB)return -1;
				if(keyA > keyB)return 1;
				return 0;
			});
			var tempOptGroupId = "";
			for(var i = 0; i<options.length; i++){
				if(i == 0){
					appendOptGroup(options[i]);
					tempOptGroupId = options[i].type;
				}else if(options[i-1].type != options[i].type){
					appendOptGroup(options[i]);
					tempOptGroupId = options[i].type;
				}
				appendOption(options[i], tempOptGroupId);
			}
			$.each($('#'+id+' option'), function(){
				if($('#'+id+' optgroup[id="'+this.label+'"] option[value="'+this.value+'"]').length > 1){$(this).remove();}
			});
			if(defaults == ""){
				try{
					$('#'+id+' select').multiselect('refresh');
				}catch(err){
					console.log(err);
				}
			}else{
				/**Lookup**/
				if(typeof(defaults)=="string") defaults = [defaults];
				if(opt.followLookup == true){
					$(defaults).each(function(){
						var splitDefaults = this.split(";");
						$(splitDefaults).each(function(){
							var ssDefaults = this.split("|");
							if($('#'+id+' select option').filter("option[value='"+ssDefaults[0]+"']").length != 0){
							$('#'+id+' select option').filter("option[value='"+ssDefaults[0]+"']").each(function(){
								this.selected = 'selected';
							});
						}

						});
					});
				}
				else{
				//standard way
					$(defaults).each(function(){
						if($('#'+id+' select option').filter("option[value='"+this+"']").length != 0){
							$('#'+id+' select option').filter("option[value='"+this+"']").each(function(){
								this.selected = 'selected';
							});
						}
					});	
				}
				
				/****/
			}
			$('#'+id+' select').multiselect({
					header: "Select fields",
				}).multiselectfilter();
			$('#'+id+' input')[0].onclick = schGlobal.getButtonOnClick;
				
			/**Reload Button**/
			if(opt.fromURLField){
				var reloadButton = document.createElement("input");
				reloadButton.id = id;
				reloadButton.type = "button";
				reloadButton.value = "Reload";
				reloadButton.onclick = function(){
					$('#'+this.id+' select option').remove();
					schGlobal.loadField(id, "", selector, opt, parentId);
				};
				if($($('#'+id+' input')[0]).parent().find("input[value='Reload']").length == 0)
				$($('#'+id+' input')[0]).parent()[0].appendChild(reloadButton);
			}
			return "afterFieldsLoad of field id: "+id+" finished.";
		}
		function addAdditionalFilters(data){
			console.log(data);
			if($("form[id='"+id+"']").length != 0){
				$("form[id='"+id+"']").parent("div").remove();
			}
			//set defaultDisabled property for returning options to default state
			$("select[id='"+id+"'] option").each(function(){
				if(this.disabled == "disabled"||this.disabled == true){
					this.defaultDisabled = "disabled";
				}
			});
			
			var filterForm = 
			'<div id="'+id+'">'
				+'<form>'
					+'<input type="radio" name="showFilter" value="false" checked> Show All'
					+'<input type="radio" name="showFilter" value="true"> Filter'
				+'</form>'
				+'<form id="'+id+'" style="display:none;">'
					+'<input type="checkbox" name="filterFields" value="Hidden"> Show Hidden'
					+'<input type="checkbox" name="filterFields" value="ReadOnlyField"> Show ReadOnlyField'
					+'<input type="checkbox" name="filterFields" value="Required"> Show Required'
				+'</form>'
			+'</div>'

			var showFilterOnchange = function(){
				var id = $(this).parent().parent("div")[0].id;
				var form = $("form[id='"+id+"']");
				if(this.value == "false"){
					form[0].style.display = "none";
					form.children("input:checked").each(function(){this.checked=false;});
					
					$("select[id='"+id+"'] option").each(function(){
						if(this.defaultDisabled != "disabled"){
							this.disabled = "";
						}
					});
					$('#'+id+' select').multiselect('refresh');
				}else{
					form[0].style.display = "";
				}
			};
			
			var filterOnchange = function(){
				console.log("Look at this, this is filterOnchange and this is its this: ")
				console.log(this);
				
				var id = this.id;
				var values = [];
				$(this).children("input:checked").each(function(){values.push(this.value);});
				
				$("select[id='"+id+"'] option").each(function(){
					if(this.defaultDisabled != "disabled"){
						this.disabled = "";
					}
				});
				
				$("select[id='"+id+"'] option").each(function(){
					for(var  i=0;i<values.length;i++ ){
						if(JSON.parse(this.json)[values[i]] == false){
							this.disabled = "disabled";
						}
					}
				});
				$('#'+id+' select').multiselect('uncheckAll');
				
				$('#'+id+' select').multiselect('refresh');
			};

			var htmlFilterForm = $(filterForm);
			$(htmlFilterForm.children("form")[0]).children().each(function(){
				this.onchange = showFilterOnchange;
			});
			$(htmlFilterForm.children("form")[1]).change(filterOnchange);

			/***/
			$($('#'+id+' input')[0]).parent()[0].appendChild(htmlFilterForm[0]);
			/***/
			return "loading addAdditionalFilters for field id: "+id+" finished.";
		}
		function loadLookupMechanics(data){
			console.log(data);
			if(opt.followLookup == true){
				if($('#'+id+' select option:selected').length == 0) defaults = "";
				if(defaults == ""){
					//only add event to create select after choosing lookupField from multiselect
					schGlobal.addLookupOnchange(id, true);
				}else{
					//add event to create select after choosing lookupField from multiselect
					schGlobal.addLookupOnchange(id, true);
					
					//additional split for string field
					if(defaults[0].indexOf(";") != -1){
						defaults = defaults[0].split(";");
					}
					
					var splitDefaults = [];
					
					$(defaults).each(function(){
						splitDefaults.push(this.split("|"));
					});
					
					var promiseFactories = [];
					$(splitDefaults).each(function(i,el){
						var selectedValue = this[0];
						this.shift();
						
						var repOpt = {
							followLookup:true
						};
						
						var factoryTemplate = function(Fid, Fdefaults, Fselector, Fopt, FparentId, FparentSelectedValue){ return schGlobal.loadNewLookup(Fid, Fdefaults, Fselector, Fopt, FparentId, FparentSelectedValue) };
						
						promiseFactories.push(factoryTemplate(id+i, this, $($('#'+id+' select')[0]).parent()[0], repOpt, id, selectedValue));
					});
					
					var result = Promise.resolve();
					promiseFactories.forEach(function (promiseFactory) {
						result = result.then(promiseFactory);
					});
					if(promiseFactories.length==0)console.log("no 'followLookup' was found for field id: "+id+"\n		>Terminating this loading strand...   ...for now")
					return result;
				}
			}
			else{
				var resMsg = "no OR no more 'followLookup' was set for field id: "+id+"\n		>Terminating this loading strand...   ...for now";
				return resMsg;
			}
		}
		
	};
	
	schGlobal.loadNewLookup = function(id, defaults, selector, opt, parentId, parentSelectedValue){
		
		if(opt.followLookup == true){
			var parentSelect = $("select[id='"+parentId+"']");
			var selectedOptionJson = JSON.parse(parentSelect.children("optgroup[id='Lookup']").children("option[value='"+parentSelectedValue+"']")[0].json);
			
			//get url for lookup request
			var u = "",r = "",l = "";
			
			if(selectedOptionJson.LookupList==""){
				u = selectedOptionJson.__metadata.uri.substring(0,selectedOptionJson.__metadata.uri.indexOf("/Fields"));
			}else{
				u = selectedOptionJson.__metadata.uri.substring(0,selectedOptionJson.__metadata.uri.indexOf("/Lists")+6);
			}
			if(selectedOptionJson.LookupList.indexOf("-") == -1 && selectedOptionJson.LookupList != ""){
				//u = u.replace(u.substring(schGlobal.host.length, u.indexOf("/_api")),"")
				r = "/getbyinternalnameortitle('"+selectedOptionJson.LookupList+"')";
			}else if(selectedOptionJson.LookupList != ""){
				r = "(guid'"+selectedOptionJson.LookupList.replace(/\{|\}/g, "")+"')";
			}
			l = "/Fields"
			if(parentId == selector.id){
				var newSelector = document.createElement("div");
				newSelector.id = parentSelectedValue; 
				newSelector.style.fontWeight = "bold";
				newSelector.innerHTML = parentSelectedValue+" - Follow Lookup: "
				selector.appendChild(newSelector);
				selector = newSelector;
			}
			
			
			var label = document.createElement("a");
			label.style.fontWeight = "normal";
			label.id = id+"label";
			label.innerHTML = " > "+parentSelectedValue+" > ";
			selector.appendChild(label);
			
			/**get label url**/
			schGlobal.getExecutorCallPromise(u+r+"/RootFolder")
				.then(function(data){
					label.href = JSON.parse(data.body).d.ServerRelativeUrl;
					console.log("get label url done.")
					return "get label url done.";
				});
			/**/
			
			var newSelect = document.createElement("select");
			newSelect.id = id;
			newSelect.multiple = "multiple";
			selector.appendChild(newSelect);
			
			var options = [];
			
			return schGlobal.getExecutorCallPromise(u+r+l)
				.then(function(data){
					var results = JSON.parse(data.body).d.results;
					$.each(results, function(){
						options.push({"type" : this.TypeAsString, "title" : this.Title || this.Id, "internalName":this.InternalName, "json":JSON.stringify(this)});
					});
					return "getExecutorCallPromise for Lookup field: "+parentSelectedValue+" from select id: "+parentId+" finished.";
				})
				.then(function(data){
					console.log(data);
					var appendOption = function(opt, ido){
						var option = document.createElement("option");
						option.value = opt.internalName;
						option.label = opt.type;
						option.innerHTML = opt.internalName;
						option.json = opt.json;
						
						$('#'+id+' optgroup[id="'+ido+'"]')[0].appendChild(option);
					};
					var appendOptGroup = function(opt){
						var optgroup = document.createElement("optgroup");
						optgroup.id = opt.type;
						optgroup.label = "Type : "+opt.type;
						$('#'+id)[0].appendChild(optgroup);
					};
					//sort options based on type
					options.sort(function(a,b){
						var keyA = a.type;
						var keyB = b.type;
						if(keyA < keyB)return -1;
						if(keyA > keyB)return 1;
						return 0;
					});
					var tempOptGroupId = "";
					for(var i = 0; i<options.length; i++){
						if(i == 0){
							appendOptGroup(options[i]);
							tempOptGroupId = options[i].type;
						}else if(options[i-1].type != options[i].type){
							appendOptGroup(options[i]);
							tempOptGroupId = options[i].type;
						}
						appendOption(options[i], tempOptGroupId);
					}
					$.each($('#'+id+' option'), function(){
						if($('#'+id+' optgroup[id="'+this.label+'"] option[value="'+this.value+'"]').length > 1){$(this).remove();}
					});
					/*************/
					function multiselectIn(){
						$('#'+id+' select').multiselect({
							header: "Select fields",
						}).multiselectfilter();
						
						schGlobal.addLookupOnchange(id, false);
						
						$('#'+id+' select').multiselect('refresh');
					}
					
					if(defaults.length == 1){
						$(defaults).each(function(){
							if($('#'+id).find("option[value='"+this+"']").length != 0){
								$('#'+id).find("option[value='"+this+"']").each(function(){
									this.selected = 'selected';
								});
							}
						});
						
						multiselectIn();
						
						console.log("Finished? id: "+id);
						return "Finished? id: "+id;
					}
					else if(defaults == ""){
						multiselectIn();
						
						console.log("Finished? id: "+id);
						return "Finished? id: "+id;
					}
					else{
						
						if($('#'+id).find("option[value='"+defaults[0]+"']").length != 0){
							$('#'+id).find("option[value='"+defaults[0]+"']").each(function(){
								this.selected = 'selected';
							});
						}
						multiselectIn();
						var newSelectedValue = defaults[0].split("|")[0];
						defaults.shift();
						
						return schGlobal.loadNewLookup(id+parentSelectedValue, defaults, selector, opt, id, newSelectedValue);
					}
					/***********************/
				});
		}
		else{
			console.log("Finished? id: "+id);
			return "Finished? id: "+id;
		}
	}
	
	schGlobal.addLookupOnchange = function(sID, multi){
		
		$("select[id='"+sID+"']").multiselect({
			click: function(event, ui){
				if($(this).multiselect("widget").find("input:checked").length > 1 && multi == false){
					alert("Choose only one");
					return false;
				}
				
				var selectedOption = $(this).children().children("option[value='"+ui.value+"']");
				selectedOption[0].originalValue = selectedOption[0].value;
				
				if(ui.checked && selectedOption[0].label == "Lookup"){
					var opt = {
						followLookup:true
					};
					schGlobal.loadNewLookup(this.id+ui.value, "", $(this).parent()[0], opt, this.id, selectedOption[0].value);
				}
				else{
					//remove other selects
					if($(this).parent().find("div[id='"+ui.value+"']").length > 0){
						$(this).parent().find("div[id='"+ui.value+"']").remove();
					}
					else{
						var s = this;
						$(this).parent().find("select[id*='"+this.id+"']").each(function(i,el){
							if(this.id != s.id){
								$("a[id='"+this.id+"label']").remove();
								$(this).remove();
								
							}
						});
					}
				}
			}
		});
	};
	
	schGlobal.fieldLoadSuccess = function(data){
		console.log(data);
		schGlobal.closeLoading();
	};
	
	schGlobal.findFieldUrl = function(){
		if($('#urlcm').length == 0){throw new Error('URL FIELD NOT FOUND');}
		var results = [];
		
		var webTitles = [];
		$('#uWeb option').each(function(){webTitles.push(this.title.replace("/",""));});
		var text = $('#urlcm')[0].value;
		var textArr = text.split('|');
		
		$(textArr).each(function(){
			var tArr = this.split("/");
			$(webTitles).each(function(){if(this.toString()==tArr[1]){tArr[0]="/"+tArr[1]; tArr[1] = tArr[2]; tArr[2] = tArr[3];}});
			if(tArr[0] == "" ){ tArr[0] = "/"; }
			if(tArr[1] == "Lists"){ tArr[1] = tArr[1]+"/"+tArr[2];}
			if ($('#uList option[title="'+tArr[1]+'"]').length > 0) 
			results.push({"value":$('#uList option[title="'+tArr[1]+'"]')[0].value});
		});
		
		return results;
	};
	
	return schGlobal;

})(schGlobal);

var schBlockly = (function(){

	schGlobal.blocklyIframes = {};
	
	
	schGlobal.loadBlockly = function(id, defaults, selector, opt, parentId){
		
		if(!parentId){
			var parentId = schGlobal.getClosestParentId(id, "schList");
		}
		var options = [];
		var selectedList = "";
		
		if(opt.fromURLField){
			//wait for urlField...
			if(window.urlfield==undefined){
				console.log("... waiting for URLField . . .")
				setTimeout(function(){
					schGlobal.loadBlockly(id, defaults, selector, opt, parentId);
				},100);
				return;
			}
			schGlobal.loadField[id] = window.urlfield
				.then(firstBlocklyLoad)
				.then(function(data){
					schGlobal.blocklyLoadSuccess(id);
				})
				.then(afterBlocklyLoad)
				
				.catch(function (err) {
					  console.log(err);
				});
		}else{
			schGlobal.loadField[id] = schGlobal.loadList[parentId]
				.then(firstBlocklyLoad)
				.then(afterBlocklyLoad)
				.then(function(data){
					blocklyLoadSuccess(id);
				})
				.catch(function (err) {
					  console.log(err);
				});
		}
		
		function firstBlocklyLoad(data){
			console.log(data);
			console.log("starting loading Blockly id: "+id);
			
			if(opt.fromURLField){
				selectedList = schGlobal.findBlocklyUrl(); //TODO: *!
			}else{
				selectedList = $('select[id*="'+parentId+'"] option:selected');
			}
			if(selectedList != "" || selectedList.length != 0){
				return Q.all(selectedList.map(function(i,el){
					//the old switcheroo
					if(typeof(i)=="object"){
						var tmp = el;
						el=i;
						i=tmp;
					}
					return schGlobal.getExecutorCallPromise(JSON.parse(el.json).Items.__deferred.uri)
						.then(function(data){
							var results = JSON.parse(data.body).d.results;
							$.each(results, function(){
								var obj = this;
								options.push([obj.Title || obj.Id, '{"title":"'+(obj.Title || obj.Id)+'","value":'+JSON.stringify(obj)+'}']);
							});
						});
				}));
			}else{
				throw new Error('no selected list');
			}
		}
		function afterBlocklyLoad(data){
			//define GetItemProperty Block
			schGlobal.blocklyIframes[id].Blockly.Blocks['getitemproperty'] = {
				  init: function() {
					var thisBlock = this;
					this.setHelpUrl('http://www.example.com/');
					this.setColour(270);
					//dropdown
					var dropdown = new schGlobal.blocklyIframes[id].Blockly.FieldDropdown(options, function(optVal){
					thisBlock.setDisabled(true);
						var optProp = JSON.parse(optVal);
						var propOpts = [];
						for(var key in optProp.value){
							if(typeof(optProp.value[key]) == "object"){
								//nothing
							}else{
								propOpts.push([key ,'["'+key+'","'+ optProp.value[key].toString()+'"]']);
							}
						}
						if(thisBlock.getField_('prop') != null){
							thisBlock.getField_('prop').menuGenerator_ = propOpts;
						}else{
						thisBlock.appendDummyInput()
							.appendField(new schGlobal.blocklyIframes[id].Blockly.FieldDropdown(propOpts), "prop");
						}
						//thisBlock.getField_('prop').changeHandler_(thisBlock.getFieldValue('prop'));
					});
					this.appendDummyInput()
						.appendField("Get Item:");
					this.appendDummyInput()
						.appendField(dropdown, 'item');
					this.appendDummyInput()
						.appendField("property:");
					this.appendDummyInput()
						.appendField(new schGlobal.blocklyIframes[id].Blockly.FieldDropdown([["",""]],function(){
							thisBlock.setDisabled(false);
						}), "prop");
					this.appendDummyInput()
						.appendField("Value");
					//this.setInputsInline(true);
					this.setOutput(true, "String");
					this.setTooltip('');
					this.getField_('item').changeHandler_(this.getFieldValue('item'));
				  }
				};
				
			//define SetItemProperty Block
			schGlobal.blocklyIframes[id].Blockly.Blocks['setitemproperty'] = {
			  init: function() {
				var thisBlock = this;
				this.setHelpUrl('http://www.example.com/');
				this.setColour(0);
				
				var dropdown = new schGlobal.blocklyIframes[id].Blockly.FieldDropdown(options, function(optVal){
					thisBlock.setDisabled(true);
					var optProp = JSON.parse(optVal);
					var propOpts = [];
					for(var key in optProp.value){
						if(typeof(optProp.value[key]) == "object"){
							//nothing
						}else{
							propOpts.push([key ,'["'+key+'","'+ optProp.value[key].toString()+'"]']);
						}
					}
					if(thisBlock.getField_('prop') != null){
						thisBlock.getField_('prop').menuGenerator_ = propOpts;
					}else{
					thisBlock.appendDummyInput()
						.appendField(new schGlobal.blocklyIframes[id].Blockly.FieldDropdown(propOpts), "prop");
					}
				});
				this.appendDummyInput()
					.appendField("Set Item:");
				this.appendDummyInput()
					.appendField(dropdown, 'item');
				this.appendDummyInput()
					.appendField("property:");
				this.appendDummyInput()
					.appendField(new schGlobal.blocklyIframes[id].Blockly.FieldDropdown([["",""]],function(){
						thisBlock.setDisabled(false);
					}), "prop");
				this.appendDummyInput()
					.appendField("to:");
				this.appendValueInput("value")
					.setCheck("String");
				this.setInputsInline(true);
				this.setPreviousStatement(true, "null");
				this.setNextStatement(true, "null");
				this.setTooltip('');
				this.getField_('item').changeHandler_(this.getFieldValue('item'));
			  }
			};
			
			//GetItemProperty Python Generator
			schGlobal.blocklyIframes[id].Blockly.Python['getitemproperty'] = function(block) {
				var dropdown_prop = block.getFieldValue('prop');
				
				var code = schGlobal.blocklyIframes[id].Blockly.Python.quote_(JSON.parse(dropdown_prop)[1]);
				
				return [code, Blockly.Python.ORDER_ATOMIC];
			};
			
			//SetItemProperty Python Generator
			schGlobal.blocklyIframes[id].Blockly.Python['setitemproperty'] = function(block) {
				var dropdown_item = block.getFieldValue('item');
				var dropdown_prop = block.getFieldValue('prop');
				//dropdown_item = schGlobal.blocklyIframes[id].Blockly.Python.quote_(JSON.parse(dropdown_item).value.ID);
				//dropdown_prop = schGlobal.blocklyIframes[id].Blockly.Python.quote_(JSON.parse(dropdown_prop)[0]);
				
				var setValue = schGlobal.blocklyIframes[id].Blockly.Python.valueToCode(block, 'value',
					Blockly.Python.ORDER_NONE) || '\'\'';
				
				var i = "Item";
				var s = "SetItemProperty";
				// TODO: Assemble Python into code variable.
				// var code = i+"("+dropdown_item+")."+s+"("+dropdown_prop+")";
				var code = i+"('"+JSON.parse(dropdown_item).value.ID+"')"+"."+s+"('"+JSON.parse(dropdown_prop)[0]+"', "+setValue+")";
				// TODO: Change ORDER_NONE to the correct strength.
				return code;
				//return [code, Blockly.Python.ORDER_FUNCTION_CALL];
				};
			//Update blockly ToolBox
			var origToolbox = schGlobal.blocklyIframes[id].document.getElementById("toolbox");
			
			var separator = new DOMParser().parseFromString('<sep></sep>', "application/xml");;
			var newBlocksString = '<category name="Items"><block type="getitemproperty"></block><block type="setitemproperty"></block></category>' ;
			var newBlocksDOM = new DOMParser().parseFromString(newBlocksString, "application/xml");
			origToolbox.appendChild($(separator).children()[0]);
			origToolbox.appendChild($(newBlocksDOM).children()[0]);
			
			schGlobal.blocklyIframes[id].Blockly.updateToolbox(origToolbox);
			
		}
	};
	
	schGlobal.blocklyLoadSuccess = function(id){
		//place to inject blockly into created iframe
		return Promise.resolve().then(function(){
			schGlobal.blocklyIframes[id] = $('iframe[id="'+id+'"]')[0].contentWindow;
			var ifrWindow = $('iframe[id="'+id+'"]')[0].contentWindow;
			ifrWindow.Blockly.inject(ifrWindow.document.body, {toolbox: ifrWindow.document.getElementById('toolbox'), trashcan: true});
			
			$('iframe[id="'+id+'"]')[0].style.minHeight = "600px";
			$('iframe[id="'+id+'"]').parent('div').resizable();
			return "blocklyLoadSuccess completed";
		});
	};
	
	schGlobal.findBlocklyUrl = function(){
		if($('#urlcm').length == 0){throw new Error('URL FIELD NOT FOUND');}
		var results = [];
		
		var webTitles = [];
		$('#uWeb option').each(function(){webTitles.push(this.title.replace("/",""));});
		var text = $('#urlcm')[0].value;
		var textArr = text.split('|');
		
		$(textArr).each(function(){
			var tArr = this.split("/");
			$(webTitles).each(function(){if(this.toString()==tArr[1]){tArr[0]="/"+tArr[1]; tArr[1] = tArr[2]; tArr[2] = tArr[3];}});
			if(tArr[0] == "" ){ tArr[0] = "/"; }
			if(tArr[1] == "Lists"){ tArr[1] = tArr[1]+"/"+tArr[2];}
			if ($('#uList option[title="'+tArr[1]+'"]').length > 0){ 
				var tempResult = {"Items":{"__deferred":{"uri":$('#uList option[title="'+tArr[1]+'"]')[0].value.replace("/Fields","/Items")}}};
				results.push({"json": JSON.stringify(tempResult)});
				//results.push({"value":$('#uList option[title="'+tArr[1]+'"]')[0].value});
			}
		});
		
		return results;
	};
	
	return schGlobal;
})(schGlobal);

var schApp = (function (schGlobal) {	
	
	schGlobal.addTab = function (name) {
		var fldName = $("div[id='editorNVR_SiteConfigJSON']").parent().contents()[1].nodeValue.split('\n')[1];
		fldName = fldName.substring(fldName.indexOf('\"') + 1, fldName.lastIndexOf('\"'));
		//var name = window.prompt("Name of schema to be added in new tab", "DerivedAction");
		if (!name) return;
		//name=name.replace("|","-");
		var b = name.split("--")[0];
		
		var origSchemaValidatedNewDefaults = window.JSONFields[fldName].validate();
		var schema = window.JSONFields[fldName].schema;
		var result = null;
		var path = $.JSONPath({ data: schema, keepHistory: false, resultType: "BOTH" });
		// if (parentName == "root") {
			result = path.query("$;properties");
		// } else {
			// result = path.query("$;properties;" + parentName + ";properties");
		// }
		try {
			if (loadSchema(b, "")) {
				result[0].value[name] = window.JSONschemas[b]();

				// parent
				var parentQuery = result[0].query.substring(0, result[0].query.lastIndexOf(";properties"));
				var parent = path.query(parentQuery);
				if (!parent[0].value.order) parent[0].value.order = [];
				parent[0].value.order.push(name);
				window.JSONFields[fldName].update(origSchemaValidatedNewDefaults);
			}
		} catch (ae) {
			console.error(ae);
		}
	};
	schGlobal.saveAndRefresh = function(){
		if(localStorage.getItem("redirectURL")==null){
			var newURL = window.location.href.replace(GetUrlKeyValue("Source", true, window.location.href), encodeURIComponent(location.pathname+"?"+window.location.search.replace("?", "").split("&")[0]))
			localStorage.setItem("redirectURL", newURL);
			
			$("form[id=aspnetForm]")[0].action = newURL;
			$("input[id$=SaveItem]").click();
			//WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions($("input[id$=SaveItem]").attr("name"), "", true, "", newURL, false, true));
		}else{
			var newURL = localStorage.getItem("redirectURL");
			
			$("form[id=aspnetForm]")[0].action = newURL;
			$("input[id$=SaveItem]").click();
			//WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions($("input[id$=SaveItem]").attr("name"), "", true, "", newURL, false, true));
		}
		//console.log("Work in progress");
		//_RefreshPage(SP.UI.DialogResult.OK);
		//return false;
	};
	schGlobal.appOnchange = function (event, variable){
		if(!$.isEmptyObject(variable)){
			var select = variable;
		}else{
			var select = this;
		}
		if($(select).parent().find("#againButton").length!=0)
			$(select).parent().find("#againButton").remove();
		if($(select).find("option:selected").length == 0) return false;
		if($(select).parent().parent().find("input")[0].value == ""){
			console.log("Empty App name input.");
			//show warning on input, chrome only...
			if(typeof($(select).parent().parent().find("input")[0].reportValidity)=="function"){
				$(select).parent().parent().find("input")[0].setCustomValidity("Please fill out this field");
				setTimeout(function(){$(select).parent().parent().find("input")[0].reportValidity();},50);
			}else{//for IE...
				SP.UI.Notify.addNotification("Empty App name input. Please fill out this field");
				$(".ms-trcnoti-bg")[0].scrollIntoView();
			}
			var againButton = document.createElement("input");
			againButton.id = "againButton";
			againButton.value = "Apply";
			againButton.type = "button";
			againButton.onclick = function(){schGlobal.appOnchange(this, select);}
			if($(select).parent().find("#againButton").length==0)
			$(select).parent()[0].appendChild(againButton);
			return false;
		}
		var appsString = $(select).parent().parent().find("input")[0].value;
		
		//TODO: remove tabs function
		$(select).find("option:selected").each(function(i,el){
			var n = "";
			if(appsString.indexOf("--")!=-1){
				n = this.text+"--"+appsString.replace(appsString.substring(0,appsString.indexOf("--")+2),"");
			}else{
				n = this.text+"--"+appsString;
			}
			if($("textarea[title='Apps']")[0].value.indexOf(n+"\n") != -1 ){
				alert(n+" :already exists");
				console.log(n+" :already exists");
				return false;
				
			}else{
				$(select).parent().parent().find("input")[0].value = n;
				schGlobal.addTab(n);
				
				$("textarea[title='Apps']")[0].value += "\n"+$(select).parent().parent().find("input")[0].value;
			}
		});
	}
	schGlobal.createAppSelectOpts = function(selector, names, id){
		var select = $("#"+id).find("select")[0];
		
		$(names).each(function(){
			var option = document.createElement("option");
			option.text = this[0];
			option.value = this[1];
			select.appendChild(option);
		
		});
		
		//select.onchange = function(){schGlobal.appOnchange("","");}
		//select.onchange = schGlobal.appOnchange;
		
		$(select).multiselect({
			multiple: false,
			header: "Select apps",
			//beforeclose:schGlobal.appOnchange,
			//close: schGlobal.saveAndRefresh,
			close: schGlobal.appOnchange,
		}).multiselectfilter();
		//$(select).multiselect('refresh');
		// if(navigator.userAgent.indexOf("MSIE")!=-1){
			// var ieButton = document.createElement("input");
			// ieButton.id = "ieButton";
			// ieButton.value = "Apply for IE";
			// ieButton.type = "button";
			// ieButton.onclick = function(){schGlobal.appOnchange(this, select);}
			// $(select).parent()[0].appendChild(ieButton);
		// }
		schGlobal.appLoadSuccess(select);
	};
	schGlobal.loadApp = function(selector, id){
		//var options = [];
		var reqUrl = schGlobal.host+"/_api/web/GetFolderByServerRelativeUrl('/SiteScripts/Schema')/Files";
		schGlobal.executor.executeAsync({
			url: reqUrl,
			method: "GET",
			headers: { "Accept": "application/json;odata=verbose" },
			success: function (data) {
				var names = [];
				var results = JSON.parse(data.body).d.results;
				$(results).each(function(){
					names.push([this.Name.replace(/\.[^/.]+$/, ""),this.ServerRelativeUrl]);//replace file extension
				});
				schGlobal.createAppSelectOpts(selector, names, id);
			},
			error: function (data, errCode, ErrMess) {
				console.log("executor error occured: ");
				console.log(ErrMess);
			}
		});
	};
	schGlobal.appLoadSuccess = function(select){
		if($(select).attr("default")){
		var value = $(select).attr("default");
			// $(value).each(function(){
				if($(select).children().filter("option:contains("+value+")").length !=0){
					$(select).children().filter("option:contains("+value+")").each(function(){
								this.selected = 'selected';
							});
				}
			// });
		}
		$(select).multiselect('refresh');
		console.log("app select options successfully loaded.");
	};
	
	
	return schGlobal;

})(schGlobal);

var schUser = (function (schGlobal) {
	schGlobal.loadUser = function(id, defaults, selector, opt, parentId){
		var schema = {};
		schema['PrincipalAccountType'] = 'User,DL,SecGroup,SPGroup';
		schema['SearchPrincipalSource'] = 15;
		schema['ResolvePrincipalSource'] = 15;
		schema['AllowMultipleValues'] = true;
		schema['MaximumEntitySuggestions'] = 50;
		schema['Width'] = '280px';
		
		var a = window.SPClientPeoplePicker_InitStandaloneControlWrapper(id, null, schema);
		
		//var resolveButton = $("input[id='"+id+"']");
		//resolveButton[0].onclick = function(){schGlobal.listOnchange(this, id);};
		
		$("div[id='"+id+"']")[0].style.float= "left";
		
		if(defaults != ""){
		//TODO: find inside SP when window.SPClientPeoplePicker_InitStandaloneControlWrapper is finished, for now: timeout
		setTimeout(function(){
			var peoplePicker = window.SPClientPeoplePicker.SPClientPeoplePickerDict[id+"_TopSpan"];
			var peoplePickerEditor = $("input[id='" + peoplePicker.EditorElementId+ "']");
			
			var splitDefaults = defaults.split(";");
			$(splitDefaults).each(function(i,el){
				peoplePickerEditor.val(this.toString());
				peoplePicker.AddUnresolvedUserFromEditor(true);
			});
			
		},500);
		}
	};
	
	schGlobal.resolveBtnOnclick = function (thisElement, id){
		
		var peoplePicker = window.SPClientPeoplePicker.SPClientPeoplePickerDict[id+"_TopSpan"];
		var keys = peoplePicker.GetAllUserKeys();
		console.log(keys);
		return false;
		
	};
	
	schGlobal.userLoadSuccess = function(data){
		
	};
})(schGlobal);

var schRoles = (function (schGlobal) {
	schGlobal.loadRoles = function(id, defaults, selector, opt, parentId){
		var options = [];
		
		schGlobal.loadRoles[id] = schGlobal.getExecutorCallPromise(schGlobal.host+"/_api/web/RoleDefinitions/")
			.then(firstRolesLoaded)
			.then(schGlobal.fieldLoadSuccess)
			.catch(function (err) {
				schGlobal.closeLoading();
				console.log(err);
			});
		function firstRolesLoaded(data){
			var appendOption = function(opt){
				var option = document.createElement("option");
				option.value = opt.id;
				option.label = opt.description;
				option.innerHTML = opt.title;
				option.json = opt.json;
				
				$('#'+id+' select')[0].appendChild(option);
			};
			var results = JSON.parse(data.body).d.results;
			$.each(results, function(){
				options.push({"type" : this.RoleTypeKind, "title" : this.Name, "id": this.Id, "description":this.Description, "json":JSON.stringify(this)});
			});
			$(options).each(function(){
				appendOption(this);
			});
			
			if(defaults == ""){
				try{
					$('#'+id+' select').multiselect('refresh');
				}catch(err){
					console.log(err);
				}
			}else{
				if(typeof(defaults)=="string") defaults = [defaults];
				$(defaults).each(function(){
					if($('#'+id+' select option').filter("option[value='"+this+"']").length != 0){
						$('#'+id+' select option').filter("option[value='"+this+"']").each(function(){
							this.selected = 'selected';
						});
					}
				});	
			}
			
			$('#'+id+' select').multiselect({
				header: "Select roles",
				click: function(event, ui){
					if($(this).multiselect("widget").find("input:checked").length > 1){
						alert("Choose only one");
						return false;
					}
				}
			}).multiselectfilter();
			$('#'+id+' input')[0].onclick = schGlobal.getButtonOnClick;
			
			
			return "schRoles id: "+id+" Loaded";
		}
	};
	
	schGlobal.rolesLoadSuccess = function(data){
		console.log(data);
	};
})(schGlobal);