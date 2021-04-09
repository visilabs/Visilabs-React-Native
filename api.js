import { Platform } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
var querystring = require('querystring');

function checkStatus(response) {
	if (response.status >= 200 && response.status < 300) {
		return response
	} else {
		var error = new Error(response.statusText)
		error.response = response
		throw error
	}
}

var create_api = function(organizationID, siteID, segmentURL, dataSource, realTimeURL, channel, euroMsgApplicationKey, euroMsgSubscriptionURL, euroMsgRetentionURL, local) {

	const sdkVersion = "1.0.34";
	const euroSubscriptionKey = "subscription";
	const suggestActionsKey = 'suggestActionsParams';

	let runController = 0, _VTObjsID = 0;

	var api = {};
	var keysToBeStored = ["OM.cookieID", "OM.exVisitorID", "OM.sys.AppID", "OM.sys.TokenID", "OM.channel", "OM.vchannel"];
	const keysToBeStoredForActjs = ["OM.voss","OM.vcname","OM.vcmedium","OM.vcsource","OM.vpv","OM.lpvs","OM.lpp","OM.vq","OM.vrDomain"];

	if(!organizationID || !siteID || !segmentURL || !dataSource || !realTimeURL || !channel || !euroMsgApplicationKey || !euroMsgSubscriptionURL || !euroMsgRetentionURL) {
		throw new Error("Missing parameters (Visilabs)!");
	}

	api.organizationID = organizationID;
	api.siteID = siteID;
	api.segmentURL = segmentURL;
	api.dataSource = dataSource;
	api.realTimeURL = realTimeURL;
	api.suggestActionURL = "http://s.visilabs.net/";
	api.suggestActionMobileURL = "https://s.visilabs.net/mobile";
	api.channel = channel;
	api.euroMsgApplicationKey = euroMsgApplicationKey;
	api.euroMsgSubscriptionURL = euroMsgSubscriptionURL;
	api.euroMsgRetentionURL = euroMsgRetentionURL;
	api.local = local;

	AsyncStorage.setItem("OM.vchannel", channel);



	var guid = function(){
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};

	var send = function(url, method, data, callback){
		var options = {};
		options["method"] = method == null ? "GET" : method;
		
		if(method === "POST"){
			options["headers"] = { "Content-Type" : "application/json", "Cache-Control" : "no-cache"}
		}

		if(data) { 
			options["body"] = JSON.stringify(data); 
		}
		fetch(url, options)
			.then(d => { callback(d);})
			.catch(err => {
				callback(err);
			});
	};

	var setCookieID = function(){
		var cookieID = guid();
		AsyncStorage.setItem("OM.cookieID", cookieID);
		return cookieID;
	}

	var isEmptyOrSpaces = function (str){
		return (str === undefined ||  str === null) || str.match(/^ *$/) !== null;
	}

	const getCustomTime = () => {
		var d = new Date();
		var date_format_str = d.getFullYear().toString() + "-" + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-" + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" + ((d.getMinutes()).toString().length == 2 ? (d.getMinutes()).toString() : "0" + (d.getMinutes()).toString()) + ":" + (d.getSeconds()).toString();
		return date_format_str
	}

	api.suggestActionsParams = { // api olduktan sonra bozulan bir parametre oldu mu kontrol et. İçeride erişilemeyen function var mı?
		set: async function (data) {
			if (!data) return

			AsyncStorage.setItem(suggestActionsKey, JSON.stringify(data));
		},
		get: async function () {
			return JSON.parse(await AsyncStorage.getItem(suggestActionsKey));
		},
		check: async function (clientData, story = false, callback = () => {}) {
			this.get().then((storageParams)=>{
				let storageParameters = storageParams ? storageParams : {}
				let clientParameters = clientData ? clientData : {}

				let convertedClientParams = convertParams(clientParameters);

				let lpvsArr = [];

				if (storageParameters["OM.lpvs"]) 
					lpvsArr = perseObjectLPVS(decodeURI(storageParameters["OM.lpvs"]))
				

				if (convertedClientParams["OM.vpv"]) {
					if (checkAlreadyDefined(convertedClientParams["OM.vpv"],lpvsArr)) {
						lpvsArr = isAlreadyDefined(convertedClientParams["OM.vpv"],lpvsArr)
					}
					else{
						if (lpvsArr.length >= 10) {
							lpvsArr.pop();
						}

						lpvsArr.unshift({
							eventId:convertedClientParams["OM.vpv"],
							date:getCustomTime()
						})
					}
				}

				let lpvs = objectArrayToString(lpvsArr)

				if (lpvs) {
					convertedClientParams["OM.lpvs"] = encodeURI(lpvs)
				}
			
				let requestParams = joinObjectArrays(storageParameters, convertedClientParams);

				requestParams["OM.obj"] = '_VTObjs["_VisilabsTarget_'+_VTObjsID+'"]';

				const parametersToStorage = paramsToStorage(requestParams);

				this.set(parametersToStorage);

                if (story) {
                    api.sendRequest(requestParams, (response)=>{
                        if(!response) return

                        callback(response);
                        _VTObjsID++;
                    }, true, true);
                }else{
                    api.sendRequest(requestParams, (response)=>{
                        _VTObjsID++;
                    }, true);
                }
				

			})
		},
		delete: async function () {
			AsyncStorage.removeItem(suggestActionsKey)
		}
	}
	
	function convertParams(data) {
		let obj = {
			"OM.voss":data["OM.OSS"] ? data["OM.OSS"] : null,
			"OM.vcname":data["OM.cname"] ? data["OM.cname"] : null,
			"OM.vcmedium":data["OM.cmedium"] ? data["OM.cmedium"] : null,
			"OM.vcsource":data["OM.csource"] ? data["OM.csource"] : null,
			"OM.vpv":data["OM.pv"] ? data["OM.pv"] : null,
			"OM.lpp":data["OM.pp"] ? (data["OM.ppr"] ? data["OM.pp"]+"|"+data["OM.ppr"]+"|"+getCustomTime() : data["OM.pp"]) : null, // son 1 ürün
			"OM.vq":data["OM.q"] ? data["OM.q"] : null,
			"OM.vrDomain":data["OM.rDomain"] ? data["OM.rDomain"] : null,
			...data
		}

		for (var prop in obj) {
			if (!obj[prop]) 
				delete obj[prop];
		}

		return obj
	}
	
	function perseObjectLPVS(lpvs) {
		if(!lpvs) return

		let products = [], resultArr = [];
		products = lpvs.split('~');
		products.forEach(product => {
			let productDetail = product.split('|');
			resultArr.push(
				{
					eventId:productDetail[0],
					date:productDetail[1]
				}
			)
		});

		return resultArr
	}

	function objectArrayToString(arr) {
		if(!arr) return

		let resultArr = arr.map(function(product) {
			return product['eventId']+"|"+product['date'];
		});

		let resultString = resultArr.join('~')
		
		return resultString
	}

	function checkAlreadyDefined(id,arr) {
		let result=false;

		arr.forEach(product => {
			if (product.eventId == id) {
				result = true
			}
		});

		return result
	}

	function isAlreadyDefined(id,arr) {
		let alreadyDefinedProduct;

		arr.forEach(product => {
			if (product.eventId == id) {
				alreadyDefinedProduct = product;
				const index = arr.indexOf(product);
				if (index > -1) {
					arr.splice(index, 1);
				}
			}
		});

		if (alreadyDefinedProduct) {
			alreadyDefinedProduct.date = getCustomTime();
			arr.unshift(alreadyDefinedProduct)
		}
		
		return arr
	}

	function paramsToStorage(params) {
		let resutlArr = {}

		for (let i = 0; i < keysToBeStoredForActjs.length-1; i++) {
			if (params[keysToBeStoredForActjs[i]] != undefined) {
				resutlArr[keysToBeStoredForActjs[i]] = params[keysToBeStoredForActjs[i]]
			}
		}
		
		return resutlArr
	}

	function joinObjectArrays(obj1,obj2) {
		if (!obj1 || !obj1) return 

		var obj3 = {};
		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }

		return obj3;
	}

	api.sendRequest = function(data, callback, targetAction = false, story = false) {
		callback = callback || function() {};
		data["OM.vchannel"] = api.channel;
		var valuesToSet = [];

		for(var i = 0; i < keysToBeStored.length; i++){
			if(data[keysToBeStored[i]] != undefined){
				valuesToSet.push([keysToBeStored[i], data[keysToBeStored[i]]]);
				delete data[keysToBeStored[i]];
			}
		}

		data["OM.siteID"] = api.siteID;
		data["OM.oid"] = api.organizationID;

		AsyncStorage.getItem("OM.exVisitorID").then(exVisitorID => {
			AsyncStorage.multiSet(valuesToSet).finally(error => {
				AsyncStorage.multiGet(keysToBeStored).then(response => {
					for(var j = 0; j < response.length; j++){
						if(response[j][1] != null)
							data[response[j][0]] = response[j][1];
					}

					if(!data["OM.cookieID"] || (!isEmptyOrSpaces(exVisitorID) && !isEmptyOrSpaces(data["OM.exVisitorID"]) && exVisitorID != data["OM.exVisitorID"])){
						data["OM.cookieID"] = setCookieID();
					}

					if (targetAction) {
                        if (story) {
                            var sUrl = api.suggestActionMobileURL + "?" + querystring.stringify(data);
						    send(sUrl, "GET", null, callback);
                        }else{
                            var sUrl = api.suggestActionURL + "act.js?" + querystring.stringify(data); // actjson yap
                            send(sUrl, "GET", null, callback);
                        }

					}else{
						var lgrUrl = api.segmentURL + "/" + api.dataSource + "/om.gif?" + querystring.stringify(data);
						var rtUrl = api.realTimeURL + "/" + api.dataSource + "/om.gif?" + querystring.stringify(data);
					
						send(lgrUrl, "GET", null, callback);
						send(rtUrl, "GET", null, callback);
					}
				});

			});
		});

	};

	api.customEvent = function(pageName, properties, callback) {
		if (!properties || typeof properties === "function") {
			callback = properties;
			properties = {};
		}
		properties["OM.uri"] = pageName;
		api.suggestActionsParams.check(properties);
		api.sendRequest(properties, callback);
	};

	api.registerToken = function(appAlias, token, callback) {
		var properties = {};
		properties["OM.sys.AppID"] = appAlias;
		properties["OM.sys.TokenID"] = token;
		api.customEvent("RegisterToken", properties, callback);
	};

	api.login = function(exVisitorID, properties, callback) {
		if(properties == null)
			properties = {};
		properties["OM.exVisitorID"] = exVisitorID;
		properties["Login"] = exVisitorID;
		properties["OM.b_login"] = "Login";
		api.customEvent("LoginPage", properties, callback);
	};

	api.signUp = function(exVisitorID, properties, callback) {
		if(properties == null)
			properties = {};
		properties["OM.exVisitorID"] = exVisitorID;
		properties["SignUp"] = exVisitorID;
		properties["OM.b_sgnp"] = "SignUp";
		api.customEvent("SignUpPage", properties, callback);
	};


	api.getExVisitorIDasync = async function () {
		return await AsyncStorage.getItem('OM.exVisitorID');
	};

	api.clearIDs = function () {
		AsyncStorage.multiGet(["OM.exVisitorID", "OM.cookieID"]).then(idArr => {

			api.customEvent("ClearIDs", {
				"OM.ClearIDs":"1",
				"OM.exVisitorID": idArr[0][1],
				"OM.cookieID": idArr[1][1]
			}, function () {
				if (runController % 2 == 0) {
					runController++;
					AsyncStorage.removeItem("OM.exVisitorID"),
					AsyncStorage.removeItem("OM.cookieID").then(res => setCookieID())
				}
			})

		})
	}

	api.getIDsAsync = async function () {
		return await AsyncStorage.multiGet(["OM.exVisitorID", "OM.cookieID"])
	}


	api.euromsg = {
		
		setUser : function(user){

			if(user === undefined)
				return;
			
			AsyncStorage.getItem(euroSubscriptionKey).then(subscriptionString => {
				var subscription = JSON.parse(subscriptionString);
				if(!subscription){
					subscription = {};
				}
					// subscription["appVersion"] = isEmptyOrSpaces(subscription["appVersion"]) ? Constants.manifest.version : subscription["appVersion"];
					subscription["appKey"] = api.euroMsgApplicationKey;
					subscription["os"] = Platform.OS;
					// subscription["deviceType"] = Constants.deviceName;
					// subscription["deviceName"] = Constants.deviceName;
					subscription["carrier"] = "";  //TODO: 
					subscription["local"] = api.local;
					subscription["identifierForVendor"] = Constants.deviceId;
					subscription["advertisingIdentifier"] = ""; //TODO:
					subscription["sdkVersion"] = sdkVersion;
					subscription["firstTime"] = 1;
					subscription["identifierForVendor"] = Constants.deviceId;

				if(!subscription["extra"]){
					subscription["extra"] = {};
				}
				
				if(user["keyID"] != undefined)
					subscription["extra"]["keyID"] = user["keyID"];
					
				if(user["email"] != undefined)
					subscription["extra"]["email"] = user["email"];

				if(user["token"] != undefined && user["token"] != null)
					subscription["token"] = user["token"];
					
				if(user["pushPermit"] != undefined && user["pushPermit"] != null)
					subscription["extra"]['pushPermit'] = user["pushPermit"]

				if(user["gsmPermit"] != undefined && user["gsmPermit"] != null)
					subscription["extra"]['gsmPermit'] = user["gsmPermit"]

				if(user["emailPermit"] != undefined && user["emailPermit"] != null)
					subscription["extra"]['emailPermit'] = user["emailPermit"]
					
				send(api.euroMsgSubscriptionURL, "POST", subscription, function() {});
				AsyncStorage.setItem(euroSubscriptionKey, JSON.stringify(subscription));
			});
		},

		subscribe: function(token) {
			AsyncStorage.getItem(euroSubscriptionKey).then(subscriptionString => {
				var subscription = JSON.parse(subscriptionString);
				try {
					if(!subscription){
						subscription = {};
					}

					// if(Constants.platform.ios !== undefined){
					// 	subscription["osVersion"] = Constants.platform.ios.systemVersion === undefined ? "" : Constants.platform.ios.systemVersion;
					// }
					// else if(Constants.platform.android !== undefined){
					// 	subscription["osVersion"] = Constants.platform.android.systemVersion === undefined ? "" : Constants.platform.android.systemVersion;
					// }
					
					subscription["token"] = token;
					// subscription["appVersion"] = isEmptyOrSpaces(subscription["appVersion"]) ? Constants.manifest.version : subscription["appVersion"];
					subscription["appKey"] = api.euroMsgApplicationKey;
					subscription["os"] = Platform.OS;
					// subscription["deviceType"] = Constants.deviceName;
					// subscription["deviceName"] = Constants.deviceName;
					subscription["carrier"] = "";  //TODO: 
					subscription["local"] = api.local;
					subscription["identifierForVendor"] = Constants.deviceId;
					subscription["advertisingIdentifier"] = ""; //TODO:
					subscription["sdkVersion"] = sdkVersion;
					subscription["firstTime"] = 1;
					subscription["identifierForVendor"] = Constants.deviceId;
					if(subscription["extra"] === undefined)
						subscription["extra"] = {};
					
					if(subscription["extra"]['pushPermit'] !== undefined && subscription["extra"]['pushPermit'] !== null)
						subscription["extra"]['pushPermit'] = subscription["extra"]['pushPermit'];

					if(subscription["extra"]['gsmPermit'] !== undefined && subscription["extra"]['gsmPermit'] !== null)
						subscription["extra"]['gsmPermit'] = subscription["extra"]['gsmPermit'];
						
					if(subscription["extra"]['emailPermit'] !== undefined && subscription["extra"]['emailPermit'] !== null)
						subscription["extra"]['emailPermit'] = subscription["extra"]['emailPermit'];
					
					send(api.euroMsgSubscriptionURL, "POST", subscription, function() {});
					AsyncStorage.setItem(euroSubscriptionKey, JSON.stringify(subscription));

				} catch (error) { }	
			});

		},

		reportRead : function(pushId){
			if(!pushId) new Error("PushId missing!");

			AsyncStorage.getItem(euroSubscriptionKey).then(subscriptionString => {
				var subscription = JSON.parse(subscriptionString);
				var retention = {};
				retention["key"] = api.euroMsgApplicationKey;
				retention["pushId"] = pushId;
				retention["status"] = "O";
				var subscription = JSON.parse(subscriptionString);
				if(subscription){
					retention["token"] = subscription["token"];
				}

				send(api.euroMsgRetentionURL, "POST", retention, function() {});
			});
		},

		removeUserProperties : function(){
			AsyncStorage.getItem(euroSubscriptionKey).then(subscriptionString => {
				var subscription = JSON.parse(subscriptionString);
				if(!subscription){
					subscription = {};
				}
				if(subscription["extra"]){
					subscription["extra"] = {};
				}
				AsyncStorage.setItem(euroSubscriptionKey, JSON.stringify(subscription));
			});
		}

	}

	return api;
}

module.exports = {
	create_api: create_api
};