@import "delegate.js";

var sketch = require("sketch");

var pluginName = "Presto Selecto";
var pluginDomain = "com.sonburn.sketchplugins.presto-selecto";

var layerLabels = ["Everything","Artboards","Groups","Shape Group","Shape Path","Slices","Symbol Instances","Symbol Masters","Text Layers"];
var layerTypes = ["*","MSArtboardGroup","MSLayerGroup","MSShapeGroup",["MSShapePathLayer","MSOvalShape","MSPolygonShape","MSRectangleShape","MSStarShape","MSTriangleShape"],"MSSliceLayer","MSSymbolInstance","MSSymbolMaster","MSTextLayer"];
var targetLabels = ["Page","Selection"];
var parentLabels = ["Artboard","Group"];
var parentTypes = ["parentArtboard.name","parentGroup.name"];
var matchTypes = ["is","is not","contains","begins with","ends with"];
var matchFormats = ["==","!=","CONTAINS","BEGINSWITH","ENDSWITH"];
var debugMode = false;

var windowWidth = 400;

var select = function(context) {
	var defaultSettings = {};

	defaultSettings.layerClassSelect = 0;
	defaultSettings.layerTargetSelect = 0;
	defaultSettings.layerMatchToggle = 0;
	defaultSettings.layerMatchSelect = 0;
	defaultSettings.layerMatchString = "";
	defaultSettings.parentIncludeToggle = 0;
	defaultSettings.parentClassSelect = 0;
	defaultSettings.parentAncestorToggle = 0;
	defaultSettings.parentMatchToggle = 0;
	defaultSettings.parentMatchSelect = 0;
	defaultSettings.parentMatchString = "";
	defaultSettings.stringCaseToggle = 0;

	var userSettings = Object.assign({},defaultSettings);

	userSettings = getSettings(context,userSettings);

	var pluginWindow = NSAlert.alloc().init();
	var pluginIconPath = context.plugin.urlForResourceNamed("icon.png").path();
	var pluginIcon = NSImage.alloc().initByReferencingFile(pluginIconPath);
	var pluginContent = createView(NSMakeRect(0,0,windowWidth,186));

	pluginWindow.setIcon(pluginIcon);
	pluginWindow.setMessageText(pluginName);

	var layerClassSelect = createSelect(layerLabels,userSettings.layerClassSelect,NSMakeRect(44,0,128,28));
	var layerTargetSelect = createSelect(targetLabels,userSettings.layerTargetSelect,NSMakeRect(283,0,81,28));
	var layerMatchToggle = createCheckbox({name:"where the name",value:1},userSettings.layerMatchToggle,NSMakeRect(0,38,112,16));
	var layerMatchSelect = createSelect(matchTypes,userSettings.layerMatchSelect,NSMakeRect(118,32,93,28));
	var layerMatchString = createField(userSettings.layerMatchString,"Layer string to match",NSMakeRect(216,34,windowWidth-216,24));
	var parentIncludeToggle = createCheckbox({name:"and has a parent",value:1},userSettings.parentIncludeToggle,NSMakeRect(0,88,116,16));
	var parentClassSelect = createSelect(parentLabels,userSettings.parentClassSelect,NSMakeRect(121,82,79,28));
	var parentAncestorToggle = createCheckbox({name:"include ancestors",value:1},userSettings.parentAncestorToggle,NSMakeRect(205,88,121,16));
	var parentMatchToggle = createCheckbox({name:"where the name",value:1},userSettings.parentMatchToggle,NSMakeRect(0,120,112,16));
	var parentMatchSelect = createSelect(matchTypes,userSettings.parentMatchSelect,NSMakeRect(118,114,93,28));
	var parentMatchString = createField(userSettings.parentMatchString,"Parent string to match",NSMakeRect(216,116,windowWidth-216,24));
	var stringCaseToggle = createCheckbox({name:"Case sensitive",value:1},userSettings.stringCaseToggle,NSMakeRect(0,170,windowWidth,16));

	var layerClassSelectDelegate = new MochaJSDelegate({
		"comboBoxSelectionDidChange:" : (function() {
			if (layerClassSelect.indexOfSelectedItem() == 1) {
				parentIncludeToggle.setState(0);
				parentIncludeToggle.setEnabled(0);
				parentClassSelect.setEnabled(0);
				parentAncestorToggle.setEnabled(0);
				parentMatchToggle.setEnabled(0);
				parentMatchSelect.setEnabled(0);
				parentMatchString.setEnabled(0);
			} else {
				parentIncludeToggle.setEnabled(1);
			}
		})
	});

	layerClassSelect.setDelegate(layerClassSelectDelegate.getClassInstance());

	var parentClassSelectDelegate = new MochaJSDelegate({
		"comboBoxSelectionDidChange:" : (function() {
			if (parentClassSelect.indexOfSelectedItem() == 1) {
				parentAncestorToggle.setEnabled(1);
			} else {
				parentAncestorToggle.setEnabled(0);
			}
		})
	});

	parentClassSelect.setDelegate(parentClassSelectDelegate.getClassInstance());

	parentIncludeToggle.setAction("callAction:");
	parentIncludeToggle.setCOSJSTargetFunction(function(sender) {
		if (sender.state() == 1) {
			parentClassSelect.setEnabled(1);
			parentMatchToggle.setEnabled(1);
			parentMatchSelect.setEnabled(1);
			parentMatchString.setEnabled(1);

			if (parentClassSelect.indexOfSelectedItem() == 1) {
				parentAncestorToggle.setEnabled(1);
			} else {
				parentAncestorToggle.setEnabled(0);
			}
		} else {
			parentClassSelect.setEnabled(0);
			parentAncestorToggle.setEnabled(0);
			parentMatchToggle.setEnabled(0);
			parentMatchSelect.setEnabled(0);
			parentMatchString.setEnabled(0);
		}
	});

	if (userSettings.layerClassSelect == 1) {
		parentIncludeToggle.setEnabled(0);
	}

	if (userSettings.parentIncludeToggle == 0) {
		parentClassSelect.setEnabled(0);
		parentMatchToggle.setEnabled(0);
		parentMatchSelect.setEnabled(0);
		parentMatchString.setEnabled(0);
		parentAncestorToggle.setEnabled(0);
	} else {
		if (parentClassSelect.indexOfSelectedItem() == 1) {
			parentAncestorToggle.setEnabled(1);
		} else {
			parentAncestorToggle.setEnabled(0);
		}
	}

	pluginContent.addSubview(createLabel("Select",NSMakeRect(0,5,40,28)));
	pluginContent.addSubview(layerClassSelect);
	pluginContent.addSubview(createLabel("within the current",NSMakeRect(174,5,104,28)));
	pluginContent.addSubview(layerTargetSelect);
	pluginContent.addSubview(layerMatchToggle);
	pluginContent.addSubview(layerMatchSelect);
	pluginContent.addSubview(layerMatchString);
	pluginContent.addSubview(createDivider(NSMakeRect(0,70,windowWidth,1)));
	pluginContent.addSubview(parentIncludeToggle);
	pluginContent.addSubview(parentClassSelect);
	pluginContent.addSubview(parentAncestorToggle);
	pluginContent.addSubview(parentMatchToggle);
	pluginContent.addSubview(parentMatchSelect);
	pluginContent.addSubview(parentMatchString);
	pluginContent.addSubview(createDivider(NSMakeRect(0,152,windowWidth,1)));
	pluginContent.addSubview(stringCaseToggle);

	pluginWindow.setAccessoryView(pluginContent);

	var selectButton = pluginWindow.addButtonWithTitle("Abracadabra!");

	pluginWindow.addButtonWithTitle("Cancel");

	var defaultsButton = pluginWindow.addButtonWithTitle("Defaults");

	defaultsButton.setCOSJSTargetFunction(function() {
		layerClassSelect.selectItemAtIndex(defaultSettings.layerClassSelect);
		layerTargetSelect.selectItemAtIndex(defaultSettings.layerTargetSelect);
		layerMatchToggle.setState(defaultSettings.layerMatchToggle);
		layerMatchSelect.selectItemAtIndex(defaultSettings.layerMatchSelect);
		layerMatchString.setStringValue(defaultSettings.layerMatchString);
		parentIncludeToggle.setState(defaultSettings.parentIncludeToggle);
		parentClassSelect.selectItemAtIndex(defaultSettings.parentClassSelect);
		parentAncestorToggle.setState(defaultSettings.parentAncestorToggle);
		parentMatchToggle.setState(defaultSettings.parentMatchToggle);
		parentMatchSelect.selectItemAtIndex(defaultSettings.parentMatchSelect);
		parentMatchString.setStringValue(defaultSettings.parentMatchString);
		stringCaseToggle.setState(defaultSettings.stringCaseToggle);

		parentClassSelect.setEnabled(0);
		parentAncestorToggle.setEnabled(0);
		parentMatchToggle.setEnabled(0);
		parentMatchSelect.setEnabled(0);
		parentMatchString.setEnabled(0);

		context.command.setValue_forKey_onLayer(nil,"layerClassSelect",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"layerTargetSelect",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"layerMatchToggle",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"layerMatchSelect",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"layerMatchString",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentIncludeToggle",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentClassSelect",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentAncestorToggle",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentMatchToggle",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentMatchSelect",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"parentMatchString",context.document.documentData());
		context.command.setValue_forKey_onLayer(nil,"stringCaseToggle",context.document.documentData());
	});

	setKeyOrder(pluginWindow,[
		layerClassSelect,
		layerTargetSelect,
		layerMatchToggle,
		layerMatchSelect,
		layerMatchString,
		parentIncludeToggle,
		parentClassSelect,
		parentAncestorToggle,
		parentMatchToggle,
		parentMatchSelect,
		parentMatchString,
		stringCaseToggle,
		selectButton
	]);

	windowLoop();

	function windowLoop() {
		var windowStatus = null;

		while (windowStatus == null) {
			var windowResponse = pluginWindow.runModal();

			if (windowResponse == 1000) {
				var layerMatchType = layerTypes[layerClassSelect.indexOfSelectedItem()];
				var layerTargetType = layerTargetSelect.indexOfSelectedItem();
				var layerMatchToggleState = layerMatchToggle.state();
				var layerMatchFormat = matchFormats[layerMatchSelect.indexOfSelectedItem()];
				var layerMatchCase = (stringCaseToggle.state() == 1) ? "" : "[c]";
				var layerMatchValue = layerMatchString.stringValue();
				var parentIncludeToggleState = parentIncludeToggle.state();
				var parentAncestorToggleState = parentAncestorToggle.state();
				var parentMatchToggleState = parentMatchToggle.state();
				var parentMatchTypeValue = parentClassSelect.indexOfSelectedItem();
				var parentMatchType = parentTypes[parentMatchTypeValue];
				var parentMatchFormat = matchFormats[parentMatchSelect.indexOfSelectedItem()];
				var parentMatchCase = (stringCaseToggle.state() == 1) ? "" : "[c]";
				var parentMatchValue = parentMatchString.stringValue();

				if (layerMatchToggleState == 0 && parentIncludeToggleState == 0 ||
					layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchValue != "" ||
					layerMatchToggleState == 1 && layerMatchValue != "" && parentIncludeToggleState == 0 ||
					layerMatchToggleState == 1 && layerMatchValue != "" && parentIncludeToggleState == 1 && parentMatchValue != "") {
					windowStatus = true;
				}
			} else {
				windowStatus = false;
			}

			switch (windowStatus) {
				case null :
					if (layerMatchToggleState == 1 && layerMatchValue != "") {
						sketch.UI.alert(pluginName,"Please provide a layer string to search for.");
					} else {
						sketch.UI.alert(pluginName,"Please provide a parent string to search for.");
					}

					break;
				case true :
					context.command.setValue_forKey_onLayer(layerClassSelect.indexOfSelectedItem(),"layerClassSelect",context.document.documentData());
					context.command.setValue_forKey_onLayer(layerTargetSelect.indexOfSelectedItem(),"layerTargetSelect",context.document.documentData());
					context.command.setValue_forKey_onLayer(layerMatchToggle.state(),"layerMatchToggle",context.document.documentData());
					context.command.setValue_forKey_onLayer(layerMatchSelect.indexOfSelectedItem(),"layerMatchSelect",context.document.documentData());
					context.command.setValue_forKey_onLayer(layerMatchString.stringValue(),"layerMatchString",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentIncludeToggle.state(),"parentIncludeToggle",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentClassSelect.indexOfSelectedItem(),"parentClassSelect",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentAncestorToggle.state(),"parentAncestorToggle",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentMatchToggle.state(),"parentMatchToggle",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentMatchSelect.indexOfSelectedItem(),"parentMatchSelect",context.document.documentData());
					context.command.setValue_forKey_onLayer(parentMatchString.stringValue(),"parentMatchString",context.document.documentData());
					context.command.setValue_forKey_onLayer(stringCaseToggle.state(),"stringCaseToggle",context.document.documentData());

					context.command.setValue_forKey_onLayer(nil,"layerTargetType",context.document.documentData());

					var page = context.document.currentPage();
					var predicate;
					var matches;
					var ancestorFilter = false;

					let compareType = (layerMatchType instanceof Array) ? 'IN' : 'LIKE'

					if (layerMatchToggleState == 0 && parentIncludeToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@",layerMatchType);
					} else if (layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchTypeValue == 0 && parentMatchToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND parentArtboard != nil",layerMatchType);
					} else if (layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchTypeValue == 0 && parentMatchToggleState == 1) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND parentArtboard != nil AND " + parentMatchType + " " + parentMatchFormat + parentMatchCase + " %@",layerMatchType,parentMatchValue);
					} else if (layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND parentGroup.className == %@",layerMatchType,"MSLayerGroup");
					} else if (layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 1 && parentAncestorToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND parentGroup.className == %@ AND " + parentMatchType + " " + parentMatchFormat + parentMatchCase + " %@",layerMatchType,"MSLayerGroup",parentMatchValue);
					} else if (layerMatchToggleState == 0 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 1 && parentAncestorToggleState == 1) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND parentGroup.className == %@",layerMatchType,"MSLayerGroup");
						ancestorFilter = true;
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@",layerMatchType,layerMatchValue);
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 1 && parentMatchTypeValue == 0 && parentMatchToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@ AND parentArtboard != nil",layerMatchType,layerMatchValue);
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 1 && parentMatchTypeValue == 0 && parentMatchToggleState == 1) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@ AND parentArtboard != nil AND " + parentMatchType + " " + parentMatchFormat + parentMatchCase + " %@",layerMatchType,layerMatchValue,parentMatchValue);
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@ AND parentGroup.className == %@",layerMatchType,layerMatchValue,"MSLayerGroup");
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 1 && parentAncestorToggleState == 0) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@ AND parentGroup.className == %@ AND " + parentMatchType + " " + parentMatchFormat + parentMatchCase + " %@",layerMatchType,layerMatchValue,"MSLayerGroup",parentMatchValue);
					} else if (layerMatchToggleState == 1 && parentIncludeToggleState == 1 && parentMatchTypeValue == 1 && parentMatchToggleState == 1 && parentAncestorToggleState == 1) {
						predicate = NSPredicate.predicateWithFormat("className " + compareType + " %@ AND name " + layerMatchFormat + layerMatchCase + " %@ AND parentGroup.className == %@",layerMatchType,layerMatchValue,"MSLayerGroup");
						ancestorFilter = true;
					}

					if (layerTargetType == 0) {
						matches = page.children().filteredArrayUsingPredicate(predicate);
					} else {
						matches = NSMutableArray.array();

						context.selection.filteredArrayUsingPredicate(predicate).forEach(match => matches.addObject(match));

						context.selection.forEach(function(selection){
							selection.children().filteredArrayUsingPredicate(predicate).forEach(match => matches.addObject(match));
						});
					}

					if (ancestorFilter) {
						var matchesWithAncestors = NSMutableArray.array();
						var loop = matches.objectEnumerator();
						var match;

						while (match = loop.nextObject()) {
							var predicate = NSPredicate.predicateWithFormat("name " + parentMatchFormat + parentMatchCase + " %@",parentMatchValue),
								ancestors = match.ancestors().filteredArrayUsingPredicate(predicate);

							if (ancestors.count() > 0) {
								matchesWithAncestors.addObject(match);
							}
						}

						matches = matchesWithAncestors;
					}

					var loop = matches.objectEnumerator();
					var match;
					var count = 0;

					page.changeSelectionBySelectingLayers(nil);

					while (match = loop.nextObject()) {
						match.select_byExtendingSelection(1,1);
						count++;
					}

					if (count == 1) {
						sketch.UI.message(matches.count() + " match selected");
					} else if (count > 1) {
						sketch.UI.message(matches.count() + " matches selected");
					} else {
						sketch.UI.message("No matches found");
					}

					if (!debugMode) googleAnalytics(context,"select","run");

					break;
				case false :
					break;
			}
		}
	}
}

var report = function(context) {
	openUrl("https://github.com/sonburn/presto-selecto/issues/new");

	if (!debugMode) googleAnalytics(context,"report","report");
}

var plugins = function(context) {
	openUrl("https://sonburn.github.io/");

	if (!debugMode) googleAnalytics(context,"plugins","plugins");
}

var donate = function(context) {
	openUrl("https://www.paypal.me/sonburn");

	if (!debugMode) googleAnalytics(context,"donate","donate");
}

function createCheckbox(item,flag,frame) {
	var checkbox = NSButton.alloc().initWithFrame(frame);
	var flag = (flag == false) ? NSOffState : NSOnState;

	checkbox.setButtonType(NSSwitchButton);
	checkbox.setBezelStyle(0);
	checkbox.setTitle(item.name);
	checkbox.setTag(item.value);
	checkbox.setState(flag);

	return checkbox;
}

function createDivider(frame) {
	var divider = NSView.alloc().initWithFrame(frame);

	divider.setWantsLayer(1);
	divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));

	return divider;
}

function createField(string,placeholder,frame) {
	var textField = NSTextField.alloc().initWithFrame(frame);

	textField.setStringValue(string);
	textField.setPlaceholderString(placeholder);

	return textField;
}

function createLabel(string,frame) {
	var textLabel = NSTextField.alloc().initWithFrame(frame);

	textLabel.setStringValue(string);
	textLabel.setBezeled(0);
	textLabel.setEditable(0);
	textLabel.setDrawsBackground(0);

	return textLabel;
}

function createSelect(items,selection,frame) {
	var comboBox = NSComboBox.alloc().initWithFrame(frame);
	var selection = (selection > -1) ? selection : 0;

	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selection);
	comboBox.setNumberOfVisibleItems(12);

	return comboBox;
}

function createView(frame) {
	var view = NSView.alloc().initWithFrame(frame);

	view.setFlipped(1);

	return view;
}

function getSettings(context,settings) {
	try {
		for (i in settings) {
			var value = context.command.valueForKey_onLayer_forPluginIdentifier(i,context.document.documentData(),pluginDomain);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log("There was a problem fetching cached settings.");
	}
}

function googleAnalytics(context,category,action,label,value) {
	var trackingID = "UA-118972367-1";
	var uuidKey = "google.analytics.uuid";
	var uuid = NSUserDefaults.standardUserDefaults().objectForKey(uuidKey);

	if (!uuid) {
		uuid = NSUUID.UUID().UUIDString();
		NSUserDefaults.standardUserDefaults().setObject_forKey(uuid,uuidKey);
	}

	var url = "https://www.google-analytics.com/collect?v=1";
	// Tracking ID
	url += "&tid=" + trackingID;
	// Source
	url += "&ds=sketch" + sketch.version.sketch;
	// Client ID
	url += "&cid=" + uuid;
	// pageview, screenview, event, transaction, item, social, exception, timing
	url += "&t=event";
	// App Name
	url += "&an=" + encodeURI(context.plugin.name());
	// App ID
	url += "&aid=" + context.plugin.identifier();
	// App Version
	url += "&av=" + context.plugin.version();
	// Event category
	url += "&ec=" + encodeURI(category);
	// Event action
	url += "&ea=" + encodeURI(action);
	// Event label
	if (label) {
		url += "&el=" + encodeURI(label);
	}
	// Event value
	if (value) {
		url += "&ev=" + encodeURI(value);
	}

	var session = NSURLSession.sharedSession();
	var task = session.dataTaskWithURL(NSURL.URLWithString(NSString.stringWithString(url)));

	task.resume();
}

function openUrl(url) {
	NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
}

function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i];
		var nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.window().setInitialFirstResponder(order[0]);
}
