(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * 
 */
var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');
var Promise = require('es6-promise').Promise;

/**
 * 這是一個 singleton 物件
 */
var AppActionCreators = {

    /**
     * app 啟動後，第一次載入資料
     */
    load: function(){
		//        
    },

    /**
     * 
     */
    ShiftLeft: function(key, itemList) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.List_ShiftLeft,
            key: key,
            itemList: itemList
        })
    },
    ShiftRight: function(key, itemList) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.List_ShiftRight,
            key: key,
            itemList: itemList
        })
    }


};

module.exports = AppActionCreators;

},{"../constants/AppConstants":3,"../dispatcher/AppDispatcher":4,"es6-promise":21}],2:[function(require,module,exports){
/*
 * 這裏是整支程式的進入點，它負責建立 root view，
 * 也就是 MainApp 元件，將它建立起來放到畫面上
 *
 * boot.js 存在的目地，是因為通常 app 啟動時有許多先期工作要完成，
 * 例如預載資料到 store 內、檢查本地端 db 狀態、切換不同語系字串、
 * 這些工作都先在 boot.js 內做完，再啟動 root view 是比較理想的流程
 * 
 */

// v0.12 開始要用 createFactory 包一次才能使用元件
// 如果不希望這麼麻煩，只要在每份 js 裏都加下面這句即可，但它有缺點
// var React = require('react');
// 
// 因為 require('...') 只是拿到一份元件定義檔，無法直接使用
// 要用它建立一個 factory，之後才能產出 instance，下面 createFactory() 就是在建立工廠
var AdWall = React.createFactory(require("./views/AdWall.jsx"));
//引入資料
var adLoader = require('./stores/adloader.js');

$(function(){
	//執行function，發送api抓資料處理後存到TagtooAdWall.adDate.itemList中
	adLoader.loadJQ()

	// create container dom element
	var body = document.getElementsByTagName("body")[0],
		node = document.createElement("section"),
		id = document.createAttribute("id");
	id.value = "container";
	node.setAttributeNode(id);
	body.insertBefore(node, body.childNodes[0]);

	var t = setInterval(function () {
		//確認api抓的資料有存到TagtooAdWall.adData.itemList之中
		var complete = TagtooAdWall.adData.itemList.row_1 && TagtooAdWall.adData.itemList.row_2 && TagtooAdWall.adData.itemList.row_3;
		
		if(complete){

			// 幫我建立mainapp元件，放到container中
			React.render( AdWall(), document.getElementById("container") );

			//停止setInterval中的function
			clearInterval(t);
		}
	}, 500);

})

},{"./stores/adloader.js":6,"./views/AdWall.jsx":7}],3:[function(require,module,exports){
/**
 * TodoConstants
 */
 var keyMirror = function(obj) {
   var ret = {};
   var key;
   for (key in obj) {
     if (!obj.hasOwnProperty(key)) {
       continue;
     }
     ret[key] = key;
   }
   return ret;
 };

// Constructs an enumeration with keys equal to their value.
// 也就是讓 hash 的 key 與 value 值一樣
// 不然原本 value 都是 null
// 不過既然如此，為何不乾脆用 set 之類只有key 的就好
module.exports = keyMirror({

  	SOURCE_VIEW_ACTION: null,
  	SOURCE_SERVER_ACTION: null,
  	SOURCE_ROUTER_ACTION: null,

  	CHANGE_EVENT: null,
  	
    List_ShiftLeft: null,

    List_ShiftRight: null,

});


},{}],4:[function(require,module,exports){

var AppConstants = require('../constants/AppConstants');

var Dispatcher = require('flux').Dispatcher;


/**
 * flux-chat 內最新的 dispatcher
 */
var AppDispatcher = new Dispatcher();

// 注意：這裏等於是繼承 Dispatcher class 身上所有指令，目地是讓此物件俱有廣播能功
// 同樣功能也可用 underscore.extend 或 Object.assign() 做到
// 今天因為有用 jquery 就請它代勞了
$.extend( AppDispatcher, {

    /**
     * @param {object} action The details of the action, including the action's
     * type and additional data coming from the server.
     */
    handleServerAction: function(action) {
        var payload = {
            source: AppConstants.SOURCE_SERVER_ACTION,
            action: action
        };

        this.dispatch(payload);
    },

    /**
     * dispatch(evt)
     */
    handleViewAction: function(action) {
        var payload = {
            source: AppConstants.SOURCE_VIEW_ACTION,
            action: action
        };
        
        this.dispatch(payload);
    },

    /**
     * 將來啟用 router 時，這裏處理所有 router event
     */
    handleRouterAction: function(path) {
        this.dispatch({
            source: AppConstants.SOURCE_ROUTER_ACTION,
            action: path
        });
    }

});

module.exports = AppDispatcher;

},{"../constants/AppConstants":3,"flux":32}],5:[function(require,module,exports){
/**
 * TodoStore
 */

//========================================================================
//
// IMPORT

var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');
var actions = require('../actions/AppActionCreator');

var EventEmitter = require('events').EventEmitter; // 取得一個 pub/sub 廣播器


//假資料
// var response = require('../stores/test_data.js');
//========================================================================
//
// Private vars

// 等同於 TodoStore extends EventEmitter 
// 從此取得廣播的能力
// 由於將來會返還 TodoStore 出去，因此下面寫的會全變為 public methods
var Store = new EventEmitter();

// 假資料
var arrTodos = null;

// 目前選取的 todo 項目
var selectedItem = null;

// header 裏隨打即查輸入的文字
var searchFilter = '';

// app 第一次啟動時，存入一包 mock data 到 localStorage 供測試
var db = window.localStorage;
if( db.hasOwnProperty('mydb') == false ){
    // console.log( '\n無歷史資料，存入 mock data' );
    db.setItem('mydb', JSON.stringify({todos: [], selectedItem: null}) )
}

// 接著一律從 db 讀取歷史資料
var o = JSON.parse(db.getItem('mydb'));
arrTodos = o.todos ? o.todos : [] ;
selectedItem = o.selectedItem;


//========================================================================
//
// Public API

/**
 * 建立 Store class，並且繼承 EventEMitter 以擁有廣播功能
 */
$.extend( Store, {

    /**
     * Public API
     * 供外界取得 store 內部資料
     */
    getAll: function(){

        return {
                arrTodos: arrTodos,
                selectedItem: selectedItem,
                filter: searchFilter,
                response: TagtooAdWall.adData
        }
        // while(!TagtooAdWall.adData.)



        // return {
        //     arrTodos: arrTodos,
        //     selectedItem: selectedItem,
        //     filter: searchFilter,
        //     response: TagtooAdWall.adData
        // }
    },

    //
    noop: function(){}
});

//========================================================================
//
// event handlers

/**
 * 向 Dispatcher 註冊自已，才能偵聽到系統發出的事件
 * 並且取回 dispatchToken 供日後 async 操作用
 */
Store.dispatchToken = AppDispatcher.register( function eventHandlers(evt){

    // evt .action 就是 view 當時廣播出來的整包物件
    // 它內含 actionType
    var action = evt.action;

    switch (action.actionType) {
        /**
         * 
         */
        case AppConstants.List_ShiftLeft:
            var key = action.key,
                itemList = action.itemList;
            response.itemList[key].ad.splice(0, 0, itemList.pop());
            Store.emit( AppConstants.CHANGE_EVENT );
        
        break;
        /**
         * 
         */
        case AppConstants.List_ShiftRight:
            var key = action.key,
                itemList = action.itemList;
            response.itemList[key].ad.push(itemList.splice(0, 1)[0]);
            Store.emit( AppConstants.CHANGE_EVENT );
        break;
        

        default:
            //
    }

})

//========================================================================
//
// private methods

/**
 * 將資料保存入 localStorage，下次開啟時取回
 */
function persist(){
    db.setItem('mydb', JSON.stringify({todos: arrTodos, selectedItem: selectedItem, response: response}) );
}

//
module.exports = Store;

},{"../actions/AppActionCreator":1,"../constants/AppConstants":3,"../dispatcher/AppDispatcher":4,"events":19}],6:[function(require,module,exports){
//讓TagtooAdWall放到window才能讓tag manager用到這個變數
var TagtooAdWall = window.TagtooAdWall || {};
TagtooAdWall = {
    "adData": {
        "first": {},
        "itemList": {}
    },
    "query": {
    	//發api
        base: function(uri, cb) {
            var setting = {
                type: 'GET',
                url: uri,
                dataType: 'jsonp',
                cache: true,
                jsonpCallback: "a" + uri.replace(/[^\w]/g, '_'),
                success: cb
            }

            $.ajax(setting);
            // $.ajax({
            //     type: 'GET',
            //     url: uri,
            //     dataType: 'jsonp',
            //     cache: true,
            //     //jsonpCallback: "a" + uri.replace(/[^\w]/g, '_'),
            //     success: cb
            // })
        },
        //api有問題

        //items還沒有開所以先用舊的
		//items: function(productKeys,cb) {
		//    TagtooAdWall.query.base(TagtooAdWall.URLBase + "product.items?product_keys=" + productKeys, cb)
		//},
		//recommend還沒有開，所以先用舊的
		//recommend: function(productKeys, cb) {
		//    TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=&recommend=" + productKeys, cb);
		//},
		similar: function(productKeys,cb) {
			//要改掉
			TagtooAdWall.query.base("//ad.tagtoo.co/ad/query/" + "product.simlar?product_key=" + productKeys, cb)
		},
		//rootPage: function(rootPage,cb) {
		//	TagtooAdWall.query.base(TagtooAdWall.URLBase + 'product.key?uri=' + rootPage, cb)
		//},
		keyword: function(keyword,cb) {
			TagtooAdWall.query.base(TagtooAdWall.URLBase + "product.keyword?keyword=" + keyword + "&advertisers=" + advertiser_id + "&require=" + keyword, cb)
		},

		//下面是舊的
        items: function(productKeys, cb) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "get_product_items?items=" + productKeys, cb);
        },
        recommend: function(productKeys, cb) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=&recommend=" + productKeys, cb);
        },
        // similar: function(productKeys, advertiser_id, arg3, cb) {
        //     TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=&simlar=" + productKeys + "&advertiser_id=" + advertiser_id + arg3 || "", cb);
        // },
        //命名疑惑:root=rootpage?
        rootPage: function(productKeys, cb) {
	        TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=&root=" + productKeys, cb);
        },
        adTrack: function(p, ecID) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "ad/track?p=" + p + "&ad=" + ecID, cb);
        },
        backup: function(url, cb) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=" + url, cb);
        }
    },
    init: function() {
        TagtooAdWall.urlOptions = TagtooAdWall.util.decodeQueryData("http://www.cthouse.com.tw/event/103/tatoo/?pid=geosun-cthouse%3Aproduct%3A891598&utm_content=geosun-cthouse%3Aproduct%3A891598%7C0.067525932456"); //要換回document.location.href
        TagtooAdWall.publisher = parseInt(TagtooAdWall.urlOptions.pb || TagtooAdWall.urlOptions.media_id || TagtooAdWall.urlOptions.tagtoo_media_id);
        TagtooAdWall.slot = parseInt(TagtooAdWall.urlOptions.id);
        TagtooAdWall.referer = TagtooAdWall.urlOptions.r || TagtooAdWall.urlOptions.referer;
        TagtooAdWall.request_para = TagtooAdWall.urlOptions.request_para || TagtooAdWall.urlOptions.click;

        if (typeof TagtooAdWall.urlOptions.urlbase != "undefined") {
            TagtooAdWall.URLBase = TagtooAdWall.urlOptions.urlbase;
        } else {
            //TagtooAdWall.URLBase = "//ad.tagtoo.co/ad/query/";
            TagtooAdWall.URLBase = "//ad.tagtoo.co/";
        };
    },
    "util": {
        addHTML: function(templates_fun, data) {
            var html = templates_fun({
                "data": data
            });
            return html
        },
        loadScript: function(url, callback) {
            var script = document.createElement("script")
            script.type = "text/javascript";

            if (script.readyState) {
                // IE
                script.onreadystatechange = function() {
                    if (script.readyState == "loaded" || script.readyState == "complete") {
                        script.onreadystatechange = null;
                        if (typeof callback !== "undefined")
                            callback();
                    }
                };
            } else {
                //Others
                script.onload = function() {
                    if (typeof callback !== "undefined")
                        callback();
                };
            }

            script.src = url;
            document.getElementsByTagName("head")[0].appendChild(script);
        },
        decodeQueryData: function(str) {
            // support parameter extract from both querystring or hash
            // not support multi value for single key yet.
            var data = {};
            var parts = str.split(/[#&\?]/);
            // remove the first part
            parts.shift();

            for (var i = 0; i < parts.length; i++) {
                var vs = parts[i].split('=');
                if (vs.length == 2) {
                    var key = decodeURIComponent(vs[0]);
                    var value = decodeURIComponent(vs[1]);
                    data[key] = value;
                }
            }
            return data
        },
        getInterceptedStr: function(sSource, rows, row_characters) {
            var iLen = rows * row_characters
            if (sSource.replace(/[^\x00-\xff]/g, "xx").length <= iLen) {
                return sSource;
            }

            var str = "";
            var l = 0;
            var schar;
            iLen = iLen - 9;
            for (var i = 0; schar = sSource.charAt(i); i++) {
                str += schar;
                if (schar.match(/[^\x00-\xff]/) == null) {
                    if (schar.match(/\n/) != null) {
                        l = l + row_characters
                    } else {
                        l = l + 1
                    };
                } else {
                    l = l + 2
                };
                if (l >= iLen) {
                    break;
                }
            }

            return str + "...(更多)";
        },
        priceTranslate: function(price) {
            if (price >= 10000) {
                price = Math.round(price / 1000) / 10 + "萬";
                return price;
            } else {
                return price;
            }
        },
        addUtm: function(link) {
            if (link.match(/\?/)) {
                return link + location.search.replace(/([\?&])pid=[^&]*&?/, "$1").replace(/\?/,"&");
            } else {
                return link + location.search.replace(/([\?&])pid=[^&]*&?/, "$1");
            }
        },
        InfoProcess: function(data, titleWords, descriptionWords) {
            if (typeof titleWords == "undefined") {
                var titleWords = {
                    row: 2,
                    rown: 22
                }
            }
            if (typeof descriptionWords == "undefined") {
                var descriptionWords = {
                    row: 2,
                    rown: 22
                }
            }

            for (var i = 0; i < data.length; i++) {
                if (typeof data[i].description != "undefined" && typeof data[i].title != "undefined") {
                    data[i].index = i;//
                    data[i].description = data[i].description.replace(/<li[^>]*>/g, '').replace(/<\/?(ul|li|hr|br)[^>]*>/g, "\n").replace(/<[^>]*>/g, "").replace(/\n(\s*\n)*/g, "\n").replace(/^\s+|\s+$/g, '');
                    data[i].title_short = TagtooAdWall.util.getInterceptedStr(data[i].title, titleWords.row, titleWords.rown);
                    data[i].description_short = TagtooAdWall.util.getInterceptedStr(data[i].description, descriptionWords.row, descriptionWords.rown);
                    data[i].price = TagtooAdWall.util.priceTranslate(data[i].price);
                    data[i].store_price = TagtooAdWall.util.priceTranslate(data[i].store_price);
                    data[i].click_link = TagtooAdWall.util.addUtm(data[i].link);
                }
            }
            return data
        },
        productComplement: function(data, num) {
            if (data.length < num) {
                var l = num - data.length;
                for (var i = 0; i < l; i++) {
                    data.push(TagtooAdWall.backup.pop());
                }
                return data
            } else {
                return data
            }
        },
        bodyOnLoad: function() {
            $("body").css("background", TagtooAdWall.ad_data.background.background);
        }
    },
    // ori_loadAdData: function() {
    //     //儲存backup的array, 用來補足數量不足的ItemList
    //     TagtooAdWall.query.backup(TagtooAdWall.adData.p, function(res) {
    //             TagtooAdWall.backup = TagtooAdWall.util.InfoProcess(res[1].ad);
    //         })
    //     //從url的pid抓第一個商品
    //     TagtooAdWall.query.items(TagtooAdWall.urlOptions.pid, function(res) {
    //         TagtooAdWall.adData.first = TagtooAdWall.util.InfoProcess(res.results[0]);
    //     });
    //     //recommand,similar,rootpage
    //     TagtooAdWall.query.recommend(TagtooAdWall.urlOptions.pid, function(res) {
    //     	//補足不滿6個的ItemList
    //     	var ItemList = TagtooAdWall.util.productComplement(res[1].ad, 6);
    //     	//對itemList中的做一些必要的資料處理
    //     	TagtooAdWall.adData.itemList["row_1"] = TagtooAdWall.util.InfoProcess(ItemList);
    //         })
    //     //100換成TagtooAdWall.ad_data.ecID
    //     TagtooAdWall.query.similar(TagtooAdWall.urlOptions.pid, 100, "&simlar_type=city", function(res) {
    //         //console.log(ItemList)
    //     	var ItemList = TagtooAdWall.util.productComplement(res[1].ad, 6);
    //     	TagtooAdWall.adData.itemList["row_2"] = TagtooAdWall.util.InfoProcess(ItemList);
    //     })
    //     TagtooAdWall.query.rootpage(TagtooAdWall.urlOptions.pid, function(res) {
    //         //console.log(ItemList)
    //     	var ItemList = TagtooAdWall.util.productComplement(res[1].ad, 12);
    //     	TagtooAdWall.adData.itemList["row_3"] = TagtooAdWall.util.InfoProcess(ItemList);
    //     })
    // },
    setItemList: function(data) {
        //recommend抓不到喔
    	$.map(data, function(obj, key) {
    		if (obj.type == "key") {
    			TagtooAdWall.query[obj.name](obj.value, function(res) {
    				//之後api統一之後要砍掉
    				if(res.length == 2) {
    					res = res[1];
    				}
                    TagtooAdWall.adData.itemList[key] = res;
                    var itemList = res.ad;
                    itemList = TagtooAdWall.util.productComplement(itemList, obj.min_num);
                    itemList = TagtooAdWall.util.InfoProcess(itemList);
                    TagtooAdWall.adData.itemList[key].ad = itemList;
    			})
    		} else if (obj.type == "remarketing") {
                TagtooAdWall.query[obj.name](obj.type, function(res) {
                    TagtooAdWall.a = res.a;
                    TagtooAdWall.b = res.b;
                    if (res.product_pool.join('|').match(/:product:|:campaign:/)) {
                        var seenProduct = res.product_pool.join('.');//看過的商品

                        //需要再做確認
                        TagtooAdWall.items(seenProduct, function(res) {
                            res.results = HTMLFilter(res.results);
                            TagtooAdWall.ad_data.itemList[obj.name] = res.results;
                            $("#" + val.name + " .item-img,#" + val.name + " .item-describe,#" + val.name + " .item-more").on("click", function() {
                                var itemId = $(this).closest(".item").attr("item");
                                TagtooAdWall.onClick("remarketing",itemId);
                                window.open(TagtooAdWall.addUtm(TagtooAdWall.ad_data.itemList.Remarketing[itemId].link), '_blank');
                            })
                            TagtooAdWall.remarketingListNumber();
                        });
                    }                })
    		} else if (obj.type == "similar") {

            }
    	})
    },
    track: function() {

    },
    loadAdData: function () {
    	//get first product
        //product_key: TagtooAdWall.urlOptions.pid
        TagtooAdWall.query.items(TagtooAdWall.urlOptions.pid, function(res) {
            console.log(res)
            TagtooAdWall.adData.first = TagtooAdWall.util.InfoProcess(res.results)[0];
        });
    	//get products of rows and store datas
    	TagtooAdWall.setItemList(TagtooAdWall.rowRule);
    },
    loadJQ: function() {
        TagtooAdWall.util.loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js", function() {
            TagtooAdWall.init();
            //將備用商品資料儲存起來, 由於時序問題, 因此不能將get backup的api與get其他ItemList的api在一起發
            if (TagtooAdWall.rowRule.backup) {
    			TagtooAdWall.query.backup(TagtooAdWall.adData.p, function(res) {
	                TagtooAdWall.backup = TagtooAdWall.util.InfoProcess(res[1].ad);
	                TagtooAdWall.loadAdData();
	            })
            } else {
                TagtooAdWall.loadAdData();
            }
        })
    }
}

//模擬GTM會載入的資料
TagtooAdWall.adData.banner = {
    "image_url": "url('//lh3.ggpht.com/gdBrth34d0TnzaLt3wxci6dDvYe0n21UAbOIwNCcVJ4-IDBCAfFY4o6z_adcMQ0zzi0AfFkfcktbtv56EgUBCYOP') no-repeat 50% 50%",
    "link": "http://www.cthouse.com.tw/event/103/aplus/?ctype=B&cid=tagtoo&banner",
    "item_hash": "cthouse_banner",
    "title": "cthouse_banner",
    "qm": "cthouse_banner",
    "qp": "cthouse_banner"
};
TagtooAdWall.adData.logo = {
    "image_url": "url('//lh4.ggpht.com/Z8ItJFZF8tbjzYMsRMpe1h7tP3z0grCZXQW3UgjJZ8A0fLQIw6d6Ha_5ch0JuZlY5tP-il8UpnsoudA7EI0vBw')",
    "link": "//www.cthouse.com.tw/?ctype=B&cid=tagtoo&logo",
    "item_hash": "cthouse_logo",
    "title": "cthouse_logo",
    "qm": "cthouse_logo",
    "qp": "cthouse_logo"
};
//目的是啥
TagtooAdWall.adData.first = {
    "link": "http://www.cthouse.com.tw/",
    "image_url": "",
    "title": "cthouse",
    "store_price": "",
    "store_price": "",
    "price": "",
    "ec_id": 142,//142?????
    "extra": {
        "root": ""
    }
};
TagtooAdWall.adData.background = {
    "image_url": "",
    "link": "",
    "background": "#ebebeb url('//lh5.ggpht.com/C84PNbVRw4EoprIULVe43Zxch1P1bgCiTkbvrzTXvrd0xoQTNZtC_ntcAiPy5McxVAwog-dwrIyGYkxy0sPZCis')",
    "title": "cthouse"
};

//命名？？
TagtooAdWall.adData.p = "http://www.cthouse.com.tw/&debug=true";

TagtooAdWall.adData.ecId = 100;

TagtooAdWall.rowRule = {
	"backup": {
		name: "backup",
	    type: "backup",
	    value: "http://www.cthouse.com.tw/&debug=true"
	},
    "row_1": {
    	name: "recommend",
        type: "key",
        value: "geosun-cthouse:product:891598",
        min_num: 6
    },
    "row_2": {
    	name: "similar",
        type: "key",
        //之後要換回{{pid}}
        value: "geosun-cthouse:product:891598",
        min_num: 6
    },
    "row_3": {
    	name: "rootPage",
        type: "key",
        //之後要換回{{pid}}
        value: "geosun-cthouse:product:891598",
        min_num: 12
    }
}

window.TagtooAdWall = TagtooAdWall;
module.exports = TagtooAdWall;

},{}],7:[function(require,module,exports){
/** @jsx React.DOM *//**
 * 這是 root view，也稱為 controller-view
 */


//========================================================================
//
// import 

// var React = require('react');

var TopBox = React.createFactory( require('./TopBox.jsx') );
var BottomBox = React.createFactory( require('./BottomBox.jsx') );
var Footer = React.createFactory( require('./Footer.jsx') );

var Store = require('../stores/Store');
var AppConstants = require('../constants/AppConstants');

var idResize;

/**
 * 
 */
var AdWall = React.createClass({displayName: 'AdWall',

    //========================================================================
    //
    // mount
    
    /**
     * 這是 component API, 在 mount 前會跑一次，取值做為 this.state 的預設值
     */
    getInitialState: function() {
        var o = this.getTruth();  // {} -> this.state
        o.screenSize = 'tablet'
        return o;  

    },

    /**
     * 主程式進入點
     */
    componentWillMount: function() {
        Store.addListener( AppConstants.CHANGE_EVENT, this._onChange );

        // 要用 interval 擋一下
        window.addEventListener('resize', this.handleResize );

        this.handleResize();
    },

    handleResize: function(evt){
            
        clearTimeout( idResize );

        idResize = setTimeout(function(){
        
            var body = document.body;
            var size;
            
            // @todo: 改回 1024
            if(body.scrollWidth > 720){
                size = 'desktop';
            }else if(body.scrollWidth > 480){
                size = 'tablet';
            }else{
                size = 'phone';
            }
            
            // console.log( 'resize: ', body.scrollWidth, body.scrollHeight, ' >size: ', size );

            this.setState({screenSize: size});

        }.bind(this), 0)

    },

    /**
     * 重要：root view 建立後第一件事，就是偵聽 store 的 change 事件
     */
    componentDidMount: function() {
        //
        // if (!this.props.reponse) {

        // }

    },  

    //========================================================================
    //
    // unmount

    /**
     * 元件將從畫面上移除時，要做善後工作
     */
    componentWillUnmount: function() {
        Store.removeChangeListener( this._onChange );
    },

    /**
     * 
     */
    componentDidUnmount: function() {
        //
    },

    //========================================================================
    //
    // update

    /**
     * 在 render() 前執行，有機會可先處理 props 後用 setState() 存起來
     */
    componentWillReceiveProps: function(nextProps) {
        //
    },

    /**
     * 
     */
    shouldComponentUpdate: function(nextProps, nextState) {
        return true;
    },

    // 這時已不可用 setState()
    componentWillUpdate: function(nextProps, nextState) {
    },

    /**
     * 
     */
    componentDidUpdate: function(prevProps, prevState) {
    },

    //========================================================================
    //
    // render

    /**
     * 
     */
    render: function() {

        var size = this.state.screenSize;
        // console.log( 'size: ', size );

        if( size == 'phone' ){

            // phone
            return (
                React.DOM.div({className: "background"}, 
                    React.DOM.div({className: "wraper"}, 
                        TopBox({truth: this.state}), 
                        BottomBox({truth: this.state}), 
                        Footer(null)
                        
                    )
                )
            )

        }else if( size == 'tablet'){

            // tablet
            return (
                React.DOM.div({className: "background"}, 
                    React.DOM.div({className: "wraper"}, 
                        TopBox({truth: this.state}), 
                        BottomBox({truth: this.state}), 
                        Footer(null)
                        
                    )
                )
            )
        
        }else{
            // desktop
            return (
                React.DOM.div({className: "background"}, 
                    React.DOM.div({className: "wraper"}, 
                        TopBox({truth: this.state}), 
                        BottomBox({truth: this.state}), 
                        Footer(null)
                        
                    )
                )
            )
        }
    },



    //========================================================================
    //
    // private methods - 處理元件內部的事件

    /**
     * controller-view 偵聽到 model change 後
     * 執行這支，它操作另一支 private method 去跟 model 取最新值
     * 然後操作 component life cycle 的 setState() 將新值灌入元件體系
     * 就會觸發一連串 child components 跟著重繪
     */
    _onChange: function(){
        // 重要：從 root view 觸發所有 sub-view 重繪
        this.setState( this.getTruth() );
    },

    /**
     * 為何要獨立寫一支？因為會有兩個地方會用到，因此抽出來
     * 目地：向各個 store 取回資料，然後統一 setState() 再一層層往下傳遞
     */
    getTruth: function() {
        // 是從 Store 取資料(as the single source of truth)
        return Store.getAll();
    }


});

module.exports = AdWall;

},{"../constants/AppConstants":3,"../stores/Store":5,"./BottomBox.jsx":9,"./Footer.jsx":10,"./TopBox.jsx":18}],8:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Banner = React.createClass({displayName: 'Banner',


  /**
   *
   */
  render: function() {
    
    var divStyle = {
        background: this.props.truth.response.banner.image_url
    }
    
  	return (
        React.DOM.div({className: "top-box-right"}, 
            React.DOM.div({className: "banner", style: divStyle})
        )
    );
  },


});

module.exports = Banner;

},{"../actions/AppActionCreator":1}],9:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

var More = React.createFactory( require('./More.jsx') );
var Prev = React.createFactory( require('./Prev.jsx') );
var Next = React.createFactory( require('./Next.jsx') );
var ItemList = React.createFactory( require('./ItemList.jsx') );
/**
 * 
 */
var BottomBox = React.createClass({displayName: 'BottomBox',

  render: function() {

    var response = this.props.truth.response;

    return (
        React.DOM.div({className: "bottom-box"}, 
            React.DOM.div({id: "row_1", className: "even"}, 
                More({link: response.itemList.row_1.ad[0].extra.link1}), 
                Prev({onClick: this.handleLeftArrowClick.bind(this, "row_1", response.itemList.row_1.ad)}), 
                ItemList({truth: response.itemList.row_1}), 
                Next({onClick: this.handleRightArrowClick.bind(this, "row_1", response.itemList.row_1.ad)})
            ), 
            React.DOM.div({id: "row_2", className: "even"}, 
                More({link: response.itemList.row_2.ad[0].extra.link1}), 
                Prev({onClick: this.handleLeftArrowClick.bind(this, "row_2", response.itemList.row_2.ad)}), 
                ItemList({truth: response.itemList.row_2}), 
                Next({onClick: this.handleRightArrowClick.bind(this, "row_2", response.itemList.row_2.ad)})
            ), 
            React.DOM.div({id: "row_3", className: "even"}, 
                More({link: response.itemList.row_3.ad[0].extra.link1}), 
                ItemList({truth: response.itemList.row_3})
            )
        )
  	);
  },
  handleLeftArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
    actions.ShiftLeft(key, itemList);
  },
  handleRightArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
    actions.ShiftRight(key, itemList);
  }


});

module.exports = BottomBox;

},{"../actions/AppActionCreator":1,"./ItemList.jsx":12,"./More.jsx":14,"./Next.jsx":15,"./Prev.jsx":16}],10:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Footer = React.createClass({displayName: 'Footer',


  /**
   *
   */
  render: function() {

  	return  React.DOM.footer({className: "footer"})

  },


});

module.exports = Footer;

},{"../actions/AppActionCreator":1}],11:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Item = React.createClass({displayName: 'Item',


  /**
   *
   */
  render: function() {

    var detail = this.props.detail;
    
  	return (
                    
        React.DOM.div({className: "item", 
             onClick: this.openLink}, 

            React.DOM.div({className: "item-slogan"}), 
            React.DOM.div({className: "item-img"}, 
                React.DOM.img({src: detail.image_url})
            ), 
            
            React.DOM.div({className: "item-title"}, detail.title), 
            React.DOM.p({className: "region"}, detail.extra.region), 
            React.DOM.div({className: "area"}, detail.extra.area, "坪"), 
            React.DOM.div({className: "item-offer_price_plus"}, 
                React.DOM.span({className: "offer_price"}, detail.price)
            ), 
            React.DOM.div({className: "item-more"})
        )

    );
  },
  openLink: function(){
    //連結都會是link這個屬性嗎？special也有一個
    var click_link = this.props.detail.click_link;
    window.open(click_link, '_blank');
  }


});

module.exports = Item;

},{"../actions/AppActionCreator":1}],12:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');
var cx = React.addons.classSet;
var Item = React.createFactory(require('./Item.jsx'));

/**
 * 
 */
var ItemList = React.createClass({displayName: 'ItemList',
  /**
   * 
   */
  render: function() {
    
    // 這裏使用 react class add-on 來切換樣式顯示
    // 這樣做比較有條理，比直接組合多個字串來的好控制  
    var classes = cx({
        'list-item': true,
    });
    var Ads = this.props.truth.ad;

    var arr = Ads.map(function(item, index){
        return Item({key: index, detail: item})
    }, this)

    return (
        React.DOM.div({className: "item_list_wraper"}, 
            React.DOM.ul({className: "item_list"}, 
                arr
            )
        )
    )
  }

});

module.exports = ItemList;
},{"../actions/AppActionCreator":1,"./Item.jsx":11}],13:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Logo = React.createClass({displayName: 'Logo',


  /**
   *
   */
  render: function() {

    var divStyle = {
        backgroundImage: this.props.truth.response.logo.image_url
    }
    
  	return (
        React.DOM.div({className: "top-box-left"}, 
            React.DOM.div({className: "logo", style: divStyle})
        )
    );
  },


});

module.exports = Logo;

},{"../actions/AppActionCreator":1}],14:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var More = React.createClass({displayName: 'More',


  /**
   *
   */
  render: function() {
    
  	  return (
          React.DOM.a({className: "more", href: this.props.link, target: "_blank"})
      );
  }



});

module.exports = More;

},{"../actions/AppActionCreator":1}],15:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Next = React.createClass({displayName: 'Next',


  /**
   *
   */
  render: function() {
    
  	return (
      React.DOM.div({className: "next", 
            onClick: this.props.onClick})
    );
  }



});

module.exports = Next;

},{"../actions/AppActionCreator":1}],16:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Prev = React.createClass({displayName: 'Prev',


  /**
   *
   */
  render: function() {
    
  	return (
      React.DOM.div({className: "prev", 
            onClick: this.props.onClick})
    );
  }



});

module.exports = Prev;

},{"../actions/AppActionCreator":1}],17:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Special = React.createClass({displayName: 'Special',


  /**
   *
   */
  render: function() {
    
    var first = this.props.truth.response.first;
  	return (
        React.DOM.div({className: "special"}, 
            React.DOM.div({className: "special-img"}, 
              React.DOM.img({src: first.image_url})
            ), 
            React.DOM.div({className: "special-text"}, 
              React.DOM.p({className: "special-describe"}, first.title), 
              React.DOM.p({className: "special-region"}, first.extra.region), 
              React.DOM.p({className: "special-store_price"}, 
                React.DOM.span({id: "label"}, "總價："), 
                React.DOM.span(null, first.price)
              ), 
              React.DOM.p({className: "special-area"}, 
                React.DOM.span({id: "label"}, "坪數："), 
                first.extra.area, "坪"
              ), 
              React.DOM.p({className: "special-area"}, 
                React.DOM.span({id: "label"}, "屋齡："), 
                first.extra.age
              ), 
              React.DOM.p({className: "special-area"}, 
                React.DOM.span({id: "label"}, "樓層："), 
                first.extra.storey
              ), 
              React.DOM.p({className: "special-area"}, 
                React.DOM.span({id: "label"}, "格局："), 
                first.extra.pattern
              )
            ), 
            React.DOM.div({className: "special-more"})
        )
    );
  },
  openLink: function(){
    //連結都會是link這個屬性嗎？special也有一個
    var click_link = first.click_link;
    window.open(click_link, '_blank');
  }

});

module.exports = Special;

},{"../actions/AppActionCreator":1}],18:[function(require,module,exports){
/** @jsx React.DOM *//**
 *
 */
var actions = require('../actions/AppActionCreator');

var Logo = React.createFactory( require('./Logo.jsx') );
var Special = React.createFactory( require('./Special.jsx') );
var Banner = React.createFactory( require('./Banner.jsx') );
/**
 * 
 */
var TopBox = React.createClass({displayName: 'TopBox',


  /**
   *
   */
  render: function() {

    return (
        React.DOM.div({className: "top-box"}, 
            Logo({truth: this.props.truth}), 
            Special({truth: this.props.truth}), 
            Banner({truth: this.props.truth})
        )
	  );
  }


});

module.exports = TopBox;

},{"../actions/AppActionCreator":1,"./Banner.jsx":8,"./Logo.jsx":13,"./Special.jsx":17}],19:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],21:[function(require,module,exports){
"use strict";
var Promise = require("./promise/promise").Promise;
var polyfill = require("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":26,"./promise/promise":27}],22:[function(require,module,exports){
"use strict";
/* global toString */

var isArray = require("./utils").isArray;
var isFunction = require("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":31}],23:[function(require,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,require("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"FWaASH":20}],24:[function(require,module,exports){
"use strict";
/**
  `RSVP.Promise.cast` returns the same promise if that promise shares a constructor
  with the promise being casted.

  Example:

  ```javascript
  var promise = RSVP.resolve(1);
  var casted = RSVP.Promise.cast(promise);

  console.log(promise === casted); // true
  ```

  In the case of a promise whose constructor does not match, it is assimilated.
  The resulting promise will fulfill or reject based on the outcome of the
  promise being casted.

  In the case of a non-promise, a promise which will fulfill with that value is
  returned.

  Example:

  ```javascript
  var value = 1; // could be a number, boolean, string, undefined...
  var casted = RSVP.Promise.cast(value);

  console.log(value === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(val) {
    val === value // => true
  });
  ```

  `RSVP.Promise.cast` is similar to `RSVP.resolve`, but `RSVP.Promise.cast` differs in the
  following ways:
  * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
  have something that could either be a promise or a value. RSVP.resolve
  will have the same effect but will create a new promise wrapper if the
  argument is a promise.
  * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
  promises of the exact class specified, so that the resulting object's `then` is
  ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

  @method cast
  @for RSVP
  @param {Object} object to be casted
  @return {Promise} promise that is fulfilled when all properties of `promises`
  have been fulfilled, or rejected if any of them become rejected.
*/


function cast(object) {
  /*jshint validthis:true */
  if (object && typeof object === 'object' && object.constructor === this) {
    return object;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(object);
  });
}

exports.cast = cast;
},{}],25:[function(require,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],26:[function(require,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = require("./promise").Promise;
var isFunction = require("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "cast" in local.Promise &&
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":27,"./utils":31}],27:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var configure = require("./config").configure;
var objectOrFunction = require("./utils").objectOrFunction;
var isFunction = require("./utils").isFunction;
var now = require("./utils").now;
var cast = require("./cast").cast;
var all = require("./all").all;
var race = require("./race").race;
var staticResolve = require("./resolve").resolve;
var staticReject = require("./reject").reject;
var asap = require("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.cast = cast;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":22,"./asap":23,"./cast":24,"./config":25,"./race":28,"./reject":29,"./resolve":30,"./utils":31}],28:[function(require,module,exports){
"use strict";
/* global toString */
var isArray = require("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":31}],29:[function(require,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],30:[function(require,module,exports){
"use strict";
/**
  `RSVP.resolve` returns a promise that will become fulfilled with the passed
  `value`. `RSVP.resolve` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @for RSVP
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(value) {
  /*jshint validthis:true */
  var Promise = this;
  return new Promise(function(resolve, reject) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],31:[function(require,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],32:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":33}],33:[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":34}],34:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3IuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2Jvb3QuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2NvbnN0YW50cy9BcHBDb25zdGFudHMuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlci5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvc3RvcmVzL1N0b3JlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy9zdG9yZXMvYWRsb2FkZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0FkV2FsbC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0Jhbm5lci5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0JvdHRvbUJveC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0Zvb3Rlci5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0l0ZW0uanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9JdGVtTGlzdC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0xvZ28uanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9Nb3JlLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvdmlld3MvTmV4dC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL1ByZXYuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9TcGVjaWFsLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvdmlld3MvVG9wQm94LmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL21haW4uanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hbGwuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hc2FwLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvY2FzdC5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2NvbmZpZy5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3BvbHlmaWxsLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcHJvbWlzZS5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JhY2UuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yZWplY3QuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yZXNvbHZlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvdXRpbHMuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvaW5kZXguanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvbGliL2ludmFyaWFudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFxuICovXG52YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xudmFyIEFwcENvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9BcHBDb25zdGFudHMnKTtcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG4vKipcbiAqIOmAmeaYr+S4gOWAiyBzaW5nbGV0b24g54mp5Lu2XG4gKi9cbnZhciBBcHBBY3Rpb25DcmVhdG9ycyA9IHtcblxuICAgIC8qKlxuICAgICAqIGFwcCDllZ/li5XlvozvvIznrKzkuIDmrKHovInlhaXos4fmlplcbiAgICAgKi9cbiAgICBsb2FkOiBmdW5jdGlvbigpe1xuXHRcdC8vICAgICAgICBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgU2hpZnRMZWZ0OiBmdW5jdGlvbihrZXksIGl0ZW1MaXN0KSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBBcHBDb25zdGFudHMuTGlzdF9TaGlmdExlZnQsXG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIGl0ZW1MaXN0OiBpdGVtTGlzdFxuICAgICAgICB9KVxuICAgIH0sXG4gICAgU2hpZnRSaWdodDogZnVuY3Rpb24oa2V5LCBpdGVtTGlzdCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogQXBwQ29uc3RhbnRzLkxpc3RfU2hpZnRSaWdodCxcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgaXRlbUxpc3Q6IGl0ZW1MaXN0XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwQWN0aW9uQ3JlYXRvcnM7XG4iLCIvKlxuICog6YCZ6KOP5piv5pW05pSv56iL5byP55qE6YCy5YWl6bue77yM5a6D6LKg6LKs5bu656uLIHJvb3Qgdmlld++8jFxuICog5Lmf5bCx5pivIE1haW5BcHAg5YWD5Lu277yM5bCH5a6D5bu656uL6LW35L6G5pS+5Yiw55Wr6Z2i5LiKXG4gKlxuICogYm9vdC5qcyDlrZjlnKjnmoTnm67lnLDvvIzmmK/lm6DngrrpgJrluLggYXBwIOWVn+WLleaZguacieioseWkmuWFiOacn+W3peS9nOimgeWujOaIkO+8jFxuICog5L6L5aaC6aCQ6LyJ6LOH5paZ5YiwIHN0b3JlIOWFp+OAgeaqouafpeacrOWcsOerryBkYiDni4DmhYvjgIHliIfmj5vkuI3lkIzoqp7ns7vlrZfkuLLjgIFcbiAqIOmAmeS6m+W3peS9nOmDveWFiOWcqCBib290LmpzIOWFp+WBmuWujO+8jOWGjeWVn+WLlSByb290IHZpZXcg5piv5q+U6LyD55CG5oOz55qE5rWB56iLXG4gKiBcbiAqL1xuXG4vLyB2MC4xMiDplovlp4vopoHnlKggY3JlYXRlRmFjdG9yeSDljIXkuIDmrKHmiY3og73kvb/nlKjlhYPku7Zcbi8vIOWmguaenOS4jeW4jOacm+mAmem6vOm6u+eFqe+8jOWPquimgeWcqOavj+S7vSBqcyDoo4/pg73liqDkuIvpnaLpgJnlj6XljbPlj6/vvIzkvYblroPmnInnvLrpu55cbi8vIHZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG4vLyBcbi8vIOWboOeCuiByZXF1aXJlKCcuLi4nKSDlj6rmmK/mi7/liLDkuIDku73lhYPku7blrprnvqnmqpTvvIznhKHms5Xnm7TmjqXkvb/nlKhcbi8vIOimgeeUqOWug+W7uueri+S4gOWAiyBmYWN0b3J577yM5LmL5b6M5omN6IO955Si5Ye6IGluc3RhbmNl77yM5LiL6Z2iIGNyZWF0ZUZhY3RvcnkoKSDlsLHmmK/lnKjlu7rnq4vlt6Xlu6BcbnZhciBBZFdhbGwgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoXCIuL3ZpZXdzL0FkV2FsbC5qc3hcIikpO1xuLy/lvJXlhaXos4fmlplcbnZhciBhZExvYWRlciA9IHJlcXVpcmUoJy4vc3RvcmVzL2FkbG9hZGVyLmpzJyk7XG5cbiQoZnVuY3Rpb24oKXtcblx0Ly/ln7fooYxmdW5jdGlvbu+8jOeZvOmAgWFwaeaKk+izh+aWmeiZleeQhuW+jOWtmOWIsFRhZ3Rvb0FkV2FsbC5hZERhdGUuaXRlbUxpc3TkuK1cblx0YWRMb2FkZXIubG9hZEpRKClcblxuXHQvLyBjcmVhdGUgY29udGFpbmVyIGRvbSBlbGVtZW50XG5cdHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdLFxuXHRcdG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKSxcblx0XHRpZCA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcImlkXCIpO1xuXHRpZC52YWx1ZSA9IFwiY29udGFpbmVyXCI7XG5cdG5vZGUuc2V0QXR0cmlidXRlTm9kZShpZCk7XG5cdGJvZHkuaW5zZXJ0QmVmb3JlKG5vZGUsIGJvZHkuY2hpbGROb2Rlc1swXSk7XG5cblx0dmFyIHQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG5cdFx0Ly/norroqo1hcGnmipPnmoTos4fmlpnmnInlrZjliLBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN05LmL5LitXG5cdFx0dmFyIGNvbXBsZXRlID0gVGFndG9vQWRXYWxsLmFkRGF0YS5pdGVtTGlzdC5yb3dfMSAmJiBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0LnJvd18yICYmIFRhZ3Rvb0FkV2FsbC5hZERhdGEuaXRlbUxpc3Qucm93XzM7XG5cdFx0XG5cdFx0aWYoY29tcGxldGUpe1xuXG5cdFx0XHQvLyDluavmiJHlu7rnq4ttYWluYXBw5YWD5Lu277yM5pS+5YiwY29udGFpbmVy5LitXG5cdFx0XHRSZWFjdC5yZW5kZXIoIEFkV2FsbCgpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lclwiKSApO1xuXG5cdFx0XHQvL+WBnOatonNldEludGVydmFs5Lit55qEZnVuY3Rpb25cblx0XHRcdGNsZWFySW50ZXJ2YWwodCk7XG5cdFx0fVxuXHR9LCA1MDApO1xuXG59KVxuIiwiLyoqXG4gKiBUb2RvQ29uc3RhbnRzXG4gKi9cbiB2YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gICB2YXIgcmV0ID0ge307XG4gICB2YXIga2V5O1xuICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICBjb250aW51ZTtcbiAgICAgfVxuICAgICByZXRba2V5XSA9IGtleTtcbiAgIH1cbiAgIHJldHVybiByZXQ7XG4gfTtcblxuLy8gQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4vLyDkuZ/lsLHmmK/orpMgaGFzaCDnmoQga2V5IOiIhyB2YWx1ZSDlgLzkuIDmqKNcbi8vIOS4jeeEtuWOn+acrCB2YWx1ZSDpg73mmK8gbnVsbFxuLy8g5LiN6YGO5pei54S25aaC5q2k77yM54K65L2V5LiN5Lm+6ISG55SoIHNldCDkuYvpoZ7lj6rmnIlrZXkg55qE5bCx5aW9XG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcih7XG5cbiAgXHRTT1VSQ0VfVklFV19BQ1RJT046IG51bGwsXG4gIFx0U09VUkNFX1NFUlZFUl9BQ1RJT046IG51bGwsXG4gIFx0U09VUkNFX1JPVVRFUl9BQ1RJT046IG51bGwsXG5cbiAgXHRDSEFOR0VfRVZFTlQ6IG51bGwsXG4gIFx0XG4gICAgTGlzdF9TaGlmdExlZnQ6IG51bGwsXG5cbiAgICBMaXN0X1NoaWZ0UmlnaHQ6IG51bGwsXG5cbn0pO1xuXG4iLCJcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG5cbnZhciBEaXNwYXRjaGVyID0gcmVxdWlyZSgnZmx1eCcpLkRpc3BhdGNoZXI7XG5cblxuLyoqXG4gKiBmbHV4LWNoYXQg5YWn5pyA5paw55qEIGRpc3BhdGNoZXJcbiAqL1xudmFyIEFwcERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuXG4vLyDms6jmhI/vvJrpgJnoo4/nrYnmlrzmmK/nubzmib8gRGlzcGF0Y2hlciBjbGFzcyDouqvkuIrmiYDmnInmjIfku6TvvIznm67lnLDmmK/orpPmraTnianku7bkv7HmnInlu6Pmkq3og73lip9cbi8vIOWQjOaoo+WKn+iDveS5n+WPr+eUqCB1bmRlcnNjb3JlLmV4dGVuZCDmiJYgT2JqZWN0LmFzc2lnbigpIOWBmuWIsFxuLy8g5LuK5aSp5Zug54K65pyJ55SoIGpxdWVyeSDlsLHoq4vlroPku6Pli57kuoZcbiQuZXh0ZW5kKCBBcHBEaXNwYXRjaGVyLCB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uIFRoZSBkZXRhaWxzIG9mIHRoZSBhY3Rpb24sIGluY2x1ZGluZyB0aGUgYWN0aW9uJ3NcbiAgICAgKiB0eXBlIGFuZCBhZGRpdGlvbmFsIGRhdGEgY29taW5nIGZyb20gdGhlIHNlcnZlci5cbiAgICAgKi9cbiAgICBoYW5kbGVTZXJ2ZXJBY3Rpb246IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIHNvdXJjZTogQXBwQ29uc3RhbnRzLlNPVVJDRV9TRVJWRVJfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoKHBheWxvYWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkaXNwYXRjaChldnQpXG4gICAgICovXG4gICAgaGFuZGxlVmlld0FjdGlvbjogZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgc291cmNlOiBBcHBDb25zdGFudHMuU09VUkNFX1ZJRVdfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlzcGF0Y2gocGF5bG9hZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWwh+S+huWVn+eUqCByb3V0ZXIg5pmC77yM6YCZ6KOP6JmV55CG5omA5pyJIHJvdXRlciBldmVudFxuICAgICAqL1xuICAgIGhhbmRsZVJvdXRlckFjdGlvbjogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIHNvdXJjZTogQXBwQ29uc3RhbnRzLlNPVVJDRV9ST1VURVJfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBwYXRoXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwRGlzcGF0Y2hlcjtcbiIsIi8qKlxuICogVG9kb1N0b3JlXG4gKi9cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBJTVBPUlRcblxudmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKTtcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyOyAvLyDlj5blvpfkuIDlgIsgcHViL3N1YiDlu6Pmkq3lmahcblxuXG4vL+WBh+izh+aWmVxuLy8gdmFyIHJlc3BvbnNlID0gcmVxdWlyZSgnLi4vc3RvcmVzL3Rlc3RfZGF0YS5qcycpO1xuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBQcml2YXRlIHZhcnNcblxuLy8g562J5ZCM5pa8IFRvZG9TdG9yZSBleHRlbmRzIEV2ZW50RW1pdHRlciBcbi8vIOW+nuatpOWPluW+l+W7o+aSreeahOiDveWKm1xuLy8g55Sx5pa85bCH5L6G5pyD6L+U6YKEIFRvZG9TdG9yZSDlh7rljrvvvIzlm6DmraTkuIvpnaLlr6vnmoTmnIPlhajororngrogcHVibGljIG1ldGhvZHNcbnZhciBTdG9yZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLy8g5YGH6LOH5paZXG52YXIgYXJyVG9kb3MgPSBudWxsO1xuXG4vLyDnm67liY3pgbjlj5bnmoQgdG9kbyDpoIXnm65cbnZhciBzZWxlY3RlZEl0ZW0gPSBudWxsO1xuXG4vLyBoZWFkZXIg6KOP6Zqo5omT5Y2z5p+l6Ly45YWl55qE5paH5a2XXG52YXIgc2VhcmNoRmlsdGVyID0gJyc7XG5cbi8vIGFwcCDnrKzkuIDmrKHllZ/li5XmmYLvvIzlrZjlhaXkuIDljIUgbW9jayBkYXRhIOWIsCBsb2NhbFN0b3JhZ2Ug5L6b5ris6KmmXG52YXIgZGIgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuaWYoIGRiLmhhc093blByb3BlcnR5KCdteWRiJykgPT0gZmFsc2UgKXtcbiAgICAvLyBjb25zb2xlLmxvZyggJ1xcbueEoeatt+WPsuizh+aWme+8jOWtmOWFpSBtb2NrIGRhdGEnICk7XG4gICAgZGIuc2V0SXRlbSgnbXlkYicsIEpTT04uc3RyaW5naWZ5KHt0b2RvczogW10sIHNlbGVjdGVkSXRlbTogbnVsbH0pIClcbn1cblxuLy8g5o6l6JGX5LiA5b6L5b6eIGRiIOiugOWPluatt+WPsuizh+aWmVxudmFyIG8gPSBKU09OLnBhcnNlKGRiLmdldEl0ZW0oJ215ZGInKSk7XG5hcnJUb2RvcyA9IG8udG9kb3MgPyBvLnRvZG9zIDogW10gO1xuc2VsZWN0ZWRJdGVtID0gby5zZWxlY3RlZEl0ZW07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBQdWJsaWMgQVBJXG5cbi8qKlxuICog5bu656uLIFN0b3JlIGNsYXNz77yM5Lim5LiU57m85om/IEV2ZW50RU1pdHRlciDku6Xmk4HmnInlu6Pmkq3lip/og71cbiAqL1xuJC5leHRlbmQoIFN0b3JlLCB7XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgQVBJXG4gICAgICog5L6b5aSW55WM5Y+W5b6XIHN0b3JlIOWFp+mDqOizh+aWmVxuICAgICAqL1xuICAgIGdldEFsbDogZnVuY3Rpb24oKXtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFyclRvZG9zOiBhcnJUb2RvcyxcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEl0ZW06IHNlbGVjdGVkSXRlbSxcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHNlYXJjaEZpbHRlcixcbiAgICAgICAgICAgICAgICByZXNwb25zZTogVGFndG9vQWRXYWxsLmFkRGF0YVxuICAgICAgICB9XG4gICAgICAgIC8vIHdoaWxlKCFUYWd0b29BZFdhbGwuYWREYXRhLilcblxuXG5cbiAgICAgICAgLy8gcmV0dXJuIHtcbiAgICAgICAgLy8gICAgIGFyclRvZG9zOiBhcnJUb2RvcyxcbiAgICAgICAgLy8gICAgIHNlbGVjdGVkSXRlbTogc2VsZWN0ZWRJdGVtLFxuICAgICAgICAvLyAgICAgZmlsdGVyOiBzZWFyY2hGaWx0ZXIsXG4gICAgICAgIC8vICAgICByZXNwb25zZTogVGFndG9vQWRXYWxsLmFkRGF0YVxuICAgICAgICAvLyB9XG4gICAgfSxcblxuICAgIC8vXG4gICAgbm9vcDogZnVuY3Rpb24oKXt9XG59KTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBldmVudCBoYW5kbGVyc1xuXG4vKipcbiAqIOWQkSBEaXNwYXRjaGVyIOiou+WGiuiHquW3su+8jOaJjeiDveWBteiBveWIsOezu+e1seeZvOWHuueahOS6i+S7tlxuICog5Lim5LiU5Y+W5ZueIGRpc3BhdGNoVG9rZW4g5L6b5pel5b6MIGFzeW5jIOaTjeS9nOeUqFxuICovXG5TdG9yZS5kaXNwYXRjaFRva2VuID0gQXBwRGlzcGF0Y2hlci5yZWdpc3RlciggZnVuY3Rpb24gZXZlbnRIYW5kbGVycyhldnQpe1xuXG4gICAgLy8gZXZ0IC5hY3Rpb24g5bCx5pivIHZpZXcg55W25pmC5buj5pKt5Ye65L6G55qE5pW05YyF54mp5Lu2XG4gICAgLy8g5a6D5YWn5ZCrIGFjdGlvblR5cGVcbiAgICB2YXIgYWN0aW9uID0gZXZ0LmFjdGlvbjtcblxuICAgIHN3aXRjaCAoYWN0aW9uLmFjdGlvblR5cGUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKi9cbiAgICAgICAgY2FzZSBBcHBDb25zdGFudHMuTGlzdF9TaGlmdExlZnQ6XG4gICAgICAgICAgICB2YXIga2V5ID0gYWN0aW9uLmtleSxcbiAgICAgICAgICAgICAgICBpdGVtTGlzdCA9IGFjdGlvbi5pdGVtTGlzdDtcbiAgICAgICAgICAgIHJlc3BvbnNlLml0ZW1MaXN0W2tleV0uYWQuc3BsaWNlKDAsIDAsIGl0ZW1MaXN0LnBvcCgpKTtcbiAgICAgICAgICAgIFN0b3JlLmVtaXQoIEFwcENvbnN0YW50cy5DSEFOR0VfRVZFTlQgKTtcbiAgICAgICAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqL1xuICAgICAgICBjYXNlIEFwcENvbnN0YW50cy5MaXN0X1NoaWZ0UmlnaHQ6XG4gICAgICAgICAgICB2YXIga2V5ID0gYWN0aW9uLmtleSxcbiAgICAgICAgICAgICAgICBpdGVtTGlzdCA9IGFjdGlvbi5pdGVtTGlzdDtcbiAgICAgICAgICAgIHJlc3BvbnNlLml0ZW1MaXN0W2tleV0uYWQucHVzaChpdGVtTGlzdC5zcGxpY2UoMCwgMSlbMF0pO1xuICAgICAgICAgICAgU3RvcmUuZW1pdCggQXBwQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCApO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vXG4gICAgfVxuXG59KVxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIHByaXZhdGUgbWV0aG9kc1xuXG4vKipcbiAqIOWwh+izh+aWmeS/neWtmOWFpSBsb2NhbFN0b3JhZ2XvvIzkuIvmrKHplovllZ/mmYLlj5blm55cbiAqL1xuZnVuY3Rpb24gcGVyc2lzdCgpe1xuICAgIGRiLnNldEl0ZW0oJ215ZGInLCBKU09OLnN0cmluZ2lmeSh7dG9kb3M6IGFyclRvZG9zLCBzZWxlY3RlZEl0ZW06IHNlbGVjdGVkSXRlbSwgcmVzcG9uc2U6IHJlc3BvbnNlfSkgKTtcbn1cblxuLy9cbm1vZHVsZS5leHBvcnRzID0gU3RvcmU7XG4iLCIvL+iuk1RhZ3Rvb0FkV2FsbOaUvuWIsHdpbmRvd+aJjeiDveiuk3RhZyBtYW5hZ2Vy55So5Yiw6YCZ5YCL6K6K5pW4XG52YXIgVGFndG9vQWRXYWxsID0gd2luZG93LlRhZ3Rvb0FkV2FsbCB8fCB7fTtcblRhZ3Rvb0FkV2FsbCA9IHtcbiAgICBcImFkRGF0YVwiOiB7XG4gICAgICAgIFwiZmlyc3RcIjoge30sXG4gICAgICAgIFwiaXRlbUxpc3RcIjoge31cbiAgICB9LFxuICAgIFwicXVlcnlcIjoge1xuICAgIFx0Ly/nmbxhcGlcbiAgICAgICAgYmFzZTogZnVuY3Rpb24odXJpLCBjYikge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiB1cmksXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXG4gICAgICAgICAgICAgICAganNvbnBDYWxsYmFjazogXCJhXCIgKyB1cmkucmVwbGFjZSgvW15cXHddL2csICdfJyksXG4gICAgICAgICAgICAgICAgc3VjY2VzczogY2JcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJC5hamF4KHNldHRpbmcpO1xuICAgICAgICAgICAgLy8gJC5hamF4KHtcbiAgICAgICAgICAgIC8vICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgIC8vICAgICB1cmw6IHVyaSxcbiAgICAgICAgICAgIC8vICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIC8vICAgICBjYWNoZTogdHJ1ZSxcbiAgICAgICAgICAgIC8vICAgICAvL2pzb25wQ2FsbGJhY2s6IFwiYVwiICsgdXJpLnJlcGxhY2UoL1teXFx3XS9nLCAnXycpLFxuICAgICAgICAgICAgLy8gICAgIHN1Y2Nlc3M6IGNiXG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICB9LFxuICAgICAgICAvL2FwaeacieWVj+mhjFxuXG4gICAgICAgIC8vaXRlbXPpgoTmspLmnInplovmiYDku6XlhYjnlKjoiIrnmoRcblx0XHQvL2l0ZW1zOiBmdW5jdGlvbihwcm9kdWN0S2V5cyxjYikge1xuXHRcdC8vICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFRhZ3Rvb0FkV2FsbC5VUkxCYXNlICsgXCJwcm9kdWN0Lml0ZW1zP3Byb2R1Y3Rfa2V5cz1cIiArIHByb2R1Y3RLZXlzLCBjYilcblx0XHQvL30sXG5cdFx0Ly9yZWNvbW1lbmTpgoTmspLmnInplovvvIzmiYDku6XlhYjnlKjoiIrnmoRcblx0XHQvL3JlY29tbWVuZDogZnVuY3Rpb24ocHJvZHVjdEtleXMsIGNiKSB7XG5cdFx0Ly8gICAgVGFndG9vQWRXYWxsLnF1ZXJ5LmJhc2UoVGFndG9vQWRXYWxsLlVSTEJhc2UgKyBcInF1ZXJ5X2lmcmFtZT9xPSZyZWNvbW1lbmQ9XCIgKyBwcm9kdWN0S2V5cywgY2IpO1xuXHRcdC8vfSxcblx0XHRzaW1pbGFyOiBmdW5jdGlvbihwcm9kdWN0S2V5cyxjYikge1xuXHRcdFx0Ly/opoHmlLnmjolcblx0XHRcdFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFwiLy9hZC50YWd0b28uY28vYWQvcXVlcnkvXCIgKyBcInByb2R1Y3Quc2ltbGFyP3Byb2R1Y3Rfa2V5PVwiICsgcHJvZHVjdEtleXMsIGNiKVxuXHRcdH0sXG5cdFx0Ly9yb290UGFnZTogZnVuY3Rpb24ocm9vdFBhZ2UsY2IpIHtcblx0XHQvL1x0VGFndG9vQWRXYWxsLnF1ZXJ5LmJhc2UoVGFndG9vQWRXYWxsLlVSTEJhc2UgKyAncHJvZHVjdC5rZXk/dXJpPScgKyByb290UGFnZSwgY2IpXG5cdFx0Ly99LFxuXHRcdGtleXdvcmQ6IGZ1bmN0aW9uKGtleXdvcmQsY2IpIHtcblx0XHRcdFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFRhZ3Rvb0FkV2FsbC5VUkxCYXNlICsgXCJwcm9kdWN0LmtleXdvcmQ/a2V5d29yZD1cIiArIGtleXdvcmQgKyBcIiZhZHZlcnRpc2Vycz1cIiArIGFkdmVydGlzZXJfaWQgKyBcIiZyZXF1aXJlPVwiICsga2V5d29yZCwgY2IpXG5cdFx0fSxcblxuXHRcdC8v5LiL6Z2i5piv6IiK55qEXG4gICAgICAgIGl0ZW1zOiBmdW5jdGlvbihwcm9kdWN0S2V5cywgY2IpIHtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFRhZ3Rvb0FkV2FsbC5VUkxCYXNlICsgXCJnZXRfcHJvZHVjdF9pdGVtcz9pdGVtcz1cIiArIHByb2R1Y3RLZXlzLCBjYik7XG4gICAgICAgIH0sXG4gICAgICAgIHJlY29tbWVuZDogZnVuY3Rpb24ocHJvZHVjdEtleXMsIGNiKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicXVlcnlfaWZyYW1lP3E9JnJlY29tbWVuZD1cIiArIHByb2R1Y3RLZXlzLCBjYik7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHNpbWlsYXI6IGZ1bmN0aW9uKHByb2R1Y3RLZXlzLCBhZHZlcnRpc2VyX2lkLCBhcmczLCBjYikge1xuICAgICAgICAvLyAgICAgVGFndG9vQWRXYWxsLnF1ZXJ5LmJhc2UoVGFndG9vQWRXYWxsLlVSTEJhc2UgKyBcInF1ZXJ5X2lmcmFtZT9xPSZzaW1sYXI9XCIgKyBwcm9kdWN0S2V5cyArIFwiJmFkdmVydGlzZXJfaWQ9XCIgKyBhZHZlcnRpc2VyX2lkICsgYXJnMyB8fCBcIlwiLCBjYik7XG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8v5ZG95ZCN55aR5oOROnJvb3Q9cm9vdHBhZ2U/XG4gICAgICAgIHJvb3RQYWdlOiBmdW5jdGlvbihwcm9kdWN0S2V5cywgY2IpIHtcblx0ICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicXVlcnlfaWZyYW1lP3E9JnJvb3Q9XCIgKyBwcm9kdWN0S2V5cywgY2IpO1xuICAgICAgICB9LFxuICAgICAgICBhZFRyYWNrOiBmdW5jdGlvbihwLCBlY0lEKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwiYWQvdHJhY2s/cD1cIiArIHAgKyBcIiZhZD1cIiArIGVjSUQsIGNiKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmFja3VwOiBmdW5jdGlvbih1cmwsIGNiKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicXVlcnlfaWZyYW1lP3E9XCIgKyB1cmwsIGNiKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zID0gVGFndG9vQWRXYWxsLnV0aWwuZGVjb2RlUXVlcnlEYXRhKFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9ldmVudC8xMDMvdGF0b28vP3BpZD1nZW9zdW4tY3Rob3VzZSUzQXByb2R1Y3QlM0E4OTE1OTgmdXRtX2NvbnRlbnQ9Z2Vvc3VuLWN0aG91c2UlM0Fwcm9kdWN0JTNBODkxNTk4JTdDMC4wNjc1MjU5MzI0NTZcIik7IC8v6KaB5o+b5ZueZG9jdW1lbnQubG9jYXRpb24uaHJlZlxuICAgICAgICBUYWd0b29BZFdhbGwucHVibGlzaGVyID0gcGFyc2VJbnQoVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucGIgfHwgVGFndG9vQWRXYWxsLnVybE9wdGlvbnMubWVkaWFfaWQgfHwgVGFndG9vQWRXYWxsLnVybE9wdGlvbnMudGFndG9vX21lZGlhX2lkKTtcbiAgICAgICAgVGFndG9vQWRXYWxsLnNsb3QgPSBwYXJzZUludChUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5pZCk7XG4gICAgICAgIFRhZ3Rvb0FkV2FsbC5yZWZlcmVyID0gVGFndG9vQWRXYWxsLnVybE9wdGlvbnMuciB8fCBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5yZWZlcmVyO1xuICAgICAgICBUYWd0b29BZFdhbGwucmVxdWVzdF9wYXJhID0gVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucmVxdWVzdF9wYXJhIHx8IFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zLmNsaWNrO1xuXG4gICAgICAgIGlmICh0eXBlb2YgVGFndG9vQWRXYWxsLnVybE9wdGlvbnMudXJsYmFzZSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwuVVJMQmFzZSA9IFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zLnVybGJhc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL1RhZ3Rvb0FkV2FsbC5VUkxCYXNlID0gXCIvL2FkLnRhZ3Rvby5jby9hZC9xdWVyeS9cIjtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5VUkxCYXNlID0gXCIvL2FkLnRhZ3Rvby5jby9cIjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFwidXRpbFwiOiB7XG4gICAgICAgIGFkZEhUTUw6IGZ1bmN0aW9uKHRlbXBsYXRlc19mdW4sIGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gdGVtcGxhdGVzX2Z1bih7XG4gICAgICAgICAgICAgICAgXCJkYXRhXCI6IGRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0bWxcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFNjcmlwdDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcbiAgICAgICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcblxuICAgICAgICAgICAgaWYgKHNjcmlwdC5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgLy8gSUVcbiAgICAgICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3JpcHQucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdC5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvL090aGVyc1xuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9LFxuICAgICAgICBkZWNvZGVRdWVyeURhdGE6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgLy8gc3VwcG9ydCBwYXJhbWV0ZXIgZXh0cmFjdCBmcm9tIGJvdGggcXVlcnlzdHJpbmcgb3IgaGFzaFxuICAgICAgICAgICAgLy8gbm90IHN1cHBvcnQgbXVsdGkgdmFsdWUgZm9yIHNpbmdsZSBrZXkgeWV0LlxuICAgICAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvWyMmXFw/XS8pO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBwYXJ0cy5zaGlmdCgpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZzID0gcGFydHNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgICBpZiAodnMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudCh2c1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2c1sxXSk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIGdldEludGVyY2VwdGVkU3RyOiBmdW5jdGlvbihzU291cmNlLCByb3dzLCByb3dfY2hhcmFjdGVycykge1xuICAgICAgICAgICAgdmFyIGlMZW4gPSByb3dzICogcm93X2NoYXJhY3RlcnNcbiAgICAgICAgICAgIGlmIChzU291cmNlLnJlcGxhY2UoL1teXFx4MDAtXFx4ZmZdL2csIFwieHhcIikubGVuZ3RoIDw9IGlMZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc1NvdXJjZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgICAgICB2YXIgc2NoYXI7XG4gICAgICAgICAgICBpTGVuID0gaUxlbiAtIDk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgc2NoYXIgPSBzU291cmNlLmNoYXJBdChpKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHNjaGFyO1xuICAgICAgICAgICAgICAgIGlmIChzY2hhci5tYXRjaCgvW15cXHgwMC1cXHhmZl0vKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2hhci5tYXRjaCgvXFxuLykgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyByb3dfY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyAyXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAobCA+PSBpTGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHN0ciArIFwiLi4uKOabtOWkmilcIjtcbiAgICAgICAgfSxcbiAgICAgICAgcHJpY2VUcmFuc2xhdGU6IGZ1bmN0aW9uKHByaWNlKSB7XG4gICAgICAgICAgICBpZiAocHJpY2UgPj0gMTAwMDApIHtcbiAgICAgICAgICAgICAgICBwcmljZSA9IE1hdGgucm91bmQocHJpY2UgLyAxMDAwKSAvIDEwICsgXCLokKxcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJpY2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYWRkVXRtOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgICAgICBpZiAobGluay5tYXRjaCgvXFw/LykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluayArIGxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKC8oW1xcPyZdKXBpZD1bXiZdKiY/LywgXCIkMVwiKS5yZXBsYWNlKC9cXD8vLFwiJlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmsgKyBsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSgvKFtcXD8mXSlwaWQ9W14mXSomPy8sIFwiJDFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIEluZm9Qcm9jZXNzOiBmdW5jdGlvbihkYXRhLCB0aXRsZVdvcmRzLCBkZXNjcmlwdGlvbldvcmRzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRpdGxlV29yZHMgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZVdvcmRzID0ge1xuICAgICAgICAgICAgICAgICAgICByb3c6IDIsXG4gICAgICAgICAgICAgICAgICAgIHJvd246IDIyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbldvcmRzID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVzY3JpcHRpb25Xb3JkcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm93OiAyLFxuICAgICAgICAgICAgICAgICAgICByb3duOiAyMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhW2ldLmRlc2NyaXB0aW9uICE9IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGRhdGFbaV0udGl0bGUgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLmluZGV4ID0gaTsvL1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLmRlc2NyaXB0aW9uID0gZGF0YVtpXS5kZXNjcmlwdGlvbi5yZXBsYWNlKC88bGlbXj5dKj4vZywgJycpLnJlcGxhY2UoLzxcXC8/KHVsfGxpfGhyfGJyKVtePl0qPi9nLCBcIlxcblwiKS5yZXBsYWNlKC88W14+XSo+L2csIFwiXCIpLnJlcGxhY2UoL1xcbihcXHMqXFxuKSovZywgXCJcXG5cIikucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLnRpdGxlX3Nob3J0ID0gVGFndG9vQWRXYWxsLnV0aWwuZ2V0SW50ZXJjZXB0ZWRTdHIoZGF0YVtpXS50aXRsZSwgdGl0bGVXb3Jkcy5yb3csIHRpdGxlV29yZHMucm93bik7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV0uZGVzY3JpcHRpb25fc2hvcnQgPSBUYWd0b29BZFdhbGwudXRpbC5nZXRJbnRlcmNlcHRlZFN0cihkYXRhW2ldLmRlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbldvcmRzLnJvdywgZGVzY3JpcHRpb25Xb3Jkcy5yb3duKTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtpXS5wcmljZSA9IFRhZ3Rvb0FkV2FsbC51dGlsLnByaWNlVHJhbnNsYXRlKGRhdGFbaV0ucHJpY2UpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLnN0b3JlX3ByaWNlID0gVGFndG9vQWRXYWxsLnV0aWwucHJpY2VUcmFuc2xhdGUoZGF0YVtpXS5zdG9yZV9wcmljZSk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV0uY2xpY2tfbGluayA9IFRhZ3Rvb0FkV2FsbC51dGlsLmFkZFV0bShkYXRhW2ldLmxpbmspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHByb2R1Y3RDb21wbGVtZW50OiBmdW5jdGlvbihkYXRhLCBudW0pIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCA8IG51bSkge1xuICAgICAgICAgICAgICAgIHZhciBsID0gbnVtIC0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKFRhZ3Rvb0FkV2FsbC5iYWNrdXAucG9wKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBib2R5T25Mb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmNzcyhcImJhY2tncm91bmRcIiwgVGFndG9vQWRXYWxsLmFkX2RhdGEuYmFja2dyb3VuZC5iYWNrZ3JvdW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gb3JpX2xvYWRBZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAvL+WEsuWtmGJhY2t1cOeahGFycmF5LCDnlKjkvoboo5zotrPmlbjph4/kuI3otrPnmoRJdGVtTGlzdFxuICAgIC8vICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFja3VwKFRhZ3Rvb0FkV2FsbC5hZERhdGEucCwgZnVuY3Rpb24ocmVzKSB7XG4gICAgLy8gICAgICAgICAgICAgVGFndG9vQWRXYWxsLmJhY2t1cCA9IFRhZ3Rvb0FkV2FsbC51dGlsLkluZm9Qcm9jZXNzKHJlc1sxXS5hZCk7XG4gICAgLy8gICAgICAgICB9KVxuICAgIC8vICAgICAvL+W+nnVybOeahHBpZOaKk+esrOS4gOWAi+WVhuWTgVxuICAgIC8vICAgICBUYWd0b29BZFdhbGwucXVlcnkuaXRlbXMoVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucGlkLCBmdW5jdGlvbihyZXMpIHtcbiAgICAvLyAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hZERhdGEuZmlyc3QgPSBUYWd0b29BZFdhbGwudXRpbC5JbmZvUHJvY2VzcyhyZXMucmVzdWx0c1swXSk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICAvL3JlY29tbWFuZCxzaW1pbGFyLHJvb3RwYWdlXG4gICAgLy8gICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5yZWNvbW1lbmQoVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucGlkLCBmdW5jdGlvbihyZXMpIHtcbiAgICAvLyAgICAgXHQvL+ijnOi2s+S4jea7vzblgIvnmoRJdGVtTGlzdFxuICAgIC8vICAgICBcdHZhciBJdGVtTGlzdCA9IFRhZ3Rvb0FkV2FsbC51dGlsLnByb2R1Y3RDb21wbGVtZW50KHJlc1sxXS5hZCwgNik7XG4gICAgLy8gICAgIFx0Ly/lsI1pdGVtTGlzdOS4reeahOWBmuS4gOS6m+W/heimgeeahOizh+aWmeiZleeQhlxuICAgIC8vICAgICBcdFRhZ3Rvb0FkV2FsbC5hZERhdGEuaXRlbUxpc3RbXCJyb3dfMVwiXSA9IFRhZ3Rvb0FkV2FsbC51dGlsLkluZm9Qcm9jZXNzKEl0ZW1MaXN0KTtcbiAgICAvLyAgICAgICAgIH0pXG4gICAgLy8gICAgIC8vMTAw5o+b5oiQVGFndG9vQWRXYWxsLmFkX2RhdGEuZWNJRFxuICAgIC8vICAgICBUYWd0b29BZFdhbGwucXVlcnkuc2ltaWxhcihUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5waWQsIDEwMCwgXCImc2ltbGFyX3R5cGU9Y2l0eVwiLCBmdW5jdGlvbihyZXMpIHtcbiAgICAvLyAgICAgICAgIC8vY29uc29sZS5sb2coSXRlbUxpc3QpXG4gICAgLy8gICAgIFx0dmFyIEl0ZW1MaXN0ID0gVGFndG9vQWRXYWxsLnV0aWwucHJvZHVjdENvbXBsZW1lbnQocmVzWzFdLmFkLCA2KTtcbiAgICAvLyAgICAgXHRUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0W1wicm93XzJcIl0gPSBUYWd0b29BZFdhbGwudXRpbC5JbmZvUHJvY2VzcyhJdGVtTGlzdCk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5yb290cGFnZShUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5waWQsIGZ1bmN0aW9uKHJlcykge1xuICAgIC8vICAgICAgICAgLy9jb25zb2xlLmxvZyhJdGVtTGlzdClcbiAgICAvLyAgICAgXHR2YXIgSXRlbUxpc3QgPSBUYWd0b29BZFdhbGwudXRpbC5wcm9kdWN0Q29tcGxlbWVudChyZXNbMV0uYWQsIDEyKTtcbiAgICAvLyAgICAgXHRUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0W1wicm93XzNcIl0gPSBUYWd0b29BZFdhbGwudXRpbC5JbmZvUHJvY2VzcyhJdGVtTGlzdCk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gfSxcbiAgICBzZXRJdGVtTGlzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvL3JlY29tbWVuZOaKk+S4jeWIsOWWlFxuICAgIFx0JC5tYXAoZGF0YSwgZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICBcdFx0aWYgKG9iai50eXBlID09IFwia2V5XCIpIHtcbiAgICBcdFx0XHRUYWd0b29BZFdhbGwucXVlcnlbb2JqLm5hbWVdKG9iai52YWx1ZSwgZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdFx0XHQvL+S5i+W+jGFwaee1seS4gOS5i+W+jOimgeegjeaOiVxuICAgIFx0XHRcdFx0aWYocmVzLmxlbmd0aCA9PSAyKSB7XG4gICAgXHRcdFx0XHRcdHJlcyA9IHJlc1sxXTtcbiAgICBcdFx0XHRcdH1cbiAgICAgICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLmFkRGF0YS5pdGVtTGlzdFtrZXldID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbUxpc3QgPSByZXMuYWQ7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1MaXN0ID0gVGFndG9vQWRXYWxsLnV0aWwucHJvZHVjdENvbXBsZW1lbnQoaXRlbUxpc3QsIG9iai5taW5fbnVtKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUxpc3QgPSBUYWd0b29BZFdhbGwudXRpbC5JbmZvUHJvY2VzcyhpdGVtTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hZERhdGEuaXRlbUxpc3Rba2V5XS5hZCA9IGl0ZW1MaXN0O1xuICAgIFx0XHRcdH0pXG4gICAgXHRcdH0gZWxzZSBpZiAob2JqLnR5cGUgPT0gXCJyZW1hcmtldGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLnF1ZXJ5W29iai5uYW1lXShvYmoudHlwZSwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hID0gcmVzLmE7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5iID0gcmVzLmI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMucHJvZHVjdF9wb29sLmpvaW4oJ3wnKS5tYXRjaCgvOnByb2R1Y3Q6fDpjYW1wYWlnbjovKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlZW5Qcm9kdWN0ID0gcmVzLnByb2R1Y3RfcG9vbC5qb2luKCcuJyk7Ly/nnIvpgY7nmoTllYblk4FcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy/pnIDopoHlho3lgZrnorroqo1cbiAgICAgICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5pdGVtcyhzZWVuUHJvZHVjdCwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnJlc3VsdHMgPSBIVE1MRmlsdGVyKHJlcy5yZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYWRfZGF0YS5pdGVtTGlzdFtvYmoubmFtZV0gPSByZXMucmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiI1wiICsgdmFsLm5hbWUgKyBcIiAuaXRlbS1pbWcsI1wiICsgdmFsLm5hbWUgKyBcIiAuaXRlbS1kZXNjcmliZSwjXCIgKyB2YWwubmFtZSArIFwiIC5pdGVtLW1vcmVcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1JZCA9ICQodGhpcykuY2xvc2VzdChcIi5pdGVtXCIpLmF0dHIoXCJpdGVtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwub25DbGljayhcInJlbWFya2V0aW5nXCIsaXRlbUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oVGFndG9vQWRXYWxsLmFkZFV0bShUYWd0b29BZFdhbGwuYWRfZGF0YS5pdGVtTGlzdC5SZW1hcmtldGluZ1tpdGVtSWRdLmxpbmspLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwucmVtYXJrZXRpbmdMaXN0TnVtYmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICB9KVxuICAgIFx0XHR9IGVsc2UgaWYgKG9iai50eXBlID09IFwic2ltaWxhclwiKSB7XG5cbiAgICAgICAgICAgIH1cbiAgICBcdH0pXG4gICAgfSxcbiAgICB0cmFjazogZnVuY3Rpb24oKSB7XG5cbiAgICB9LFxuICAgIGxvYWRBZERhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICBcdC8vZ2V0IGZpcnN0IHByb2R1Y3RcbiAgICAgICAgLy9wcm9kdWN0X2tleTogVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucGlkXG4gICAgICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5pdGVtcyhUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5waWQsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKVxuICAgICAgICAgICAgVGFndG9vQWRXYWxsLmFkRGF0YS5maXJzdCA9IFRhZ3Rvb0FkV2FsbC51dGlsLkluZm9Qcm9jZXNzKHJlcy5yZXN1bHRzKVswXTtcbiAgICAgICAgfSk7XG4gICAgXHQvL2dldCBwcm9kdWN0cyBvZiByb3dzIGFuZCBzdG9yZSBkYXRhc1xuICAgIFx0VGFndG9vQWRXYWxsLnNldEl0ZW1MaXN0KFRhZ3Rvb0FkV2FsbC5yb3dSdWxlKTtcbiAgICB9LFxuICAgIGxvYWRKUTogZnVuY3Rpb24oKSB7XG4gICAgICAgIFRhZ3Rvb0FkV2FsbC51dGlsLmxvYWRTY3JpcHQoXCIvL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8xLjEwLjIvanF1ZXJ5Lm1pbi5qc1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5pbml0KCk7XG4gICAgICAgICAgICAvL+Wwh+WCmeeUqOWVhuWTgeizh+aWmeWEsuWtmOi1t+S+hiwg55Sx5pa85pmC5bqP5ZWP6aGMLCDlm6DmraTkuI3og73lsIdnZXQgYmFja3Vw55qEYXBp6IiHZ2V05YW25LuWSXRlbUxpc3TnmoRhcGnlnKjkuIDotbfnmbxcbiAgICAgICAgICAgIGlmIChUYWd0b29BZFdhbGwucm93UnVsZS5iYWNrdXApIHtcbiAgICBcdFx0XHRUYWd0b29BZFdhbGwucXVlcnkuYmFja3VwKFRhZ3Rvb0FkV2FsbC5hZERhdGEucCwgZnVuY3Rpb24ocmVzKSB7XG5cdCAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYmFja3VwID0gVGFndG9vQWRXYWxsLnV0aWwuSW5mb1Byb2Nlc3MocmVzWzFdLmFkKTtcblx0ICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5sb2FkQWREYXRhKCk7XG5cdCAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5sb2FkQWREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG4vL+aooeaTrEdUTeacg+i8ieWFpeeahOizh+aWmVxuVGFndG9vQWRXYWxsLmFkRGF0YS5iYW5uZXIgPSB7XG4gICAgXCJpbWFnZV91cmxcIjogXCJ1cmwoJy8vbGgzLmdncGh0LmNvbS9nZEJydGgzNGQwVG56YUx0M3d4Y2k2ZER2WWUwbjIxVUFiT0l3TkNjVko0LUlEQkNBZkZZNG82el9hZGNNUTB6emkwQWZGa2Zja3RidHY1NkVnVUJDWU9QJykgbm8tcmVwZWF0IDUwJSA1MCVcIixcbiAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L2V2ZW50LzEwMy9hcGx1cy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmJhbm5lclwiLFxuICAgIFwiaXRlbV9oYXNoXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInRpdGxlXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInFtXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInFwXCI6IFwiY3Rob3VzZV9iYW5uZXJcIlxufTtcblRhZ3Rvb0FkV2FsbC5hZERhdGEubG9nbyA9IHtcbiAgICBcImltYWdlX3VybFwiOiBcInVybCgnLy9saDQuZ2dwaHQuY29tL1o4SXRKRlpGOHRianpZTXNSTXBlMWg3dFAzejBnckNaWFFXM1VnakpaOEEwZkxRSXc2ZDZIYV81Y2gwSnVabFk1dFAtaWw4VXBuc291ZEE3RUkwdkJ3JylcIixcbiAgICBcImxpbmtcIjogXCIvL3d3dy5jdGhvdXNlLmNvbS50dy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmxvZ29cIixcbiAgICBcIml0ZW1faGFzaFwiOiBcImN0aG91c2VfbG9nb1wiLFxuICAgIFwidGl0bGVcIjogXCJjdGhvdXNlX2xvZ29cIixcbiAgICBcInFtXCI6IFwiY3Rob3VzZV9sb2dvXCIsXG4gICAgXCJxcFwiOiBcImN0aG91c2VfbG9nb1wiXG59O1xuLy/nm67nmoTmmK/llaVcblRhZ3Rvb0FkV2FsbC5hZERhdGEuZmlyc3QgPSB7XG4gICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9cIixcbiAgICBcImltYWdlX3VybFwiOiBcIlwiLFxuICAgIFwidGl0bGVcIjogXCJjdGhvdXNlXCIsXG4gICAgXCJzdG9yZV9wcmljZVwiOiBcIlwiLFxuICAgIFwic3RvcmVfcHJpY2VcIjogXCJcIixcbiAgICBcInByaWNlXCI6IFwiXCIsXG4gICAgXCJlY19pZFwiOiAxNDIsLy8xNDI/Pz8/P1xuICAgIFwiZXh0cmFcIjoge1xuICAgICAgICBcInJvb3RcIjogXCJcIlxuICAgIH1cbn07XG5UYWd0b29BZFdhbGwuYWREYXRhLmJhY2tncm91bmQgPSB7XG4gICAgXCJpbWFnZV91cmxcIjogXCJcIixcbiAgICBcImxpbmtcIjogXCJcIixcbiAgICBcImJhY2tncm91bmRcIjogXCIjZWJlYmViIHVybCgnLy9saDUuZ2dwaHQuY29tL0M4NFBOYlZSdzRFb3BySVVMVmU0M1p4Y2gxUDFiZ0NpVGtidnJ6VFh2cmQweG9RVE5adENfbnRjQWlQeTVNY3hWQXdvZy1kd3JJeUdZa3h5MHNQWkNpcycpXCIsXG4gICAgXCJ0aXRsZVwiOiBcImN0aG91c2VcIlxufTtcblxuLy/lkb3lkI3vvJ/vvJ9cblRhZ3Rvb0FkV2FsbC5hZERhdGEucCA9IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy8mZGVidWc9dHJ1ZVwiO1xuXG5UYWd0b29BZFdhbGwuYWREYXRhLmVjSWQgPSAxMDA7XG5cblRhZ3Rvb0FkV2FsbC5yb3dSdWxlID0ge1xuXHRcImJhY2t1cFwiOiB7XG5cdFx0bmFtZTogXCJiYWNrdXBcIixcblx0ICAgIHR5cGU6IFwiYmFja3VwXCIsXG5cdCAgICB2YWx1ZTogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3LyZkZWJ1Zz10cnVlXCJcblx0fSxcbiAgICBcInJvd18xXCI6IHtcbiAgICBcdG5hbWU6IFwicmVjb21tZW5kXCIsXG4gICAgICAgIHR5cGU6IFwia2V5XCIsXG4gICAgICAgIHZhbHVlOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODkxNTk4XCIsXG4gICAgICAgIG1pbl9udW06IDZcbiAgICB9LFxuICAgIFwicm93XzJcIjoge1xuICAgIFx0bmFtZTogXCJzaW1pbGFyXCIsXG4gICAgICAgIHR5cGU6IFwia2V5XCIsXG4gICAgICAgIC8v5LmL5b6M6KaB5o+b5Zuee3twaWR9fVxuICAgICAgICB2YWx1ZTogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg5MTU5OFwiLFxuICAgICAgICBtaW5fbnVtOiA2XG4gICAgfSxcbiAgICBcInJvd18zXCI6IHtcbiAgICBcdG5hbWU6IFwicm9vdFBhZ2VcIixcbiAgICAgICAgdHlwZTogXCJrZXlcIixcbiAgICAgICAgLy/kuYvlvozopoHmj5vlm557e3BpZH19XG4gICAgICAgIHZhbHVlOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODkxNTk4XCIsXG4gICAgICAgIG1pbl9udW06IDEyXG4gICAgfVxufVxuXG53aW5kb3cuVGFndG9vQWRXYWxsID0gVGFndG9vQWRXYWxsO1xubW9kdWxlLmV4cG9ydHMgPSBUYWd0b29BZFdhbGw7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqIOmAmeaYryByb290IHZpZXfvvIzkuZ/nqLHngrogY29udHJvbGxlci12aWV3XG4gKi9cblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIGltcG9ydCBcblxuLy8gdmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIFRvcEJveCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vVG9wQm94LmpzeCcpICk7XG52YXIgQm90dG9tQm94ID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9Cb3R0b21Cb3guanN4JykgKTtcbnZhciBGb290ZXIgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL0Zvb3Rlci5qc3gnKSApO1xuXG52YXIgU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvU3RvcmUnKTtcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG5cbnZhciBpZFJlc2l6ZTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEFkV2FsbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FkV2FsbCcsXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vXG4gICAgLy8gbW91bnRcbiAgICBcbiAgICAvKipcbiAgICAgKiDpgJnmmK8gY29tcG9uZW50IEFQSSwg5ZyoIG1vdW50IOWJjeacg+i3keS4gOasoe+8jOWPluWAvOWBmueCuiB0aGlzLnN0YXRlIOeahOmgkOioreWAvFxuICAgICAqL1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5nZXRUcnV0aCgpOyAgLy8ge30gLT4gdGhpcy5zdGF0ZVxuICAgICAgICBvLnNjcmVlblNpemUgPSAndGFibGV0J1xuICAgICAgICByZXR1cm4gbzsgIFxuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOS4u+eoi+W8j+mAsuWFpem7nlxuICAgICAqL1xuICAgIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFN0b3JlLmFkZExpc3RlbmVyKCBBcHBDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCB0aGlzLl9vbkNoYW5nZSApO1xuXG4gICAgICAgIC8vIOimgeeUqCBpbnRlcnZhbCDmk4vkuIDkuItcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuaGFuZGxlUmVzaXplICk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVzaXplOiBmdW5jdGlvbihldnQpe1xuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCggaWRSZXNpemUgKTtcblxuICAgICAgICBpZFJlc2l6ZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgICAgICAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2YXIgc2l6ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQHRvZG86IOaUueWbniAxMDI0XG4gICAgICAgICAgICBpZihib2R5LnNjcm9sbFdpZHRoID4gNzIwKXtcbiAgICAgICAgICAgICAgICBzaXplID0gJ2Rlc2t0b3AnO1xuICAgICAgICAgICAgfWVsc2UgaWYoYm9keS5zY3JvbGxXaWR0aCA+IDQ4MCl7XG4gICAgICAgICAgICAgICAgc2l6ZSA9ICd0YWJsZXQnO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgc2l6ZSA9ICdwaG9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAncmVzaXplOiAnLCBib2R5LnNjcm9sbFdpZHRoLCBib2R5LnNjcm9sbEhlaWdodCwgJyA+c2l6ZTogJywgc2l6ZSApO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzY3JlZW5TaXplOiBzaXplfSk7XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKVxuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOmHjeimge+8mnJvb3QgdmlldyDlu7rnq4vlvoznrKzkuIDku7bkuovvvIzlsLHmmK/lgbXogb0gc3RvcmUg55qEIGNoYW5nZSDkuovku7ZcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGlmICghdGhpcy5wcm9wcy5yZXBvbnNlKSB7XG5cbiAgICAgICAgLy8gfVxuXG4gICAgfSwgIFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIHVubW91bnRcblxuICAgIC8qKlxuICAgICAqIOWFg+S7tuWwh+W+nueVq+mdouS4iuenu+mZpOaZgu+8jOimgeWBmuWWhOW+jOW3peS9nFxuICAgICAqL1xuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIoIHRoaXMuX29uQ2hhbmdlICk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGNvbXBvbmVudERpZFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vXG4gICAgLy8gdXBkYXRlXG5cbiAgICAvKipcbiAgICAgKiDlnKggcmVuZGVyKCkg5YmN5Z+36KGM77yM5pyJ5qmf5pyD5Y+v5YWI6JmV55CGIHByb3BzIOW+jOeUqCBzZXRTdGF0ZSgpIOWtmOi1t+S+hlxuICAgICAqL1xuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xuICAgICAgICAvL1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvLyDpgJnmmYLlt7LkuI3lj6/nlKggc2V0U3RhdGUoKVxuICAgIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIHJlbmRlclxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuc3RhdGUuc2NyZWVuU2l6ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coICdzaXplOiAnLCBzaXplICk7XG5cbiAgICAgICAgaWYoIHNpemUgPT0gJ3Bob25lJyApe1xuXG4gICAgICAgICAgICAvLyBwaG9uZVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFja2dyb3VuZFwifSwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ3cmFwZXJcIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgVG9wQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEJvdHRvbUJveCh7dHJ1dGg6IHRoaXMuc3RhdGV9KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBGb290ZXIobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuXG4gICAgICAgIH1lbHNlIGlmKCBzaXplID09ICd0YWJsZXQnKXtcblxuICAgICAgICAgICAgLy8gdGFibGV0XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJiYWNrZ3JvdW5kXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIndyYXBlclwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BCb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgQm90dG9tQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZvb3RlcihudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgIFxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIGRlc2t0b3BcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImJhY2tncm91bmRcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwid3JhcGVyXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFRvcEJveCh7dHJ1dGg6IHRoaXMuc3RhdGV9KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBCb3R0b21Cb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgRm9vdGVyKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuICAgIH0sXG5cblxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIHByaXZhdGUgbWV0aG9kcyAtIOiZleeQhuWFg+S7tuWFp+mDqOeahOS6i+S7tlxuXG4gICAgLyoqXG4gICAgICogY29udHJvbGxlci12aWV3IOWBteiBveWIsCBtb2RlbCBjaGFuZ2Ug5b6MXG4gICAgICog5Z+36KGM6YCZ5pSv77yM5a6D5pON5L2c5Y+m5LiA5pSvIHByaXZhdGUgbWV0aG9kIOWOu+i3nyBtb2RlbCDlj5bmnIDmlrDlgLxcbiAgICAgKiDnhLblvozmk43kvZwgY29tcG9uZW50IGxpZmUgY3ljbGUg55qEIHNldFN0YXRlKCkg5bCH5paw5YC854GM5YWl5YWD5Lu26auU57O7XG4gICAgICog5bCx5pyD6Ke455m85LiA6YCj5LiyIGNoaWxkIGNvbXBvbmVudHMg6Lef6JGX6YeN57mqXG4gICAgICovXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpe1xuICAgICAgICAvLyDph43opoHvvJrlvp4gcm9vdCB2aWV3IOinuOeZvOaJgOaciSBzdWItdmlldyDph43nuapcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSggdGhpcy5nZXRUcnV0aCgpICk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOeCuuS9leimgeeNqOeri+Wvq+S4gOaUr++8n+WboOeCuuacg+acieWFqeWAi+WcsOaWueacg+eUqOWIsO+8jOWboOatpOaKveWHuuS+hlxuICAgICAqIOebruWcsO+8muWQkeWQhOWAiyBzdG9yZSDlj5blm57os4fmlpnvvIznhLblvozntbHkuIAgc2V0U3RhdGUoKSDlho3kuIDlsaTlsaTlvoDkuIvlgrPpgZ5cbiAgICAgKi9cbiAgICBnZXRUcnV0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOaYr+W+niBTdG9yZSDlj5bos4fmlpkoYXMgdGhlIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGgpXG4gICAgICAgIHJldHVybiBTdG9yZS5nZXRBbGwoKTtcbiAgICB9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRXYWxsO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG4vKipcbiAqIFxuICovXG52YXIgQmFubmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQmFubmVyJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgICB2YXIgZGl2U3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UuYmFubmVyLmltYWdlX3VybFxuICAgIH1cbiAgICBcbiAgXHRyZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwidG9wLWJveC1yaWdodFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFubmVyXCIsIHN0eWxlOiBkaXZTdHlsZX0pXG4gICAgICAgIClcbiAgICApO1xuICB9LFxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbm5lcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIE1vcmUgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL01vcmUuanN4JykgKTtcbnZhciBQcmV2ID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9QcmV2LmpzeCcpICk7XG52YXIgTmV4dCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vTmV4dC5qc3gnKSApO1xudmFyIEl0ZW1MaXN0ID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9JdGVtTGlzdC5qc3gnKSApO1xuLyoqXG4gKiBcbiAqL1xudmFyIEJvdHRvbUJveCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0JvdHRvbUJveCcsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciByZXNwb25zZSA9IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2U7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYm90dG9tLWJveFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtpZDogXCJyb3dfMVwiLCBjbGFzc05hbWU6IFwiZXZlblwifSwgXG4gICAgICAgICAgICAgICAgTW9yZSh7bGluazogcmVzcG9uc2UuaXRlbUxpc3Qucm93XzEuYWRbMF0uZXh0cmEubGluazF9KSwgXG4gICAgICAgICAgICAgICAgUHJldih7b25DbGljazogdGhpcy5oYW5kbGVMZWZ0QXJyb3dDbGljay5iaW5kKHRoaXMsIFwicm93XzFcIiwgcmVzcG9uc2UuaXRlbUxpc3Qucm93XzEuYWQpfSksIFxuICAgICAgICAgICAgICAgIEl0ZW1MaXN0KHt0cnV0aDogcmVzcG9uc2UuaXRlbUxpc3Qucm93XzF9KSwgXG4gICAgICAgICAgICAgICAgTmV4dCh7b25DbGljazogdGhpcy5oYW5kbGVSaWdodEFycm93Q2xpY2suYmluZCh0aGlzLCBcInJvd18xXCIsIHJlc3BvbnNlLml0ZW1MaXN0LnJvd18xLmFkKX0pXG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2lkOiBcInJvd18yXCIsIGNsYXNzTmFtZTogXCJldmVuXCJ9LCBcbiAgICAgICAgICAgICAgICBNb3JlKHtsaW5rOiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMi5hZFswXS5leHRyYS5saW5rMX0pLCBcbiAgICAgICAgICAgICAgICBQcmV2KHtvbkNsaWNrOiB0aGlzLmhhbmRsZUxlZnRBcnJvd0NsaWNrLmJpbmQodGhpcywgXCJyb3dfMlwiLCByZXNwb25zZS5pdGVtTGlzdC5yb3dfMi5hZCl9KSwgXG4gICAgICAgICAgICAgICAgSXRlbUxpc3Qoe3RydXRoOiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMn0pLCBcbiAgICAgICAgICAgICAgICBOZXh0KHtvbkNsaWNrOiB0aGlzLmhhbmRsZVJpZ2h0QXJyb3dDbGljay5iaW5kKHRoaXMsIFwicm93XzJcIiwgcmVzcG9uc2UuaXRlbUxpc3Qucm93XzIuYWQpfSlcbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7aWQ6IFwicm93XzNcIiwgY2xhc3NOYW1lOiBcImV2ZW5cIn0sIFxuICAgICAgICAgICAgICAgIE1vcmUoe2xpbms6IHJlc3BvbnNlLml0ZW1MaXN0LnJvd18zLmFkWzBdLmV4dHJhLmxpbmsxfSksIFxuICAgICAgICAgICAgICAgIEl0ZW1MaXN0KHt0cnV0aDogcmVzcG9uc2UuaXRlbUxpc3Qucm93XzN9KVxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gIFx0KTtcbiAgfSxcbiAgaGFuZGxlTGVmdEFycm93Q2xpY2s6IGZ1bmN0aW9uKGtleSwgaXRlbUxpc3QpIHsvL+WFtuWvpuS4jeeUqOWCs2l0ZW1MaXN0LOWboOeCuuaciWtleeS6hlxuICAgIGFjdGlvbnMuU2hpZnRMZWZ0KGtleSwgaXRlbUxpc3QpO1xuICB9LFxuICBoYW5kbGVSaWdodEFycm93Q2xpY2s6IGZ1bmN0aW9uKGtleSwgaXRlbUxpc3QpIHsvL+WFtuWvpuS4jeeUqOWCs2l0ZW1MaXN0LOWboOeCuuaciWtleeS6hlxuICAgIGFjdGlvbnMuU2hpZnRSaWdodChrZXksIGl0ZW1MaXN0KTtcbiAgfVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvdHRvbUJveDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEZvb3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Zvb3RlcicsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgXHRyZXR1cm4gIFJlYWN0LkRPTS5mb290ZXIoe2NsYXNzTmFtZTogXCJmb290ZXJcIn0pXG5cbiAgfSxcblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXI7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG5cbi8qKlxuICogXG4gKi9cbnZhciBJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSXRlbScsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgZGV0YWlsID0gdGhpcy5wcm9wcy5kZXRhaWw7XG4gICAgXG4gIFx0cmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtXCIsIFxuICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMub3Blbkxpbmt9LCBcblxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tc2xvZ2FuXCJ9KSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbS1pbWdcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbWcoe3NyYzogZGV0YWlsLmltYWdlX3VybH0pXG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tdGl0bGVcIn0sIGRldGFpbC50aXRsZSksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJyZWdpb25cIn0sIGRldGFpbC5leHRyYS5yZWdpb24pLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJhcmVhXCJ9LCBkZXRhaWwuZXh0cmEuYXJlYSwgXCLlnapcIiksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tb2ZmZXJfcHJpY2VfcGx1c1wifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJvZmZlcl9wcmljZVwifSwgZGV0YWlsLnByaWNlKVxuICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbS1tb3JlXCJ9KVxuICAgICAgICApXG5cbiAgICApO1xuICB9LFxuICBvcGVuTGluazogZnVuY3Rpb24oKXtcbiAgICAvL+mAo+e1kOmDveacg+aYr2xpbmvpgJnlgIvlsazmgKfll47vvJ9zcGVjaWFs5Lmf5pyJ5LiA5YCLXG4gICAgdmFyIGNsaWNrX2xpbmsgPSB0aGlzLnByb3BzLmRldGFpbC5jbGlja19saW5rO1xuICAgIHdpbmRvdy5vcGVuKGNsaWNrX2xpbmssICdfYmxhbmsnKTtcbiAgfVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG52YXIgY3ggPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQ7XG52YXIgSXRlbSA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9JdGVtLmpzeCcpKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEl0ZW1MaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSXRlbUxpc3QnLFxuICAvKipcbiAgICogXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIC8vIOmAmeijj+S9v+eUqCByZWFjdCBjbGFzcyBhZGQtb24g5L6G5YiH5o+b5qij5byP6aGv56S6XG4gICAgLy8g6YCZ5qij5YGa5q+U6LyD5pyJ5qKd55CG77yM5q+U55u05o6l57WE5ZCI5aSa5YCL5a2X5Liy5L6G55qE5aW95o6n5Yi2ICBcbiAgICB2YXIgY2xhc3NlcyA9IGN4KHtcbiAgICAgICAgJ2xpc3QtaXRlbSc6IHRydWUsXG4gICAgfSk7XG4gICAgdmFyIEFkcyA9IHRoaXMucHJvcHMudHJ1dGguYWQ7XG5cbiAgICB2YXIgYXJyID0gQWRzLm1hcChmdW5jdGlvbihpdGVtLCBpbmRleCl7XG4gICAgICAgIHJldHVybiBJdGVtKHtrZXk6IGluZGV4LCBkZXRhaWw6IGl0ZW19KVxuICAgIH0sIHRoaXMpXG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbV9saXN0X3dyYXBlclwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00udWwoe2NsYXNzTmFtZTogXCJpdGVtX2xpc3RcIn0sIFxuICAgICAgICAgICAgICAgIGFyclxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgKVxuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1MaXN0OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIExvZ28gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMb2dvJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkaXZTdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZEltYWdlOiB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLmxvZ28uaW1hZ2VfdXJsXG4gICAgfVxuICAgIFxuICBcdHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ0b3AtYm94LWxlZnRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImxvZ29cIiwgc3R5bGU6IGRpdlN0eWxlfSlcbiAgICAgICAgKVxuICAgICk7XG4gIH0sXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTG9nbztcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIE1vcmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb3JlJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgXHQgIHJldHVybiAoXG4gICAgICAgICAgUmVhY3QuRE9NLmEoe2NsYXNzTmFtZTogXCJtb3JlXCIsIGhyZWY6IHRoaXMucHJvcHMubGluaywgdGFyZ2V0OiBcIl9ibGFua1wifSlcbiAgICAgICk7XG4gIH1cblxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vcmU7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG5cbi8qKlxuICogXG4gKi9cbnZhciBOZXh0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmV4dCcsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgXG4gIFx0cmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJuZXh0XCIsIFxuICAgICAgICAgICAgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrfSlcbiAgICApO1xuICB9XG5cblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOZXh0O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG4vKipcbiAqIFxuICovXG52YXIgUHJldiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1ByZXYnLFxuXG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFxuICBcdHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwicHJldlwiLCBcbiAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30pXG4gICAgKTtcbiAgfVxuXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJldjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIFNwZWNpYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTcGVjaWFsJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgICB2YXIgZmlyc3QgPSB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLmZpcnN0O1xuICBcdHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJzcGVjaWFsXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWltZ1wifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5pbWcoe3NyYzogZmlyc3QuaW1hZ2VfdXJsfSlcbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInNwZWNpYWwtdGV4dFwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1kZXNjcmliZVwifSwgZmlyc3QudGl0bGUpLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLXJlZ2lvblwifSwgZmlyc3QuZXh0cmEucmVnaW9uKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1zdG9yZV9wcmljZVwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2lkOiBcImxhYmVsXCJ9LCBcIue4veWDue+8mlwiKSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgZmlyc3QucHJpY2UpXG4gICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInNwZWNpYWwtYXJlYVwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2lkOiBcImxhYmVsXCJ9LCBcIuWdquaVuO+8mlwiKSwgXG4gICAgICAgICAgICAgICAgZmlyc3QuZXh0cmEuYXJlYSwgXCLlnapcIlxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLlsYvpvaHvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLmFnZVxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLmqJPlsaTvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLnN0b3JleVxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLmoLzlsYDvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLnBhdHRlcm5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwic3BlY2lhbC1tb3JlXCJ9KVxuICAgICAgICApXG4gICAgKTtcbiAgfSxcbiAgb3Blbkxpbms6IGZ1bmN0aW9uKCl7XG4gICAgLy/pgKPntZDpg73mnIPmmK9saW5r6YCZ5YCL5bGs5oCn5ZeO77yfc3BlY2lhbOS5n+acieS4gOWAi1xuICAgIHZhciBjbGlja19saW5rID0gZmlyc3QuY2xpY2tfbGluaztcbiAgICB3aW5kb3cub3BlbihjbGlja19saW5rLCAnX2JsYW5rJyk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3BlY2lhbDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIExvZ28gPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL0xvZ28uanN4JykgKTtcbnZhciBTcGVjaWFsID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9TcGVjaWFsLmpzeCcpICk7XG52YXIgQmFubmVyID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9CYW5uZXIuanN4JykgKTtcbi8qKlxuICogXG4gKi9cbnZhciBUb3BCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUb3BCb3gnLFxuXG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInRvcC1ib3hcIn0sIFxuICAgICAgICAgICAgTG9nbyh7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGh9KSwgXG4gICAgICAgICAgICBTcGVjaWFsKHt0cnV0aDogdGhpcy5wcm9wcy50cnV0aH0pLCBcbiAgICAgICAgICAgIEJhbm5lcih7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGh9KVxuICAgICAgICApXG5cdCAgKTtcbiAgfVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvcEJveDtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2UvcHJvbWlzZVwiKS5Qcm9taXNlO1xudmFyIHBvbHlmaWxsID0gcmVxdWlyZShcIi4vcHJvbWlzZS9wb2x5ZmlsbFwiKS5wb2x5ZmlsbDtcbmV4cG9ydHMuUHJvbWlzZSA9IFByb21pc2U7XG5leHBvcnRzLnBvbHlmaWxsID0gcG9seWZpbGw7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgdG9TdHJpbmcgKi9cblxudmFyIGlzQXJyYXkgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5pc0FycmF5O1xudmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5pc0Z1bmN0aW9uO1xuXG4vKipcbiAgUmV0dXJucyBhIHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgdGhlIGdpdmVuIHByb21pc2VzIGhhdmUgYmVlblxuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC4gVGhlIHJldHVybiBwcm9taXNlXG4gIGlzIGZ1bGZpbGxlZCB3aXRoIGFuIGFycmF5IHRoYXQgZ2l2ZXMgYWxsIHRoZSB2YWx1ZXMgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZVxuICBwYXNzZWQgaW4gdGhlIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlMSA9IFJTVlAucmVzb2x2ZSgxKTtcbiAgdmFyIHByb21pc2UyID0gUlNWUC5yZXNvbHZlKDIpO1xuICB2YXIgcHJvbWlzZTMgPSBSU1ZQLnJlc29sdmUoMyk7XG4gIHZhciBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFJTVlAuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBUaGUgYXJyYXkgaGVyZSB3b3VsZCBiZSBbIDEsIDIsIDMgXTtcbiAgfSk7XG4gIGBgYFxuXG4gIElmIGFueSBvZiB0aGUgYHByb21pc2VzYCBnaXZlbiB0byBgUlNWUC5hbGxgIGFyZSByZWplY3RlZCwgdGhlIGZpcnN0IHByb21pc2VcbiAgdGhhdCBpcyByZWplY3RlZCB3aWxsIGJlIGdpdmVuIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSByZXR1cm5lZCBwcm9taXNlcydzXG4gIHJlamVjdGlvbiBoYW5kbGVyLiBGb3IgZXhhbXBsZTpcblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICB2YXIgcHJvbWlzZTIgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoXCIyXCIpKTtcbiAgdmFyIHByb21pc2UzID0gUlNWUC5yZWplY3QobmV3IEVycm9yKFwiM1wiKSk7XG4gIHZhciBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFJTVlAuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVucyBiZWNhdXNlIHRoZXJlIGFyZSByZWplY3RlZCBwcm9taXNlcyFcbiAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAvLyBlcnJvci5tZXNzYWdlID09PSBcIjJcIlxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCBhbGxcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbFxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuKi9cbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgaWYgKCFpc0FycmF5KHByb21pc2VzKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gYWxsLicpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXN1bHRzID0gW10sIHJlbWFpbmluZyA9IHByb21pc2VzLmxlbmd0aCxcbiAgICBwcm9taXNlO1xuXG4gICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgcmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZXIoaW5kZXgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXNvbHZlQWxsKGluZGV4LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmVBbGwoaW5kZXgsIHZhbHVlKSB7XG4gICAgICByZXN1bHRzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICBpZiAocHJvbWlzZSAmJiBpc0Z1bmN0aW9uKHByb21pc2UudGhlbikpIHtcbiAgICAgICAgcHJvbWlzZS50aGVuKHJlc29sdmVyKGkpLCByZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZUFsbChpLCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnRzLmFsbCA9IGFsbDsiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcblwidXNlIHN0cmljdFwiO1xudmFyIGJyb3dzZXJHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDoge307XG52YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBicm93c2VyR2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xudmFyIGxvY2FsID0gKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSA/IGdsb2JhbCA6ICh0aGlzID09PSB1bmRlZmluZWQ/IHdpbmRvdzp0aGlzKTtcblxuLy8gbm9kZVxuZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZVNldFRpbWVvdXQoKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBsb2NhbC5zZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgfTtcbn1cblxudmFyIHF1ZXVlID0gW107XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0dXBsZSA9IHF1ZXVlW2ldO1xuICAgIHZhciBjYWxsYmFjayA9IHR1cGxlWzBdLCBhcmcgPSB0dXBsZVsxXTtcbiAgICBjYWxsYmFjayhhcmcpO1xuICB9XG4gIHF1ZXVlID0gW107XG59XG5cbnZhciBzY2hlZHVsZUZsdXNoO1xuXG4vLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXScpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG59IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG59IGVsc2Uge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlU2V0VGltZW91dCgpO1xufVxuXG5mdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgdmFyIGxlbmd0aCA9IHF1ZXVlLnB1c2goW2NhbGxiYWNrLCBhcmddKTtcbiAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgIC8vIElmIGxlbmd0aCBpcyAxLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICBzY2hlZHVsZUZsdXNoKCk7XG4gIH1cbn1cblxuZXhwb3J0cy5hc2FwID0gYXNhcDtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICBgUlNWUC5Qcm9taXNlLmNhc3RgIHJldHVybnMgdGhlIHNhbWUgcHJvbWlzZSBpZiB0aGF0IHByb21pc2Ugc2hhcmVzIGEgY29uc3RydWN0b3JcbiAgd2l0aCB0aGUgcHJvbWlzZSBiZWluZyBjYXN0ZWQuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlID0gUlNWUC5yZXNvbHZlKDEpO1xuICB2YXIgY2FzdGVkID0gUlNWUC5Qcm9taXNlLmNhc3QocHJvbWlzZSk7XG5cbiAgY29uc29sZS5sb2cocHJvbWlzZSA9PT0gY2FzdGVkKTsgLy8gdHJ1ZVxuICBgYGBcblxuICBJbiB0aGUgY2FzZSBvZiBhIHByb21pc2Ugd2hvc2UgY29uc3RydWN0b3IgZG9lcyBub3QgbWF0Y2gsIGl0IGlzIGFzc2ltaWxhdGVkLlxuICBUaGUgcmVzdWx0aW5nIHByb21pc2Ugd2lsbCBmdWxmaWxsIG9yIHJlamVjdCBiYXNlZCBvbiB0aGUgb3V0Y29tZSBvZiB0aGVcbiAgcHJvbWlzZSBiZWluZyBjYXN0ZWQuXG5cbiAgSW4gdGhlIGNhc2Ugb2YgYSBub24tcHJvbWlzZSwgYSBwcm9taXNlIHdoaWNoIHdpbGwgZnVsZmlsbCB3aXRoIHRoYXQgdmFsdWUgaXNcbiAgcmV0dXJuZWQuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciB2YWx1ZSA9IDE7IC8vIGNvdWxkIGJlIGEgbnVtYmVyLCBib29sZWFuLCBzdHJpbmcsIHVuZGVmaW5lZC4uLlxuICB2YXIgY2FzdGVkID0gUlNWUC5Qcm9taXNlLmNhc3QodmFsdWUpO1xuXG4gIGNvbnNvbGUubG9nKHZhbHVlID09PSBjYXN0ZWQpOyAvLyBmYWxzZVxuICBjb25zb2xlLmxvZyhjYXN0ZWQgaW5zdGFuY2VvZiBSU1ZQLlByb21pc2UpIC8vIHRydWVcblxuICBjYXN0ZWQudGhlbihmdW5jdGlvbih2YWwpIHtcbiAgICB2YWwgPT09IHZhbHVlIC8vID0+IHRydWVcbiAgfSk7XG4gIGBgYFxuXG4gIGBSU1ZQLlByb21pc2UuY2FzdGAgaXMgc2ltaWxhciB0byBgUlNWUC5yZXNvbHZlYCwgYnV0IGBSU1ZQLlByb21pc2UuY2FzdGAgZGlmZmVycyBpbiB0aGVcbiAgZm9sbG93aW5nIHdheXM6XG4gICogYFJTVlAuUHJvbWlzZS5jYXN0YCBzZXJ2ZXMgYXMgYSBtZW1vcnktZWZmaWNpZW50IHdheSBvZiBnZXR0aW5nIGEgcHJvbWlzZSwgd2hlbiB5b3VcbiAgaGF2ZSBzb21ldGhpbmcgdGhhdCBjb3VsZCBlaXRoZXIgYmUgYSBwcm9taXNlIG9yIGEgdmFsdWUuIFJTVlAucmVzb2x2ZVxuICB3aWxsIGhhdmUgdGhlIHNhbWUgZWZmZWN0IGJ1dCB3aWxsIGNyZWF0ZSBhIG5ldyBwcm9taXNlIHdyYXBwZXIgaWYgdGhlXG4gIGFyZ3VtZW50IGlzIGEgcHJvbWlzZS5cbiAgKiBgUlNWUC5Qcm9taXNlLmNhc3RgIGlzIGEgd2F5IG9mIGNhc3RpbmcgaW5jb21pbmcgdGhlbmFibGVzIG9yIHByb21pc2Ugc3ViY2xhc3NlcyB0b1xuICBwcm9taXNlcyBvZiB0aGUgZXhhY3QgY2xhc3Mgc3BlY2lmaWVkLCBzbyB0aGF0IHRoZSByZXN1bHRpbmcgb2JqZWN0J3MgYHRoZW5gIGlzXG4gIGVuc3VyZWQgdG8gaGF2ZSB0aGUgYmVoYXZpb3Igb2YgdGhlIGNvbnN0cnVjdG9yIHlvdSBhcmUgY2FsbGluZyBjYXN0IG9uIChpLmUuLCBSU1ZQLlByb21pc2UpLlxuXG4gIEBtZXRob2QgY2FzdFxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtPYmplY3R9IG9iamVjdCB0byBiZSBjYXN0ZWRcbiAgQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCBwcm9wZXJ0aWVzIG9mIGBwcm9taXNlc2BcbiAgaGF2ZSBiZWVuIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuKi9cblxuXG5mdW5jdGlvbiBjYXN0KG9iamVjdCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gdGhpcykge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICByZXNvbHZlKG9iamVjdCk7XG4gIH0pO1xufVxuXG5leHBvcnRzLmNhc3QgPSBjYXN0OyIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZyA9IHtcbiAgaW5zdHJ1bWVudDogZmFsc2Vcbn07XG5cbmZ1bmN0aW9uIGNvbmZpZ3VyZShuYW1lLCB2YWx1ZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbmZpZ1tuYW1lXSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb25maWdbbmFtZV07XG4gIH1cbn1cblxuZXhwb3J0cy5jb25maWcgPSBjb25maWc7XG5leHBvcnRzLmNvbmZpZ3VyZSA9IGNvbmZpZ3VyZTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG5cInVzZSBzdHJpY3RcIjtcbi8qZ2xvYmFsIHNlbGYqL1xudmFyIFJTVlBQcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZVwiKS5Qcm9taXNlO1xudmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5pc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBwb2x5ZmlsbCgpIHtcbiAgdmFyIGxvY2FsO1xuXG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxvY2FsID0gZ2xvYmFsO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5kb2N1bWVudCkge1xuICAgIGxvY2FsID0gd2luZG93O1xuICB9IGVsc2Uge1xuICAgIGxvY2FsID0gc2VsZjtcbiAgfVxuXG4gIHZhciBlczZQcm9taXNlU3VwcG9ydCA9IFxuICAgIFwiUHJvbWlzZVwiIGluIGxvY2FsICYmXG4gICAgLy8gU29tZSBvZiB0aGVzZSBtZXRob2RzIGFyZSBtaXNzaW5nIGZyb21cbiAgICAvLyBGaXJlZm94L0Nocm9tZSBleHBlcmltZW50YWwgaW1wbGVtZW50YXRpb25zXG4gICAgXCJjYXN0XCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgIFwicmVzb2x2ZVwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJlamVjdFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcImFsbFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJhY2VcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgLy8gT2xkZXIgdmVyc2lvbiBvZiB0aGUgc3BlYyBoYWQgYSByZXNvbHZlciBvYmplY3RcbiAgICAvLyBhcyB0aGUgYXJnIHJhdGhlciB0aGFuIGEgZnVuY3Rpb25cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzb2x2ZTtcbiAgICAgIG5ldyBsb2NhbC5Qcm9taXNlKGZ1bmN0aW9uKHIpIHsgcmVzb2x2ZSA9IHI7IH0pO1xuICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ocmVzb2x2ZSk7XG4gICAgfSgpKTtcblxuICBpZiAoIWVzNlByb21pc2VTdXBwb3J0KSB7XG4gICAgbG9jYWwuUHJvbWlzZSA9IFJTVlBQcm9taXNlO1xuICB9XG59XG5cbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY29uZmlnID0gcmVxdWlyZShcIi4vY29uZmlnXCIpLmNvbmZpZztcbnZhciBjb25maWd1cmUgPSByZXF1aXJlKFwiLi9jb25maWdcIikuY29uZmlndXJlO1xudmFyIG9iamVjdE9yRnVuY3Rpb24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5vYmplY3RPckZ1bmN0aW9uO1xudmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5pc0Z1bmN0aW9uO1xudmFyIG5vdyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLm5vdztcbnZhciBjYXN0ID0gcmVxdWlyZShcIi4vY2FzdFwiKS5jYXN0O1xudmFyIGFsbCA9IHJlcXVpcmUoXCIuL2FsbFwiKS5hbGw7XG52YXIgcmFjZSA9IHJlcXVpcmUoXCIuL3JhY2VcIikucmFjZTtcbnZhciBzdGF0aWNSZXNvbHZlID0gcmVxdWlyZShcIi4vcmVzb2x2ZVwiKS5yZXNvbHZlO1xudmFyIHN0YXRpY1JlamVjdCA9IHJlcXVpcmUoXCIuL3JlamVjdFwiKS5yZWplY3Q7XG52YXIgYXNhcCA9IHJlcXVpcmUoXCIuL2FzYXBcIikuYXNhcDtcblxudmFyIGNvdW50ZXIgPSAwO1xuXG5jb25maWcuYXN5bmMgPSBhc2FwOyAvLyBkZWZhdWx0IGFzeW5jIGlzIGFzYXA7XG5cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKHJlc29sdmVyKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbiAgfVxuXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gY29uc3RydWN0ICdQcm9taXNlJzogUGxlYXNlIHVzZSB0aGUgJ25ldycgb3BlcmF0b3IsIHRoaXMgb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gIH1cblxuICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gIGludm9rZVJlc29sdmVyKHJlc29sdmVyLCB0aGlzKTtcbn1cblxuZnVuY3Rpb24gaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHByb21pc2UpIHtcbiAgZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpIHtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIH1cblxuICB0cnkge1xuICAgIHJlc29sdmVyKHJlc29sdmVQcm9taXNlLCByZWplY3RQcm9taXNlKTtcbiAgfSBjYXRjaChlKSB7XG4gICAgcmVqZWN0UHJvbWlzZShlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gIHZhciBoYXNDYWxsYmFjayA9IGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICBpZiAoaGFzQ2FsbGJhY2spIHtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICBlcnJvciA9IGU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gZGV0YWlsO1xuICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gIH1cblxuICBpZiAoaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpKSB7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gRlVMRklMTEVEKSB7XG4gICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gUkVKRUNURUQpIHtcbiAgICByZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbnZhciBQRU5ESU5HICAgPSB2b2lkIDA7XG52YXIgU0VBTEVEICAgID0gMDtcbnZhciBGVUxGSUxMRUQgPSAxO1xudmFyIFJFSkVDVEVEICA9IDI7XG5cbmZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgc3Vic2NyaWJlcnMgPSBwYXJlbnQuX3N1YnNjcmliZXJzO1xuICB2YXIgbGVuZ3RoID0gc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gIHN1YnNjcmliZXJzW2xlbmd0aCArIFJFSkVDVEVEXSAgPSBvblJlamVjdGlvbjtcbn1cblxuZnVuY3Rpb24gcHVibGlzaChwcm9taXNlLCBzZXR0bGVkKSB7XG4gIHZhciBjaGlsZCwgY2FsbGJhY2ssIHN1YnNjcmliZXJzID0gcHJvbWlzZS5fc3Vic2NyaWJlcnMsIGRldGFpbCA9IHByb21pc2UuX2RldGFpbDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgfVxuXG4gIHByb21pc2UuX3N1YnNjcmliZXJzID0gbnVsbDtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBQcm9taXNlLFxuXG4gIF9zdGF0ZTogdW5kZWZpbmVkLFxuICBfZGV0YWlsOiB1bmRlZmluZWQsXG4gIF9zdWJzY3JpYmVyczogdW5kZWZpbmVkLFxuXG4gIHRoZW46IGZ1bmN0aW9uKG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuXG4gICAgdmFyIHRoZW5Qcm9taXNlID0gbmV3IHRoaXMuY29uc3RydWN0b3IoZnVuY3Rpb24oKSB7fSk7XG5cbiAgICBpZiAodGhpcy5fc3RhdGUpIHtcbiAgICAgIHZhciBjYWxsYmFja3MgPSBhcmd1bWVudHM7XG4gICAgICBjb25maWcuYXN5bmMoZnVuY3Rpb24gaW52b2tlUHJvbWlzZUNhbGxiYWNrKCkge1xuICAgICAgICBpbnZva2VDYWxsYmFjayhwcm9taXNlLl9zdGF0ZSwgdGhlblByb21pc2UsIGNhbGxiYWNrc1twcm9taXNlLl9zdGF0ZSAtIDFdLCBwcm9taXNlLl9kZXRhaWwpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1YnNjcmliZSh0aGlzLCB0aGVuUHJvbWlzZSwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGVuUHJvbWlzZTtcbiAgfSxcblxuICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICB9XG59O1xuXG5Qcm9taXNlLmFsbCA9IGFsbDtcblByb21pc2UuY2FzdCA9IGNhc3Q7XG5Qcm9taXNlLnJhY2UgPSByYWNlO1xuUHJvbWlzZS5yZXNvbHZlID0gc3RhdGljUmVzb2x2ZTtcblByb21pc2UucmVqZWN0ID0gc3RhdGljUmVqZWN0O1xuXG5mdW5jdGlvbiBoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkge1xuICB2YXIgdGhlbiA9IG51bGwsXG4gIHJlc29sdmVkO1xuXG4gIHRyeSB7XG4gICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLlwiKTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHRoZW4gPSB2YWx1ZS50aGVuO1xuXG4gICAgICBpZiAoaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgIHJlc29sdmVkID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdmFsKSB7XG4gICAgICAgICAgICByZXNvbHZlKHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgIHJlc29sdmVkID0gdHJ1ZTtcblxuICAgICAgICAgIHJlamVjdChwcm9taXNlLCB2YWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKHJlc29sdmVkKSB7IHJldHVybiB0cnVlOyB9XG4gICAgcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgfSBlbHNlIGlmICghaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gIHByb21pc2UuX3N0YXRlID0gU0VBTEVEO1xuICBwcm9taXNlLl9kZXRhaWwgPSB2YWx1ZTtcblxuICBjb25maWcuYXN5bmMocHVibGlzaEZ1bGZpbGxtZW50LCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gIHByb21pc2UuX3N0YXRlID0gU0VBTEVEO1xuICBwcm9taXNlLl9kZXRhaWwgPSByZWFzb247XG5cbiAgY29uZmlnLmFzeW5jKHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoRnVsZmlsbG1lbnQocHJvbWlzZSkge1xuICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gRlVMRklMTEVEKTtcbn1cblxuZnVuY3Rpb24gcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gIHB1Ymxpc2gocHJvbWlzZSwgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRCk7XG59XG5cbmV4cG9ydHMuUHJvbWlzZSA9IFByb21pc2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgdG9TdHJpbmcgKi9cbnZhciBpc0FycmF5ID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNBcnJheTtcblxuLyoqXG4gIGBSU1ZQLnJhY2VgIGFsbG93cyB5b3UgdG8gd2F0Y2ggYSBzZXJpZXMgb2YgcHJvbWlzZXMgYW5kIGFjdCBhcyBzb29uIGFzIHRoZVxuICBmaXJzdCBwcm9taXNlIGdpdmVuIHRvIHRoZSBgcHJvbWlzZXNgIGFyZ3VtZW50IGZ1bGZpbGxzIG9yIHJlamVjdHMuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlMSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKFwicHJvbWlzZSAxXCIpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIHZhciBwcm9taXNlMiA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKFwicHJvbWlzZSAyXCIpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFJTVlAucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHJlc3VsdCA9PT0gXCJwcm9taXNlIDJcIiBiZWNhdXNlIGl0IHdhcyByZXNvbHZlZCBiZWZvcmUgcHJvbWlzZTFcbiAgICAvLyB3YXMgcmVzb2x2ZWQuXG4gIH0pO1xuICBgYGBcblxuICBgUlNWUC5yYWNlYCBpcyBkZXRlcm1pbmlzdGljIGluIHRoYXQgb25seSB0aGUgc3RhdGUgb2YgdGhlIGZpcnN0IGNvbXBsZXRlZFxuICBwcm9taXNlIG1hdHRlcnMuIEZvciBleGFtcGxlLCBldmVuIGlmIG90aGVyIHByb21pc2VzIGdpdmVuIHRvIHRoZSBgcHJvbWlzZXNgXG4gIGFycmF5IGFyZ3VtZW50IGFyZSByZXNvbHZlZCwgYnV0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZSBoYXMgYmVjb21lXG4gIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkIHByb21pc2VcbiAgd2lsbCBiZWNvbWUgcmVqZWN0ZWQ6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMVwiKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICB2YXIgcHJvbWlzZTIgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcInByb21pc2UgMlwiKSk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgUlNWUC5yYWNlKFtwcm9taXNlMSwgcHJvbWlzZTJdKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09IFwicHJvbWlzZTJcIiBiZWNhdXNlIHByb21pc2UgMiBiZWNhbWUgcmVqZWN0ZWQgYmVmb3JlXG4gICAgLy8gcHJvbWlzZSAxIGJlY2FtZSBmdWxmaWxsZWRcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmFjZVxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBcnJheX0gcHJvbWlzZXMgYXJyYXkgb2YgcHJvbWlzZXMgdG8gb2JzZXJ2ZVxuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBkZXNjcmliaW5nIHRoZSBwcm9taXNlIHJldHVybmVkLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IGJlY29tZXMgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIHRoZSBmaXJzdFxuICBjb21wbGV0ZWQgcHJvbWlzZXMgaXMgcmVzb2x2ZWQgd2l0aCBpZiB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2Ugd2FzXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgd2l0aCB0aGUgcmVhc29uIHRoYXQgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlXG4gIHdhcyByZWplY3RlZCB3aXRoLlxuKi9cbmZ1bmN0aW9uIHJhY2UocHJvbWlzZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIGlmICghaXNBcnJheShwcm9taXNlcykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIHJhY2UuJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXN1bHRzID0gW10sIHByb21pc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgIGlmIChwcm9taXNlICYmIHR5cGVvZiBwcm9taXNlLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydHMucmFjZSA9IHJhY2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAgYFJTVlAucmVqZWN0YCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlamVjdGVkIHdpdGggdGhlIHBhc3NlZFxuICBgcmVhc29uYC4gYFJTVlAucmVqZWN0YCBpcyBlc3NlbnRpYWxseSBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gQ29kZSBoZXJlIGRvZXNuJ3QgcnVuIGJlY2F1c2UgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQhXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZSA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gQ29kZSBoZXJlIGRvZXNuJ3QgcnVuIGJlY2F1c2UgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQhXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlamVjdFxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBbnl9IHJlYXNvbiB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQgd2l0aC5cbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgaWRlbnRpZnlpbmcgdGhlIHJldHVybmVkIHByb21pc2UuXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVqZWN0ZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgYHJlYXNvbmAuXG4qL1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICByZWplY3QocmVhc29uKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMucmVqZWN0ID0gcmVqZWN0OyIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gIGBSU1ZQLnJlc29sdmVgIHJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgZnVsZmlsbGVkIHdpdGggdGhlIHBhc3NlZFxuICBgdmFsdWVgLiBgUlNWUC5yZXNvbHZlYCBpcyBlc3NlbnRpYWxseSBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZXNvbHZlKDEpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZSA9IFJTVlAucmVzb2x2ZSgxKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlc29sdmVcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QW55fSB2YWx1ZSB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVzb2x2ZWQgd2l0aFxuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBpZGVudGlmeWluZyB0aGUgcmV0dXJuZWQgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSBmdWxmaWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgYHZhbHVlYFxuKi9cbmZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVzb2x2ZSh2YWx1ZSk7XG4gIH0pO1xufVxuXG5leHBvcnRzLnJlc29sdmUgPSByZXNvbHZlOyIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gb2JqZWN0T3JGdW5jdGlvbih4KSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKHgpIHx8ICh0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsKTtcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KHgpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xufVxuXG4vLyBEYXRlLm5vdyBpcyBub3QgYXZhaWxhYmxlIGluIGJyb3dzZXJzIDwgSUU5XG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9EYXRlL25vdyNDb21wYXRpYmlsaXR5XG52YXIgbm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuXG5leHBvcnRzLm9iamVjdE9yRnVuY3Rpb24gPSBvYmplY3RPckZ1bmN0aW9uO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLm5vdyA9IG5vdzsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbm1vZHVsZS5leHBvcnRzLkRpc3BhdGNoZXIgPSByZXF1aXJlKCcuL2xpYi9EaXNwYXRjaGVyJylcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgRGlzcGF0Y2hlclxuICogQHR5cGVjaGVja3NcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJy4vaW52YXJpYW50Jyk7XG5cbnZhciBfbGFzdElEID0gMTtcbnZhciBfcHJlZml4ID0gJ0lEXyc7XG5cbi8qKlxuICogRGlzcGF0Y2hlciBpcyB1c2VkIHRvIGJyb2FkY2FzdCBwYXlsb2FkcyB0byByZWdpc3RlcmVkIGNhbGxiYWNrcy4gVGhpcyBpc1xuICogZGlmZmVyZW50IGZyb20gZ2VuZXJpYyBwdWItc3ViIHN5c3RlbXMgaW4gdHdvIHdheXM6XG4gKlxuICogICAxKSBDYWxsYmFja3MgYXJlIG5vdCBzdWJzY3JpYmVkIHRvIHBhcnRpY3VsYXIgZXZlbnRzLiBFdmVyeSBwYXlsb2FkIGlzXG4gKiAgICAgIGRpc3BhdGNoZWQgdG8gZXZlcnkgcmVnaXN0ZXJlZCBjYWxsYmFjay5cbiAqICAgMikgQ2FsbGJhY2tzIGNhbiBiZSBkZWZlcnJlZCBpbiB3aG9sZSBvciBwYXJ0IHVudGlsIG90aGVyIGNhbGxiYWNrcyBoYXZlXG4gKiAgICAgIGJlZW4gZXhlY3V0ZWQuXG4gKlxuICogRm9yIGV4YW1wbGUsIGNvbnNpZGVyIHRoaXMgaHlwb3RoZXRpY2FsIGZsaWdodCBkZXN0aW5hdGlvbiBmb3JtLCB3aGljaFxuICogc2VsZWN0cyBhIGRlZmF1bHQgY2l0eSB3aGVuIGEgY291bnRyeSBpcyBzZWxlY3RlZDpcbiAqXG4gKiAgIHZhciBmbGlnaHREaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHdoaWNoIGNvdW50cnkgaXMgc2VsZWN0ZWRcbiAqICAgdmFyIENvdW50cnlTdG9yZSA9IHtjb3VudHJ5OiBudWxsfTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHdoaWNoIGNpdHkgaXMgc2VsZWN0ZWRcbiAqICAgdmFyIENpdHlTdG9yZSA9IHtjaXR5OiBudWxsfTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHRoZSBiYXNlIGZsaWdodCBwcmljZSBvZiB0aGUgc2VsZWN0ZWQgY2l0eVxuICogICB2YXIgRmxpZ2h0UHJpY2VTdG9yZSA9IHtwcmljZTogbnVsbH1cbiAqXG4gKiBXaGVuIGEgdXNlciBjaGFuZ2VzIHRoZSBzZWxlY3RlZCBjaXR5LCB3ZSBkaXNwYXRjaCB0aGUgcGF5bG9hZDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICogICAgIGFjdGlvblR5cGU6ICdjaXR5LXVwZGF0ZScsXG4gKiAgICAgc2VsZWN0ZWRDaXR5OiAncGFyaXMnXG4gKiAgIH0pO1xuICpcbiAqIFRoaXMgcGF5bG9hZCBpcyBkaWdlc3RlZCBieSBgQ2l0eVN0b3JlYDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjaXR5LXVwZGF0ZScpIHtcbiAqICAgICAgIENpdHlTdG9yZS5jaXR5ID0gcGF5bG9hZC5zZWxlY3RlZENpdHk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBXaGVuIHRoZSB1c2VyIHNlbGVjdHMgYSBjb3VudHJ5LCB3ZSBkaXNwYXRjaCB0aGUgcGF5bG9hZDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICogICAgIGFjdGlvblR5cGU6ICdjb3VudHJ5LXVwZGF0ZScsXG4gKiAgICAgc2VsZWN0ZWRDb3VudHJ5OiAnYXVzdHJhbGlhJ1xuICogICB9KTtcbiAqXG4gKiBUaGlzIHBheWxvYWQgaXMgZGlnZXN0ZWQgYnkgYm90aCBzdG9yZXM6XG4gKlxuICogICAgQ291bnRyeVN0b3JlLmRpc3BhdGNoVG9rZW4gPSBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY291bnRyeS11cGRhdGUnKSB7XG4gKiAgICAgICBDb3VudHJ5U3RvcmUuY291bnRyeSA9IHBheWxvYWQuc2VsZWN0ZWRDb3VudHJ5O1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogV2hlbiB0aGUgY2FsbGJhY2sgdG8gdXBkYXRlIGBDb3VudHJ5U3RvcmVgIGlzIHJlZ2lzdGVyZWQsIHdlIHNhdmUgYSByZWZlcmVuY2VcbiAqIHRvIHRoZSByZXR1cm5lZCB0b2tlbi4gVXNpbmcgdGhpcyB0b2tlbiB3aXRoIGB3YWl0Rm9yKClgLCB3ZSBjYW4gZ3VhcmFudGVlXG4gKiB0aGF0IGBDb3VudHJ5U3RvcmVgIGlzIHVwZGF0ZWQgYmVmb3JlIHRoZSBjYWxsYmFjayB0aGF0IHVwZGF0ZXMgYENpdHlTdG9yZWBcbiAqIG5lZWRzIHRvIHF1ZXJ5IGl0cyBkYXRhLlxuICpcbiAqICAgQ2l0eVN0b3JlLmRpc3BhdGNoVG9rZW4gPSBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY291bnRyeS11cGRhdGUnKSB7XG4gKiAgICAgICAvLyBgQ291bnRyeVN0b3JlLmNvdW50cnlgIG1heSBub3QgYmUgdXBkYXRlZC5cbiAqICAgICAgIGZsaWdodERpc3BhdGNoZXIud2FpdEZvcihbQ291bnRyeVN0b3JlLmRpc3BhdGNoVG9rZW5dKTtcbiAqICAgICAgIC8vIGBDb3VudHJ5U3RvcmUuY291bnRyeWAgaXMgbm93IGd1YXJhbnRlZWQgdG8gYmUgdXBkYXRlZC5cbiAqXG4gKiAgICAgICAvLyBTZWxlY3QgdGhlIGRlZmF1bHQgY2l0eSBmb3IgdGhlIG5ldyBjb3VudHJ5XG4gKiAgICAgICBDaXR5U3RvcmUuY2l0eSA9IGdldERlZmF1bHRDaXR5Rm9yQ291bnRyeShDb3VudHJ5U3RvcmUuY291bnRyeSk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBUaGUgdXNhZ2Ugb2YgYHdhaXRGb3IoKWAgY2FuIGJlIGNoYWluZWQsIGZvciBleGFtcGxlOlxuICpcbiAqICAgRmxpZ2h0UHJpY2VTdG9yZS5kaXNwYXRjaFRva2VuID1cbiAqICAgICBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb25UeXBlKSB7XG4gKiAgICAgICAgIGNhc2UgJ2NvdW50cnktdXBkYXRlJzpcbiAqICAgICAgICAgICBmbGlnaHREaXNwYXRjaGVyLndhaXRGb3IoW0NpdHlTdG9yZS5kaXNwYXRjaFRva2VuXSk7XG4gKiAgICAgICAgICAgRmxpZ2h0UHJpY2VTdG9yZS5wcmljZSA9XG4gKiAgICAgICAgICAgICBnZXRGbGlnaHRQcmljZVN0b3JlKENvdW50cnlTdG9yZS5jb3VudHJ5LCBDaXR5U3RvcmUuY2l0eSk7XG4gKiAgICAgICAgICAgYnJlYWs7XG4gKlxuICogICAgICAgICBjYXNlICdjaXR5LXVwZGF0ZSc6XG4gKiAgICAgICAgICAgRmxpZ2h0UHJpY2VTdG9yZS5wcmljZSA9XG4gKiAgICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlKENvdW50cnlTdG9yZS5jb3VudHJ5LCBDaXR5U3RvcmUuY2l0eSk7XG4gKiAgICAgICAgICAgYnJlYWs7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBUaGUgYGNvdW50cnktdXBkYXRlYCBwYXlsb2FkIHdpbGwgYmUgZ3VhcmFudGVlZCB0byBpbnZva2UgdGhlIHN0b3JlcydcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGluIG9yZGVyOiBgQ291bnRyeVN0b3JlYCwgYENpdHlTdG9yZWAsIHRoZW5cbiAqIGBGbGlnaHRQcmljZVN0b3JlYC5cbiAqL1xuXG4gIGZ1bmN0aW9uIERpc3BhdGNoZXIoKSB7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3MgPSB7fTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZyA9IHt9O1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkID0ge307XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9wZW5kaW5nUGF5bG9hZCA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aXRoIGV2ZXJ5IGRpc3BhdGNoZWQgcGF5bG9hZC4gUmV0dXJuc1xuICAgKiBhIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBgd2FpdEZvcigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUucmVnaXN0ZXI9ZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgaWQgPSBfcHJlZml4ICsgX2xhc3RJRCsrO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzW2lkXSA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBpZDtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNhbGxiYWNrIGJhc2VkIG9uIGl0cyB0b2tlbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS51bnJlZ2lzdGVyPWZ1bmN0aW9uKGlkKSB7XG4gICAgaW52YXJpYW50KFxuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdLFxuICAgICAgJ0Rpc3BhdGNoZXIudW5yZWdpc3RlciguLi4pOiBgJXNgIGRvZXMgbm90IG1hcCB0byBhIHJlZ2lzdGVyZWQgY2FsbGJhY2suJyxcbiAgICAgIGlkXG4gICAgKTtcbiAgICBkZWxldGUgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXYWl0cyBmb3IgdGhlIGNhbGxiYWNrcyBzcGVjaWZpZWQgdG8gYmUgaW52b2tlZCBiZWZvcmUgY29udGludWluZyBleGVjdXRpb25cbiAgICogb2YgdGhlIGN1cnJlbnQgY2FsbGJhY2suIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIHVzZWQgYnkgYSBjYWxsYmFjayBpblxuICAgKiByZXNwb25zZSB0byBhIGRpc3BhdGNoZWQgcGF5bG9hZC5cbiAgICpcbiAgICogQHBhcmFtIHthcnJheTxzdHJpbmc+fSBpZHNcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLndhaXRGb3I9ZnVuY3Rpb24oaWRzKSB7XG4gICAgaW52YXJpYW50KFxuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nLFxuICAgICAgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBNdXN0IGJlIGludm9rZWQgd2hpbGUgZGlzcGF0Y2hpbmcuJ1xuICAgICk7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGlkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciBpZCA9IGlkc1tpaV07XG4gICAgICBpZiAodGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmdbaWRdKSB7XG4gICAgICAgIGludmFyaWFudChcbiAgICAgICAgICB0aGlzLiREaXNwYXRjaGVyX2lzSGFuZGxlZFtpZF0sXG4gICAgICAgICAgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBDaXJjdWxhciBkZXBlbmRlbmN5IGRldGVjdGVkIHdoaWxlICcgK1xuICAgICAgICAgICd3YWl0aW5nIGZvciBgJXNgLicsXG4gICAgICAgICAgaWRcbiAgICAgICAgKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpbnZhcmlhbnQoXG4gICAgICAgIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzW2lkXSxcbiAgICAgICAgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBgJXNgIGRvZXMgbm90IG1hcCB0byBhIHJlZ2lzdGVyZWQgY2FsbGJhY2suJyxcbiAgICAgICAgaWRcbiAgICAgICk7XG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2ludm9rZUNhbGxiYWNrKGlkKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoZXMgYSBwYXlsb2FkIHRvIGFsbCByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWRcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoPWZ1bmN0aW9uKHBheWxvYWQpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICAhdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nLFxuICAgICAgJ0Rpc3BhdGNoLmRpc3BhdGNoKC4uLik6IENhbm5vdCBkaXNwYXRjaCBpbiB0aGUgbWlkZGxlIG9mIGEgZGlzcGF0Y2guJ1xuICAgICk7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9zdGFydERpc3BhdGNoaW5nKHBheWxvYWQpO1xuICAgIHRyeSB7XG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrcykge1xuICAgICAgICBpZiAodGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmdbaWRdKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pbnZva2VDYWxsYmFjayhpZCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfc3RvcERpc3BhdGNoaW5nKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBJcyB0aGlzIERpc3BhdGNoZXIgY3VycmVudGx5IGRpc3BhdGNoaW5nLlxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuaXNEaXNwYXRjaGluZz1mdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsIHRoZSBjYWxsYmFjayBzdG9yZWQgd2l0aCB0aGUgZ2l2ZW4gaWQuIEFsc28gZG8gc29tZSBpbnRlcm5hbFxuICAgKiBib29ra2VlcGluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuJERpc3BhdGNoZXJfaW52b2tlQ2FsbGJhY2s9ZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0gPSB0cnVlO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzW2lkXSh0aGlzLiREaXNwYXRjaGVyX3BlbmRpbmdQYXlsb2FkKTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzSGFuZGxlZFtpZF0gPSB0cnVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdXAgYm9va2tlZXBpbmcgbmVlZGVkIHdoZW4gZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXlsb2FkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuJERpc3BhdGNoZXJfc3RhcnREaXNwYXRjaGluZz1mdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nW2lkXSA9IGZhbHNlO1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0hhbmRsZWRbaWRdID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQgPSBwYXlsb2FkO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFyIGJvb2trZWVwaW5nIHVzZWQgZm9yIGRpc3BhdGNoaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLiREaXNwYXRjaGVyX3N0b3BEaXNwYXRjaGluZz1mdW5jdGlvbigpIHtcbiAgICB0aGlzLiREaXNwYXRjaGVyX3BlbmRpbmdQYXlsb2FkID0gbnVsbDtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgfTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3BhdGNoZXI7XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBpbnZhcmlhbnRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxudmFyIGludmFyaWFudCA9IGZ1bmN0aW9uKGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIGlmIChmYWxzZSkge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICtcbiAgICAgICAgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdJbnZhcmlhbnQgVmlvbGF0aW9uOiAnICtcbiAgICAgICAgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJnc1thcmdJbmRleCsrXTsgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDtcbiJdfQ==
