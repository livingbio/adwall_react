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

// 等同於 TodoStore extends EventEmitter 
// 從此取得廣播的能力
// 由於將來會返還 TodoStore 出去，因此下面寫的會全變為 public methods
var Store = new EventEmitter();

//測試用假資料
// var response = require('../stores/test_data.js');

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
            response: TagtooAdWall.adData
        }
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
    //為了不要更動從api抓下來的資料,所以用一個local variable來儲存
    var response = TagtooAdWall.adData;

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
//
module.exports = Store;

},{"../actions/AppActionCreator":1,"../constants/AppConstants":3,"../dispatcher/AppDispatcher":4,"events":19}],6:[function(require,module,exports){
//要改remarketing, similar的setting(name&type),把大小寫統一比較好

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
            $.ajax({
                type: 'GET',
                url: uri,
                dataType: 'jsonp',
                cache: true,
                jsonpCallback: "a" + uri.replace(/[^\w]/g, '_'),
                success: cb
            })
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
        key: function(productKeys, cb) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "product.key?uri=" + productKeys, cb);
        },
		similar: function(productKeys,cb) {
			//要改掉
			TagtooAdWall.query.base("//ad.tagtoo.co/ad/query/" + "product.simlar?product_key=" + productKeys, cb)
		},
        rootPage: function(productKeys, cb) {
	        TagtooAdWall.query.base(TagtooAdWall.URLBase + "query_iframe?q=&root=" + productKeys, cb);
        },
        adTrack: function(p, ecID) {
            TagtooAdWall.query.base(TagtooAdWall.URLBase + "ad/track?p=" + p + "&ad=" + ecID, cb);
        },
        backup: function(url, cb) {
            TagtooAdWall.query.base("//ad.tagtoo.co/" + "query_iframe?q=" + url, cb);
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
            // TagtooAdWall.URLBase = "//ad.tagtoo.co/ad/query/";
            //TagtooAdWall.URLBase = "//ad.tagtoo.co/";
            //舊版測試用
            TagtooAdWall.URLBase = "//ad.tagtoo.co/query_iframe?q=";
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
        //切字
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
                    data[i].click_link = TagtooAdWall.util.addUtm(data[i].link);//用一個新的key把utm_content,ctype...等資訊與link組合
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
    },
    setItemList: function(data) {
        //recommend抓不到喔
    	$.map(data, function(obj, key) {
    		if (obj.type.toLowerCase() == "key") {
    			TagtooAdWall.query[obj.type](obj.value, function(res) {

    				/*要補
                    *之後api統一之後要砍掉
                    */
    				if(res.length == 2) {
    					res = res[1];
    				}
                    
                    TagtooAdWall.adData.itemList[key] = res;
                    var itemList = res.ad;
                    itemList = TagtooAdWall.util.productComplement(itemList, obj.min_num);
                    itemList = TagtooAdWall.util.InfoProcess(itemList);
                    TagtooAdWall.adData.itemList[key].ad = itemList;
                    
                    //把key存在itemList[key]裡面
                    TagtooAdWall.adData.itemList[key].key = key;
    			})
    		} else if (obj.type == "remarketing") {
                //發個AdTrack
                TagtooAdWall.query[obj.name](obj.type, function(res) {
                    TagtooAdWall.a = res.a;
                    TagtooAdWall.b = res.b;
                    if (res.product_pool.join('|').match(/:product:|:campaign:/)) {
                        var seenProduct = res.product_pool.join('.');//看過的商品

                        //api需要再做確認
                        TagtooAdWall.items(seenProduct, function(res) {
                            res.results = InfoProcess(res.results);
                            TagtooAdWall.ad_data.itemList[obj.name] = res.results;
                            //要留嗎？
                            TagtooAdWall.remarketingListNumber();
                        });
                    } else {
                        //wtf
                        $("#"+val.name).hide();
                    }                
                })
    		} else if (obj.type == "similar") {
                //相關商品
                TagtooAdWall.queryIframe("simlar=" + TagtooAdWall.util.decodeQueryData(document.location.href).pid + "&ad=" + TagtooAdWall.ad_data.first.ec_id + "&async=false", function(res) {
                    res[1].ad = TagtooAdWall.productPush(res[1].ad,obj.min_num);
                    TagtooAdWall.ad_data.itemList[obj.name] = data || [];
                    //wtf
                    if (data.length == 0) {
                        TagtooAdWall.ad_data.itemList[obj.name].ad.push(false);
                        $("#"+obj.name).hide();
                    } else {
                        res[1].ad = InfoProcess(res[1].ad);
                        TagtooAdWall.ad_data.itemList[obj.name] = res[1];
                    }
                })
            }
    	})
    },
    loadAdData: function () {
    	//get first product
        //product_key: TagtooAdWall.urlOptions.pid
        TagtooAdWall.query.items(TagtooAdWall.urlOptions.pid, function(res) {
            TagtooAdWall.adData.first = TagtooAdWall.util.InfoProcess(res.results)[0];
            //row_3以後是否都統一從first item拿root這個連結當作商品的input
            // TagtooAdWall.rowRule.row_3.value = res.results.extra.root.replace(/auto\:\/\/, ""/);
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
//重要要補height
TagtooAdWall.adData.background = {
    "image_url": "",
    "link": "",
    "background": "#ebebeb url('//lh5.ggpht.com/C84PNbVRw4EoprIULVe43Zxch1P1bgCiTkbvrzTXvrd0xoQTNZtC_ntcAiPy5McxVAwog-dwrIyGYkxy0sPZCis')",
    "height": "100%",
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
        name: "row_1",
        type: "key",
        value: "&recommend=geosun-cthouse:product:891598&debug=true",
        min_num: 6
    },
    "row_2": {
        name: "row_2",
        type: "key",
        value: "&simlar=geosun-cthouse:product:891598&ad=" + TagtooAdWall.adData.ecId + "&simlar_type=city",
        min_num: 6
    },
    "row_3": {
        name: "row_3",
        type: "key",
        //以後要從first商品的auto
        value: "&root=geosun-cthouse:product:891598&debug=true",
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
            if (body.scrollWidth > 720) {
                size = 'desktop';
            } else if(body.scrollWidth > 480) {
                size = 'tablet';
            } else{
                size = 'phone';
            }

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
                React.DOM.div({style: this.state.response.background}, 
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
                    ItemList({row: response.itemList.row_1}), 
                    Next({onClick: this.handleRightArrowClick.bind(this, "row_1", response.itemList.row_1.ad)})
                ), 
                React.DOM.div({id: "row_2", className: "even"}, 
                    More({link: response.itemList.row_2.ad[0].extra.link1}), 
                    Prev({onClick: this.handleLeftArrowClick.bind(this, "row_2", response.itemList.row_2.ad)}), 
                    ItemList({row: response.itemList.row_2}), 
                    Next({onClick: this.handleRightArrowClick.bind(this, "row_2", response.itemList.row_2.ad)})
                ), 
                React.DOM.div({id: "row_3", className: "even"}, 
                    More({link: response.itemList.row_3.ad[0].extra.link1}), 
                    ItemList({row: response.itemList.row_3})
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

		return  React.DOM.footer({className: "footer"});

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
               onClick: this.props.click}, 

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

    render: function() {

        var Ads = this.props.row.ad;
        var arr = Ads.map(function(item, index){
            return Item({key: item.index, detail: item, click: this.click.bind(this, item)})
        }, this)

        return (
            React.DOM.div({className: "item_list_wraper"}, 
                React.DOM.ul({className: "item_list"}, 
                    arr
                )
            )
        )
    },
    click: function(item){

        //open link
        window.open(item.click_link, '_blank');

        //add tracking pixel
        var itemList = this.props.row;
        var key = this.props.row.key;

        //根據不同的rule給予不同的tracking資料
        if (key == "similar") {
            var qm = "SimilarQuery",
                qp = TagtooAdWall.util.decodeQueryData(document.location.href).pid;
        } else if (key == "remarketing") {
            var qm = "remarketing",
                qp = item.product_key;
        } else if (key.match("row")) {
            var qm = itemList.qm,
                qp = itemList.qp;
        }

        var vs = {
            fs: TagtooAdWall.fs,
            cr: TagtooAdWall.cr,
            p: TagtooAdWall.page,
            u: item['link'],
            ut: item['title'],
            r: TagtooAdWall.refer,
            t: 'track',
            e: 'content_click',
            a: TagtooAdWall.a,
            b: TagtooAdWall.b,
            id: "adWall",
            pb: TagtooAdWall.publisher,
            ad: item['ec_id'],
            ca: item['item_hash'],
            v0: item['track'],
            n0: 'track',
            qm: qm,
            qp: qp,
            pc: TagtooAdWall.pc,
            n: Math.random() * 10000000000000000 // cache buster
        }

        this.addTrackPixel(vs);
    },

    //在第一個script的前面插入一個img(發出tracking pixel)
    addTrackPixel: function(vs){
        var imgElem = document.createElement("img");
        imgElem.src = "//track.tagtoo.co/ad/tr.gif?" + this.encodeQueryData(vs);
        var node = document.getElementsByTagName("script")[0];
        node.parentNode.insertBefore(imgElem, node);
    },
    //obj2會蓋到obj1
    // mergeObject: function(obj1, obj2) {
    //   var obj3 = {};
    //   for (var attrname in obj1) {
    //     obj3[attrname] = obj1[attrname];
    //   }
    //   for (var attrname in obj2) {
    //     obj3[attrname] = obj2[attrname];
    //   }
    //   return obj3;
    // },
    // stringToObject: function(string) {
    //   var data = {};
    //   var parts = string.split("&");
    //   for (var i = 0; i < parts.length; i++) {
    //     var vs = parts[i].split('=');
    //     if (vs.length == 2) {
    //       var key = decodeURIComponent(vs[0]);
    //       var value = decodeURIComponent(vs[1]);
    //       data[key] = value;
    //     }
    //   }
    //   return data
    // },
    // objectToString: function(vs){
    //   var oN = -1,
    //       orN = 0,
    //       string = "";
    //   for (i in vs) {
    //       oN ++;
    //   }
    //   for (i in vs) {
    //       string = string + i + "=" + encodeURIComponent(vs[i])
    //       if (oN != orN) {
    //           string += "&";
    //       }
    //       orN ++;
    //   }
    //   return string;
    // },
    encodeQueryData: function(vs) {
        var arr = [];
        for(var key in vs) {
            if(vs[key]){
                arr.push("" + key + "=" + encodeURIComponent(vs[key]));
            }
        }
        return arr.join("&");
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

		return  React.DOM.a({className: "more", href: this.props.link, target: "_blank"});
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

		return React.DOM.div({className: "next", onClick: this.props.onClick});
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

		return React.DOM.div({className: "prev", onClick: this.props.onClick});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3IuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2Jvb3QuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2NvbnN0YW50cy9BcHBDb25zdGFudHMuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlci5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvc3RvcmVzL1N0b3JlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy9zdG9yZXMvYWRsb2FkZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0FkV2FsbC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0Jhbm5lci5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0JvdHRvbUJveC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0Zvb3Rlci5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0l0ZW0uanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9JdGVtTGlzdC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL0xvZ28uanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9Nb3JlLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvdmlld3MvTmV4dC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3QvYXBwL2pzL3ZpZXdzL1ByZXYuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L2FwcC9qcy92aWV3cy9TcGVjaWFsLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9hcHAvanMvdmlld3MvVG9wQm94LmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL21haW4uanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hbGwuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hc2FwLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvY2FzdC5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2NvbmZpZy5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3BvbHlmaWxsLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcHJvbWlzZS5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9naXRodWIvdGFndG9vL2Fkd2FsbF9yZWFjdC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JhY2UuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yZWplY3QuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yZXNvbHZlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL2dpdGh1Yi90YWd0b28vYWR3YWxsX3JlYWN0L25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvdXRpbHMuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvaW5kZXguanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvZ2l0aHViL3RhZ3Rvby9hZHdhbGxfcmVhY3Qvbm9kZV9tb2R1bGVzL2ZsdXgvbGliL2ludmFyaWFudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFxuICovXG52YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xudmFyIEFwcENvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9BcHBDb25zdGFudHMnKTtcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG4vKipcbiAqIOmAmeaYr+S4gOWAiyBzaW5nbGV0b24g54mp5Lu2XG4gKi9cbnZhciBBcHBBY3Rpb25DcmVhdG9ycyA9IHtcblxuICAgIC8qKlxuICAgICAqIGFwcCDllZ/li5XlvozvvIznrKzkuIDmrKHovInlhaXos4fmlplcbiAgICAgKi9cbiAgICBsb2FkOiBmdW5jdGlvbigpe1xuXHRcdC8vICAgICAgICBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgU2hpZnRMZWZ0OiBmdW5jdGlvbihrZXksIGl0ZW1MaXN0KSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBBcHBDb25zdGFudHMuTGlzdF9TaGlmdExlZnQsXG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIGl0ZW1MaXN0OiBpdGVtTGlzdFxuICAgICAgICB9KVxuICAgIH0sXG4gICAgU2hpZnRSaWdodDogZnVuY3Rpb24oa2V5LCBpdGVtTGlzdCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmhhbmRsZVZpZXdBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uVHlwZTogQXBwQ29uc3RhbnRzLkxpc3RfU2hpZnRSaWdodCxcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgaXRlbUxpc3Q6IGl0ZW1MaXN0XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwQWN0aW9uQ3JlYXRvcnM7XG4iLCIvKlxuICog6YCZ6KOP5piv5pW05pSv56iL5byP55qE6YCy5YWl6bue77yM5a6D6LKg6LKs5bu656uLIHJvb3Qgdmlld++8jFxuICog5Lmf5bCx5pivIE1haW5BcHAg5YWD5Lu277yM5bCH5a6D5bu656uL6LW35L6G5pS+5Yiw55Wr6Z2i5LiKXG4gKlxuICogYm9vdC5qcyDlrZjlnKjnmoTnm67lnLDvvIzmmK/lm6DngrrpgJrluLggYXBwIOWVn+WLleaZguacieioseWkmuWFiOacn+W3peS9nOimgeWujOaIkO+8jFxuICog5L6L5aaC6aCQ6LyJ6LOH5paZ5YiwIHN0b3JlIOWFp+OAgeaqouafpeacrOWcsOerryBkYiDni4DmhYvjgIHliIfmj5vkuI3lkIzoqp7ns7vlrZfkuLLjgIFcbiAqIOmAmeS6m+W3peS9nOmDveWFiOWcqCBib290LmpzIOWFp+WBmuWujO+8jOWGjeWVn+WLlSByb290IHZpZXcg5piv5q+U6LyD55CG5oOz55qE5rWB56iLXG4gKiBcbiAqL1xuXG4vLyB2MC4xMiDplovlp4vopoHnlKggY3JlYXRlRmFjdG9yeSDljIXkuIDmrKHmiY3og73kvb/nlKjlhYPku7Zcbi8vIOWmguaenOS4jeW4jOacm+mAmem6vOm6u+eFqe+8jOWPquimgeWcqOavj+S7vSBqcyDoo4/pg73liqDkuIvpnaLpgJnlj6XljbPlj6/vvIzkvYblroPmnInnvLrpu55cbi8vIHZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG4vLyBcbi8vIOWboOeCuiByZXF1aXJlKCcuLi4nKSDlj6rmmK/mi7/liLDkuIDku73lhYPku7blrprnvqnmqpTvvIznhKHms5Xnm7TmjqXkvb/nlKhcbi8vIOimgeeUqOWug+W7uueri+S4gOWAiyBmYWN0b3J577yM5LmL5b6M5omN6IO955Si5Ye6IGluc3RhbmNl77yM5LiL6Z2iIGNyZWF0ZUZhY3RvcnkoKSDlsLHmmK/lnKjlu7rnq4vlt6Xlu6BcbnZhciBBZFdhbGwgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoXCIuL3ZpZXdzL0FkV2FsbC5qc3hcIikpO1xuLy/lvJXlhaXos4fmlplcbnZhciBhZExvYWRlciA9IHJlcXVpcmUoJy4vc3RvcmVzL2FkbG9hZGVyLmpzJyk7XG5cbiQoZnVuY3Rpb24oKXtcblx0Ly/ln7fooYxmdW5jdGlvbu+8jOeZvOmAgWFwaeaKk+izh+aWmeiZleeQhuW+jOWtmOWIsFRhZ3Rvb0FkV2FsbC5hZERhdGUuaXRlbUxpc3TkuK1cblx0YWRMb2FkZXIubG9hZEpRKClcblxuXHQvLyBjcmVhdGUgY29udGFpbmVyIGRvbSBlbGVtZW50XG5cdHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdLFxuXHRcdG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKSxcblx0XHRpZCA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcImlkXCIpO1xuXHRpZC52YWx1ZSA9IFwiY29udGFpbmVyXCI7XG5cdG5vZGUuc2V0QXR0cmlidXRlTm9kZShpZCk7XG5cdGJvZHkuaW5zZXJ0QmVmb3JlKG5vZGUsIGJvZHkuY2hpbGROb2Rlc1swXSk7XG5cblx0dmFyIHQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG5cdFx0Ly/norroqo1hcGnmipPnmoTos4fmlpnmnInlrZjliLBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN05LmL5LitXG5cdFx0dmFyIGNvbXBsZXRlID0gVGFndG9vQWRXYWxsLmFkRGF0YS5pdGVtTGlzdC5yb3dfMSAmJiBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0LnJvd18yICYmIFRhZ3Rvb0FkV2FsbC5hZERhdGEuaXRlbUxpc3Qucm93XzM7XG5cdFx0XG5cdFx0aWYoY29tcGxldGUpe1xuXG5cdFx0XHQvLyDluavmiJHlu7rnq4ttYWluYXBw5YWD5Lu277yM5pS+5YiwY29udGFpbmVy5LitXG5cdFx0XHRSZWFjdC5yZW5kZXIoIEFkV2FsbCgpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lclwiKSApO1xuXG5cdFx0XHQvL+WBnOatonNldEludGVydmFs5Lit55qEZnVuY3Rpb25cblx0XHRcdGNsZWFySW50ZXJ2YWwodCk7XG5cdFx0fVxuXHR9LCA1MDApO1xuXG59KVxuIiwiLyoqXG4gKiBUb2RvQ29uc3RhbnRzXG4gKi9cbiB2YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gICB2YXIgcmV0ID0ge307XG4gICB2YXIga2V5O1xuICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICBjb250aW51ZTtcbiAgICAgfVxuICAgICByZXRba2V5XSA9IGtleTtcbiAgIH1cbiAgIHJldHVybiByZXQ7XG4gfTtcblxuLy8gQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4vLyDkuZ/lsLHmmK/orpMgaGFzaCDnmoQga2V5IOiIhyB2YWx1ZSDlgLzkuIDmqKNcbi8vIOS4jeeEtuWOn+acrCB2YWx1ZSDpg73mmK8gbnVsbFxuLy8g5LiN6YGO5pei54S25aaC5q2k77yM54K65L2V5LiN5Lm+6ISG55SoIHNldCDkuYvpoZ7lj6rmnIlrZXkg55qE5bCx5aW9XG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcih7XG5cbiAgXHRTT1VSQ0VfVklFV19BQ1RJT046IG51bGwsXG4gIFx0U09VUkNFX1NFUlZFUl9BQ1RJT046IG51bGwsXG4gIFx0U09VUkNFX1JPVVRFUl9BQ1RJT046IG51bGwsXG5cbiAgXHRDSEFOR0VfRVZFTlQ6IG51bGwsXG4gIFx0XG4gICAgTGlzdF9TaGlmdExlZnQ6IG51bGwsXG5cbiAgICBMaXN0X1NoaWZ0UmlnaHQ6IG51bGwsXG5cbn0pO1xuXG4iLCJcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG5cbnZhciBEaXNwYXRjaGVyID0gcmVxdWlyZSgnZmx1eCcpLkRpc3BhdGNoZXI7XG5cblxuLyoqXG4gKiBmbHV4LWNoYXQg5YWn5pyA5paw55qEIGRpc3BhdGNoZXJcbiAqL1xudmFyIEFwcERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuXG4vLyDms6jmhI/vvJrpgJnoo4/nrYnmlrzmmK/nubzmib8gRGlzcGF0Y2hlciBjbGFzcyDouqvkuIrmiYDmnInmjIfku6TvvIznm67lnLDmmK/orpPmraTnianku7bkv7HmnInlu6Pmkq3og73lip9cbi8vIOWQjOaoo+WKn+iDveS5n+WPr+eUqCB1bmRlcnNjb3JlLmV4dGVuZCDmiJYgT2JqZWN0LmFzc2lnbigpIOWBmuWIsFxuLy8g5LuK5aSp5Zug54K65pyJ55SoIGpxdWVyeSDlsLHoq4vlroPku6Pli57kuoZcbiQuZXh0ZW5kKCBBcHBEaXNwYXRjaGVyLCB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uIFRoZSBkZXRhaWxzIG9mIHRoZSBhY3Rpb24sIGluY2x1ZGluZyB0aGUgYWN0aW9uJ3NcbiAgICAgKiB0eXBlIGFuZCBhZGRpdGlvbmFsIGRhdGEgY29taW5nIGZyb20gdGhlIHNlcnZlci5cbiAgICAgKi9cbiAgICBoYW5kbGVTZXJ2ZXJBY3Rpb246IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIHNvdXJjZTogQXBwQ29uc3RhbnRzLlNPVVJDRV9TRVJWRVJfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoKHBheWxvYWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkaXNwYXRjaChldnQpXG4gICAgICovXG4gICAgaGFuZGxlVmlld0FjdGlvbjogZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgc291cmNlOiBBcHBDb25zdGFudHMuU09VUkNFX1ZJRVdfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlzcGF0Y2gocGF5bG9hZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWwh+S+huWVn+eUqCByb3V0ZXIg5pmC77yM6YCZ6KOP6JmV55CG5omA5pyJIHJvdXRlciBldmVudFxuICAgICAqL1xuICAgIGhhbmRsZVJvdXRlckFjdGlvbjogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIHNvdXJjZTogQXBwQ29uc3RhbnRzLlNPVVJDRV9ST1VURVJfQUNUSU9OLFxuICAgICAgICAgICAgYWN0aW9uOiBwYXRoXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwRGlzcGF0Y2hlcjtcbiIsIi8qKlxuICogVG9kb1N0b3JlXG4gKi9cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBJTVBPUlRcblxudmFyIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXInKTtcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyOyAvLyDlj5blvpfkuIDlgIsgcHViL3N1YiDlu6Pmkq3lmahcblxuLy8g562J5ZCM5pa8IFRvZG9TdG9yZSBleHRlbmRzIEV2ZW50RW1pdHRlciBcbi8vIOW+nuatpOWPluW+l+W7o+aSreeahOiDveWKm1xuLy8g55Sx5pa85bCH5L6G5pyD6L+U6YKEIFRvZG9TdG9yZSDlh7rljrvvvIzlm6DmraTkuIvpnaLlr6vnmoTmnIPlhajororngrogcHVibGljIG1ldGhvZHNcbnZhciBTdG9yZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLy/muKzoqabnlKjlgYfos4fmlplcbi8vIHZhciByZXNwb25zZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy90ZXN0X2RhdGEuanMnKTtcblxuLyoqXG4gKiDlu7rnq4sgU3RvcmUgY2xhc3PvvIzkuKbkuJTnubzmib8gRXZlbnRFTWl0dGVyIOS7peaTgeacieW7o+aSreWKn+iDvVxuICovXG4kLmV4dGVuZCggU3RvcmUsIHtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBBUElcbiAgICAgKiDkvpvlpJbnlYzlj5blvpcgc3RvcmUg5YWn6YOo6LOH5paZXG4gICAgICovXG4gICAgZ2V0QWxsOiBmdW5jdGlvbigpe1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZTogVGFndG9vQWRXYWxsLmFkRGF0YVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vXG4gICAgbm9vcDogZnVuY3Rpb24oKXt9XG59KTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBldmVudCBoYW5kbGVyc1xuXG4vKipcbiAqIOWQkSBEaXNwYXRjaGVyIOiou+WGiuiHquW3su+8jOaJjeiDveWBteiBveWIsOezu+e1seeZvOWHuueahOS6i+S7tlxuICog5Lim5LiU5Y+W5ZueIGRpc3BhdGNoVG9rZW4g5L6b5pel5b6MIGFzeW5jIOaTjeS9nOeUqFxuICovXG5TdG9yZS5kaXNwYXRjaFRva2VuID0gQXBwRGlzcGF0Y2hlci5yZWdpc3RlciggZnVuY3Rpb24gZXZlbnRIYW5kbGVycyhldnQpe1xuXG4gICAgLy8gZXZ0IC5hY3Rpb24g5bCx5pivIHZpZXcg55W25pmC5buj5pKt5Ye65L6G55qE5pW05YyF54mp5Lu2XG4gICAgLy8g5a6D5YWn5ZCrIGFjdGlvblR5cGVcbiAgICB2YXIgYWN0aW9uID0gZXZ0LmFjdGlvbjtcbiAgICAvL+eCuuS6huS4jeimgeabtOWLleW+nmFwaeaKk+S4i+S+hueahOizh+aWmSzmiYDku6XnlKjkuIDlgItsb2NhbCB2YXJpYWJsZeS+huWEsuWtmFxuICAgIHZhciByZXNwb25zZSA9IFRhZ3Rvb0FkV2FsbC5hZERhdGE7XG5cbiAgICBzd2l0Y2ggKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICovXG4gICAgICAgIGNhc2UgQXBwQ29uc3RhbnRzLkxpc3RfU2hpZnRMZWZ0OlxuICAgICAgICAgICAgdmFyIGtleSA9IGFjdGlvbi5rZXksXG4gICAgICAgICAgICAgICAgaXRlbUxpc3QgPSBhY3Rpb24uaXRlbUxpc3Q7XG4gICAgICAgICAgICByZXNwb25zZS5pdGVtTGlzdFtrZXldLmFkLnNwbGljZSgwLCAwLCBpdGVtTGlzdC5wb3AoKSk7XG4gICAgICAgICAgICBTdG9yZS5lbWl0KCBBcHBDb25zdGFudHMuQ0hBTkdFX0VWRU5UICk7XG4gICAgICAgIFxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICovXG4gICAgICAgIGNhc2UgQXBwQ29uc3RhbnRzLkxpc3RfU2hpZnRSaWdodDpcbiAgICAgICAgICAgIHZhciBrZXkgPSBhY3Rpb24ua2V5LFxuICAgICAgICAgICAgICAgIGl0ZW1MaXN0ID0gYWN0aW9uLml0ZW1MaXN0O1xuICAgICAgICAgICAgcmVzcG9uc2UuaXRlbUxpc3Rba2V5XS5hZC5wdXNoKGl0ZW1MaXN0LnNwbGljZSgwLCAxKVswXSk7XG4gICAgICAgICAgICBTdG9yZS5lbWl0KCBBcHBDb25zdGFudHMuQ0hBTkdFX0VWRU5UICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vXG4gICAgfVxuXG59KVxuLy9cbm1vZHVsZS5leHBvcnRzID0gU3RvcmU7XG4iLCIvL+imgeaUuXJlbWFya2V0aW5nLCBzaW1pbGFy55qEc2V0dGluZyhuYW1lJnR5cGUpLOaKiuWkp+Wwj+Wvq+e1seS4gOavlOi8g+WlvVxuXG4vL+iuk1RhZ3Rvb0FkV2FsbOaUvuWIsHdpbmRvd+aJjeiDveiuk3RhZyBtYW5hZ2Vy55So5Yiw6YCZ5YCL6K6K5pW4XG52YXIgVGFndG9vQWRXYWxsID0gd2luZG93LlRhZ3Rvb0FkV2FsbCB8fCB7fTtcblRhZ3Rvb0FkV2FsbCA9IHtcbiAgICBcImFkRGF0YVwiOiB7XG4gICAgICAgIFwiZmlyc3RcIjoge30sXG4gICAgICAgIFwiaXRlbUxpc3RcIjoge31cbiAgICB9LFxuICAgIFwicXVlcnlcIjoge1xuICAgIFx0Ly/nmbxhcGlcbiAgICAgICAgYmFzZTogZnVuY3Rpb24odXJpLCBjYikge1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVyaSxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBqc29ucENhbGxiYWNrOiBcImFcIiArIHVyaS5yZXBsYWNlKC9bXlxcd10vZywgJ18nKSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBjYlxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgLy9hcGnmnInllY/poYxcblxuICAgICAgICAvL2l0ZW1z6YKE5rKS5pyJ6ZaL5omA5Lul5YWI55So6IiK55qEXG5cdFx0Ly9pdGVtczogZnVuY3Rpb24ocHJvZHVjdEtleXMsY2IpIHtcblx0XHQvLyAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicHJvZHVjdC5pdGVtcz9wcm9kdWN0X2tleXM9XCIgKyBwcm9kdWN0S2V5cywgY2IpXG5cdFx0Ly99LFxuXHRcdC8vcmVjb21tZW5k6YKE5rKS5pyJ6ZaL77yM5omA5Lul5YWI55So6IiK55qEXG5cdFx0Ly9yZWNvbW1lbmQ6IGZ1bmN0aW9uKHByb2R1Y3RLZXlzLCBjYikge1xuXHRcdC8vICAgIFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFRhZ3Rvb0FkV2FsbC5VUkxCYXNlICsgXCJxdWVyeV9pZnJhbWU/cT0mcmVjb21tZW5kPVwiICsgcHJvZHVjdEtleXMsIGNiKTtcblx0XHQvL30sXG4gICAgICAgIGtleTogZnVuY3Rpb24ocHJvZHVjdEtleXMsIGNiKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicHJvZHVjdC5rZXk/dXJpPVwiICsgcHJvZHVjdEtleXMsIGNiKTtcbiAgICAgICAgfSxcblx0XHRzaW1pbGFyOiBmdW5jdGlvbihwcm9kdWN0S2V5cyxjYikge1xuXHRcdFx0Ly/opoHmlLnmjolcblx0XHRcdFRhZ3Rvb0FkV2FsbC5xdWVyeS5iYXNlKFwiLy9hZC50YWd0b28uY28vYWQvcXVlcnkvXCIgKyBcInByb2R1Y3Quc2ltbGFyP3Byb2R1Y3Rfa2V5PVwiICsgcHJvZHVjdEtleXMsIGNiKVxuXHRcdH0sXG4gICAgICAgIHJvb3RQYWdlOiBmdW5jdGlvbihwcm9kdWN0S2V5cywgY2IpIHtcblx0ICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwicXVlcnlfaWZyYW1lP3E9JnJvb3Q9XCIgKyBwcm9kdWN0S2V5cywgY2IpO1xuICAgICAgICB9LFxuICAgICAgICBhZFRyYWNrOiBmdW5jdGlvbihwLCBlY0lEKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShUYWd0b29BZFdhbGwuVVJMQmFzZSArIFwiYWQvdHJhY2s/cD1cIiArIHAgKyBcIiZhZD1cIiArIGVjSUQsIGNiKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmFja3VwOiBmdW5jdGlvbih1cmwsIGNiKSB7XG4gICAgICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuYmFzZShcIi8vYWQudGFndG9vLmNvL1wiICsgXCJxdWVyeV9pZnJhbWU/cT1cIiArIHVybCwgY2IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVGFndG9vQWRXYWxsLnVybE9wdGlvbnMgPSBUYWd0b29BZFdhbGwudXRpbC5kZWNvZGVRdWVyeURhdGEoXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L2V2ZW50LzEwMy90YXRvby8/cGlkPWdlb3N1bi1jdGhvdXNlJTNBcHJvZHVjdCUzQTg5MTU5OCZ1dG1fY29udGVudD1nZW9zdW4tY3Rob3VzZSUzQXByb2R1Y3QlM0E4OTE1OTglN0MwLjA2NzUyNTkzMjQ1NlwiKTsgLy/opoHmj5vlm55kb2N1bWVudC5sb2NhdGlvbi5ocmVmXG4gICAgICAgIFRhZ3Rvb0FkV2FsbC5wdWJsaXNoZXIgPSBwYXJzZUludChUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5wYiB8fCBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5tZWRpYV9pZCB8fCBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy50YWd0b29fbWVkaWFfaWQpO1xuICAgICAgICBUYWd0b29BZFdhbGwuc2xvdCA9IHBhcnNlSW50KFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zLmlkKTtcbiAgICAgICAgVGFndG9vQWRXYWxsLnJlZmVyZXIgPSBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5yIHx8IFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zLnJlZmVyZXI7XG4gICAgICAgIFRhZ3Rvb0FkV2FsbC5yZXF1ZXN0X3BhcmEgPSBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy5yZXF1ZXN0X3BhcmEgfHwgVGFndG9vQWRXYWxsLnVybE9wdGlvbnMuY2xpY2s7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBUYWd0b29BZFdhbGwudXJsT3B0aW9ucy51cmxiYXNlICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5VUkxCYXNlID0gVGFndG9vQWRXYWxsLnVybE9wdGlvbnMudXJsYmFzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRhZ3Rvb0FkV2FsbC5VUkxCYXNlID0gXCIvL2FkLnRhZ3Rvby5jby9hZC9xdWVyeS9cIjtcbiAgICAgICAgICAgIC8vVGFndG9vQWRXYWxsLlVSTEJhc2UgPSBcIi8vYWQudGFndG9vLmNvL1wiO1xuICAgICAgICAgICAgLy/oiIrniYjmuKzoqabnlKhcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5VUkxCYXNlID0gXCIvL2FkLnRhZ3Rvby5jby9xdWVyeV9pZnJhbWU/cT1cIjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFwidXRpbFwiOiB7XG4gICAgICAgIGFkZEhUTUw6IGZ1bmN0aW9uKHRlbXBsYXRlc19mdW4sIGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gdGVtcGxhdGVzX2Z1bih7XG4gICAgICAgICAgICAgICAgXCJkYXRhXCI6IGRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0bWxcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFNjcmlwdDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcbiAgICAgICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcblxuICAgICAgICAgICAgaWYgKHNjcmlwdC5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgLy8gSUVcbiAgICAgICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3JpcHQucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdC5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvL090aGVyc1xuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9LFxuICAgICAgICBkZWNvZGVRdWVyeURhdGE6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgLy8gc3VwcG9ydCBwYXJhbWV0ZXIgZXh0cmFjdCBmcm9tIGJvdGggcXVlcnlzdHJpbmcgb3IgaGFzaFxuICAgICAgICAgICAgLy8gbm90IHN1cHBvcnQgbXVsdGkgdmFsdWUgZm9yIHNpbmdsZSBrZXkgeWV0LlxuICAgICAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvWyMmXFw/XS8pO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBwYXJ0cy5zaGlmdCgpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZzID0gcGFydHNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgICBpZiAodnMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudCh2c1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2c1sxXSk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIC8v5YiH5a2XXG4gICAgICAgIGdldEludGVyY2VwdGVkU3RyOiBmdW5jdGlvbihzU291cmNlLCByb3dzLCByb3dfY2hhcmFjdGVycykge1xuICAgICAgICAgICAgdmFyIGlMZW4gPSByb3dzICogcm93X2NoYXJhY3RlcnNcbiAgICAgICAgICAgIGlmIChzU291cmNlLnJlcGxhY2UoL1teXFx4MDAtXFx4ZmZdL2csIFwieHhcIikubGVuZ3RoIDw9IGlMZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc1NvdXJjZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgICAgICB2YXIgc2NoYXI7XG4gICAgICAgICAgICBpTGVuID0gaUxlbiAtIDk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgc2NoYXIgPSBzU291cmNlLmNoYXJBdChpKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHNjaGFyO1xuICAgICAgICAgICAgICAgIGlmIChzY2hhci5tYXRjaCgvW15cXHgwMC1cXHhmZl0vKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2hhci5tYXRjaCgvXFxuLykgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyByb3dfY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyAyXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAobCA+PSBpTGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHN0ciArIFwiLi4uKOabtOWkmilcIjtcbiAgICAgICAgfSxcbiAgICAgICAgcHJpY2VUcmFuc2xhdGU6IGZ1bmN0aW9uKHByaWNlKSB7XG4gICAgICAgICAgICBpZiAocHJpY2UgPj0gMTAwMDApIHtcbiAgICAgICAgICAgICAgICBwcmljZSA9IE1hdGgucm91bmQocHJpY2UgLyAxMDAwKSAvIDEwICsgXCLokKxcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJpY2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYWRkVXRtOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgICAgICBpZiAobGluay5tYXRjaCgvXFw/LykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluayArIGxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKC8oW1xcPyZdKXBpZD1bXiZdKiY/LywgXCIkMVwiKS5yZXBsYWNlKC9cXD8vLFwiJlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmsgKyBsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSgvKFtcXD8mXSlwaWQ9W14mXSomPy8sIFwiJDFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIEluZm9Qcm9jZXNzOiBmdW5jdGlvbihkYXRhLCB0aXRsZVdvcmRzLCBkZXNjcmlwdGlvbldvcmRzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRpdGxlV29yZHMgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZVdvcmRzID0ge1xuICAgICAgICAgICAgICAgICAgICByb3c6IDIsXG4gICAgICAgICAgICAgICAgICAgIHJvd246IDIyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbldvcmRzID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVzY3JpcHRpb25Xb3JkcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm93OiAyLFxuICAgICAgICAgICAgICAgICAgICByb3duOiAyMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhW2ldLmRlc2NyaXB0aW9uICE9IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGRhdGFbaV0udGl0bGUgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLmluZGV4ID0gaTsvL1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLmRlc2NyaXB0aW9uID0gZGF0YVtpXS5kZXNjcmlwdGlvbi5yZXBsYWNlKC88bGlbXj5dKj4vZywgJycpLnJlcGxhY2UoLzxcXC8/KHVsfGxpfGhyfGJyKVtePl0qPi9nLCBcIlxcblwiKS5yZXBsYWNlKC88W14+XSo+L2csIFwiXCIpLnJlcGxhY2UoL1xcbihcXHMqXFxuKSovZywgXCJcXG5cIikucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLnRpdGxlX3Nob3J0ID0gVGFndG9vQWRXYWxsLnV0aWwuZ2V0SW50ZXJjZXB0ZWRTdHIoZGF0YVtpXS50aXRsZSwgdGl0bGVXb3Jkcy5yb3csIHRpdGxlV29yZHMucm93bik7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV0uZGVzY3JpcHRpb25fc2hvcnQgPSBUYWd0b29BZFdhbGwudXRpbC5nZXRJbnRlcmNlcHRlZFN0cihkYXRhW2ldLmRlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbldvcmRzLnJvdywgZGVzY3JpcHRpb25Xb3Jkcy5yb3duKTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtpXS5wcmljZSA9IFRhZ3Rvb0FkV2FsbC51dGlsLnByaWNlVHJhbnNsYXRlKGRhdGFbaV0ucHJpY2UpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldLnN0b3JlX3ByaWNlID0gVGFndG9vQWRXYWxsLnV0aWwucHJpY2VUcmFuc2xhdGUoZGF0YVtpXS5zdG9yZV9wcmljZSk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV0uY2xpY2tfbGluayA9IFRhZ3Rvb0FkV2FsbC51dGlsLmFkZFV0bShkYXRhW2ldLmxpbmspOy8v55So5LiA5YCL5paw55qEa2V55oqKdXRtX2NvbnRlbnQsY3R5cGUuLi7nrYnos4foqIroiIdsaW5r57WE5ZCIXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgcHJvZHVjdENvbXBsZW1lbnQ6IGZ1bmN0aW9uKGRhdGEsIG51bSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoIDwgbnVtKSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBudW0gLSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goVGFndG9vQWRXYWxsLmJhY2t1cC5wb3AoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBzZXRJdGVtTGlzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvL3JlY29tbWVuZOaKk+S4jeWIsOWWlFxuICAgIFx0JC5tYXAoZGF0YSwgZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICBcdFx0aWYgKG9iai50eXBlLnRvTG93ZXJDYXNlKCkgPT0gXCJrZXlcIikge1xuICAgIFx0XHRcdFRhZ3Rvb0FkV2FsbC5xdWVyeVtvYmoudHlwZV0ob2JqLnZhbHVlLCBmdW5jdGlvbihyZXMpIHtcblxuICAgIFx0XHRcdFx0LyropoHoo5xcbiAgICAgICAgICAgICAgICAgICAgKuS5i+W+jGFwaee1seS4gOS5i+W+jOimgeegjeaOiVxuICAgICAgICAgICAgICAgICAgICAqL1xuICAgIFx0XHRcdFx0aWYocmVzLmxlbmd0aCA9PSAyKSB7XG4gICAgXHRcdFx0XHRcdHJlcyA9IHJlc1sxXTtcbiAgICBcdFx0XHRcdH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hZERhdGEuaXRlbUxpc3Rba2V5XSA9IHJlcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1MaXN0ID0gcmVzLmFkO1xuICAgICAgICAgICAgICAgICAgICBpdGVtTGlzdCA9IFRhZ3Rvb0FkV2FsbC51dGlsLnByb2R1Y3RDb21wbGVtZW50KGl0ZW1MaXN0LCBvYmoubWluX251bSk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1MaXN0ID0gVGFndG9vQWRXYWxsLnV0aWwuSW5mb1Byb2Nlc3MoaXRlbUxpc3QpO1xuICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0W2tleV0uYWQgPSBpdGVtTGlzdDtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8v5oqKa2V55a2Y5ZyoaXRlbUxpc3Rba2V5XeijoemdolxuICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYWREYXRhLml0ZW1MaXN0W2tleV0ua2V5ID0ga2V5O1xuICAgIFx0XHRcdH0pXG4gICAgXHRcdH0gZWxzZSBpZiAob2JqLnR5cGUgPT0gXCJyZW1hcmtldGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgLy/nmbzlgItBZFRyYWNrXG4gICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLnF1ZXJ5W29iai5uYW1lXShvYmoudHlwZSwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hID0gcmVzLmE7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5iID0gcmVzLmI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMucHJvZHVjdF9wb29sLmpvaW4oJ3wnKS5tYXRjaCgvOnByb2R1Y3Q6fDpjYW1wYWlnbjovKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlZW5Qcm9kdWN0ID0gcmVzLnByb2R1Y3RfcG9vbC5qb2luKCcuJyk7Ly/nnIvpgY7nmoTllYblk4FcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9hcGnpnIDopoHlho3lgZrnorroqo1cbiAgICAgICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5pdGVtcyhzZWVuUHJvZHVjdCwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnJlc3VsdHMgPSBJbmZvUHJvY2VzcyhyZXMucmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLmFkX2RhdGEuaXRlbUxpc3Rbb2JqLm5hbWVdID0gcmVzLnJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/opoHnlZnll47vvJ9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwucmVtYXJrZXRpbmdMaXN0TnVtYmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd3RmXG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI1wiK3ZhbC5uYW1lKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSlcbiAgICBcdFx0fSBlbHNlIGlmIChvYmoudHlwZSA9PSBcInNpbWlsYXJcIikge1xuICAgICAgICAgICAgICAgIC8v55u46Zec5ZWG5ZOBXG4gICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLnF1ZXJ5SWZyYW1lKFwic2ltbGFyPVwiICsgVGFndG9vQWRXYWxsLnV0aWwuZGVjb2RlUXVlcnlEYXRhKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpLnBpZCArIFwiJmFkPVwiICsgVGFndG9vQWRXYWxsLmFkX2RhdGEuZmlyc3QuZWNfaWQgKyBcIiZhc3luYz1mYWxzZVwiLCBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzWzFdLmFkID0gVGFndG9vQWRXYWxsLnByb2R1Y3RQdXNoKHJlc1sxXS5hZCxvYmoubWluX251bSk7XG4gICAgICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hZF9kYXRhLml0ZW1MaXN0W29iai5uYW1lXSA9IGRhdGEgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIC8vd3RmXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYWRfZGF0YS5pdGVtTGlzdFtvYmoubmFtZV0uYWQucHVzaChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI1wiK29iai5uYW1lKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNbMV0uYWQgPSBJbmZvUHJvY2VzcyhyZXNbMV0uYWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVGFndG9vQWRXYWxsLmFkX2RhdGEuaXRlbUxpc3Rbb2JqLm5hbWVdID0gcmVzWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICBcdH0pXG4gICAgfSxcbiAgICBsb2FkQWREYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgXHQvL2dldCBmaXJzdCBwcm9kdWN0XG4gICAgICAgIC8vcHJvZHVjdF9rZXk6IFRhZ3Rvb0FkV2FsbC51cmxPcHRpb25zLnBpZFxuICAgICAgICBUYWd0b29BZFdhbGwucXVlcnkuaXRlbXMoVGFndG9vQWRXYWxsLnVybE9wdGlvbnMucGlkLCBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5hZERhdGEuZmlyc3QgPSBUYWd0b29BZFdhbGwudXRpbC5JbmZvUHJvY2VzcyhyZXMucmVzdWx0cylbMF07XG4gICAgICAgICAgICAvL3Jvd18z5Lul5b6M5piv5ZCm6YO957Wx5LiA5b6eZmlyc3QgaXRlbeaLv3Jvb3TpgJnlgIvpgKPntZDnlbbkvZzllYblk4HnmoRpbnB1dFxuICAgICAgICAgICAgLy8gVGFndG9vQWRXYWxsLnJvd1J1bGUucm93XzMudmFsdWUgPSByZXMucmVzdWx0cy5leHRyYS5yb290LnJlcGxhY2UoL2F1dG9cXDpcXC9cXC8sIFwiXCIvKTtcbiAgICAgICAgfSk7XG4gICAgXHQvL2dldCBwcm9kdWN0cyBvZiByb3dzIGFuZCBzdG9yZSBkYXRhc1xuICAgIFx0VGFndG9vQWRXYWxsLnNldEl0ZW1MaXN0KFRhZ3Rvb0FkV2FsbC5yb3dSdWxlKTtcbiAgICB9LFxuICAgIGxvYWRKUTogZnVuY3Rpb24oKSB7XG4gICAgICAgIFRhZ3Rvb0FkV2FsbC51dGlsLmxvYWRTY3JpcHQoXCIvL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8xLjEwLjIvanF1ZXJ5Lm1pbi5qc1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5pbml0KCk7XG4gICAgICAgICAgICAvL+Wwh+WCmeeUqOWVhuWTgeizh+aWmeWEsuWtmOi1t+S+hiwg55Sx5pa85pmC5bqP5ZWP6aGMLCDlm6DmraTkuI3og73lsIdnZXQgYmFja3Vw55qEYXBp6IiHZ2V05YW25LuWSXRlbUxpc3TnmoRhcGnlnKjkuIDotbfnmbxcbiAgICAgICAgICAgIGlmIChUYWd0b29BZFdhbGwucm93UnVsZS5iYWNrdXApIHtcbiAgICBcdFx0XHRUYWd0b29BZFdhbGwucXVlcnkuYmFja3VwKFRhZ3Rvb0FkV2FsbC5hZERhdGEucCwgZnVuY3Rpb24ocmVzKSB7XG5cdCAgICAgICAgICAgICAgICBUYWd0b29BZFdhbGwuYmFja3VwID0gVGFndG9vQWRXYWxsLnV0aWwuSW5mb1Byb2Nlc3MocmVzWzFdLmFkKTtcblx0ICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5sb2FkQWREYXRhKCk7XG5cdCAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFRhZ3Rvb0FkV2FsbC5sb2FkQWREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG4vL+aooeaTrEdUTeacg+i8ieWFpeeahOizh+aWmVxuVGFndG9vQWRXYWxsLmFkRGF0YS5iYW5uZXIgPSB7XG4gICAgXCJpbWFnZV91cmxcIjogXCJ1cmwoJy8vbGgzLmdncGh0LmNvbS9nZEJydGgzNGQwVG56YUx0M3d4Y2k2ZER2WWUwbjIxVUFiT0l3TkNjVko0LUlEQkNBZkZZNG82el9hZGNNUTB6emkwQWZGa2Zja3RidHY1NkVnVUJDWU9QJykgbm8tcmVwZWF0IDUwJSA1MCVcIixcbiAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L2V2ZW50LzEwMy9hcGx1cy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmJhbm5lclwiLFxuICAgIFwiaXRlbV9oYXNoXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInRpdGxlXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInFtXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICBcInFwXCI6IFwiY3Rob3VzZV9iYW5uZXJcIlxufTtcblRhZ3Rvb0FkV2FsbC5hZERhdGEubG9nbyA9IHtcbiAgICBcImltYWdlX3VybFwiOiBcInVybCgnLy9saDQuZ2dwaHQuY29tL1o4SXRKRlpGOHRianpZTXNSTXBlMWg3dFAzejBnckNaWFFXM1VnakpaOEEwZkxRSXc2ZDZIYV81Y2gwSnVabFk1dFAtaWw4VXBuc291ZEE3RUkwdkJ3JylcIixcbiAgICBcImxpbmtcIjogXCIvL3d3dy5jdGhvdXNlLmNvbS50dy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmxvZ29cIixcbiAgICBcIml0ZW1faGFzaFwiOiBcImN0aG91c2VfbG9nb1wiLFxuICAgIFwidGl0bGVcIjogXCJjdGhvdXNlX2xvZ29cIixcbiAgICBcInFtXCI6IFwiY3Rob3VzZV9sb2dvXCIsXG4gICAgXCJxcFwiOiBcImN0aG91c2VfbG9nb1wiXG59O1xuLy/nm67nmoTmmK/llaVcblRhZ3Rvb0FkV2FsbC5hZERhdGEuZmlyc3QgPSB7XG4gICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9cIixcbiAgICBcImltYWdlX3VybFwiOiBcIlwiLFxuICAgIFwidGl0bGVcIjogXCJjdGhvdXNlXCIsXG4gICAgXCJzdG9yZV9wcmljZVwiOiBcIlwiLFxuICAgIFwic3RvcmVfcHJpY2VcIjogXCJcIixcbiAgICBcInByaWNlXCI6IFwiXCIsXG4gICAgXCJlY19pZFwiOiAxNDIsLy8xNDI/Pz8/P1xuICAgIFwiZXh0cmFcIjoge1xuICAgICAgICBcInJvb3RcIjogXCJcIlxuICAgIH1cbn07XG4vL+mHjeimgeimgeijnGhlaWdodFxuVGFndG9vQWRXYWxsLmFkRGF0YS5iYWNrZ3JvdW5kID0ge1xuICAgIFwiaW1hZ2VfdXJsXCI6IFwiXCIsXG4gICAgXCJsaW5rXCI6IFwiXCIsXG4gICAgXCJiYWNrZ3JvdW5kXCI6IFwiI2ViZWJlYiB1cmwoJy8vbGg1LmdncGh0LmNvbS9DODRQTmJWUnc0RW9wcklVTFZlNDNaeGNoMVAxYmdDaVRrYnZyelRYdnJkMHhvUVROWnRDX250Y0FpUHk1TWN4VkF3b2ctZHdySXlHWWt4eTBzUFpDaXMnKVwiLFxuICAgIFwiaGVpZ2h0XCI6IFwiMTAwJVwiLFxuICAgIFwidGl0bGVcIjogXCJjdGhvdXNlXCJcbn07XG5cbi8v5ZG95ZCN77yf77yfXG5UYWd0b29BZFdhbGwuYWREYXRhLnAgPSBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvJmRlYnVnPXRydWVcIjtcblxuVGFndG9vQWRXYWxsLmFkRGF0YS5lY0lkID0gMTAwO1xuXG5UYWd0b29BZFdhbGwucm93UnVsZSA9IHtcblx0XCJiYWNrdXBcIjoge1xuXHRcdG5hbWU6IFwiYmFja3VwXCIsXG5cdCAgICB0eXBlOiBcImJhY2t1cFwiLFxuXHQgICAgdmFsdWU6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy8mZGVidWc9dHJ1ZVwiXG5cdH0sXG4gICAgXCJyb3dfMVwiOiB7XG4gICAgICAgIG5hbWU6IFwicm93XzFcIixcbiAgICAgICAgdHlwZTogXCJrZXlcIixcbiAgICAgICAgdmFsdWU6IFwiJnJlY29tbWVuZD1nZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg5MTU5OCZkZWJ1Zz10cnVlXCIsXG4gICAgICAgIG1pbl9udW06IDZcbiAgICB9LFxuICAgIFwicm93XzJcIjoge1xuICAgICAgICBuYW1lOiBcInJvd18yXCIsXG4gICAgICAgIHR5cGU6IFwia2V5XCIsXG4gICAgICAgIHZhbHVlOiBcIiZzaW1sYXI9Z2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo4OTE1OTgmYWQ9XCIgKyBUYWd0b29BZFdhbGwuYWREYXRhLmVjSWQgKyBcIiZzaW1sYXJfdHlwZT1jaXR5XCIsXG4gICAgICAgIG1pbl9udW06IDZcbiAgICB9LFxuICAgIFwicm93XzNcIjoge1xuICAgICAgICBuYW1lOiBcInJvd18zXCIsXG4gICAgICAgIHR5cGU6IFwia2V5XCIsXG4gICAgICAgIC8v5Lul5b6M6KaB5b6eZmlyc3TllYblk4HnmoRhdXRvXG4gICAgICAgIHZhbHVlOiBcIiZyb290PWdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODkxNTk4JmRlYnVnPXRydWVcIixcbiAgICAgICAgbWluX251bTogMTJcbiAgICB9XG5cbn1cblxud2luZG93LlRhZ3Rvb0FkV2FsbCA9IFRhZ3Rvb0FkV2FsbDtcbm1vZHVsZS5leHBvcnRzID0gVGFndG9vQWRXYWxsO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKiDpgJnmmK8gcm9vdCB2aWV377yM5Lmf56ix54K6IGNvbnRyb2xsZXItdmlld1xuICovXG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBpbXBvcnQgXG5cbi8vIHZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBUb3BCb3ggPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL1RvcEJveC5qc3gnKSApO1xudmFyIEJvdHRvbUJveCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vQm90dG9tQm94LmpzeCcpICk7XG52YXIgRm9vdGVyID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9Gb290ZXIuanN4JykgKTtcblxudmFyIFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL1N0b3JlJyk7XG52YXIgQXBwQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FwcENvbnN0YW50cycpO1xuXG52YXIgaWRSZXNpemU7XG5cbi8qKlxuICogXG4gKi9cbnZhciBBZFdhbGwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBZFdhbGwnLFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIG1vdW50XG4gICAgXG4gICAgLyoqXG4gICAgICog6YCZ5pivIGNvbXBvbmVudCBBUEksIOWcqCBtb3VudCDliY3mnIPot5HkuIDmrKHvvIzlj5blgLzlgZrngrogdGhpcy5zdGF0ZSDnmoTpoJDoqK3lgLxcbiAgICAgKi9cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbyA9IHRoaXMuZ2V0VHJ1dGgoKTsgIC8vIHt9IC0+IHRoaXMuc3RhdGVcbiAgICAgICAgby5zY3JlZW5TaXplID0gJ3RhYmxldCdcbiAgICAgICAgcmV0dXJuIG87ICBcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDkuLvnqIvlvI/pgLLlhaXpu55cbiAgICAgKi9cbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBTdG9yZS5hZGRMaXN0ZW5lciggQXBwQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCwgdGhpcy5fb25DaGFuZ2UgKTtcblxuICAgICAgICAvLyDopoHnlKggaW50ZXJ2YWwg5pOL5LiA5LiLXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLmhhbmRsZVJlc2l6ZSApO1xuXG4gICAgICAgIHRoaXMuaGFuZGxlUmVzaXplKCk7XG4gICAgfSxcblxuICAgIGhhbmRsZVJlc2l6ZTogZnVuY3Rpb24oZXZ0KXtcbiAgICAgICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQoIGlkUmVzaXplICk7XG5cbiAgICAgICAgaWRSZXNpemUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgdmFyIHNpemU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEB0b2RvOiDmlLnlm54gMTAyNFxuICAgICAgICAgICAgaWYgKGJvZHkuc2Nyb2xsV2lkdGggPiA3MjApIHtcbiAgICAgICAgICAgICAgICBzaXplID0gJ2Rlc2t0b3AnO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJvZHkuc2Nyb2xsV2lkdGggPiA0ODApIHtcbiAgICAgICAgICAgICAgICBzaXplID0gJ3RhYmxldCc7XG4gICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgICAgc2l6ZSA9ICdwaG9uZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3NjcmVlblNpemU6IHNpemV9KTtcblxuICAgICAgICB9LmJpbmQodGhpcyksIDApXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6YeN6KaB77yacm9vdCB2aWV3IOW7uueri+W+jOesrOS4gOS7tuS6i++8jOWwseaYr+WBteiBvSBzdG9yZSDnmoQgY2hhbmdlIOS6i+S7tlxuICAgICAqL1xuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gaWYgKCF0aGlzLnByb3BzLnJlcG9uc2UpIHtcblxuICAgICAgICAvLyB9XG5cbiAgICB9LCAgXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vXG4gICAgLy8gdW5tb3VudFxuXG4gICAgLyoqXG4gICAgICog5YWD5Lu25bCH5b6e55Wr6Z2i5LiK56e76Zmk5pmC77yM6KaB5YGa5ZaE5b6M5bel5L2cXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lciggdGhpcy5fb25DaGFuZ2UgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgY29tcG9uZW50RGlkVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vXG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy9cbiAgICAvLyB1cGRhdGVcblxuICAgIC8qKlxuICAgICAqIOWcqCByZW5kZXIoKSDliY3ln7fooYzvvIzmnInmqZ/mnIPlj6/lhYjomZXnkIYgcHJvcHMg5b6M55SoIHNldFN0YXRlKCkg5a2Y6LW35L6GXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV4dFByb3BzKSB7XG4gICAgICAgIC8vXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8vIOmAmeaZguW3suS4jeWPr+eUqCBzZXRTdGF0ZSgpXG4gICAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbihwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIH0sXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vXG4gICAgLy8gcmVuZGVyXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBzaXplID0gdGhpcy5zdGF0ZS5zY3JlZW5TaXplO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyggJ3NpemU6ICcsIHNpemUgKTtcblxuICAgICAgICBpZiggc2l6ZSA9PSAncGhvbmUnICl7XG5cbiAgICAgICAgICAgIC8vIHBob25lXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJiYWNrZ3JvdW5kXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIndyYXBlclwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BCb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgQm90dG9tQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZvb3RlcihudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG5cbiAgICAgICAgfWVsc2UgaWYoIHNpemUgPT0gJ3RhYmxldCcpe1xuXG4gICAgICAgICAgICAvLyB0YWJsZXRcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImJhY2tncm91bmRcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwid3JhcGVyXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFRvcEJveCh7dHJ1dGg6IHRoaXMuc3RhdGV9KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBCb3R0b21Cb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgRm9vdGVyKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBkZXNrdG9wXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe3N0eWxlOiB0aGlzLnN0YXRlLnJlc3BvbnNlLmJhY2tncm91bmR9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIndyYXBlclwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BCb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgQm90dG9tQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZvb3RlcihudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICB9LFxuXG5cblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy9cbiAgICAvLyBwcml2YXRlIG1ldGhvZHMgLSDomZXnkIblhYPku7blhafpg6jnmoTkuovku7ZcblxuICAgIC8qKlxuICAgICAqIGNvbnRyb2xsZXItdmlldyDlgbXogb3liLAgbW9kZWwgY2hhbmdlIOW+jFxuICAgICAqIOWft+ihjOmAmeaUr++8jOWug+aTjeS9nOWPpuS4gOaUryBwcml2YXRlIG1ldGhvZCDljrvot58gbW9kZWwg5Y+W5pyA5paw5YC8XG4gICAgICog54S25b6M5pON5L2cIGNvbXBvbmVudCBsaWZlIGN5Y2xlIOeahCBzZXRTdGF0ZSgpIOWwh+aWsOWAvOeBjOWFpeWFg+S7tumrlOezu1xuICAgICAqIOWwseacg+inuOeZvOS4gOmAo+S4siBjaGlsZCBjb21wb25lbnRzIOi3n+iRl+mHjee5qlxuICAgICAqL1xuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKXtcbiAgICAgICAgLy8g6YeN6KaB77ya5b6eIHJvb3QgdmlldyDop7jnmbzmiYDmnIkgc3ViLXZpZXcg6YeN57mqXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoIHRoaXMuZ2V0VHJ1dGgoKSApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDngrrkvZXopoHnjajnq4vlr6vkuIDmlK/vvJ/lm6DngrrmnIPmnInlhanlgIvlnLDmlrnmnIPnlKjliLDvvIzlm6DmraTmir3lh7rkvoZcbiAgICAgKiDnm67lnLDvvJrlkJHlkITlgIsgc3RvcmUg5Y+W5Zue6LOH5paZ77yM54S25b6M57Wx5LiAIHNldFN0YXRlKCkg5YaN5LiA5bGk5bGk5b6A5LiL5YKz6YGeXG4gICAgICovXG4gICAgZ2V0VHJ1dGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmmK/lvp4gU3RvcmUg5Y+W6LOH5paZKGFzIHRoZSBzaW5nbGUgc291cmNlIG9mIHRydXRoKVxuICAgICAgICByZXR1cm4gU3RvcmUuZ2V0QWxsKCk7XG4gICAgfVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkV2FsbDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEJhbm5lciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Jhbm5lcicsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgdmFyIGRpdlN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLmJhbm5lci5pbWFnZV91cmxcbiAgICB9XG4gICAgXG4gIFx0cmV0dXJuIChcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInRvcC1ib3gtcmlnaHRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImJhbm5lclwiLCBzdHlsZTogZGl2U3R5bGV9KVxuICAgICAgICApXG4gICAgKTtcbiAgfSxcblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYW5uZXI7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG5cbnZhciBNb3JlID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9Nb3JlLmpzeCcpICk7XG52YXIgUHJldiA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vUHJldi5qc3gnKSApO1xudmFyIE5leHQgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL05leHQuanN4JykgKTtcbnZhciBJdGVtTGlzdCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vSXRlbUxpc3QuanN4JykgKTtcbi8qKlxuICogXG4gKi9cbnZhciBCb3R0b21Cb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCb3R0b21Cb3gnLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgcmVzcG9uc2UgPSB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYm90dG9tLWJveFwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7aWQ6IFwicm93XzFcIiwgY2xhc3NOYW1lOiBcImV2ZW5cIn0sIFxuICAgICAgICAgICAgICAgICAgICBNb3JlKHtsaW5rOiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMS5hZFswXS5leHRyYS5saW5rMX0pLCBcbiAgICAgICAgICAgICAgICAgICAgUHJldih7b25DbGljazogdGhpcy5oYW5kbGVMZWZ0QXJyb3dDbGljay5iaW5kKHRoaXMsIFwicm93XzFcIiwgcmVzcG9uc2UuaXRlbUxpc3Qucm93XzEuYWQpfSksIFxuICAgICAgICAgICAgICAgICAgICBJdGVtTGlzdCh7cm93OiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMX0pLCBcbiAgICAgICAgICAgICAgICAgICAgTmV4dCh7b25DbGljazogdGhpcy5oYW5kbGVSaWdodEFycm93Q2xpY2suYmluZCh0aGlzLCBcInJvd18xXCIsIHJlc3BvbnNlLml0ZW1MaXN0LnJvd18xLmFkKX0pXG4gICAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7aWQ6IFwicm93XzJcIiwgY2xhc3NOYW1lOiBcImV2ZW5cIn0sIFxuICAgICAgICAgICAgICAgICAgICBNb3JlKHtsaW5rOiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMi5hZFswXS5leHRyYS5saW5rMX0pLCBcbiAgICAgICAgICAgICAgICAgICAgUHJldih7b25DbGljazogdGhpcy5oYW5kbGVMZWZ0QXJyb3dDbGljay5iaW5kKHRoaXMsIFwicm93XzJcIiwgcmVzcG9uc2UuaXRlbUxpc3Qucm93XzIuYWQpfSksIFxuICAgICAgICAgICAgICAgICAgICBJdGVtTGlzdCh7cm93OiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMn0pLCBcbiAgICAgICAgICAgICAgICAgICAgTmV4dCh7b25DbGljazogdGhpcy5oYW5kbGVSaWdodEFycm93Q2xpY2suYmluZCh0aGlzLCBcInJvd18yXCIsIHJlc3BvbnNlLml0ZW1MaXN0LnJvd18yLmFkKX0pXG4gICAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7aWQ6IFwicm93XzNcIiwgY2xhc3NOYW1lOiBcImV2ZW5cIn0sIFxuICAgICAgICAgICAgICAgICAgICBNb3JlKHtsaW5rOiByZXNwb25zZS5pdGVtTGlzdC5yb3dfMy5hZFswXS5leHRyYS5saW5rMX0pLCBcbiAgICAgICAgICAgICAgICAgICAgSXRlbUxpc3Qoe3JvdzogcmVzcG9uc2UuaXRlbUxpc3Qucm93XzN9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgXHQpO1xuICAgIH0sXG4gICAgaGFuZGxlTGVmdEFycm93Q2xpY2s6IGZ1bmN0aW9uKGtleSwgaXRlbUxpc3QpIHsvL+WFtuWvpuS4jeeUqOWCs2l0ZW1MaXN0LOWboOeCuuaciWtleeS6hlxuICAgICAgICBhY3Rpb25zLlNoaWZ0TGVmdChrZXksIGl0ZW1MaXN0KTtcbiAgICB9LFxuICAgIGhhbmRsZVJpZ2h0QXJyb3dDbGljazogZnVuY3Rpb24oa2V5LCBpdGVtTGlzdCkgey8v5YW25a+m5LiN55So5YKzaXRlbUxpc3Qs5Zug54K65pyJa2V55LqGXG4gICAgICAgIGFjdGlvbnMuU2hpZnRSaWdodChrZXksIGl0ZW1MaXN0KTtcbiAgICB9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQm90dG9tQm94O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuLyoqXG4gKiBcbiAqL1xudmFyIEZvb3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Zvb3RlcicsXG4gIC8qKlxuICAgKlxuICAgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblxuXHRcdHJldHVybiAgUmVhY3QuRE9NLmZvb3Rlcih7Y2xhc3NOYW1lOiBcImZvb3RlclwifSk7XG5cblx0fSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3RlcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcbi8qKlxuICogXG4gKi9cbnZhciBJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSXRlbScsXG4gICAgLyoqXG4gICAgKlxuICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgZGV0YWlsID0gdGhpcy5wcm9wcy5kZXRhaWw7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbVwiLCBcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMucHJvcHMuY2xpY2t9LCBcblxuICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbS1zbG9nYW5cIn0pLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0taW1nXCJ9LCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbWcoe3NyYzogZGV0YWlsLmltYWdlX3VybH0pXG4gICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tdGl0bGVcIn0sIGRldGFpbC50aXRsZSksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInJlZ2lvblwifSwgZGV0YWlsLmV4dHJhLnJlZ2lvbiksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYXJlYVwifSwgZGV0YWlsLmV4dHJhLmFyZWEsIFwi5Z2qXCIpLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tb2ZmZXJfcHJpY2VfcGx1c1wifSwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7Y2xhc3NOYW1lOiBcIm9mZmVyX3ByaWNlXCJ9LCBkZXRhaWwucHJpY2UpXG4gICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbS1tb3JlXCJ9KVxuICAgICAgICAgIClcblxuICAgICAgICApO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG52YXIgY3ggPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQ7XG52YXIgSXRlbSA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9JdGVtLmpzeCcpKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEl0ZW1MaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSXRlbUxpc3QnLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgQWRzID0gdGhpcy5wcm9wcy5yb3cuYWQ7XG4gICAgICAgIHZhciBhcnIgPSBBZHMubWFwKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KXtcbiAgICAgICAgICAgIHJldHVybiBJdGVtKHtrZXk6IGl0ZW0uaW5kZXgsIGRldGFpbDogaXRlbSwgY2xpY2s6IHRoaXMuY2xpY2suYmluZCh0aGlzLCBpdGVtKX0pXG4gICAgICAgIH0sIHRoaXMpXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtX2xpc3Rfd3JhcGVyXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udWwoe2NsYXNzTmFtZTogXCJpdGVtX2xpc3RcIn0sIFxuICAgICAgICAgICAgICAgICAgICBhcnJcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgIClcbiAgICB9LFxuICAgIGNsaWNrOiBmdW5jdGlvbihpdGVtKXtcblxuICAgICAgICAvL29wZW4gbGlua1xuICAgICAgICB3aW5kb3cub3BlbihpdGVtLmNsaWNrX2xpbmssICdfYmxhbmsnKTtcblxuICAgICAgICAvL2FkZCB0cmFja2luZyBwaXhlbFxuICAgICAgICB2YXIgaXRlbUxpc3QgPSB0aGlzLnByb3BzLnJvdztcbiAgICAgICAgdmFyIGtleSA9IHRoaXMucHJvcHMucm93LmtleTtcblxuICAgICAgICAvL+agueaTmuS4jeWQjOeahHJ1bGXntabkuojkuI3lkIznmoR0cmFja2luZ+izh+aWmVxuICAgICAgICBpZiAoa2V5ID09IFwic2ltaWxhclwiKSB7XG4gICAgICAgICAgICB2YXIgcW0gPSBcIlNpbWlsYXJRdWVyeVwiLFxuICAgICAgICAgICAgICAgIHFwID0gVGFndG9vQWRXYWxsLnV0aWwuZGVjb2RlUXVlcnlEYXRhKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpLnBpZDtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT0gXCJyZW1hcmtldGluZ1wiKSB7XG4gICAgICAgICAgICB2YXIgcW0gPSBcInJlbWFya2V0aW5nXCIsXG4gICAgICAgICAgICAgICAgcXAgPSBpdGVtLnByb2R1Y3Rfa2V5O1xuICAgICAgICB9IGVsc2UgaWYgKGtleS5tYXRjaChcInJvd1wiKSkge1xuICAgICAgICAgICAgdmFyIHFtID0gaXRlbUxpc3QucW0sXG4gICAgICAgICAgICAgICAgcXAgPSBpdGVtTGlzdC5xcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2cyA9IHtcbiAgICAgICAgICAgIGZzOiBUYWd0b29BZFdhbGwuZnMsXG4gICAgICAgICAgICBjcjogVGFndG9vQWRXYWxsLmNyLFxuICAgICAgICAgICAgcDogVGFndG9vQWRXYWxsLnBhZ2UsXG4gICAgICAgICAgICB1OiBpdGVtWydsaW5rJ10sXG4gICAgICAgICAgICB1dDogaXRlbVsndGl0bGUnXSxcbiAgICAgICAgICAgIHI6IFRhZ3Rvb0FkV2FsbC5yZWZlcixcbiAgICAgICAgICAgIHQ6ICd0cmFjaycsXG4gICAgICAgICAgICBlOiAnY29udGVudF9jbGljaycsXG4gICAgICAgICAgICBhOiBUYWd0b29BZFdhbGwuYSxcbiAgICAgICAgICAgIGI6IFRhZ3Rvb0FkV2FsbC5iLFxuICAgICAgICAgICAgaWQ6IFwiYWRXYWxsXCIsXG4gICAgICAgICAgICBwYjogVGFndG9vQWRXYWxsLnB1Ymxpc2hlcixcbiAgICAgICAgICAgIGFkOiBpdGVtWydlY19pZCddLFxuICAgICAgICAgICAgY2E6IGl0ZW1bJ2l0ZW1faGFzaCddLFxuICAgICAgICAgICAgdjA6IGl0ZW1bJ3RyYWNrJ10sXG4gICAgICAgICAgICBuMDogJ3RyYWNrJyxcbiAgICAgICAgICAgIHFtOiBxbSxcbiAgICAgICAgICAgIHFwOiBxcCxcbiAgICAgICAgICAgIHBjOiBUYWd0b29BZFdhbGwucGMsXG4gICAgICAgICAgICBuOiBNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMDAwMDAwMDAgLy8gY2FjaGUgYnVzdGVyXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkZFRyYWNrUGl4ZWwodnMpO1xuICAgIH0sXG5cbiAgICAvL+WcqOesrOS4gOWAi3NjcmlwdOeahOWJjemdouaPkuWFpeS4gOWAi2ltZyjnmbzlh7p0cmFja2luZyBwaXhlbClcbiAgICBhZGRUcmFja1BpeGVsOiBmdW5jdGlvbih2cyl7XG4gICAgICAgIHZhciBpbWdFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgaW1nRWxlbS5zcmMgPSBcIi8vdHJhY2sudGFndG9vLmNvL2FkL3RyLmdpZj9cIiArIHRoaXMuZW5jb2RlUXVlcnlEYXRhKHZzKTtcbiAgICAgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKVswXTtcbiAgICAgICAgbm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbWdFbGVtLCBub2RlKTtcbiAgICB9LFxuICAgIC8vb2JqMuacg+iTi+WIsG9iajFcbiAgICAvLyBtZXJnZU9iamVjdDogZnVuY3Rpb24ob2JqMSwgb2JqMikge1xuICAgIC8vICAgdmFyIG9iajMgPSB7fTtcbiAgICAvLyAgIGZvciAodmFyIGF0dHJuYW1lIGluIG9iajEpIHtcbiAgICAvLyAgICAgb2JqM1thdHRybmFtZV0gPSBvYmoxW2F0dHJuYW1lXTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGZvciAodmFyIGF0dHJuYW1lIGluIG9iajIpIHtcbiAgICAvLyAgICAgb2JqM1thdHRybmFtZV0gPSBvYmoyW2F0dHJuYW1lXTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiBvYmozO1xuICAgIC8vIH0sXG4gICAgLy8gc3RyaW5nVG9PYmplY3Q6IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIC8vICAgdmFyIGRhdGEgPSB7fTtcbiAgICAvLyAgIHZhciBwYXJ0cyA9IHN0cmluZy5zcGxpdChcIiZcIik7XG4gICAgLy8gICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gICAgIHZhciB2cyA9IHBhcnRzW2ldLnNwbGl0KCc9Jyk7XG4gICAgLy8gICAgIGlmICh2cy5sZW5ndGggPT0gMikge1xuICAgIC8vICAgICAgIHZhciBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQodnNbMF0pO1xuICAgIC8vICAgICAgIHZhciB2YWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2c1sxXSk7XG4gICAgLy8gICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiBkYXRhXG4gICAgLy8gfSxcbiAgICAvLyBvYmplY3RUb1N0cmluZzogZnVuY3Rpb24odnMpe1xuICAgIC8vICAgdmFyIG9OID0gLTEsXG4gICAgLy8gICAgICAgb3JOID0gMCxcbiAgICAvLyAgICAgICBzdHJpbmcgPSBcIlwiO1xuICAgIC8vICAgZm9yIChpIGluIHZzKSB7XG4gICAgLy8gICAgICAgb04gKys7XG4gICAgLy8gICB9XG4gICAgLy8gICBmb3IgKGkgaW4gdnMpIHtcbiAgICAvLyAgICAgICBzdHJpbmcgPSBzdHJpbmcgKyBpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodnNbaV0pXG4gICAgLy8gICAgICAgaWYgKG9OICE9IG9yTikge1xuICAgIC8vICAgICAgICAgICBzdHJpbmcgKz0gXCImXCI7XG4gICAgLy8gICAgICAgfVxuICAgIC8vICAgICAgIG9yTiArKztcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiBzdHJpbmc7XG4gICAgLy8gfSxcbiAgICBlbmNvZGVRdWVyeURhdGE6IGZ1bmN0aW9uKHZzKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gdnMpIHtcbiAgICAgICAgICAgIGlmKHZzW2tleV0pe1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKFwiXCIgKyBrZXkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2c1trZXldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFyci5qb2luKFwiJlwiKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtTGlzdDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG4vKipcbiAqIFxuICovXG52YXIgTG9nbyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xvZ28nLFxuICAvKipcbiAgICpcbiAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgZGl2U3R5bGUgPSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UubG9nby5pbWFnZV91cmxcbiAgICAgICAgfVxuXG4gICAgXHRyZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInRvcC1ib3gtbGVmdFwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImxvZ29cIiwgc3R5bGU6IGRpdlN0eWxlfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTG9nbztcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcbi8qKlxuICogXG4gKi9cbnZhciBNb3JlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTW9yZScsXG4gIC8qKlxuICAgKlxuICAgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblxuXHRcdHJldHVybiAgUmVhY3QuRE9NLmEoe2NsYXNzTmFtZTogXCJtb3JlXCIsIGhyZWY6IHRoaXMucHJvcHMubGluaywgdGFyZ2V0OiBcIl9ibGFua1wifSk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vcmU7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG5cbi8qKlxuICogXG4gKi9cbnZhciBOZXh0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmV4dCcsXG5cblxuICAvKipcbiAgICpcbiAgICovXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblx0XHRyZXR1cm4gUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIm5leHRcIiwgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrfSk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmV4dDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIFByZXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcmV2JyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblxuXHRcdHJldHVybiBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwicHJldlwiLCBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xpY2t9KTtcblx0fVxuXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJldjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIFNwZWNpYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTcGVjaWFsJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgICB2YXIgZmlyc3QgPSB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLmZpcnN0O1xuICBcdHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJzcGVjaWFsXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWltZ1wifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5pbWcoe3NyYzogZmlyc3QuaW1hZ2VfdXJsfSlcbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInNwZWNpYWwtdGV4dFwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1kZXNjcmliZVwifSwgZmlyc3QudGl0bGUpLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLXJlZ2lvblwifSwgZmlyc3QuZXh0cmEucmVnaW9uKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1zdG9yZV9wcmljZVwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2lkOiBcImxhYmVsXCJ9LCBcIue4veWDue+8mlwiKSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgZmlyc3QucHJpY2UpXG4gICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInNwZWNpYWwtYXJlYVwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2lkOiBcImxhYmVsXCJ9LCBcIuWdquaVuO+8mlwiKSwgXG4gICAgICAgICAgICAgICAgZmlyc3QuZXh0cmEuYXJlYSwgXCLlnapcIlxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLlsYvpvaHvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLmFnZVxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLmqJPlsaTvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLnN0b3JleVxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLmoLzlsYDvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLnBhdHRlcm5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwic3BlY2lhbC1tb3JlXCJ9KVxuICAgICAgICApXG4gICAgKTtcbiAgfSxcbiAgb3Blbkxpbms6IGZ1bmN0aW9uKCl7XG4gICAgLy/pgKPntZDpg73mnIPmmK9saW5r6YCZ5YCL5bGs5oCn5ZeO77yfc3BlY2lhbOS5n+acieS4gOWAi1xuICAgIHZhciBjbGlja19saW5rID0gZmlyc3QuY2xpY2tfbGluaztcbiAgICB3aW5kb3cub3BlbihjbGlja19saW5rLCAnX2JsYW5rJyk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3BlY2lhbDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIExvZ28gPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL0xvZ28uanN4JykgKTtcbnZhciBTcGVjaWFsID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9TcGVjaWFsLmpzeCcpICk7XG52YXIgQmFubmVyID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9CYW5uZXIuanN4JykgKTtcbi8qKlxuICogXG4gKi9cbnZhciBUb3BCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUb3BCb3gnLFxuICAvKipcbiAgICpcbiAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ0b3AtYm94XCJ9LCBcbiAgICAgICAgICAgICAgTG9nbyh7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGh9KSwgXG4gICAgICAgICAgICAgIFNwZWNpYWwoe3RydXRoOiB0aGlzLnByb3BzLnRydXRofSksIFxuICAgICAgICAgICAgICBCYW5uZXIoe3RydXRoOiB0aGlzLnByb3BzLnRydXRofSlcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9wQm94O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBQcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZS9wcm9taXNlXCIpLlByb21pc2U7XG52YXIgcG9seWZpbGwgPSByZXF1aXJlKFwiLi9wcm9taXNlL3BvbHlmaWxsXCIpLnBvbHlmaWxsO1xuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTtcbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCB0b1N0cmluZyAqL1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzRnVuY3Rpb247XG5cbi8qKlxuICBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCB0aGUgZ2l2ZW4gcHJvbWlzZXMgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLiBUaGUgcmV0dXJuIHByb21pc2VcbiAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgdGhhdCBnaXZlcyBhbGwgdGhlIHZhbHVlcyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlXG4gIHBhc3NlZCBpbiB0aGUgYHByb21pc2VzYCBhcnJheSBhcmd1bWVudC5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICB2YXIgcHJvbWlzZTIgPSBSU1ZQLnJlc29sdmUoMik7XG4gIHZhciBwcm9taXNlMyA9IFJTVlAucmVzb2x2ZSgzKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIFRoZSBhcnJheSBoZXJlIHdvdWxkIGJlIFsgMSwgMiwgMyBdO1xuICB9KTtcbiAgYGBgXG5cbiAgSWYgYW55IG9mIHRoZSBgcHJvbWlzZXNgIGdpdmVuIHRvIGBSU1ZQLmFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgcmVqZWN0aW9uIGhhbmRsZXIuIEZvciBleGFtcGxlOlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBSU1ZQLnJlc29sdmUoMSk7XG4gIHZhciBwcm9taXNlMiA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcihcIjJcIikpO1xuICB2YXIgcHJvbWlzZTMgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIGFsbFxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBcnJheX0gcHJvbWlzZXNcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4gIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgYHByb21pc2VzYCBoYXZlIGJlZW5cbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuXG4qL1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byBhbGwuJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXSwgcmVtYWluaW5nID0gcHJvbWlzZXMubGVuZ3RoLFxuICAgIHByb21pc2U7XG5cbiAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICByZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcihpbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmVBbGwoaW5kZXgsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpIHtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gdmFsdWU7XG4gICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgIGlmIChwcm9taXNlICYmIGlzRnVuY3Rpb24ocHJvbWlzZS50aGVuKSkge1xuICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZXIoaSksIHJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlQWxsKGksIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydHMuYWxsID0gYWxsOyIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgYnJvd3Nlckdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgbG9jYWwgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHRoaXMgPT09IHVuZGVmaW5lZD8gd2luZG93OnRoaXMpO1xuXG4vLyBub2RlXG5mdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsLnNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICB9O1xufVxuXG52YXIgcXVldWUgPSBbXTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gcXVldWVbaV07XG4gICAgdmFyIGNhbGxiYWNrID0gdHVwbGVbMF0sIGFyZyA9IHR1cGxlWzFdO1xuICAgIGNhbGxiYWNrKGFyZyk7XG4gIH1cbiAgcXVldWUgPSBbXTtcbn1cblxudmFyIHNjaGVkdWxlRmx1c2g7XG5cbi8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG5pZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJykge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTmV4dFRpY2soKTtcbn0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbn0gZWxzZSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICB2YXIgbGVuZ3RoID0gcXVldWUucHVzaChbY2FsbGJhY2ssIGFyZ10pO1xuICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgLy8gSWYgbGVuZ3RoIGlzIDEsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgfVxufVxuXG5leHBvcnRzLmFzYXAgPSBhc2FwO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJGV2FBU0hcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gIGBSU1ZQLlByb21pc2UuY2FzdGAgcmV0dXJucyB0aGUgc2FtZSBwcm9taXNlIGlmIHRoYXQgcHJvbWlzZSBzaGFyZXMgYSBjb25zdHJ1Y3RvclxuICB3aXRoIHRoZSBwcm9taXNlIGJlaW5nIGNhc3RlZC5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBSU1ZQLnJlc29sdmUoMSk7XG4gIHZhciBjYXN0ZWQgPSBSU1ZQLlByb21pc2UuY2FzdChwcm9taXNlKTtcblxuICBjb25zb2xlLmxvZyhwcm9taXNlID09PSBjYXN0ZWQpOyAvLyB0cnVlXG4gIGBgYFxuXG4gIEluIHRoZSBjYXNlIG9mIGEgcHJvbWlzZSB3aG9zZSBjb25zdHJ1Y3RvciBkb2VzIG5vdCBtYXRjaCwgaXQgaXMgYXNzaW1pbGF0ZWQuXG4gIFRoZSByZXN1bHRpbmcgcHJvbWlzZSB3aWxsIGZ1bGZpbGwgb3IgcmVqZWN0IGJhc2VkIG9uIHRoZSBvdXRjb21lIG9mIHRoZVxuICBwcm9taXNlIGJlaW5nIGNhc3RlZC5cblxuICBJbiB0aGUgY2FzZSBvZiBhIG5vbi1wcm9taXNlLCBhIHByb21pc2Ugd2hpY2ggd2lsbCBmdWxmaWxsIHdpdGggdGhhdCB2YWx1ZSBpc1xuICByZXR1cm5lZC5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHZhbHVlID0gMTsgLy8gY291bGQgYmUgYSBudW1iZXIsIGJvb2xlYW4sIHN0cmluZywgdW5kZWZpbmVkLi4uXG4gIHZhciBjYXN0ZWQgPSBSU1ZQLlByb21pc2UuY2FzdCh2YWx1ZSk7XG5cbiAgY29uc29sZS5sb2codmFsdWUgPT09IGNhc3RlZCk7IC8vIGZhbHNlXG4gIGNvbnNvbGUubG9nKGNhc3RlZCBpbnN0YW5jZW9mIFJTVlAuUHJvbWlzZSkgLy8gdHJ1ZVxuXG4gIGNhc3RlZC50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgIHZhbCA9PT0gdmFsdWUgLy8gPT4gdHJ1ZVxuICB9KTtcbiAgYGBgXG5cbiAgYFJTVlAuUHJvbWlzZS5jYXN0YCBpcyBzaW1pbGFyIHRvIGBSU1ZQLnJlc29sdmVgLCBidXQgYFJTVlAuUHJvbWlzZS5jYXN0YCBkaWZmZXJzIGluIHRoZVxuICBmb2xsb3dpbmcgd2F5czpcbiAgKiBgUlNWUC5Qcm9taXNlLmNhc3RgIHNlcnZlcyBhcyBhIG1lbW9yeS1lZmZpY2llbnQgd2F5IG9mIGdldHRpbmcgYSBwcm9taXNlLCB3aGVuIHlvdVxuICBoYXZlIHNvbWV0aGluZyB0aGF0IGNvdWxkIGVpdGhlciBiZSBhIHByb21pc2Ugb3IgYSB2YWx1ZS4gUlNWUC5yZXNvbHZlXG4gIHdpbGwgaGF2ZSB0aGUgc2FtZSBlZmZlY3QgYnV0IHdpbGwgY3JlYXRlIGEgbmV3IHByb21pc2Ugd3JhcHBlciBpZiB0aGVcbiAgYXJndW1lbnQgaXMgYSBwcm9taXNlLlxuICAqIGBSU1ZQLlByb21pc2UuY2FzdGAgaXMgYSB3YXkgb2YgY2FzdGluZyBpbmNvbWluZyB0aGVuYWJsZXMgb3IgcHJvbWlzZSBzdWJjbGFzc2VzIHRvXG4gIHByb21pc2VzIG9mIHRoZSBleGFjdCBjbGFzcyBzcGVjaWZpZWQsIHNvIHRoYXQgdGhlIHJlc3VsdGluZyBvYmplY3QncyBgdGhlbmAgaXNcbiAgZW5zdXJlZCB0byBoYXZlIHRoZSBiZWhhdmlvciBvZiB0aGUgY29uc3RydWN0b3IgeW91IGFyZSBjYWxsaW5nIGNhc3Qgb24gKGkuZS4sIFJTVlAuUHJvbWlzZSkuXG5cbiAgQG1ldGhvZCBjYXN0XG4gIEBmb3IgUlNWUFxuICBAcGFyYW0ge09iamVjdH0gb2JqZWN0IHRvIGJlIGNhc3RlZFxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIHByb3BlcnRpZXMgb2YgYHByb21pc2VzYFxuICBoYXZlIGJlZW4gZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuXG4qL1xuXG5cbmZ1bmN0aW9uIGNhc3Qob2JqZWN0KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSB0aGlzKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIHJlc29sdmUob2JqZWN0KTtcbiAgfSk7XG59XG5cbmV4cG9ydHMuY2FzdCA9IGNhc3Q7IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY29uZmlnID0ge1xuICBpbnN0cnVtZW50OiBmYWxzZVxufTtcblxuZnVuY3Rpb24gY29uZmlndXJlKG5hbWUsIHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgY29uZmlnW25hbWVdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNvbmZpZ1tuYW1lXTtcbiAgfVxufVxuXG5leHBvcnRzLmNvbmZpZyA9IGNvbmZpZztcbmV4cG9ydHMuY29uZmlndXJlID0gY29uZmlndXJlOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcblwidXNlIHN0cmljdFwiO1xuLypnbG9iYWwgc2VsZiovXG52YXIgUlNWUFByb21pc2UgPSByZXF1aXJlKFwiLi9wcm9taXNlXCIpLlByb21pc2U7XG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIHBvbHlmaWxsKCkge1xuICB2YXIgbG9jYWw7XG5cbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbG9jYWwgPSBnbG9iYWw7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmRvY3VtZW50KSB7XG4gICAgbG9jYWwgPSB3aW5kb3c7XG4gIH0gZWxzZSB7XG4gICAgbG9jYWwgPSBzZWxmO1xuICB9XG5cbiAgdmFyIGVzNlByb21pc2VTdXBwb3J0ID0gXG4gICAgXCJQcm9taXNlXCIgaW4gbG9jYWwgJiZcbiAgICAvLyBTb21lIG9mIHRoZXNlIG1ldGhvZHMgYXJlIG1pc3NpbmcgZnJvbVxuICAgIC8vIEZpcmVmb3gvQ2hyb21lIGV4cGVyaW1lbnRhbCBpbXBsZW1lbnRhdGlvbnNcbiAgICBcImNhc3RcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgXCJyZXNvbHZlXCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgIFwicmVqZWN0XCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgIFwiYWxsXCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgIFwicmFjZVwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICAvLyBPbGRlciB2ZXJzaW9uIG9mIHRoZSBzcGVjIGhhZCBhIHJlc29sdmVyIG9iamVjdFxuICAgIC8vIGFzIHRoZSBhcmcgcmF0aGVyIHRoYW4gYSBmdW5jdGlvblxuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXNvbHZlO1xuICAgICAgbmV3IGxvY2FsLlByb21pc2UoZnVuY3Rpb24ocikgeyByZXNvbHZlID0gcjsgfSk7XG4gICAgICByZXR1cm4gaXNGdW5jdGlvbihyZXNvbHZlKTtcbiAgICB9KCkpO1xuXG4gIGlmICghZXM2UHJvbWlzZVN1cHBvcnQpIHtcbiAgICBsb2NhbC5Qcm9taXNlID0gUlNWUFByb21pc2U7XG4gIH1cbn1cblxuZXhwb3J0cy5wb2x5ZmlsbCA9IHBvbHlmaWxsO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWcgPSByZXF1aXJlKFwiLi9jb25maWdcIikuY29uZmlnO1xudmFyIGNvbmZpZ3VyZSA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKS5jb25maWd1cmU7XG52YXIgb2JqZWN0T3JGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLm9iamVjdE9yRnVuY3Rpb247XG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzRnVuY3Rpb247XG52YXIgbm93ID0gcmVxdWlyZShcIi4vdXRpbHNcIikubm93O1xudmFyIGNhc3QgPSByZXF1aXJlKFwiLi9jYXN0XCIpLmNhc3Q7XG52YXIgYWxsID0gcmVxdWlyZShcIi4vYWxsXCIpLmFsbDtcbnZhciByYWNlID0gcmVxdWlyZShcIi4vcmFjZVwiKS5yYWNlO1xudmFyIHN0YXRpY1Jlc29sdmUgPSByZXF1aXJlKFwiLi9yZXNvbHZlXCIpLnJlc29sdmU7XG52YXIgc3RhdGljUmVqZWN0ID0gcmVxdWlyZShcIi4vcmVqZWN0XCIpLnJlamVjdDtcbnZhciBhc2FwID0gcmVxdWlyZShcIi4vYXNhcFwiKS5hc2FwO1xuXG52YXIgY291bnRlciA9IDA7XG5cbmNvbmZpZy5hc3luYyA9IGFzYXA7IC8vIGRlZmF1bHQgYXN5bmMgaXMgYXNhcDtcblxuZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICBpZiAoIWlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgfVxuXG4gIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpbnZva2VSZXNvbHZlcihyZXNvbHZlciwgcHJvbWlzZSkge1xuICBmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzb2x2ZXIocmVzb2x2ZVByb21pc2UsIHJlamVjdFByb21pc2UpO1xuICB9IGNhdGNoKGUpIHtcbiAgICByZWplY3RQcm9taXNlKGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSwgZXJyb3IsIHN1Y2NlZWRlZCwgZmFpbGVkO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgIHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxudmFyIFBFTkRJTkcgICA9IHZvaWQgMDtcbnZhciBTRUFMRUQgICAgPSAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgID0gMjtcblxuZnVuY3Rpb24gc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBzdWJzY3JpYmVyc1tsZW5ndGggKyBGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoKHByb21pc2UsIHNldHRsZWQpIHtcbiAgdmFyIGNoaWxkLCBjYWxsYmFjaywgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycywgZGV0YWlsID0gcHJvbWlzZS5fZGV0YWlsO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICB9XG5cbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBudWxsO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgX3N0YXRlOiB1bmRlZmluZWQsXG4gIF9kZXRhaWw6IHVuZGVmaW5lZCxcbiAgX3N1YnNjcmliZXJzOiB1bmRlZmluZWQsXG5cbiAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG5cbiAgICB2YXIgdGhlblByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihmdW5jdGlvbigpIHt9KTtcblxuICAgIGlmICh0aGlzLl9zdGF0ZSkge1xuICAgICAgdmFyIGNhbGxiYWNrcyA9IGFyZ3VtZW50cztcbiAgICAgIGNvbmZpZy5hc3luYyhmdW5jdGlvbiBpbnZva2VQcm9taXNlQ2FsbGJhY2soKSB7XG4gICAgICAgIGludm9rZUNhbGxiYWNrKHByb21pc2UuX3N0YXRlLCB0aGVuUHJvbWlzZSwgY2FsbGJhY2tzW3Byb21pc2UuX3N0YXRlIC0gMV0sIHByb21pc2UuX2RldGFpbCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vic2NyaWJlKHRoaXMsIHRoZW5Qcm9taXNlLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZW5Qcm9taXNlO1xuICB9LFxuXG4gICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cblByb21pc2UuYWxsID0gYWxsO1xuUHJvbWlzZS5jYXN0ID0gY2FzdDtcblByb21pc2UucmFjZSA9IHJhY2U7XG5Qcm9taXNlLnJlc29sdmUgPSBzdGF0aWNSZXNvbHZlO1xuUHJvbWlzZS5yZWplY3QgPSBzdGF0aWNSZWplY3Q7XG5cbmZ1bmN0aW9uIGhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSB7XG4gIHZhciB0aGVuID0gbnVsbCxcbiAgcmVzb2x2ZWQ7XG5cbiAgdHJ5IHtcbiAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuXCIpO1xuICAgIH1cblxuICAgIGlmIChvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdGhlbiA9IHZhbHVlLnRoZW47XG5cbiAgICAgIGlmIChpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgaWYgKHJlc29sdmVkKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKHZhbHVlICE9PSB2YWwpIHtcbiAgICAgICAgICAgIHJlc29sdmUocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgaWYgKHJlc29sdmVkKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgcmVqZWN0KHByb21pc2UsIHZhbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICByZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKCFoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykgeyByZXR1cm47IH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBTRUFMRUQ7XG4gIHByb21pc2UuX2RldGFpbCA9IHZhbHVlO1xuXG4gIGNvbmZpZy5hc3luYyhwdWJsaXNoRnVsZmlsbG1lbnQsIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiByZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykgeyByZXR1cm47IH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBTRUFMRUQ7XG4gIHByb21pc2UuX2RldGFpbCA9IHJlYXNvbjtcblxuICBjb25maWcuYXN5bmMocHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2hGdWxmaWxsbWVudChwcm9taXNlKSB7XG4gIHB1Ymxpc2gocHJvbWlzZSwgcHJvbWlzZS5fc3RhdGUgPSBGVUxGSUxMRUQpO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgcHVibGlzaChwcm9taXNlLCBwcm9taXNlLl9zdGF0ZSA9IFJFSkVDVEVEKTtcbn1cblxuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCB0b1N0cmluZyAqL1xudmFyIGlzQXJyYXkgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5pc0FycmF5O1xuXG4vKipcbiAgYFJTVlAucmFjZWAgYWxsb3dzIHlvdSB0byB3YXRjaCBhIHNlcmllcyBvZiBwcm9taXNlcyBhbmQgYWN0IGFzIHNvb24gYXMgdGhlXG4gIGZpcnN0IHByb21pc2UgZ2l2ZW4gdG8gdGhlIGBwcm9taXNlc2AgYXJndW1lbnQgZnVsZmlsbHMgb3IgcmVqZWN0cy5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoXCJwcm9taXNlIDFcIik7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgdmFyIHByb21pc2UyID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoXCJwcm9taXNlIDJcIik7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgUlNWUC5yYWNlKFtwcm9taXNlMSwgcHJvbWlzZTJdKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgLy8gcmVzdWx0ID09PSBcInByb21pc2UgMlwiIGJlY2F1c2UgaXQgd2FzIHJlc29sdmVkIGJlZm9yZSBwcm9taXNlMVxuICAgIC8vIHdhcyByZXNvbHZlZC5cbiAgfSk7XG4gIGBgYFxuXG4gIGBSU1ZQLnJhY2VgIGlzIGRldGVybWluaXN0aWMgaW4gdGhhdCBvbmx5IHRoZSBzdGF0ZSBvZiB0aGUgZmlyc3QgY29tcGxldGVkXG4gIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlIGBwcm9taXNlc2BcbiAgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlIGhhcyBiZWNvbWVcbiAgcmVqZWN0ZWQgYmVmb3JlIHRoZSBvdGhlciBwcm9taXNlcyBiZWNhbWUgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuICB3aWxsIGJlY29tZSByZWplY3RlZDpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlMSA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKFwicHJvbWlzZSAxXCIpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIHZhciBwcm9taXNlMiA9IG5ldyBSU1ZQLlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwicHJvbWlzZSAyXCIpKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVucyBiZWNhdXNlIHRoZXJlIGFyZSByZWplY3RlZCBwcm9taXNlcyFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gXCJwcm9taXNlMlwiIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByYWNlXG4gIEBmb3IgUlNWUFxuICBAcGFyYW0ge0FycmF5fSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyB0byBvYnNlcnZlXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGRlc2NyaWJpbmcgdGhlIHByb21pc2UgcmV0dXJuZWQuXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgYmVjb21lcyBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgdGhlIGZpcnN0XG4gIGNvbXBsZXRlZCBwcm9taXNlcyBpcyByZXNvbHZlZCB3aXRoIGlmIHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZSB3YXNcbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCB3aXRoIHRoZSByZWFzb24gdGhhdCB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2VcbiAgd2FzIHJlamVjdGVkIHdpdGguXG4qL1xuZnVuY3Rpb24gcmFjZShwcm9taXNlcykge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgaWYgKCFpc0FycmF5KHByb21pc2VzKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXSwgcHJvbWlzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvbWlzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlc1tpXTtcblxuICAgICAgaWYgKHByb21pc2UgJiYgdHlwZW9mIHByb21pc2UudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUocHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0cy5yYWNlID0gcmFjZTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICBgUlNWUC5yZWplY3RgIHJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVqZWN0ZWQgd2l0aCB0aGUgcGFzc2VkXG4gIGByZWFzb25gLiBgUlNWUC5yZWplY3RgIGlzIGVzc2VudGlhbGx5IHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEluc3RlYWQgb2Ygd3JpdGluZyB0aGUgYWJvdmUsIHlvdXIgY29kZSBub3cgc2ltcGx5IGJlY29tZXMgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlID0gUlNWUC5yZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmVqZWN0XG4gIEBmb3IgUlNWUFxuICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBpZGVudGlmeWluZyB0aGUgcmV0dXJuZWQgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlblxuICBgcmVhc29uYC5cbiovXG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHJlamVjdChyZWFzb24pO1xuICB9KTtcbn1cblxuZXhwb3J0cy5yZWplY3QgPSByZWplY3Q7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAgYFJTVlAucmVzb2x2ZWAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSBmdWxmaWxsZWQgd2l0aCB0aGUgcGFzc2VkXG4gIGB2YWx1ZWAuIGBSU1ZQLnJlc29sdmVgIGlzIGVzc2VudGlhbGx5IHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHJlc29sdmUoMSk7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gdmFsdWUgPT09IDFcbiAgfSk7XG4gIGBgYFxuXG4gIEluc3RlYWQgb2Ygd3JpdGluZyB0aGUgYWJvdmUsIHlvdXIgY29kZSBub3cgc2ltcGx5IGJlY29tZXMgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlID0gUlNWUC5yZXNvbHZlKDEpO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gdmFsdWUgPT09IDFcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmVzb2x2ZVxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBbnl9IHZhbHVlIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCB3aXRoXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGlkZW50aWZ5aW5nIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIGZ1bGZpbGxlZCB3aXRoIHRoZSBnaXZlblxuICBgdmFsdWVgXG4qL1xuZnVuY3Rpb24gcmVzb2x2ZSh2YWx1ZSkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICByZXNvbHZlKHZhbHVlKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMucmVzb2x2ZSA9IHJlc29sdmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24oeCkgfHwgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGwpO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoeCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG59XG5cbi8vIERhdGUubm93IGlzIG5vdCBhdmFpbGFibGUgaW4gYnJvd3NlcnMgPCBJRTlcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvbm93I0NvbXBhdGliaWxpdHlcbnZhciBub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG5cbmV4cG9ydHMub2JqZWN0T3JGdW5jdGlvbiA9IG9iamVjdE9yRnVuY3Rpb247XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMubm93ID0gbm93OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMuRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vbGliL0Rpc3BhdGNoZXInKVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBEaXNwYXRjaGVyXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnLi9pbnZhcmlhbnQnKTtcblxudmFyIF9sYXN0SUQgPSAxO1xudmFyIF9wcmVmaXggPSAnSURfJztcblxuLyoqXG4gKiBEaXNwYXRjaGVyIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHBheWxvYWRzIHRvIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLiBUaGlzIGlzXG4gKiBkaWZmZXJlbnQgZnJvbSBnZW5lcmljIHB1Yi1zdWIgc3lzdGVtcyBpbiB0d28gd2F5czpcbiAqXG4gKiAgIDEpIENhbGxiYWNrcyBhcmUgbm90IHN1YnNjcmliZWQgdG8gcGFydGljdWxhciBldmVudHMuIEV2ZXJ5IHBheWxvYWQgaXNcbiAqICAgICAgZGlzcGF0Y2hlZCB0byBldmVyeSByZWdpc3RlcmVkIGNhbGxiYWNrLlxuICogICAyKSBDYWxsYmFja3MgY2FuIGJlIGRlZmVycmVkIGluIHdob2xlIG9yIHBhcnQgdW50aWwgb3RoZXIgY2FsbGJhY2tzIGhhdmVcbiAqICAgICAgYmVlbiBleGVjdXRlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhpcyBoeXBvdGhldGljYWwgZmxpZ2h0IGRlc3RpbmF0aW9uIGZvcm0sIHdoaWNoXG4gKiBzZWxlY3RzIGEgZGVmYXVsdCBjaXR5IHdoZW4gYSBjb3VudHJ5IGlzIHNlbGVjdGVkOlxuICpcbiAqICAgdmFyIGZsaWdodERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY291bnRyeSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ291bnRyeVN0b3JlID0ge2NvdW50cnk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY2l0eSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ2l0eVN0b3JlID0ge2NpdHk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIGJhc2UgZmxpZ2h0IHByaWNlIG9mIHRoZSBzZWxlY3RlZCBjaXR5XG4gKiAgIHZhciBGbGlnaHRQcmljZVN0b3JlID0ge3ByaWNlOiBudWxsfVxuICpcbiAqIFdoZW4gYSB1c2VyIGNoYW5nZXMgdGhlIHNlbGVjdGVkIGNpdHksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NpdHktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENpdHk6ICdwYXJpcydcbiAqICAgfSk7XG4gKlxuICogVGhpcyBwYXlsb2FkIGlzIGRpZ2VzdGVkIGJ5IGBDaXR5U3RvcmVgOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NpdHktdXBkYXRlJykge1xuICogICAgICAgQ2l0eVN0b3JlLmNpdHkgPSBwYXlsb2FkLnNlbGVjdGVkQ2l0eTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFdoZW4gdGhlIHVzZXIgc2VsZWN0cyBhIGNvdW50cnksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NvdW50cnktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENvdW50cnk6ICdhdXN0cmFsaWEnXG4gKiAgIH0pO1xuICpcbiAqIFRoaXMgcGF5bG9hZCBpcyBkaWdlc3RlZCBieSBib3RoIHN0b3JlczpcbiAqXG4gKiAgICBDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIENvdW50cnlTdG9yZS5jb3VudHJ5ID0gcGF5bG9hZC5zZWxlY3RlZENvdW50cnk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBXaGVuIHRoZSBjYWxsYmFjayB0byB1cGRhdGUgYENvdW50cnlTdG9yZWAgaXMgcmVnaXN0ZXJlZCwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxuICogdG8gdGhlIHJldHVybmVkIHRva2VuLiBVc2luZyB0aGlzIHRva2VuIHdpdGggYHdhaXRGb3IoKWAsIHdlIGNhbiBndWFyYW50ZWVcbiAqIHRoYXQgYENvdW50cnlTdG9yZWAgaXMgdXBkYXRlZCBiZWZvcmUgdGhlIGNhbGxiYWNrIHRoYXQgdXBkYXRlcyBgQ2l0eVN0b3JlYFxuICogbmVlZHMgdG8gcXVlcnkgaXRzIGRhdGEuXG4gKlxuICogICBDaXR5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIC8vIGBDb3VudHJ5U3RvcmUuY291bnRyeWAgbWF5IG5vdCBiZSB1cGRhdGVkLlxuICogICAgICAgZmxpZ2h0RGlzcGF0Y2hlci53YWl0Rm9yKFtDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbl0pO1xuICogICAgICAgLy8gYENvdW50cnlTdG9yZS5jb3VudHJ5YCBpcyBub3cgZ3VhcmFudGVlZCB0byBiZSB1cGRhdGVkLlxuICpcbiAqICAgICAgIC8vIFNlbGVjdCB0aGUgZGVmYXVsdCBjaXR5IGZvciB0aGUgbmV3IGNvdW50cnlcbiAqICAgICAgIENpdHlTdG9yZS5jaXR5ID0gZ2V0RGVmYXVsdENpdHlGb3JDb3VudHJ5KENvdW50cnlTdG9yZS5jb3VudHJ5KTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSB1c2FnZSBvZiBgd2FpdEZvcigpYCBjYW4gYmUgY2hhaW5lZCwgZm9yIGV4YW1wbGU6XG4gKlxuICogICBGbGlnaHRQcmljZVN0b3JlLmRpc3BhdGNoVG9rZW4gPVxuICogICAgIGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvblR5cGUpIHtcbiAqICAgICAgICAgY2FzZSAnY291bnRyeS11cGRhdGUnOlxuICogICAgICAgICAgIGZsaWdodERpc3BhdGNoZXIud2FpdEZvcihbQ2l0eVN0b3JlLmRpc3BhdGNoVG9rZW5dKTtcbiAqICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlLnByaWNlID1cbiAqICAgICAgICAgICAgIGdldEZsaWdodFByaWNlU3RvcmUoQ291bnRyeVN0b3JlLmNvdW50cnksIENpdHlTdG9yZS5jaXR5KTtcbiAqICAgICAgICAgICBicmVhaztcbiAqXG4gKiAgICAgICAgIGNhc2UgJ2NpdHktdXBkYXRlJzpcbiAqICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlLnByaWNlID1cbiAqICAgICAgICAgICAgIEZsaWdodFByaWNlU3RvcmUoQ291bnRyeVN0b3JlLmNvdW50cnksIENpdHlTdG9yZS5jaXR5KTtcbiAqICAgICAgICAgICBicmVhaztcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSBgY291bnRyeS11cGRhdGVgIHBheWxvYWQgd2lsbCBiZSBndWFyYW50ZWVkIHRvIGludm9rZSB0aGUgc3RvcmVzJ1xuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MgaW4gb3JkZXI6IGBDb3VudHJ5U3RvcmVgLCBgQ2l0eVN0b3JlYCwgdGhlblxuICogYEZsaWdodFByaWNlU3RvcmVgLlxuICovXG5cbiAgZnVuY3Rpb24gRGlzcGF0Y2hlcigpIHtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrcyA9IHt9O1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nID0ge307XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0hhbmRsZWQgPSB7fTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX3BlbmRpbmdQYXlsb2FkID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdpdGggZXZlcnkgZGlzcGF0Y2hlZCBwYXlsb2FkLiBSZXR1cm5zXG4gICAqIGEgdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB3aXRoIGB3YWl0Rm9yKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5yZWdpc3Rlcj1mdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBpZCA9IF9wcmVmaXggKyBfbGFzdElEKys7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGlkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgY2FsbGJhY2sgYmFzZWQgb24gaXRzIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLnVucmVnaXN0ZXI9ZnVuY3Rpb24oaWQpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF0sXG4gICAgICAnRGlzcGF0Y2hlci51bnJlZ2lzdGVyKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLFxuICAgICAgaWRcbiAgICApO1xuICAgIGRlbGV0ZSB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFdhaXRzIGZvciB0aGUgY2FsbGJhY2tzIHNwZWNpZmllZCB0byBiZSBpbnZva2VkIGJlZm9yZSBjb250aW51aW5nIGV4ZWN1dGlvblxuICAgKiBvZiB0aGUgY3VycmVudCBjYWxsYmFjay4gVGhpcyBtZXRob2Qgc2hvdWxkIG9ubHkgYmUgdXNlZCBieSBhIGNhbGxiYWNrIGluXG4gICAqIHJlc3BvbnNlIHRvIGEgZGlzcGF0Y2hlZCBwYXlsb2FkLlxuICAgKlxuICAgKiBAcGFyYW0ge2FycmF5PHN0cmluZz59IGlkc1xuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUud2FpdEZvcj1mdW5jdGlvbihpZHMpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcsXG4gICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IE11c3QgYmUgaW52b2tlZCB3aGlsZSBkaXNwYXRjaGluZy4nXG4gICAgKTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaWRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIGlkID0gaWRzW2lpXTtcbiAgICAgIGlmICh0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgaW52YXJpYW50KFxuICAgICAgICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkW2lkXSxcbiAgICAgICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IENpcmN1bGFyIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgd2hpbGUgJyArXG4gICAgICAgICAgJ3dhaXRpbmcgZm9yIGAlc2AuJyxcbiAgICAgICAgICBpZFxuICAgICAgICApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGludmFyaWFudChcbiAgICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdLFxuICAgICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLFxuICAgICAgICBpZFxuICAgICAgKTtcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfaW52b2tlQ2FsbGJhY2soaWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyBhIHBheWxvYWQgdG8gYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGF5bG9hZFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2g9ZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgIGludmFyaWFudChcbiAgICAgICF0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcsXG4gICAgICAnRGlzcGF0Y2guZGlzcGF0Y2goLi4uKTogQ2Fubm90IGRpc3BhdGNoIGluIHRoZSBtaWRkbGUgb2YgYSBkaXNwYXRjaC4nXG4gICAgKTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX3N0YXJ0RGlzcGF0Y2hpbmcocGF5bG9hZCk7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzKSB7XG4gICAgICAgIGlmICh0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiREaXNwYXRjaGVyX2ludm9rZUNhbGxiYWNrKGlkKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9zdG9wRGlzcGF0Y2hpbmcoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIElzIHRoaXMgRGlzcGF0Y2hlciBjdXJyZW50bHkgZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5pc0Rpc3BhdGNoaW5nPWZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmc7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGwgdGhlIGNhbGxiYWNrIHN0b3JlZCB3aXRoIHRoZSBnaXZlbiBpZC4gQWxzbyBkbyBzb21lIGludGVybmFsXG4gICAqIGJvb2trZWVwaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS4kRGlzcGF0Y2hlcl9pbnZva2VDYWxsYmFjaz1mdW5jdGlvbihpZCkge1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nW2lkXSA9IHRydWU7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdKHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQpO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkW2lkXSA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB1cCBib29ra2VlcGluZyBuZWVkZWQgd2hlbiBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS4kRGlzcGF0Y2hlcl9zdGFydERpc3BhdGNoaW5nPWZ1bmN0aW9uKHBheWxvYWQpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrcykge1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmdbaWRdID0gZmFsc2U7XG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2lzSGFuZGxlZFtpZF0gPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9wZW5kaW5nUGF5bG9hZCA9IHBheWxvYWQ7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXIgYm9va2tlZXBpbmcgdXNlZCBmb3IgZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuJERpc3BhdGNoZXJfc3RvcERpc3BhdGNoaW5nPWZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQgPSBudWxsO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyA9IGZhbHNlO1xuICB9O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRGlzcGF0Y2hlcjtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGludmFyaWFudFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKGZhbHNlKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgK1xuICAgICAgICAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ0ludmFyaWFudCBWaW9sYXRpb246ICcgK1xuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50O1xuIl19
