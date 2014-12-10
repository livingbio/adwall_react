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

$(function(){
	// create container dom element
	var body = document.getElementsByTagName("body")[0],
		node = document.createElement("section"),
		id = document.createAttribute("id");
	id.value = "container";
	node.setAttributeNode(id);
	body.insertBefore(node, body.childNodes[0]);

	// 幫我建立mainapp元件，放到container中
	React.render( AdWall(), document.getElementById("container") );

})

},{"./views/AdWall.jsx":7}],3:[function(require,module,exports){
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

//引入假資料
var response = require('../stores/test_data.js');
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

var url = "//ad.tagtoo.co/query_iframe?q=row_1"
$.get(url,function(res){
    console.log(res)
})

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
            //======假資料
            response: response
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

},{"../actions/AppActionCreator":1,"../constants/AppConstants":3,"../dispatcher/AppDispatcher":4,"../stores/test_data.js":6,"events":19}],6:[function(require,module,exports){
var response = {
    "first": {
        "category1": null,
        "category3": null,
        "category2": null,
        "description": "近R15捷運  左營火車站 \t\t\r\n漢神巨蛋  瑞豐夜市\t\t\r\n生活機能好",
        "title": "巨蛋R15三房",
        "extra": {
            "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
            "area": "22.86",
            "pattern": "--",
            "region": "高雄市左營區",
            "link2": "http://www.cthouse.com.tw/PriceReduction/18",
            "storey": "4樓/7樓",
            "root": "auto://www.cthouse.com.tw/PriceReduction/18",
            "age": "18年9個月"
        },
        "item_hash": "geosun-cthouse:product:891598",
        "price": "468萬",
        "tags": null,
        "category_full": null,
        "product_key": "geosun-cthouse:product:891598",
        "advertiser_id": 100,
        "related_ads": [],
        "store_price": "None",
        "link": "http://www.cthouse.com.tw/House/891598?ctype=B&cid=tagtoo&oid=2&",
        "ec_id": 100,
        "keywords": "",
        "image_url": "//lh3.ggpht.com/dMfo7OSxx0kLx_Pd3G4ygN1gQ2GHxCTjdYfaALuFjqWXoNN5DCXYiidZAn0tJ4pK1_6oVDSJPks-ZPK5xByyqdg=s200-c",
        "title_short": "巨蛋R15三房",
        "description_short": "近R15捷運  左營火車站 \t\t\r\n...(更多)"
    },
    "itemList": {
        "row_1": {
            "ppb": 0,
            "qp": "recommend:geosun-cthouse:product:891598",
            "ad": [{
                "description": "◎全屋翻新為四間套房，目前滿租中，租金 27,800元/月，年收租金333,600元，投報率高達近7%(陽台進出)\r\n◎近漢神巨蛋購物廣場/捷運漢神巨蛋站(R14)\r\n3.鄰崇德商圈/近瑞豐夜市/近原生植物園/蓮池潭風景區，鐵路地下化增值性更佳",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "24.03",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "4樓/5樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "30年2個月"
                },
                "item_hash": "geosun-cthouse:product:934693",
                "price": "538萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/934693",
                "title": "漢神巨蛋旁高投報~4套房出租美寓",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:934693",
                "image_url": "//lh6.ggpht.com/TAbybz16lSEOfL0bge-QbSEC5Q455Fx-94OBgGzSkqT2MfvCwbcafkaPgjYK_NpDF0n8lzChz1p0Gvz0sbQWdqs=s200-c",
                "title_short": "漢神巨蛋旁高投報~4套房出租美寓",
                "description_short": "◎全屋翻新為四間套房，目前滿租中，租...(更多)"
            }, {
                "description": "1.近巨蛋商圈。\r\n2.近勝利國小。\r\n3.獨立出入。\r\n4.車庫可停雙部車。\r\n5.低管理費，鬧中取靜。",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "30.24",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "1~2樓/22樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "19年3個月"
                },
                "item_hash": "geosun-cthouse:product:964091",
                "price": "668萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/964091",
                "title": "巨蛋車庫1+2樓",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:964091",
                "image_url": "//lh5.ggpht.com/YNvxsS6SlImrzQ5pPn4OqLZXbUDKu1OF3kSfggH_L_FyWL3mMfdJ6o2hpJQnLh8sOHr253c3NPP9HRZ2w47-k2tu=s200-c",
                "title_short": "巨蛋車庫1+2樓",
                "description_short": "1.近巨蛋商圈。\r\n...(更多)"
            }, {
                "description": "◎近R15生態園站\r\n◎鄰公園\r\n◎近漢神巨蛋\r\n◎近左營國中、新光國小\r\n◎近崇德商圈\r\n◎近原生植物園",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "16.85",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "7樓/10樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "20年10個月"
                },
                "item_hash": "geosun-cthouse:product:972391",
                "price": "330萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/972391",
                "title": "捷運小2房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:972391",
                "image_url": "//lh4.ggpht.com/qO0mBEAuXLkWcxKWFFxqS0ZNu4u-i4THCCtfNicshLC-GPhkrNBEZBxAraBlIGGqYORMAHsTF_KmQ4qIDNlhvA=s200-c",
                "title_short": "捷運小2房",
                "description_short": "◎近R15生態園站\r\n...(更多)"
            }, {
                "description": "鄰R14捷運.交通便捷\r\n近漢神巨蛋百貨商圈.生機佳\r\n臨勝利國小.市場.學校邊\r\n亮麗屋況.採光通風佳\r\n優質2房.新婚雅築",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "23.21",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "5樓/27樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "20年3個月"
                },
                "item_hash": "geosun-cthouse:product:898544",
                "price": "458萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/898544",
                "title": "漢神巨蛋優質2房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:898544",
                "image_url": "//lh5.ggpht.com/qXA3O-QIpdbljZb4ZxaWlszlUl8N9eN-hC11-MAtvXZUfHuzvyTENzVR_aDyw_TTSvJA2WOHZv-_-RloYSAlMg=s200-c",
                "title_short": "漢神巨蛋優質2房",
                "description_short": "鄰R14捷運.交通便捷\r\n...(更多)"
            }, {
                "description": "1.4套房 傢電俱全\t\t\t\t\t\t\r\n2.滿租月收27800元 投報率高6%以上\t\t\t\t\t\t\r\n3.近漢神巨蛋 生活交通便利",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "24.03",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "4樓/5樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "30年1個月"
                },
                "item_hash": "geosun-cthouse:product:925264",
                "price": "538萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/925264",
                "title": "巨蛋收租公寓4套房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:925264",
                "image_url": "//lh6.ggpht.com/6-CXjyk0ksG2z9y4cI85F1R10F96K3zcswzM0iLTKwqsAjT77S3tnNk5FZOPrPJ1IaunjFxJQFZ9abI1AAR1nw=s200-c",
                "title_short": "巨蛋收租公寓4套房",
                "description_short": "1.4套房 傢電俱全\t\t\t\t\t\t\r\n...(更多)"
            }, {
                "description": "1.近R14捷運\r\n2.近漢神巨蛋商圈.生活機能強\r\n3.陽台進出.採光通風佳.低公設比",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "31.93",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "11樓/16樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "21年5個月"
                },
                "item_hash": "geosun-cthouse:product:880734",
                "price": "538萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/880734",
                "title": "{金大間}漢神巨蛋3房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:880734",
                "image_url": "//lh5.ggpht.com/NnqkCLd0joR_kSPj1Na--NC8Iga7cm3p3jMZYp5Ie585M7h5FUqVMqFtlWI0TvpF8ZsuWk_BJNCM9ZfnUqvbVQX2=s200-c",
                "title_short": "{金大間}漢神巨蛋3房",
                "description_short": "1.近R14捷運\r\n2...(更多)"
            }],
            "logo_link": "http://www.cthouse.com.tw/",
            "bgcolor": "#f4572c",
            "logo_url": "http://lh3.ggpht.com/eF109RorwTc0Iz4wzhXVDche08svqh18QyAZJVnPIfCNdkLlAae1WmtGoMbzgrkrNDL4xcZSj3tbmPzLn8g-lw",
            "qm": "Recommend"
        },
        "row_2": {
            "ppb": 0,
            "qp": ",SimlarHouse:\"高雄市\"ec:100:30,",
            "ad": [{
                "description": "◎巷道整潔，整棟外牆翻過，採光通風良好\r\n◎室內客、餐廳大空間，寬敞舒適好規劃\r\n◎巷口為陽信銀行、近公園、學校、市場、郵局\r\n◎近中正運動公園、中正技擊館\r\n◎近捷運、國一號道中正交流道，交通便利\r\n6.進入高雄市區、鳳山衛武營，均很方便\r\n7.武廟商圈各式商家林立，生活機能完善",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "28.55",
                    "pattern": "--",
                    "region": "高雄市苓雅區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "4樓/5樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "31年11個月"
                },
                "item_hash": "geosun-cthouse:product:865641",
                "price": "368萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/865641?ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&",
                "title": "武廟熱鬧商圈‧大坪數出租公寓",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:865641",
                "image_url": "//lh3.ggpht.com/QjfdKtz_Q8Nb3zvqXjOu--KuvaGK79LR5Zpxmd2uME3P7WEGK2uyzu3vfHAJ5koHwT4zBmN_UcaNcsIvsEQKyGA=s200-c",
                "title_short": "武廟熱鬧商圈‧大坪數出租公寓",
                "description_short": "◎巷道整潔，整棟外牆翻過，採光通風良...(更多)"
            }, {
                "description": "＊生活機能佳＊超低總價產品＊高投資報酬率＊雙學區",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=04",
                    "area": "12.65",
                    "pattern": "--",
                    "region": "宜蘭縣礁溪鄉",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/04",
                    "storey": "4樓/5樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/04",
                    "age": "30年5個月"
                },
                "item_hash": "geosun-cthouse:product:894622",
                "price": "190萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/894622?ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&",
                "title": "市區大一房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:894622",
                "image_url": "//lh3.ggpht.com/adB34VAO3202GaA8pNvnybkndDCxCQsAKl5SR-LTwq7SE5bvioVp2CO5uQZEEMFEdWUifSHoM-jB_xdl26PuAqPV=s200-c",
                "title_short": "市區大一房",
                "description_short": "＊生活機能佳＊超低總價產品＊高投資報...(更多)"
            }, {
                "description": "生活機能佳.管理優.捷運邊",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=01",
                    "area": "12.49",
                    "pattern": "--",
                    "region": "台北市內湖區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/01",
                    "storey": "9樓/15樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/01",
                    "age": "19年9個月"
                },
                "item_hash": "geosun-cthouse:product:921825",
                "price": "970萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/921825",
                "title": "捷運套房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:921825",
                "image_url": "//lh5.ggpht.com/woD2GP50OwiD_WMBiYprYKXHrrnfifZxuou00TTUe9eSPfhTJTFUvGsgtpDKCGzrnnWUoLY5UoZAga_cOgR9yg=s200-c",
                "title_short": "捷運套房",
                "description_short": "生活機能佳.管理優.捷運邊"
            }, {
                "description": "邊間採光明亮\r\n投資自用皆宜\r\n精美裝潢\r\n挑高3米6空間\r\n近捷運近百貨",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=01",
                    "area": "12.37",
                    "pattern": "--",
                    "region": "台北市中山區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/01",
                    "storey": "3樓/7樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/01",
                    "age": "6年10個月"
                },
                "item_hash": "geosun-cthouse:product:901160",
                "price": "1220萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/901160?ctype=B&cid=tagtoo&oid=2&",
                "title": "國賓捷運公園2+1房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:901160",
                "image_url": "//lh4.ggpht.com/sso6xTOOCx2BakkZGLmdjWTc-aYehFbhwPblOIbp2OSFeiQ_pDRZgKE7u1S1qg1k68CX5QbYwD0AYdCAG-iCytM_=s200-c",
                "title_short": "國賓捷運公園2+1房",
                "description_short": "邊間採光明亮\r\n...(更多)"
            }, {
                "description": "臨大湳商圈 ,生活機能佳,近葫蘆墩萬坪公園,1-2樓加建至滿",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=09",
                    "area": "16.63",
                    "pattern": "--",
                    "region": "台中市豐原區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/09",
                    "storey": "1~2樓/2樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/09",
                    "age": "40年4個月"
                },
                "item_hash": "geosun-cthouse:product:927675",
                "price": "468萬",
                "advertiser_id": 100,
                "related_ads": ["geosun-cthouse:product:unknown", "geosun-cthouse:product:856138", "geosun-cthouse:product:788904", "geosun-cthouse:product:910593"],
                "store_price": "",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/927675",
                "title": "大湳透天厝",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:927675",
                "image_url": "//lh3.ggpht.com/KdDL5XmvtIdnJONFSR08Udp-RtPYkoXZjz1BTGSKqT9nNRBe7QIA17_EgSnI81GatcJkX3cAVAqO1WzSIpCQizY=s200-c",
                "title_short": "大湳透天厝",
                "description_short": "臨大湳商圈 ,生活機能佳,近葫蘆墩萬坪...(更多)"
            }, {
                "description": "低總價.近市區及學區.格局方正.開放空間.一樓可規劃孝親房.用華廈的價格買透天.買地送屋.稀有出售.",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=05",
                    "area": "27.36",
                    "pattern": "--",
                    "region": "新竹市",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/05",
                    "storey": "1~3樓/2樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/05",
                    "age": "45年6個月"
                },
                "item_hash": "geosun-cthouse:product:881702",
                "price": "750萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/881702?ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&",
                "title": "食品超值透天",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:881702",
                "image_url": "//lh3.ggpht.com/uKP0C5W8GJP7eKfDWeqm1urbUUEPN_fMAtg7x9T1ipKo0IDUyvAqGxm139zaoghXVxHv6lbD88RZJwQCb0OJ550=s200-c",
                "title_short": "食品超值透天",
                "description_short": "低總價.近市區及學區.格局方正.開放空...(更多)"
            }],
            "logo_link": "http://www.cthouse.com.tw/",
            "bgcolor": "#f4572c",
            "logo_url": "http://lh3.ggpht.com/eF109RorwTc0Iz4wzhXVDche08svqh18QyAZJVnPIfCNdkLlAae1WmtGoMbzgrkrNDL4xcZSj3tbmPzLn8g-lw",
            "qm": "SimlarHouseQuery"
        },
        "row_3": {
            "ppb": 0,
            "qp": "auto://www.cthouse.com.tw/PriceReduction/18/",
            "ad": [{
                "description": "1.屋況佳，採光真棒通風好\r\n2.門口就是福山學區，上學便利走路就到\r\n3.旁邊就是公園，散步休閒好地方就在樓下\r\n4.適合小家庭及首購族，圓一個成家的夢想\r\n5.附設機械下層車位，停車沒煩惱",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "40.99",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "3樓/13樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "19年3個月"
                },
                "item_hash": "geosun-cthouse:product:978269",
                "price": "598萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/978269?ctype=B&cid=tagtoo&oid=2&",
                "title": "福山學區優質四房加車位",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:978269",
                "image_url": "//lh3.ggpht.com/AwkHdmozioiSitLECJjex9gDs9WJJ53kP10O5hp-uRexil94kYnjjOlGIPcbau63ip_sAOficpdw3omzBHcMRw=s200-c",
                "title_short": "福山學區優質四房加車位",
                "description_short": "1.屋況佳，採光真棒通風好\r\n...(更多)"
            }, {
                "description": "陽台進出.採光佳.近福山學區.三鐵共構.格局方正.屋況佳",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "35.73",
                    "pattern": "--",
                    "region": "高雄市左營區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "9樓/14樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "18年0個月"
                },
                "item_hash": "geosun-cthouse:product:957222",
                "price": "560萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/957222?ctype=B&cid=tagtoo&oid=2&",
                "title": "福山3房車位",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:957222",
                "image_url": "//lh4.ggpht.com/NBp3dpsDs3jdjHxoOyq3T140DCmNqLxNY8PS8OPCPKUp-2TVvwbixc711v-O3UWo8U_BT2E-pdE3KlWBtvYVg6k=s200-c",
                "title_short": "福山3房車位",
                "description_short": "陽台進出.採光佳.近福山學區.三鐵共構...(更多)"
            }, {
                "description": "”1.樓中樓.景觀佳.2.大露台.活動空間大\r\n3.高應大商圈.生活機能佳\r\n4.四大套房.5.超美.不看可惜”",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "103.92",
                    "pattern": "--",
                    "region": "高雄市三民區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "13~14樓/14樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "16年11個月"
                },
                "item_hash": "geosun-cthouse:product:840871",
                "price": "1280萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/840871",
                "title": "親水公園樓中樓",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:840871",
                "image_url": "//lh6.ggpht.com/xIeohoDtfBhcfQNuUo_2-6BjzTrtzZCodXqjyL8wngYbV8PoOMHLtv3OoLNyZy5FNaReF3XpNl8vItlXp8XeLQ=s200-c",
                "title_short": "親水公園樓中樓",
                "description_short": "”1.樓中樓.景觀佳.2.大露台.活動空間...(更多)"
            }, {
                "description": "一、R21都會公園站走路1分鐘\r\n二、雙陽台，通風涼爽，採光佳\r\n三、大室內空間，正四房，絕無小房間\r\n四、省道 捷運 火車站 公車站，交通方便",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "39.57",
                    "pattern": "--",
                    "region": "高雄市楠梓區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "3樓/11樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "20年3個月"
                },
                "item_hash": "geosun-cthouse:product:972939",
                "price": "488萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/972939",
                "title": "森泳大地3 ★★ 高雄楠梓最棒團隊★★",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:972939",
                "image_url": "//lh3.ggpht.com/f52TLN53bmd6UEn0tAcTGOeBTAhOa1vZY1Hk9x5dsEptsUSRBsH5ZITMVx416IhmxutWz3_DesMigTdbsRGbFw8=s200-c",
                "title_short": "森泳大地3 ★★ 高雄楠梓最棒團隊★★",
                "description_short": "一、R21都會公園站走路1分鐘\r\n...(更多)"
            }, {
                "description": "一、方正格局、前後陽台\r\n二、採光佳、視野佳、動距大\r\n三、衛浴開窗，三面採光\r\n四、全新三房車位，合理價一年屋",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "36.95",
                    "pattern": "--",
                    "region": "高雄市楠梓區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "12樓/15樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "0年7個月"
                },
                "item_hash": "geosun-cthouse:product:981073",
                "price": "666萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/981073?ctype=B&cid=tagtoo&oid=2&",
                "title": "四季香頌12 ★★ 高雄楠梓最棒團隊★★",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:981073",
                "image_url": "//lh5.ggpht.com/OXiplZP-OkEGwR6kPcMbccPBKV37iE4Isb-fo2X0xj0uIfDSIwYEN2z849t3oTw8NV8HhQUaGgfN6PLic8UB5ko=s200-c",
                "title_short": "四季香頌12 ★★ 高雄楠梓最棒團隊★★",
                "description_short": "一、方正格局、前後陽台\r\n...(更多)"
            }, {
                "description": "R21都會公園站 走路1分鐘\r\n雙陽台 通風涼爽 採光佳\r\n大室內空間 正四房\r\n省道捷運火車站 交通方便",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "39.57",
                    "pattern": "--",
                    "region": "高雄市楠梓區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "3樓/11樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "20年3個月"
                },
                "item_hash": "geosun-cthouse:product:973751",
                "price": "488萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/973751",
                "title": "森泳大地3-高雄楠梓最棒團隊",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:973751",
                "image_url": "//lh5.ggpht.com/4qdLZ7bEh2__31D-E6yTaO_rivfuo7XvjO1Zg9ZL6ZRC_MOtICiPg36YCZ7IPkURFboxU1OJrzd48FJLbc2zzX8=s200-c",
                "title_short": "森泳大地3-高雄楠梓最棒團隊",
                "description_short": "R21都會公園站 走路1分鐘\r\n...(更多)"
            }, {
                "description": "1.近科工館.高應大\r\n2.輕軌在附近\r\n3.屋況好採光佳\r\n4.可當生套房",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "10.42",
                    "pattern": "--",
                    "region": "高雄市三民區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "7樓/10樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "34年6個月"
                },
                "item_hash": "geosun-cthouse:product:985131",
                "price": "156萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/985131?ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&",
                "title": "高應大漂亮套房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:985131",
                "image_url": "//lh4.ggpht.com/J4s6XWeKMOwNcVMNjfhuMqVK9k6LAiFJwk8CfcN2O1AgYUtNkXmC4GTDup8FWNrm3QLGpTFDvQmlIb2Tqo6hXnk=s200-c",
                "title_short": "高應大漂亮套房",
                "description_short": "1.近科工館.高應大\r\n...(更多)"
            }, {
                "description": "一、軍校路主幹道的高雄銀行樓上\r\n二、保全周密.監視安全.住?私有停機車位\r\n三、右昌最熱鬧的商圈.m.小北.銀行.公車\r\n四、高樓層可眺望軍區.夕陽美景.夜空星光",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "13.06",
                    "pattern": "--",
                    "region": "高雄市楠梓區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "7樓/7樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "22年10個月"
                },
                "item_hash": "geosun-cthouse:product:963076",
                "price": "190萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/963076?ctype=B&cid=tagtoo&oid=2&&ctype=B&cid=tagtoo&oid=2&",
                "title": "軍校大套房 ★★ 高雄楠梓最棒團隊★★",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:963076",
                "image_url": "//lh5.ggpht.com/mDuLRaCDoGBcU7GmYst_bGo3YlOMEnW0ENb47c2d0hSYoSoE2L6efLlnWRxE5UDYhL-f35VA5MuirFRko_5yGTQ=s200-c",
                "title_short": "軍校大套房 ★★ 高雄楠梓最棒團隊★★",
                "description_short": "一、軍校路主幹道的高雄銀行樓上\r\n...(更多)"
            }, {
                "description": "1.室內空間大，採光通風好\r\n2.出門河堤綠帶公園，運動、休閒好去處\r\n3.位裕誠、河堤商圈，生活機能佳",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "46.67",
                    "pattern": "--",
                    "region": "高雄市三民區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "8樓/14樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "17年10個月"
                },
                "item_hash": "geosun-cthouse:product:981744",
                "price": "828萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/981744",
                "title": "河堤公園四房+車位",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:981744",
                "image_url": "//lh6.ggpht.com/4589c0JL6Xd4_7Q_upcR1O8L1ddiSGEY0-LGWv5CohdsT3fd38XSj40ZYmcLpn325x33R_p3AMDyLhSPmMucyg=s200-c",
                "title_short": "河堤公園四房+車位",
                "description_short": "1.室內空間大，採光通風好\r\n...(更多)"
            }, {
                "description": "1.雙捷運，大東VS鳳山國中站，交通便利，近大東藝術文化中心，公園，學校旁\r\n2.鄰傳統巿場，青年夜巿，超商賣場，生活採買超方便",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "41.95",
                    "pattern": "--",
                    "region": "高雄市鳳山區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "3樓/13樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "18年5個月"
                },
                "item_hash": "geosun-cthouse:product:965291",
                "price": "768萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/965291",
                "title": "至善天下美四房",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:965291",
                "image_url": "//lh6.ggpht.com/0M8wBkvACtwSEdEkZVoOy1VjFh9jzGQ6fUEcqts0Vj7woCaA-nvJbkJAbPP9j2P1WK5fnizfTMHDUvdhjdTF6nA=s200-c",
                "title_short": "至善天下美四房",
                "description_short": "1.雙捷運，大東VS鳳山國中站，交通便利...(更多)"
            }, {
                "description": "1.近國道高速公路.及88快速\r\n  道路.交通方便.\r\n2.格局方正.採光通風好.\r\n3.屋況佳.即可入住.",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "32.44",
                    "pattern": "--",
                    "region": "高雄市大寮區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "12樓/17樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "16年9個月"
                },
                "item_hash": "geosun-cthouse:product:965937",
                "price": "298萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/965937",
                "title": "大寮歡喜鎮景觀美大樓",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:965937",
                "image_url": "//lh5.ggpht.com/kOH_wKf2oDxHRly4et6xo8OrWukpGwsV3_HXjL2KpoP4cMFItUHIGttpSLhXpkGFvdT11jmzmAGmbLu106scGg=s200-c",
                "title_short": "大寮歡喜鎮景觀美大樓",
                "description_short": "1.近國道高速公路.及88快速\r\n...(更多)"
            }, {
                "description": "免整理、屋況有夠棒\r\n近學區、生活機能佳",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "38.90",
                    "pattern": "--",
                    "region": "高雄市小港區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "4樓/6樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "22年3個月"
                },
                "item_hash": "geosun-cthouse:product:963354",
                "price": "368萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/963354?ctype=B&cid=tagtoo&oid=2&",
                "title": "林林國小漂亮三房，送平車",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:963354",
                "image_url": "//lh6.ggpht.com/AoUQ5gThlt-IfRpfCIBdgRRHPTYOvFB6amhgk3Y7z4vScgn5lZ1JSkJ3Kp2HJ2ssh2R0BuqgaLfGaJ2RUlHSEw=s200-c",
                "title_short": "林林國小漂亮三房，送平車",
                "description_short": "免整理、屋況有夠棒\r\n近學區、生活機能佳"
            }, {
                "description": "格局採光佳 可眺望美景\r\n楠梓最熱鬧區段\r\n近捷運站 \r\n德賢商圈 生活機能佳\r\n近海科大 好出租",
                "extra": {
                    "link1": "http://www.cthouse.com.tw/BuyingHouse/index.aspx?searchtype=1&countyid=18",
                    "area": "40.12",
                    "pattern": "--",
                    "region": "高雄市楠梓區",
                    "link2": "http://www.cthouse.com.tw/PriceReduction/18",
                    "storey": "17樓/19樓",
                    "root": "auto://www.cthouse.com.tw/PriceReduction/18",
                    "age": "18年10個月"
                },
                "item_hash": "geosun-cthouse:product:956578",
                "price": "460萬",
                "advertiser_id": 100,
                "related_ads": [],
                "store_price": "None",
                "expire": null,
                "link": "http://www.cthouse.com.tw/House/956578?ctype=B&cid=tagtoo&oid=2&",
                "title": "美麗國17-高雄楠梓最棒團隊",
                "ec_id": 100,
                "product_key": "geosun-cthouse:product:956578",
                "image_url": "//lh3.ggpht.com/s3esGgDP4o_iYEfkbIWxoROWTl0SEJJkDUfYr8sEVQWOyR-iT80z2PcLh9AsWLQYJQQ-BDdG1oTXM7GNY1UkvDA=s200-c",
                "title_short": "美麗國17-高雄楠梓最棒團隊",
                "description_short": "格局採光佳 可眺望美景\r\n...(更多)"
            }],
            "logo_link": "http://www.cthouse.com.tw/",
            "bgcolor": "#f4572c",
            "logo_url": "http://lh3.ggpht.com/eF109RorwTc0Iz4wzhXVDche08svqh18QyAZJVnPIfCNdkLlAae1WmtGoMbzgrkrNDL4xcZSj3tbmPzLn8g-lw",
            "qm": "Hot"
        }
    },
    "banner": {
        "image_url": "url('//lh3.ggpht.com/gdBrth34d0TnzaLt3wxci6dDvYe0n21UAbOIwNCcVJ4-IDBCAfFY4o6z_adcMQ0zzi0AfFkfcktbtv56EgUBCYOP') no-repeat 50% 50%",
        "link": "http://www.cthouse.com.tw/event/103/aplus/?ctype=B&cid=tagtoo&banner",
        "item_hash": "cthouse_banner",
        "title": "cthouse_banner",
        "qm": "cthouse_banner",
        "qp": "cthouse_banner"
    },
    "logo": {
        "image_url": "url('//lh4.ggpht.com/Z8ItJFZF8tbjzYMsRMpe1h7tP3z0grCZXQW3UgjJZ8A0fLQIw6d6Ha_5ch0JuZlY5tP-il8UpnsoudA7EI0vBw')",
        "link": "//www.cthouse.com.tw/?ctype=B&cid=tagtoo&logo",
        "item_hash": "cthouse_logo",
        "title": "cthouse_logo",
        "qm": "cthouse_logo",
        "qp": "cthouse_logo"
    },
    "background": {
        "image_url": "",
        "link": "",
        "background": "#ebebeb url('//lh5.ggpht.com/C84PNbVRw4EoprIULVe43Zxch1P1bgCiTkbvrzTXvrd0xoQTNZtC_ntcAiPy5McxVAwog-dwrIyGYkxy0sPZCis')",
        "title": "cthouse"
    },
    "p": "http://www.cthouse.com.tw/&debug=true",
    "ecId": 100
}
module.exports = response;
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

var TodoStore = require('../stores/TodoStore');
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
        TodoStore.addListener( AppConstants.CHANGE_EVENT, this._onChange );

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
    },  

    //========================================================================
    //
    // unmount

    /**
     * 元件將從畫面上移除時，要做善後工作
     */
    componentWillUnmount: function() {
        TodoStore.removeChangeListener( this._onChange );
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
        // 是從 TodoStore 取資料(as the single source of truth)
        return TodoStore.getAll();
    }


});

module.exports = AdWall;

},{"../constants/AppConstants":3,"../stores/TodoStore":5,"./BottomBox.jsx":9,"./Footer.jsx":10,"./TopBox.jsx":18}],8:[function(require,module,exports){
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


  /**
   *
   */
  render: function() {

    return (
        React.DOM.div({className: "bottom-box"}, 
            React.DOM.div({id: "row_1", className: "even"}, 
                More({link: this.props.truth.response.itemList.row_1.ad[0].extra.link1}), 
                Prev({onClick: this.handleLeftArrowClick.bind(this, "row_1", this.props.truth.response.itemList.row_1.ad)}), 
                ItemList({truth: this.props.truth.response.itemList.row_1}), 
                Next({onClick: this.handleRightArrowClick.bind(this, "row_1", this.props.truth.response.itemList.row_1.ad)})
            ), 
            React.DOM.div({id: "row_2", className: "even"}, 
                More({link: this.props.truth.response.itemList.row_2.ad[0].extra.link1}), 
                Prev({onClick: this.handleLeftArrowClick.bind(this, "row_2", this.props.truth.response.itemList.row_2.ad)}), 
                ItemList({truth: this.props.truth.response.itemList.row_2}), 
                Next({onClick: this.handleRightArrowClick.bind(this, "row_2", this.props.truth.response.itemList.row_2.ad)})
            ), 
            React.DOM.div({id: "row_3", className: "even"}, 
                More({link: this.props.truth.response.itemList.row_3.ad[0].extra.link1}), 
                ItemList({truth: this.props.truth.response.itemList.row_3})
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
                    
        React.DOM.div({className: "item"}, 
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvci5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL2Jvb3QuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy9jb25zdGFudHMvQXBwQ29uc3RhbnRzLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvc3RvcmVzL1RvZG9TdG9yZS5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL3N0b3Jlcy90ZXN0X2RhdGEuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy92aWV3cy9BZFdhbGwuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvdmlld3MvQmFubmVyLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL3ZpZXdzL0JvdHRvbUJveC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy92aWV3cy9Gb290ZXIuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvdmlld3MvSXRlbS5qc3giLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy92aWV3cy9JdGVtTGlzdC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy92aWV3cy9Mb2dvLmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL3ZpZXdzL01vcmUuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvdmlld3MvTmV4dC5qc3giLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL2FwcC9qcy92aWV3cy9QcmV2LmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvYXBwL2pzL3ZpZXdzL1NwZWNpYWwuanN4IiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9hcHAvanMvdmlld3MvVG9wQm94LmpzeCIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL21haW4uanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvYWxsLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2FzYXAuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvY2FzdC5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9jb25maWcuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcG9seWZpbGwuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcHJvbWlzZS5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yYWNlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JlamVjdC5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9yZXNvbHZlLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3V0aWxzLmpzIiwiL1VzZXJzL0ZlZWxpbmdzL1Byb2dyYW1taW5nL0FkV2FsbC9ub2RlX21vZHVsZXMvZmx1eC9pbmRleC5qcyIsIi9Vc2Vycy9GZWVsaW5ncy9Qcm9ncmFtbWluZy9BZFdhbGwvbm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvRmVlbGluZ3MvUHJvZ3JhbW1pbmcvQWRXYWxsL25vZGVfbW9kdWxlcy9mbHV4L2xpYi9pbnZhcmlhbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogXG4gKi9cbnZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyk7XG52YXIgQXBwQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FwcENvbnN0YW50cycpO1xudmFyIFByb21pc2UgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XG5cbi8qKlxuICog6YCZ5piv5LiA5YCLIHNpbmdsZXRvbiDnianku7ZcbiAqL1xudmFyIEFwcEFjdGlvbkNyZWF0b3JzID0ge1xuXG4gICAgLyoqXG4gICAgICogYXBwIOWVn+WLleW+jO+8jOesrOS4gOasoei8ieWFpeizh+aWmVxuICAgICAqL1xuICAgIGxvYWQ6IGZ1bmN0aW9uKCl7XG5cdFx0Ly8gICAgICAgIFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBTaGlmdExlZnQ6IGZ1bmN0aW9uKGtleSwgaXRlbUxpc3QpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5oYW5kbGVWaWV3QWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvblR5cGU6IEFwcENvbnN0YW50cy5MaXN0X1NoaWZ0TGVmdCxcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgaXRlbUxpc3Q6IGl0ZW1MaXN0XG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBTaGlmdFJpZ2h0OiBmdW5jdGlvbihrZXksIGl0ZW1MaXN0KSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuaGFuZGxlVmlld0FjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25UeXBlOiBBcHBDb25zdGFudHMuTGlzdF9TaGlmdFJpZ2h0LFxuICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICBpdGVtTGlzdDogaXRlbUxpc3RcbiAgICAgICAgfSlcbiAgICB9XG5cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHBBY3Rpb25DcmVhdG9ycztcbiIsIi8qXG4gKiDpgJnoo4/mmK/mlbTmlK/nqIvlvI/nmoTpgLLlhaXpu57vvIzlroPosqDosqzlu7rnq4sgcm9vdCB2aWV377yMXG4gKiDkuZ/lsLHmmK8gTWFpbkFwcCDlhYPku7bvvIzlsIflroPlu7rnq4votbfkvobmlL7liLDnlavpnaLkuIpcbiAqXG4gKiBib290LmpzIOWtmOWcqOeahOebruWcsO+8jOaYr+WboOeCuumAmuW4uCBhcHAg5ZWf5YuV5pmC5pyJ6Kix5aSa5YWI5pyf5bel5L2c6KaB5a6M5oiQ77yMXG4gKiDkvovlpoLpoJDovInos4fmlpnliLAgc3RvcmUg5YWn44CB5qqi5p+l5pys5Zyw56uvIGRiIOeLgOaFi+OAgeWIh+aPm+S4jeWQjOiqnuezu+Wtl+S4suOAgVxuICog6YCZ5Lqb5bel5L2c6YO95YWI5ZyoIGJvb3QuanMg5YWn5YGa5a6M77yM5YaN5ZWf5YuVIHJvb3QgdmlldyDmmK/mr5TovIPnkIbmg7PnmoTmtYHnqItcbiAqIFxuICovXG5cbi8vIHYwLjEyIOmWi+Wni+imgeeUqCBjcmVhdGVGYWN0b3J5IOWMheS4gOasoeaJjeiDveS9v+eUqOWFg+S7tlxuLy8g5aaC5p6c5LiN5biM5pyb6YCZ6bq86bq754Wp77yM5Y+q6KaB5Zyo5q+P5Lu9IGpzIOijj+mDveWKoOS4i+mdoumAmeWPpeWNs+WPr++8jOS9huWug+aciee8uum7nlxuLy8gdmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbi8vIFxuLy8g5Zug54K6IHJlcXVpcmUoJy4uLicpIOWPquaYr+aLv+WIsOS4gOS7veWFg+S7tuWumue+qeaqlO+8jOeEoeazleebtOaOpeS9v+eUqFxuLy8g6KaB55So5a6D5bu656uL5LiA5YCLIGZhY3RvcnnvvIzkuYvlvozmiY3og73nlKLlh7ogaW5zdGFuY2XvvIzkuIvpnaIgY3JlYXRlRmFjdG9yeSgpIOWwseaYr+WcqOW7uueri+W3peW7oFxudmFyIEFkV2FsbCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZShcIi4vdmlld3MvQWRXYWxsLmpzeFwiKSk7XG5cbiQoZnVuY3Rpb24oKXtcblx0Ly8gY3JlYXRlIGNvbnRhaW5lciBkb20gZWxlbWVudFxuXHR2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXSxcblx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIiksXG5cdFx0aWQgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJpZFwiKTtcblx0aWQudmFsdWUgPSBcImNvbnRhaW5lclwiO1xuXHRub2RlLnNldEF0dHJpYnV0ZU5vZGUoaWQpO1xuXHRib2R5Lmluc2VydEJlZm9yZShub2RlLCBib2R5LmNoaWxkTm9kZXNbMF0pO1xuXG5cdC8vIOW5q+aIkeW7uueri21haW5hcHDlhYPku7bvvIzmlL7liLBjb250YWluZXLkuK1cblx0UmVhY3QucmVuZGVyKCBBZFdhbGwoKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXJcIikgKTtcblxufSlcbiIsIi8qKlxuICogVG9kb0NvbnN0YW50c1xuICovXG4gdmFyIGtleU1pcnJvciA9IGZ1bmN0aW9uKG9iaikge1xuICAgdmFyIHJldCA9IHt9O1xuICAgdmFyIGtleTtcbiAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgY29udGludWU7XG4gICAgIH1cbiAgICAgcmV0W2tleV0gPSBrZXk7XG4gICB9XG4gICByZXR1cm4gcmV0O1xuIH07XG5cbi8vIENvbnN0cnVjdHMgYW4gZW51bWVyYXRpb24gd2l0aCBrZXlzIGVxdWFsIHRvIHRoZWlyIHZhbHVlLlxuLy8g5Lmf5bCx5piv6K6TIGhhc2gg55qEIGtleSDoiIcgdmFsdWUg5YC85LiA5qijXG4vLyDkuI3nhLbljp/mnKwgdmFsdWUg6YO95pivIG51bGxcbi8vIOS4jemBjuaXoueEtuWmguatpO+8jOeCuuS9leS4jeS5vuiEhueUqCBzZXQg5LmL6aGe5Y+q5pyJa2V5IOeahOWwseWlvVxubW9kdWxlLmV4cG9ydHMgPSBrZXlNaXJyb3Ioe1xuXG4gIFx0U09VUkNFX1ZJRVdfQUNUSU9OOiBudWxsLFxuICBcdFNPVVJDRV9TRVJWRVJfQUNUSU9OOiBudWxsLFxuICBcdFNPVVJDRV9ST1VURVJfQUNUSU9OOiBudWxsLFxuXG4gIFx0Q0hBTkdFX0VWRU5UOiBudWxsLFxuICBcdFxuICAgIExpc3RfU2hpZnRMZWZ0OiBudWxsLFxuXG4gICAgTGlzdF9TaGlmdFJpZ2h0OiBudWxsLFxuXG59KTtcblxuIiwiXG52YXIgQXBwQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FwcENvbnN0YW50cycpO1xuXG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJ2ZsdXgnKS5EaXNwYXRjaGVyO1xuXG5cbi8qKlxuICogZmx1eC1jaGF0IOWFp+acgOaWsOeahCBkaXNwYXRjaGVyXG4gKi9cbnZhciBBcHBEaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcblxuLy8g5rOo5oSP77ya6YCZ6KOP562J5pa85piv57m85om/IERpc3BhdGNoZXIgY2xhc3Mg6Lqr5LiK5omA5pyJ5oyH5Luk77yM55uu5Zyw5piv6K6T5q2k54mp5Lu25L+x5pyJ5buj5pKt6IO95YqfXG4vLyDlkIzmqKPlip/og73kuZ/lj6/nlKggdW5kZXJzY29yZS5leHRlbmQg5oiWIE9iamVjdC5hc3NpZ24oKSDlgZrliLBcbi8vIOS7iuWkqeWboOeCuuacieeUqCBqcXVlcnkg5bCx6KuL5a6D5Luj5Yue5LqGXG4kLmV4dGVuZCggQXBwRGlzcGF0Y2hlciwge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGFjdGlvbiBUaGUgZGV0YWlscyBvZiB0aGUgYWN0aW9uLCBpbmNsdWRpbmcgdGhlIGFjdGlvbidzXG4gICAgICogdHlwZSBhbmQgYWRkaXRpb25hbCBkYXRhIGNvbWluZyBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICovXG4gICAgaGFuZGxlU2VydmVyQWN0aW9uOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgICAgICBzb3VyY2U6IEFwcENvbnN0YW50cy5TT1VSQ0VfU0VSVkVSX0FDVElPTixcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaChwYXlsb2FkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZGlzcGF0Y2goZXZ0KVxuICAgICAqL1xuICAgIGhhbmRsZVZpZXdBY3Rpb246IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIHNvdXJjZTogQXBwQ29uc3RhbnRzLlNPVVJDRV9WSUVXX0FDVElPTixcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmRpc3BhdGNoKHBheWxvYWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlsIfkvobllZ/nlKggcm91dGVyIOaZgu+8jOmAmeijj+iZleeQhuaJgOaciSByb3V0ZXIgZXZlbnRcbiAgICAgKi9cbiAgICBoYW5kbGVSb3V0ZXJBY3Rpb246IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBzb3VyY2U6IEFwcENvbnN0YW50cy5TT1VSQ0VfUk9VVEVSX0FDVElPTixcbiAgICAgICAgICAgIGFjdGlvbjogcGF0aFxuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcERpc3BhdGNoZXI7XG4iLCIvKipcbiAqIFRvZG9TdG9yZVxuICovXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vL1xuLy8gSU1QT1JUXG5cbnZhciBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyJyk7XG52YXIgQXBwQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FwcENvbnN0YW50cycpO1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjsgLy8g5Y+W5b6X5LiA5YCLIHB1Yi9zdWIg5buj5pKt5ZmoXG5cbi8v5byV5YWl5YGH6LOH5paZXG52YXIgcmVzcG9uc2UgPSByZXF1aXJlKCcuLi9zdG9yZXMvdGVzdF9kYXRhLmpzJyk7XG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIFByaXZhdGUgdmFyc1xuXG4vLyDnrYnlkIzmlrwgVG9kb1N0b3JlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIFxuLy8g5b6e5q2k5Y+W5b6X5buj5pKt55qE6IO95YqbXG4vLyDnlLHmlrzlsIfkvobmnIPov5TpgoQgVG9kb1N0b3JlIOWHuuWOu++8jOWboOatpOS4i+mdouWvq+eahOacg+WFqOiuiueCuiBwdWJsaWMgbWV0aG9kc1xudmFyIFN0b3JlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vLyDlgYfos4fmlplcbnZhciBhcnJUb2RvcyA9IG51bGw7XG5cbi8vIOebruWJjemBuOWPlueahCB0b2RvIOmgheebrlxudmFyIHNlbGVjdGVkSXRlbSA9IG51bGw7XG5cbi8vIGhlYWRlciDoo4/pmqjmiZPljbPmn6XovLjlhaXnmoTmloflrZdcbnZhciBzZWFyY2hGaWx0ZXIgPSAnJztcblxuLy8gYXBwIOesrOS4gOasoeWVn+WLleaZgu+8jOWtmOWFpeS4gOWMhSBtb2NrIGRhdGEg5YiwIGxvY2FsU3RvcmFnZSDkvpvmuKzoqaZcbnZhciBkYiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2U7XG5pZiggZGIuaGFzT3duUHJvcGVydHkoJ215ZGInKSA9PSBmYWxzZSApe1xuICAgIC8vIGNvbnNvbGUubG9nKCAnXFxu54Sh5q235Y+y6LOH5paZ77yM5a2Y5YWlIG1vY2sgZGF0YScgKTtcbiAgICBkYi5zZXRJdGVtKCdteWRiJywgSlNPTi5zdHJpbmdpZnkoe3RvZG9zOiBbXSwgc2VsZWN0ZWRJdGVtOiBudWxsfSkgKVxufVxuXG4vLyDmjqXokZfkuIDlvovlvp4gZGIg6K6A5Y+W5q235Y+y6LOH5paZXG52YXIgbyA9IEpTT04ucGFyc2UoZGIuZ2V0SXRlbSgnbXlkYicpKTtcbmFyclRvZG9zID0gby50b2RvcyA/IG8udG9kb3MgOiBbXSA7XG5zZWxlY3RlZEl0ZW0gPSBvLnNlbGVjdGVkSXRlbTtcblxudmFyIHVybCA9IFwiLy9hZC50YWd0b28uY28vcXVlcnlfaWZyYW1lP3E9cm93XzFcIlxuJC5nZXQodXJsLGZ1bmN0aW9uKHJlcyl7XG4gICAgY29uc29sZS5sb2cocmVzKVxufSlcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBQdWJsaWMgQVBJXG5cbi8qKlxuICog5bu656uLIFN0b3JlIGNsYXNz77yM5Lim5LiU57m85om/IEV2ZW50RU1pdHRlciDku6Xmk4HmnInlu6Pmkq3lip/og71cbiAqL1xuJC5leHRlbmQoIFN0b3JlLCB7XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgQVBJXG4gICAgICog5L6b5aSW55WM5Y+W5b6XIHN0b3JlIOWFp+mDqOizh+aWmVxuICAgICAqL1xuICAgIGdldEFsbDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFyclRvZG9zOiBhcnJUb2RvcyxcbiAgICAgICAgICAgIHNlbGVjdGVkSXRlbTogc2VsZWN0ZWRJdGVtLFxuICAgICAgICAgICAgZmlsdGVyOiBzZWFyY2hGaWx0ZXIsXG4gICAgICAgICAgICAvLz09PT09PeWBh+izh+aWmVxuICAgICAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy9cbiAgICBub29wOiBmdW5jdGlvbigpe31cbn0pO1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy9cbi8vIGV2ZW50IGhhbmRsZXJzXG5cbi8qKlxuICog5ZCRIERpc3BhdGNoZXIg6Ki75YaK6Ieq5bey77yM5omN6IO95YG16IG95Yiw57O757Wx55m85Ye655qE5LqL5Lu2XG4gKiDkuKbkuJTlj5blm54gZGlzcGF0Y2hUb2tlbiDkvpvml6XlvowgYXN5bmMg5pON5L2c55SoXG4gKi9cblN0b3JlLmRpc3BhdGNoVG9rZW4gPSBBcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKCBmdW5jdGlvbiBldmVudEhhbmRsZXJzKGV2dCl7XG5cbiAgICAvLyBldnQgLmFjdGlvbiDlsLHmmK8gdmlldyDnlbbmmYLlu6Pmkq3lh7rkvobnmoTmlbTljIXnianku7ZcbiAgICAvLyDlroPlhaflkKsgYWN0aW9uVHlwZVxuICAgIHZhciBhY3Rpb24gPSBldnQuYWN0aW9uO1xuXG4gICAgc3dpdGNoIChhY3Rpb24uYWN0aW9uVHlwZSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqL1xuICAgICAgICBjYXNlIEFwcENvbnN0YW50cy5MaXN0X1NoaWZ0TGVmdDpcbiAgICAgICAgICAgIHZhciBrZXkgPSBhY3Rpb24ua2V5LFxuICAgICAgICAgICAgICAgIGl0ZW1MaXN0ID0gYWN0aW9uLml0ZW1MaXN0O1xuICAgICAgICAgICAgcmVzcG9uc2UuaXRlbUxpc3Rba2V5XS5hZC5zcGxpY2UoMCwgMCwgaXRlbUxpc3QucG9wKCkpO1xuICAgICAgICAgICAgU3RvcmUuZW1pdCggQXBwQ29uc3RhbnRzLkNIQU5HRV9FVkVOVCApO1xuICAgICAgICBcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICovXG4gICAgICAgIGNhc2UgQXBwQ29uc3RhbnRzLkxpc3RfU2hpZnRSaWdodDpcbiAgICAgICAgICAgIHZhciBrZXkgPSBhY3Rpb24ua2V5LFxuICAgICAgICAgICAgICAgIGl0ZW1MaXN0ID0gYWN0aW9uLml0ZW1MaXN0O1xuICAgICAgICAgICAgcmVzcG9uc2UuaXRlbUxpc3Rba2V5XS5hZC5wdXNoKGl0ZW1MaXN0LnNwbGljZSgwLCAxKVswXSk7XG4gICAgICAgICAgICBTdG9yZS5lbWl0KCBBcHBDb25zdGFudHMuQ0hBTkdFX0VWRU5UICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy9cbiAgICB9XG5cbn0pXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vL1xuLy8gcHJpdmF0ZSBtZXRob2RzXG5cbi8qKlxuICog5bCH6LOH5paZ5L+d5a2Y5YWlIGxvY2FsU3RvcmFnZe+8jOS4i+asoemWi+WVn+aZguWPluWbnlxuICovXG5mdW5jdGlvbiBwZXJzaXN0KCl7XG4gICAgZGIuc2V0SXRlbSgnbXlkYicsIEpTT04uc3RyaW5naWZ5KHt0b2RvczogYXJyVG9kb3MsIHNlbGVjdGVkSXRlbTogc2VsZWN0ZWRJdGVtLCByZXNwb25zZTogcmVzcG9uc2V9KSApO1xufVxuXG4vL1xubW9kdWxlLmV4cG9ydHMgPSBTdG9yZTtcbiIsInZhciByZXNwb25zZSA9IHtcbiAgICBcImZpcnN0XCI6IHtcbiAgICAgICAgXCJjYXRlZ29yeTFcIjogbnVsbCxcbiAgICAgICAgXCJjYXRlZ29yeTNcIjogbnVsbCxcbiAgICAgICAgXCJjYXRlZ29yeTJcIjogbnVsbCxcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIui/kVIxNeaNt+mBiyAg5bem54ef54Gr6LuK56uZIFxcdFxcdFxcclxcbua8ouelnuW3qOibiyAg55Ge6LGQ5aSc5biCXFx0XFx0XFxyXFxu55Sf5rS75qmf6IO95aW9XCIsXG4gICAgICAgIFwidGl0bGVcIjogXCLlt6jom4tSMTXkuInmiL9cIixcbiAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgXCJhcmVhXCI6IFwiMjIuODZcIixcbiAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICBcInJlZ2lvblwiOiBcIumrmOmbhOW4guW3pueHn+WNgFwiLFxuICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiNOaoky835qiTXCIsXG4gICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICBcImFnZVwiOiBcIjE45bm0OeWAi+aciFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo4OTE1OThcIixcbiAgICAgICAgXCJwcmljZVwiOiBcIjQ2OOiQrFwiLFxuICAgICAgICBcInRhZ3NcIjogbnVsbCxcbiAgICAgICAgXCJjYXRlZ29yeV9mdWxsXCI6IG51bGwsXG4gICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg5MTU5OFwiLFxuICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzg5MTU5OD9jdHlwZT1CJmNpZD10YWd0b28mb2lkPTImXCIsXG4gICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICBcImtleXdvcmRzXCI6IFwiXCIsXG4gICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDMuZ2dwaHQuY29tL2RNZm83T1N4eDBrTHhfUGQzRzR5Z04xZ1EyR0h4Q1RqZFlmYUFMdUZqcVdYb05ONURDWFlpaWRaQW4wdEo0cEsxXzZvVkRTSlBrcy1aUEs1eEJ5eXFkZz1zMjAwLWNcIixcbiAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuW3qOibi1IxNeS4ieaIv1wiLFxuICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi6L+RUjE15o236YGLICDlt6bnh5/ngavou4rnq5kgXFx0XFx0XFxyXFxuLi4uKOabtOWkmilcIlxuICAgIH0sXG4gICAgXCJpdGVtTGlzdFwiOiB7XG4gICAgICAgIFwicm93XzFcIjoge1xuICAgICAgICAgICAgXCJwcGJcIjogMCxcbiAgICAgICAgICAgIFwicXBcIjogXCJyZWNvbW1lbmQ6Z2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo4OTE1OThcIixcbiAgICAgICAgICAgIFwiYWRcIjogW3tcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi4peO5YWo5bGL57+75paw54K65Zub6ZaT5aWX5oi/77yM55uu5YmN5ru/56ef5Lit77yM56ef6YeRIDI3LDgwMOWFgy/mnIjvvIzlubTmlLbnp5/ph5EzMzMsNjAw5YWD77yM5oqV5aCx546H6auY6YGU6L+RNyUo6Zm95Y+w6YCy5Ye6KVxcclxcbuKXjui/kea8ouelnuW3qOibi+izvOeJqeW7o+WgtC/mjbfpgYvmvKLnpZ7lt6jom4vnq5koUjE0KVxcclxcbjMu6YSw5bSH5b635ZWG5ZyIL+i/keeRnuixkOWknOW4gi/ov5Hljp/nlJ/mpI3nianlnJIv6JOu5rGg5r2t6aKo5pmv5Y2A77yM6ZC16Lev5Zyw5LiL5YyW5aKe5YC85oCn5pu05L2zXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjI0LjAzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5bem54ef5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiNOaoky815qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIzMOW5tDLlgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0OjkzNDY5M1wiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCI1MzjokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTM0NjkzXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIua8ouelnuW3qOibi+aXgemrmOaKleWgsX405aWX5oi/5Ye656ef576O5a+TXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTM0NjkzXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNi5nZ3BodC5jb20vVEFieWJ6MTZsU0VPZkwwYmdlLVFiU0VDNVE0NTVGeC05NE9CZ0d6U2txVDJNZnZDd2JjYWZrYVBnallLX05wREYwbjhsekNoejFwMEd2ejBzYlFXZHFzPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmvKLnpZ7lt6jom4vml4Hpq5jmipXloLF+NOWll+aIv+WHuuenn+e+juWvk1wiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCLil47lhajlsYvnv7vmlrDngrrlm5vplpPlpZfmiL/vvIznm67liY3mu7/np5/kuK3vvIznp58uLi4o5pu05aSaKVwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIjEu6L+R5beo6JuL5ZWG5ZyI44CCXFxyXFxuMi7ov5Hli53liKnlnIvlsI/jgIJcXHJcXG4zLueNqOeri+WHuuWFpeOAglxcclxcbjQu6LuK5bqr5Y+v5YGc6ZuZ6YOo6LuK44CCXFxyXFxuNS7kvY7nrqHnkIbosrvvvIzprKfkuK3lj5bpnZzjgIJcIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiMzAuMjRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILlt6bnh5/ljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCIxfjLmqJMvMjLmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjE55bm0M+WAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTY0MDkxXCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjY2OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85NjQwOTFcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5beo6JuL6LuK5bqrMSsy5qiTXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTY0MDkxXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNS5nZ3BodC5jb20vWU52eHNTNlNsSW1yelE1cFBuNE9xTFpYYlVES3UxT0Yza1NmZ2dIX0xfRnlXTDNtTWZkSjZvMmhwSlFuTGg4c09IcjI1M2MzTlBQOUhSWjJ3NDctazJ0dT1zMjAwLWNcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlX3Nob3J0XCI6IFwi5beo6JuL6LuK5bqrMSsy5qiTXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIjEu6L+R5beo6JuL5ZWG5ZyI44CCXFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLil47ov5FSMTXnlJ/mhYvlnJLnq5lcXHJcXG7il47phLDlhazlnJJcXHJcXG7il47ov5HmvKLnpZ7lt6jom4tcXHJcXG7il47ov5Hlt6bnh5/lnIvkuK3jgIHmlrDlhYnlnIvlsI9cXHJcXG7il47ov5HltIflvrfllYblnIhcXHJcXG7il47ov5Hljp/nlJ/mpI3nianlnJJcIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiMTYuODVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILlt6bnh5/ljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCI35qiTLzEw5qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIyMOW5tDEw5YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5NzIzOTFcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiMzMw6JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJOb25lXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzk3MjM5MVwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLmjbfpgYvlsI8y5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTcyMzkxXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNC5nZ3BodC5jb20vcU8wbUJFQXVYTGtXY3hLV0ZGeHFTMFpOdTR1LWk0VEhDQ3RmTmljc2hMQy1HUGhrck5CRVpCeEFyYUJsSUdHcVlPUk1BSHNURl9LbVE0cUlETmxodkE9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuaNt+mBi+WwjzLmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi4peO6L+RUjE155Sf5oWL5ZyS56uZXFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLphLBSMTTmjbfpgYsu5Lqk6YCa5L6/5o23XFxyXFxu6L+R5ryi56We5beo6JuL55m+6LKo5ZWG5ZyILueUn+apn+S9s1xcclxcbuiHqOWLneWIqeWci+Wwjy7luILloLQu5a245qCh6YKKXFxyXFxu5Lqu6bqX5bGL5rOBLuaOoeWFiemAmumiqOS9s1xcclxcbuWEquizqjLmiL8u5paw5ama6ZuF56+JXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjIzLjIxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5bem54ef5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiNeaoky8yN+aok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMjDlubQz5YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo4OTg1NDRcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiNDU46JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJOb25lXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzg5ODU0NFwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLmvKLnpZ7lt6jom4vlhKros6oy5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODk4NTQ0XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNS5nZ3BodC5jb20vcVhBM08tUUlwZGJsalpiNFp4YVdsc3psVWw4TjllTi1oQzExLU1BdHZYWlVmSHV6dnlURU56VlJfYUR5d19UVFN2SkEyV09IWnYtXy1SbG9ZU0FsTWc9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIua8ouelnuW3qOibi+WEquizqjLmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi6YSwUjE05o236YGLLuS6pOmAmuS+v+aNt1xcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiMS405aWX5oi/IOWCoumbu+S/seWFqFxcdFxcdFxcdFxcdFxcdFxcdFxcclxcbjIu5ru/56ef5pyI5pS2Mjc4MDDlhYMg5oqV5aCx546H6auYNiXku6XkuIpcXHRcXHRcXHRcXHRcXHRcXHRcXHJcXG4zLui/kea8ouelnuW3qOibiyDnlJ/mtLvkuqTpgJrkvr/liKlcIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiMjQuMDNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILlt6bnh5/ljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCI05qiTLzXmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjMw5bm0MeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTI1MjY0XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjUzOOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzkyNTI2NFwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLlt6jom4vmlLbnp5/lhazlr5M05aWX5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTI1MjY0XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNi5nZ3BodC5jb20vNi1DWGp5azBrc0cyejl5NGNJODVGMVIxMEY5NkszemNzd3pNMGlMVEt3cXNBalQ3N1MzdG5OazVGWk9QclBKMUlhdW5qRnhKUUZaOWFiSTFBQVIxbnc9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuW3qOibi+aUtuenn+WFrOWvkzTlpZfmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwiMS405aWX5oi/IOWCoumbu+S/seWFqFxcdFxcdFxcdFxcdFxcdFxcdFxcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiMS7ov5FSMTTmjbfpgYtcXHJcXG4yLui/kea8ouelnuW3qOibi+WVhuWciC7nlJ/mtLvmqZ/og73lvLdcXHJcXG4zLumZveWPsOmAsuWHui7mjqHlhYnpgJrpoqjkvbMu5L2O5YWs6Kit5q+UXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjMxLjkzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5bem54ef5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiMTHmqJMvMTbmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjIx5bm0NeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODgwNzM0XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjUzOOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS84ODA3MzRcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwie+mHkeWkp+mWk33mvKLnpZ7lt6jom4sz5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODgwNzM0XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNS5nZ3BodC5jb20vTm5xa0NMZDBqb1Jfa1NQajFOYS0tTkM4SWdhN2NtM3Azak1aWXA1SWU1ODVNN2g1RlVxVk1xRnRsV0kwVHZwRjhac3VXa19CSk5DTTlaZm5VcXZiVlFYMj1zMjAwLWNcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlX3Nob3J0XCI6IFwie+mHkeWkp+mWk33mvKLnpZ7lt6jom4sz5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIjEu6L+RUjE05o236YGLXFxyXFxuMi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgXCJsb2dvX2xpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1wiLFxuICAgICAgICAgICAgXCJiZ2NvbG9yXCI6IFwiI2Y0NTcyY1wiLFxuICAgICAgICAgICAgXCJsb2dvX3VybFwiOiBcImh0dHA6Ly9saDMuZ2dwaHQuY29tL2VGMTA5Um9yd1RjMEl6NHd6aFhWRGNoZTA4c3ZxaDE4UXlBWkpWblBJZkNOZGtMbEFhZTFXbXRHb01iemdya3JOREw0eGNaU2ozdGJtUHpMbjhnLWx3XCIsXG4gICAgICAgICAgICBcInFtXCI6IFwiUmVjb21tZW5kXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyb3dfMlwiOiB7XG4gICAgICAgICAgICBcInBwYlwiOiAwLFxuICAgICAgICAgICAgXCJxcFwiOiBcIixTaW1sYXJIb3VzZTpcXFwi6auY6ZuE5biCXFxcImVjOjEwMDozMCxcIixcbiAgICAgICAgICAgIFwiYWRcIjogW3tcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi4peO5be36YGT5pW05r2U77yM5pW05qOf5aSW54mG57+76YGO77yM5o6h5YWJ6YCa6aKo6Imv5aW9XFxyXFxu4peO5a6k5YWn5a6i44CB6aSQ5buz5aSn56m66ZaT77yM5a+s5pWe6IiS6YGp5aW96KaP5YqDXFxyXFxu4peO5be35Y+j54K66Zm95L+h6YqA6KGM44CB6L+R5YWs5ZyS44CB5a245qCh44CB5biC5aC044CB6YO15bGAXFxyXFxu4peO6L+R5Lit5q2j6YGL5YuV5YWs5ZyS44CB5Lit5q2j5oqA5pOK6aSoXFxyXFxu4peO6L+R5o236YGL44CB5ZyL5LiA6Jmf6YGT5Lit5q2j5Lqk5rWB6YGT77yM5Lqk6YCa5L6/5YipXFxyXFxuNi7pgLLlhaXpq5jpm4TluILljYDjgIHps7PlsbHooZvmrabnh5/vvIzlnYflvojmlrnkvr9cXHJcXG43LuatpuW7n+WVhuWciOWQhOW8j+WVhuWutuael+eri++8jOeUn+a0u+apn+iDveWujOWWhFwiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIyOC41NVwiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIumrmOmbhOW4guiLk+mbheWNgFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjTmqJMvNeaok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMzHlubQxMeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODY1NjQxXCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjM2OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS84NjU2NDE/Y3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJiZjdHlwZT1CJmNpZD10YWd0b28mb2lkPTImJmN0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiZcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5q2m5buf54ax6ayn5ZWG5ZyI4oCn5aSn5Z2q5pW45Ye656ef5YWs5a+TXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODY1NjQxXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoMy5nZ3BodC5jb20vUWpmZEt0el9ROE5iM3p2cVhqT3UtLUt1dmFHSzc5TFI1WnB4bWQydU1FM1A3V0VHSzJ1eXp1M3ZmSEFKNWtvSHdUNHpCbU5fVWNhTmNzSXZzRVFLeUdBPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmrablu5/nhrHprKfllYblnIjigKflpKflnarmlbjlh7rnp5/lhazlr5NcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi4peO5be36YGT5pW05r2U77yM5pW05qOf5aSW54mG57+76YGO77yM5o6h5YWJ6YCa6aKo6ImvLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLvvIrnlJ/mtLvmqZ/og73kvbPvvIrotoXkvY7nuL3lg7nnlKLlk4HvvIrpq5jmipXos4floLHphaznjofvvIrpm5nlrbjljYBcIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MDRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiMTIuNjVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLlrpzomK3nuKPnpIHmuqrphIlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMDRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCI05qiTLzXmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8wNFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjMw5bm0NeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODk0NjIyXCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjE5MOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS84OTQ2MjI/Y3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJiZjdHlwZT1CJmNpZD10YWd0b28mb2lkPTImXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuW4guWNgOWkp+S4gOaIv1wiLFxuICAgICAgICAgICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg5NDYyMlwiLFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDMuZ2dwaHQuY29tL2FkQjM0VkFPMzIwMkdhQThwTnZueWJrbmREQ3hDUXNBS2w1U1ItTFR3cTdTRTVidmlvVnAyQ081dVFaRUVNRkVkV1VpZlNIb00takJfeGRsMjZQdUFxUFY9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuW4guWNgOWkp+S4gOaIv1wiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCLvvIrnlJ/mtLvmqZ/og73kvbPvvIrotoXkvY7nuL3lg7nnlKLlk4HvvIrpq5jmipXos4floLEuLi4o5pu05aSaKVwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIueUn+a0u+apn+iDveS9sy7nrqHnkIblhKou5o236YGL6YKKXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTAxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjEyLjQ5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi5Y+w5YyX5biC5YWn5rmW5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzAxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiOeaoky8xNeaok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzAxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMTnlubQ55YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5MjE4MjVcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiOTcw6JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTIxODI1XCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuaNt+mBi+Wll+aIv1wiLFxuICAgICAgICAgICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0OjkyMTgyNVwiLFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDUuZ2dwaHQuY29tL3dvRDJHUDUwT3dpRF9XTUJpWXByWUtYSHJybmZpZlp4dW91MDBUVFVlOWVTUGZoVEpURlV2R3NndHBES0NHenJubldVb0xZNVVvWkFnYV9jT2dSOXlnPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmjbfpgYvlpZfmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi55Sf5rS75qmf6IO95L2zLueuoeeQhuWEqi7mjbfpgYvpgopcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLpgorplpPmjqHlhYnmmI7kuq5cXHJcXG7mipXos4foh6rnlKjnmoblrpxcXHJcXG7nsr7nvo7oo53mvaJcXHJcXG7mjJHpq5gz57GzNuepuumWk1xcclxcbui/keaNt+mBi+i/keeZvuiyqFwiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0wMVwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIxMi4zN1wiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIuWPsOWMl+W4guS4reWxseWNgFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8wMVwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjPmqJMvN+aok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzAxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiNuW5tDEw5YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5MDExNjBcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiMTIyMOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85MDExNjA/Y3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJlwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLlnIvos5PmjbfpgYvlhazlnJIyKzHmiL9cIixcbiAgICAgICAgICAgICAgICBcImVjX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInByb2R1Y3Rfa2V5XCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5MDExNjBcIixcbiAgICAgICAgICAgICAgICBcImltYWdlX3VybFwiOiBcIi8vbGg0LmdncGh0LmNvbS9zc282eFRPT0N4MkJha2taR0xtZGpXVGMtYVllaEZiaHdQYmxPSWJwMk9TRmVpUV9wRFJaZ0tFN3UxUzFxZzFrNjhDWDVRYll3RDBBWWRDQUctaUN5dE1fPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLlnIvos5PmjbfpgYvlhazlnJIyKzHmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi6YKK6ZaT5o6h5YWJ5piO5LquXFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLoh6jlpKfmubPllYblnIggLOeUn+a0u+apn+iDveS9syzov5HokavomIbloqnokKzlnarlhazlnJIsMS0y5qiT5Yqg5bu66Iez5ru/XCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTA5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjE2LjYzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi5Y+w5Lit5biC6LGQ5Y6f5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzA5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiMX4y5qiTLzLmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8wOVwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjQw5bm0NOWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTI3Njc1XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjQ2OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0OnVua25vd25cIiwgXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg1NjEzOFwiLCBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6Nzg4OTA0XCIsIFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5MTA1OTNcIl0sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85Mjc2NzVcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5aSn5rmz6YCP5aSp5Y6dXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTI3Njc1XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoMy5nZ3BodC5jb20vS2RETDVYbXZ0SWRuSk9ORlNSMDhVZHAtUnRQWWtvWFpqejFCVEdTS3FUOW5OUkJlN1FJQTE3X0VnU25JODFHYXRjSmtYM2NBVkFxTzFXelNJcENRaXpZPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLlpKfmubPpgI/lpKnljp1cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi6Ieo5aSn5rmz5ZWG5ZyIICznlJ/mtLvmqZ/og73kvbMs6L+R6JGr6JiG5aKp6JCs5Z2qLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLkvY7nuL3lg7ku6L+R5biC5Y2A5Y+K5a245Y2ALuagvOWxgOaWueatoy7plovmlL7nqbrplpMu5LiA5qiT5Y+v6KaP5YqD5a2d6Kaq5oi/LueUqOiPr+W7iOeahOWDueagvOiyt+mAj+WkqS7osrflnLDpgIHlsYsu56iA5pyJ5Ye65ZSuLlwiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0wNVwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIyNy4zNlwiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIuaWsOerueW4glwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8wNVwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjF+M+aoky8y5qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMDVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCI0NeW5tDblgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg4MTcwMlwiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCI3NTDokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvODgxNzAyP2N0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiYmY3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJlwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLpo5/lk4HotoXlgLzpgI/lpKlcIixcbiAgICAgICAgICAgICAgICBcImVjX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInByb2R1Y3Rfa2V5XCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo4ODE3MDJcIixcbiAgICAgICAgICAgICAgICBcImltYWdlX3VybFwiOiBcIi8vbGgzLmdncGh0LmNvbS91S1AwQzVXOEdKUDdlS2ZEV2VxbTF1cmJVVUVQTl9mTUF0Zzd4OVQxaXBLbzBJRFV5dkFxR3htMTM5emFvZ2hYVnhIdjZsYkQ4OFJaSndRQ2IwT0o1NTA9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIumjn+WTgei2heWAvOmAj+WkqVwiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCLkvY7nuL3lg7ku6L+R5biC5Y2A5Y+K5a245Y2ALuagvOWxgOaWueatoy7plovmlL7nqbouLi4o5pu05aSaKVwiXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwibG9nb19saW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9cIixcbiAgICAgICAgICAgIFwiYmdjb2xvclwiOiBcIiNmNDU3MmNcIixcbiAgICAgICAgICAgIFwibG9nb191cmxcIjogXCJodHRwOi8vbGgzLmdncGh0LmNvbS9lRjEwOVJvcndUYzBJejR3emhYVkRjaGUwOHN2cWgxOFF5QVpKVm5QSWZDTmRrTGxBYWUxV210R29NYnpncmtyTkRMNHhjWlNqM3RibVB6TG44Zy1sd1wiLFxuICAgICAgICAgICAgXCJxbVwiOiBcIlNpbWxhckhvdXNlUXVlcnlcIlxuICAgICAgICB9LFxuICAgICAgICBcInJvd18zXCI6IHtcbiAgICAgICAgICAgIFwicHBiXCI6IDAsXG4gICAgICAgICAgICBcInFwXCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOC9cIixcbiAgICAgICAgICAgIFwiYWRcIjogW3tcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiMS7lsYvms4HkvbPvvIzmjqHlhYnnnJ/mo5LpgJrpoqjlpb1cXHJcXG4yLumWgOWPo+WwseaYr+emj+WxseWtuOWNgO+8jOS4iuWtuOS+v+WIqei1sOi3r+WwseWIsFxcclxcbjMu5peB6YKK5bCx5piv5YWs5ZyS77yM5pWj5q2l5LyR6ZaS5aW95Zyw5pa55bCx5Zyo5qiT5LiLXFxyXFxuNC7pganlkIjlsI/lrrbluq3lj4rpppbos7zml4/vvIzlnJPkuIDlgIvmiJDlrrbnmoTlpKLmg7NcXHJcXG41LumZhOioreapn+aisOS4i+WxpOi7iuS9je+8jOWBnOi7iuaykueFqeaDsVwiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCI0MC45OVwiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIumrmOmbhOW4guW3pueHn+WNgFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjPmqJMvMTPmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjE55bm0M+WAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTc4MjY5XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjU5OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85NzgyNjk/Y3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJlwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLnpo/lsbHlrbjljYDlhKros6rlm5vmiL/liqDou4rkvY1cIixcbiAgICAgICAgICAgICAgICBcImVjX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInByb2R1Y3Rfa2V5XCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5NzgyNjlcIixcbiAgICAgICAgICAgICAgICBcImltYWdlX3VybFwiOiBcIi8vbGgzLmdncGh0LmNvbS9Bd2tIZG1vemlvaVNpdExFQ0pqZXg5Z0RzOVdKSjUza1AxME81aHAtdVJleGlsOTRrWW5qak9sR0lQY2JhdTYzaXBfc0FPZmljcGR3M29tekJIY01Sdz1zMjAwLWNcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlX3Nob3J0XCI6IFwi56aP5bGx5a245Y2A5YSq6LOq5Zub5oi/5Yqg6LuK5L2NXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIjEu5bGL5rOB5L2z77yM5o6h5YWJ55yf5qOS6YCa6aKo5aW9XFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLpmb3lj7DpgLLlh7ou5o6h5YWJ5L2zLui/keemj+WxseWtuOWNgC7kuInpkLXlhbHmp4su5qC85bGA5pa55q2jLuWxi+azgeS9s1wiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIzNS43M1wiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIumrmOmbhOW4guW3pueHn+WNgFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjnmqJMvMTTmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjE45bm0MOWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTU3MjIyXCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjU2MOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85NTcyMjI/Y3R5cGU9QiZjaWQ9dGFndG9vJm9pZD0yJlwiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogXCLnpo/lsbEz5oi/6LuK5L2NXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTU3MjIyXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNC5nZ3BodC5jb20vTkJwM2Rwc0RzM2pkakh4b095cTNUMTQwRENtTnFMeE5ZOFBTOE9QQ1BLVXAtMlRWdndiaXhjNzExdi1PM1VXbzhVX0JUMkUtcGRFM0tsV0J0dllWZzZrPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLnpo/lsbEz5oi/6LuK5L2NXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIumZveWPsOmAsuWHui7mjqHlhYnkvbMu6L+R56aP5bGx5a245Y2ALuS4iemQteWFseaniy4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi4oCdMS7mqJPkuK3mqJMu5pmv6KeA5L2zLjIu5aSn6Zyy5Y+wLua0u+WLleepuumWk+Wkp1xcclxcbjMu6auY5oeJ5aSn5ZWG5ZyILueUn+a0u+apn+iDveS9s1xcclxcbjQu5Zub5aSn5aWX5oi/LjUu6LaF576OLuS4jeeci+WPr+aDnOKAnVwiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIxMDMuOTJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILkuInmsJHljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCIxM34xNOaoky8xNOaok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMTblubQxMeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6ODQwODcxXCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjEyODDokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvODQwODcxXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuimquawtOWFrOWckuaok+S4reaok1wiLFxuICAgICAgICAgICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojg0MDg3MVwiLFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDYuZ2dwaHQuY29tL3hJZW9ob0R0ZkJoY2ZRTnVVb18yLTZCanpUcnR6WkNvZFhxanlMOHduZ1liVjhQb09NSEx0djNPb0xOeVp5NUZOYVJlRjNYcE5sOHZJdGxYcDhYZUxRPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLopqrmsLTlhazlnJLmqJPkuK3mqJNcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi4oCdMS7mqJPkuK3mqJMu5pmv6KeA5L2zLjIu5aSn6Zyy5Y+wLua0u+WLleepuumWky4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi5LiA44CBUjIx6YO95pyD5YWs5ZyS56uZ6LWw6LevMeWIhumQmFxcclxcbuS6jOOAgembmemZveWPsO+8jOmAmumiqOa2vOeIve+8jOaOoeWFieS9s1xcclxcbuS4ieOAgeWkp+WupOWFp+epuumWk++8jOato+Wbm+aIv++8jOe1leeEoeWwj+aIv+mWk1xcclxcbuWbm+OAgeecgemBkyDmjbfpgYsg54Gr6LuK56uZIOWFrOi7iuerme+8jOS6pOmAmuaWueS+v1wiLFxuICAgICAgICAgICAgICAgIFwiZXh0cmFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmsxXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9CdXlpbmdIb3VzZS9pbmRleC5hc3B4P3NlYXJjaHR5cGU9MSZjb3VudHlpZD0xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyZWFcIjogXCIzOS41N1wiLFxuICAgICAgICAgICAgICAgICAgICBcInBhdHRlcm5cIjogXCItLVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlZ2lvblwiOiBcIumrmOmbhOW4gualoOaik+WNgFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmsyXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JleVwiOiBcIjPmqJMvMTHmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjIw5bm0M+WAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTcyOTM5XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjQ4OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85NzI5MzlcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5qOu5rOz5aSn5ZywMyDimIXimIUg6auY6ZuE5qWg5qKT5pyA5qOS5ZyY6ZqK4piF4piFXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTcyOTM5XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoMy5nZ3BodC5jb20vZjUyVExONTNibWQ2VUVuMHRBY1RHT2VCVEFoT2ExdlpZMUhrOXg1ZHNFcHRzVVNSQnNINVpJVE1WeDQxNklobXh1dFd6M19EZXNNaWdUZGJzUkdiRnc4PXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmo67ms7PlpKflnLAzIOKYheKYhSDpq5jpm4TmpaDmopPmnIDmo5LlnJjpmorimIXimIVcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi5LiA44CBUjIx6YO95pyD5YWs5ZyS56uZ6LWw6LevMeWIhumQmFxcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi5LiA44CB5pa55q2j5qC85bGA44CB5YmN5b6M6Zm95Y+wXFxyXFxu5LqM44CB5o6h5YWJ5L2z44CB6KaW6YeO5L2z44CB5YuV6Led5aSnXFxyXFxu5LiJ44CB6KGb5rW06ZaL56qX77yM5LiJ6Z2i5o6h5YWJXFxyXFxu5Zub44CB5YWo5paw5LiJ5oi/6LuK5L2N77yM5ZCI55CG5YO55LiA5bm05bGLXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjM2Ljk1XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5qWg5qKT5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiMTLmqJMvMTXmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjDlubQ35YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5ODEwNzNcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiNjY26JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJOb25lXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzk4MTA3Mz9jdHlwZT1CJmNpZD10YWd0b28mb2lkPTImXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuWbm+Wto+mmmemgjDEyIOKYheKYhSDpq5jpm4TmpaDmopPmnIDmo5LlnJjpmorimIXimIVcIixcbiAgICAgICAgICAgICAgICBcImVjX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInByb2R1Y3Rfa2V5XCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5ODEwNzNcIixcbiAgICAgICAgICAgICAgICBcImltYWdlX3VybFwiOiBcIi8vbGg1LmdncGh0LmNvbS9PWGlwbFpQLU9rRUd3UjZrUGNNYmNjUEJLVjM3aUU0SXNiLWZvMlgweGowdUlmRFNJd1lFTjJ6ODQ5dDNvVHc4TlY4SGhRVWFHZ2ZONlBMaWM4VUI1a289czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuWbm+Wto+mmmemgjDEyIOKYheKYhSDpq5jpm4TmpaDmopPmnIDmo5LlnJjpmorimIXimIVcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi5LiA44CB5pa55q2j5qC85bGA44CB5YmN5b6M6Zm95Y+wXFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJSMjHpg73mnIPlhazlnJLnq5kg6LWw6LevMeWIhumQmFxcclxcbumbmemZveWPsCDpgJrpoqjmtrzniL0g5o6h5YWJ5L2zXFxyXFxu5aSn5a6k5YWn56m66ZaTIOato+Wbm+aIv1xcclxcbuecgemBk+aNt+mBi+eBq+i7iuermSDkuqTpgJrmlrnkvr9cIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiMzkuNTdcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILmpaDmopPljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCIz5qiTLzEx5qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIyMOW5tDPlgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk3Mzc1MVwiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCI0ODjokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTczNzUxXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuajruazs+Wkp+WcsDMt6auY6ZuE5qWg5qKT5pyA5qOS5ZyY6ZqKXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTczNzUxXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNS5nZ3BodC5jb20vNHFkTFo3YkVoMl9fMzFELUU2eVRhT19yaXZmdW83WHZqTzFaZzlaTDZaUkNfTU90SUNpUGczNllDWjdJUGtVUkZib3hVMU9KcnpkNDhGSkxiYzJ6elg4PXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmo67ms7PlpKflnLAzLemrmOmbhOaloOaik+acgOajkuWcmOmailwiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCJSMjHpg73mnIPlhazlnJLnq5kg6LWw6LevMeWIhumQmFxcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiMS7ov5Hnp5Hlt6XppKgu6auY5oeJ5aSnXFxyXFxuMi7ovJXou4zlnKjpmYTov5FcXHJcXG4zLuWxi+azgeWlveaOoeWFieS9s1xcclxcbjQu5Y+v55W255Sf5aWX5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjEwLjQyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5LiJ5rCR5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiN+aoky8xMOaok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMzTlubQ25YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5ODUxMzFcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiMTU26JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJOb25lXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzk4NTEzMT9jdHlwZT1CJmNpZD10YWd0b28mb2lkPTImJmN0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiZcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi6auY5oeJ5aSn5ryC5Lqu5aWX5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTg1MTMxXCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNC5nZ3BodC5jb20vSjRzNlhXZUtNT3dOY1ZNTmpmaHVNcVZLOWs2TEFpRkp3azhDZmNOMk8xQWdZVXROa1htQzRHVER1cDhGV05ybTNRTEdwVEZEdlFtbEliMlRxbzZoWG5rPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLpq5jmh4nlpKfmvILkuq7lpZfmiL9cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwiMS7ov5Hnp5Hlt6XppKgu6auY5oeJ5aSnXFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLkuIDjgIHou43moKHot6/kuLvlubnpgZPnmoTpq5jpm4TpioDooYzmqJPkuIpcXHJcXG7kuozjgIHkv53lhajlkajlr4Yu55uj6KaW5a6J5YWoLuS9jz/np4HmnInlgZzmqZ/ou4rkvY1cXHJcXG7kuInjgIHlj7PmmIzmnIDnhrHprKfnmoTllYblnIgubS7lsI/ljJcu6YqA6KGMLuWFrOi7ilxcclxcbuWbm+OAgemrmOaok+WxpOWPr+ecuuacm+i7jeWNgC7lpJXpmb3nvo7mma8u5aSc56m65pif5YWJXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjEzLjA2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5qWg5qKT5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiN+aoky835qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIyMuW5tDEw5YCL5pyIXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiaXRlbV9oYXNoXCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5NjMwNzZcIixcbiAgICAgICAgICAgICAgICBcInByaWNlXCI6IFwiMTkw6JCsXCIsXG4gICAgICAgICAgICAgICAgXCJhZHZlcnRpc2VyX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInJlbGF0ZWRfYWRzXCI6IFtdLFxuICAgICAgICAgICAgICAgIFwic3RvcmVfcHJpY2VcIjogXCJOb25lXCIsXG4gICAgICAgICAgICAgICAgXCJleHBpcmVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0hvdXNlLzk2MzA3Nj9jdHlwZT1CJmNpZD10YWd0b28mb2lkPTImJmN0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiZcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi6LuN5qCh5aSn5aWX5oi/IOKYheKYhSDpq5jpm4TmpaDmopPmnIDmo5LlnJjpmorimIXimIVcIixcbiAgICAgICAgICAgICAgICBcImVjX2lkXCI6IDEwMCxcbiAgICAgICAgICAgICAgICBcInByb2R1Y3Rfa2V5XCI6IFwiZ2Vvc3VuLWN0aG91c2U6cHJvZHVjdDo5NjMwNzZcIixcbiAgICAgICAgICAgICAgICBcImltYWdlX3VybFwiOiBcIi8vbGg1LmdncGh0LmNvbS9tRHVMUmFDRG9HQmNVN0dtWXN0X2JHbzNZbE9NRW5XMEVOYjQ3YzJkMGhTWW9Tb0UyTDZlZkxsbldSeEU1VURZaEwtZjM1VkE1TXVpckZSa29fNXlHVFE9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIui7jeagoeWkp+Wll+aIvyDimIXimIUg6auY6ZuE5qWg5qKT5pyA5qOS5ZyY6ZqK4piF4piFXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIuS4gOOAgei7jeagoei3r+S4u+W5uemBk+eahOmrmOmbhOmKgOihjOaok+S4ilxcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiMS7lrqTlhafnqbrplpPlpKfvvIzmjqHlhYnpgJrpoqjlpb1cXHJcXG4yLuWHuumWgOays+WgpOe2oOW4tuWFrOWcku+8jOmBi+WLleOAgeS8kemWkuWlveWOu+iZlVxcclxcbjMu5L2N6KOV6Kqg44CB5rKz5aCk5ZWG5ZyI77yM55Sf5rS75qmf6IO95L2zXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjQ2LjY3XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5LiJ5rCR5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiOOaoky8xNOaok1wiLFxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIjogXCJhdXRvOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYWdlXCI6IFwiMTflubQxMOWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTgxNzQ0XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjgyOOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85ODE3NDRcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5rKz5aCk5YWs5ZyS5Zub5oi/K+i7iuS9jVwiLFxuICAgICAgICAgICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk4MTc0NFwiLFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDYuZ2dwaHQuY29tLzQ1ODljMEpMNlhkNF83UV91cGNSMU84TDFkZGlTR0VZMC1MR1d2NUNvaGRzVDNmZDM4WFNqNDBaWW1jTHBuMzI1eDMzUl9wM0FNRHlMaFNQbU11Y3lnPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLmsrPloKTlhazlnJLlm5vmiL8r6LuK5L2NXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIjEu5a6k5YWn56m66ZaT5aSn77yM5o6h5YWJ6YCa6aKo5aW9XFxyXFxuLi4uKOabtOWkmilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCIxLumbmeaNt+mBi++8jOWkp+adsVZT6bOz5bGx5ZyL5Lit56uZ77yM5Lqk6YCa5L6/5Yip77yM6L+R5aSn5p2x6Jed6KGT5paH5YyW5Lit5b+D77yM5YWs5ZyS77yM5a245qCh5peBXFxyXFxuMi7phLDlgrPntbHlt7/loLTvvIzpnZLlubTlpJzlt7/vvIzotoXllYbos6PloLTvvIznlJ/mtLvmjqHosrfotoXmlrnkvr9cIixcbiAgICAgICAgICAgICAgICBcImV4dHJhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMVwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvQnV5aW5nSG91c2UvaW5kZXguYXNweD9zZWFyY2h0eXBlPTEmY291bnR5aWQ9MThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhcmVhXCI6IFwiNDEuOTVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXR0ZXJuXCI6IFwiLS1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdpb25cIjogXCLpq5jpm4TluILps7PlsbHljYBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5rMlwiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yZXlcIjogXCIz5qiTLzEz5qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIxOOW5tDXlgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk2NTI5MVwiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCI3NjjokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTY1MjkxXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIuiHs+WWhOWkqeS4i+e+juWbm+aIv1wiLFxuICAgICAgICAgICAgICAgIFwiZWNfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9rZXlcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk2NTI5MVwiLFxuICAgICAgICAgICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwiLy9saDYuZ2dwaHQuY29tLzBNOHdCa3ZBQ3R3U0VkRWtaVm9PeTFWakZoOWp6R1E2ZlVFY3F0czBWajd3b0NhQS1udkpia0pBYlBQOWoyUDFXSzVmbml6ZlRNSERVdmRoamRURjZuQT1zMjAwLWNcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlX3Nob3J0XCI6IFwi6Iez5ZaE5aSp5LiL576O5Zub5oi/XCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvbl9zaG9ydFwiOiBcIjEu6ZuZ5o236YGL77yM5aSn5p2xVlPps7PlsbHlnIvkuK3nq5nvvIzkuqTpgJrkvr/liKkuLi4o5pu05aSaKVwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIjEu6L+R5ZyL6YGT6auY6YCf5YWs6LevLuWPijg45b+r6YCfXFxyXFxuICDpgZPot68u5Lqk6YCa5pa55L6/LlxcclxcbjIu5qC85bGA5pa55q2jLuaOoeWFiemAmumiqOWlvS5cXHJcXG4zLuWxi+azgeS9sy7ljbPlj6/lhaXkvY8uXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjMyLjQ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5aSn5a+u5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiMTLmqJMvMTfmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjE25bm0OeWAi+aciFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIml0ZW1faGFzaFwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTY1OTM3XCIsXG4gICAgICAgICAgICAgICAgXCJwcmljZVwiOiBcIjI5OOiQrFwiLFxuICAgICAgICAgICAgICAgIFwiYWR2ZXJ0aXNlcl9pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJyZWxhdGVkX2Fkc1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcInN0b3JlX3ByaWNlXCI6IFwiTm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwaXJlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgXCJsaW5rXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy9Ib3VzZS85NjU5MzdcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5aSn5a+u5q2h5Zac6Y6u5pmv6KeA576O5aSn5qiTXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTY1OTM3XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNS5nZ3BodC5jb20va09IX3dLZjJvRHhIUmx5NGV0NnhvOE9yV3VrcEd3c1YzX0hYakwyS3BvUDRjTUZJdFVISUd0dHBTTGhYcGtHRnZkVDExam16bUFHbWJMdTEwNnNjR2c9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuWkp+WvruatoeWWnOmOruaZr+ingOe+juWkp+aok1wiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCIxLui/keWci+mBk+mrmOmAn+WFrOi3ry7lj4o4OOW/q+mAn1xcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwi5YWN5pW055CG44CB5bGL5rOB5pyJ5aSg5qOSXFxyXFxu6L+R5a245Y2A44CB55Sf5rS75qmf6IO95L2zXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjM4LjkwXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5bCP5riv5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiNOaoky825qiTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm9vdFwiOiBcImF1dG86Ly93d3cuY3Rob3VzZS5jb20udHcvUHJpY2VSZWR1Y3Rpb24vMThcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhZ2VcIjogXCIyMuW5tDPlgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk2MzM1NFwiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCIzNjjokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTYzMzU0P2N0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiZcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi5p6X5p6X5ZyL5bCP5ryC5Lqu5LiJ5oi/77yM6YCB5bmz6LuKXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTYzMzU0XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoNi5nZ3BodC5jb20vQW9VUTVnVGhsdC1JZlJwZkNJQmRnUlJIUFRZT3ZGQjZhbWhnazNZN3o0dlNjZ241bFoxSlNrSjNLcDJISjJzc2gyUjBCdXFnYUxmR2FKMlJVbEhTRXc9czIwMC1jXCIsXG4gICAgICAgICAgICAgICAgXCJ0aXRsZV9zaG9ydFwiOiBcIuael+ael+Wci+Wwj+a8guS6ruS4ieaIv++8jOmAgeW5s+i7ilwiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25fc2hvcnRcIjogXCLlhY3mlbTnkIbjgIHlsYvms4HmnInlpKDmo5JcXHJcXG7ov5HlrbjljYDjgIHnlJ/mtLvmqZ/og73kvbNcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCLmoLzlsYDmjqHlhYnkvbMg5Y+v55y65pyb576O5pmvXFxyXFxu5qWg5qKT5pyA54ax6ayn5Y2A5q61XFxyXFxu6L+R5o236YGL56uZIFxcclxcbuW+t+izouWVhuWciCDnlJ/mtLvmqZ/og73kvbNcXHJcXG7ov5Hmtbfnp5HlpKcg5aW95Ye656efXCIsXG4gICAgICAgICAgICAgICAgXCJleHRyYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwibGluazFcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L0J1eWluZ0hvdXNlL2luZGV4LmFzcHg/c2VhcmNodHlwZT0xJmNvdW50eWlkPTE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXJlYVwiOiBcIjQwLjEyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGF0dGVyblwiOiBcIi0tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnaW9uXCI6IFwi6auY6ZuE5biC5qWg5qKT5Y2AXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluazJcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1ByaWNlUmVkdWN0aW9uLzE4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmV5XCI6IFwiMTfmqJMvMTnmqJNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb290XCI6IFwiYXV0bzovL3d3dy5jdGhvdXNlLmNvbS50dy9QcmljZVJlZHVjdGlvbi8xOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFnZVwiOiBcIjE45bm0MTDlgIvmnIhcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJnZW9zdW4tY3Rob3VzZTpwcm9kdWN0Ojk1NjU3OFwiLFxuICAgICAgICAgICAgICAgIFwicHJpY2VcIjogXCI0NjDokKxcIixcbiAgICAgICAgICAgICAgICBcImFkdmVydGlzZXJfaWRcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwicmVsYXRlZF9hZHNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJzdG9yZV9wcmljZVwiOiBcIk5vbmVcIixcbiAgICAgICAgICAgICAgICBcImV4cGlyZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuY3Rob3VzZS5jb20udHcvSG91c2UvOTU2NTc4P2N0eXBlPUImY2lkPXRhZ3RvbyZvaWQ9MiZcIixcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwi576O6bqX5ZyLMTct6auY6ZuE5qWg5qKT5pyA5qOS5ZyY6ZqKXCIsXG4gICAgICAgICAgICAgICAgXCJlY19pZFwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2tleVwiOiBcImdlb3N1bi1jdGhvdXNlOnByb2R1Y3Q6OTU2NTc4XCIsXG4gICAgICAgICAgICAgICAgXCJpbWFnZV91cmxcIjogXCIvL2xoMy5nZ3BodC5jb20vczNlc0dnRFA0b19pWUVma2JJV3hvUk9XVGwwU0VKSmtEVWZZcjhzRVZRV095Ui1pVDgwejJQY0xoOUFzV0xRWUpRUS1CRGRHMW9UWE03R05ZMVVrdkRBPXMyMDAtY1wiLFxuICAgICAgICAgICAgICAgIFwidGl0bGVfc2hvcnRcIjogXCLnvo7pupflnIsxNy3pq5jpm4TmpaDmopPmnIDmo5LlnJjpmopcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uX3Nob3J0XCI6IFwi5qC85bGA5o6h5YWJ5L2zIOWPr+ecuuacm+e+juaZr1xcclxcbi4uLijmm7TlpJopXCJcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgXCJsb2dvX2xpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L1wiLFxuICAgICAgICAgICAgXCJiZ2NvbG9yXCI6IFwiI2Y0NTcyY1wiLFxuICAgICAgICAgICAgXCJsb2dvX3VybFwiOiBcImh0dHA6Ly9saDMuZ2dwaHQuY29tL2VGMTA5Um9yd1RjMEl6NHd6aFhWRGNoZTA4c3ZxaDE4UXlBWkpWblBJZkNOZGtMbEFhZTFXbXRHb01iemdya3JOREw0eGNaU2ozdGJtUHpMbjhnLWx3XCIsXG4gICAgICAgICAgICBcInFtXCI6IFwiSG90XCJcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXCJiYW5uZXJcIjoge1xuICAgICAgICBcImltYWdlX3VybFwiOiBcInVybCgnLy9saDMuZ2dwaHQuY29tL2dkQnJ0aDM0ZDBUbnphTHQzd3hjaTZkRHZZZTBuMjFVQWJPSXdOQ2NWSjQtSURCQ0FmRlk0bzZ6X2FkY01RMHp6aTBBZkZrZmNrdGJ0djU2RWdVQkNZT1AnKSBuby1yZXBlYXQgNTAlIDUwJVwiLFxuICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmN0aG91c2UuY29tLnR3L2V2ZW50LzEwMy9hcGx1cy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmJhbm5lclwiLFxuICAgICAgICBcIml0ZW1faGFzaFwiOiBcImN0aG91c2VfYmFubmVyXCIsXG4gICAgICAgIFwidGl0bGVcIjogXCJjdGhvdXNlX2Jhbm5lclwiLFxuICAgICAgICBcInFtXCI6IFwiY3Rob3VzZV9iYW5uZXJcIixcbiAgICAgICAgXCJxcFwiOiBcImN0aG91c2VfYmFubmVyXCJcbiAgICB9LFxuICAgIFwibG9nb1wiOiB7XG4gICAgICAgIFwiaW1hZ2VfdXJsXCI6IFwidXJsKCcvL2xoNC5nZ3BodC5jb20vWjhJdEpGWkY4dGJqellNc1JNcGUxaDd0UDN6MGdyQ1pYUVczVWdqSlo4QTBmTFFJdzZkNkhhXzVjaDBKdVpsWTV0UC1pbDhVcG5zb3VkQTdFSTB2QncnKVwiLFxuICAgICAgICBcImxpbmtcIjogXCIvL3d3dy5jdGhvdXNlLmNvbS50dy8/Y3R5cGU9QiZjaWQ9dGFndG9vJmxvZ29cIixcbiAgICAgICAgXCJpdGVtX2hhc2hcIjogXCJjdGhvdXNlX2xvZ29cIixcbiAgICAgICAgXCJ0aXRsZVwiOiBcImN0aG91c2VfbG9nb1wiLFxuICAgICAgICBcInFtXCI6IFwiY3Rob3VzZV9sb2dvXCIsXG4gICAgICAgIFwicXBcIjogXCJjdGhvdXNlX2xvZ29cIlxuICAgIH0sXG4gICAgXCJiYWNrZ3JvdW5kXCI6IHtcbiAgICAgICAgXCJpbWFnZV91cmxcIjogXCJcIixcbiAgICAgICAgXCJsaW5rXCI6IFwiXCIsXG4gICAgICAgIFwiYmFja2dyb3VuZFwiOiBcIiNlYmViZWIgdXJsKCcvL2xoNS5nZ3BodC5jb20vQzg0UE5iVlJ3NEVvcHJJVUxWZTQzWnhjaDFQMWJnQ2lUa2J2cnpUWHZyZDB4b1FUTlp0Q19udGNBaVB5NU1jeFZBd29nLWR3ckl5R1lreHkwc1BaQ2lzJylcIixcbiAgICAgICAgXCJ0aXRsZVwiOiBcImN0aG91c2VcIlxuICAgIH0sXG4gICAgXCJwXCI6IFwiaHR0cDovL3d3dy5jdGhvdXNlLmNvbS50dy8mZGVidWc9dHJ1ZVwiLFxuICAgIFwiZWNJZFwiOiAxMDBcbn1cbm1vZHVsZS5leHBvcnRzID0gcmVzcG9uc2U7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKiDpgJnmmK8gcm9vdCB2aWV377yM5Lmf56ix54K6IGNvbnRyb2xsZXItdmlld1xuICovXG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vXG4vLyBpbXBvcnQgXG5cbi8vIHZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBUb3BCb3ggPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL1RvcEJveC5qc3gnKSApO1xudmFyIEJvdHRvbUJveCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vQm90dG9tQm94LmpzeCcpICk7XG52YXIgRm9vdGVyID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9Gb290ZXIuanN4JykgKTtcblxudmFyIFRvZG9TdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9Ub2RvU3RvcmUnKTtcbnZhciBBcHBDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXBwQ29uc3RhbnRzJyk7XG5cbnZhciBpZFJlc2l6ZTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEFkV2FsbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FkV2FsbCcsXG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vXG4gICAgLy8gbW91bnRcbiAgICBcbiAgICAvKipcbiAgICAgKiDpgJnmmK8gY29tcG9uZW50IEFQSSwg5ZyoIG1vdW50IOWJjeacg+i3keS4gOasoe+8jOWPluWAvOWBmueCuiB0aGlzLnN0YXRlIOeahOmgkOioreWAvFxuICAgICAqL1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5nZXRUcnV0aCgpOyAgLy8ge30gLT4gdGhpcy5zdGF0ZVxuICAgICAgICBvLnNjcmVlblNpemUgPSAndGFibGV0J1xuICAgICAgICByZXR1cm4gbztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Li756iL5byP6YCy5YWl6bueXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVG9kb1N0b3JlLmFkZExpc3RlbmVyKCBBcHBDb25zdGFudHMuQ0hBTkdFX0VWRU5ULCB0aGlzLl9vbkNoYW5nZSApO1xuXG4gICAgICAgIC8vIOimgeeUqCBpbnRlcnZhbCDmk4vkuIDkuItcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuaGFuZGxlUmVzaXplICk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVzaXplOiBmdW5jdGlvbihldnQpe1xuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCggaWRSZXNpemUgKTtcblxuICAgICAgICBpZFJlc2l6ZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgICAgICAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2YXIgc2l6ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQHRvZG86IOaUueWbniAxMDI0XG4gICAgICAgICAgICBpZihib2R5LnNjcm9sbFdpZHRoID4gNzIwKXtcbiAgICAgICAgICAgICAgICBzaXplID0gJ2Rlc2t0b3AnO1xuICAgICAgICAgICAgfWVsc2UgaWYoYm9keS5zY3JvbGxXaWR0aCA+IDQ4MCl7XG4gICAgICAgICAgICAgICAgc2l6ZSA9ICd0YWJsZXQnO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgc2l6ZSA9ICdwaG9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAncmVzaXplOiAnLCBib2R5LnNjcm9sbFdpZHRoLCBib2R5LnNjcm9sbEhlaWdodCwgJyA+c2l6ZTogJywgc2l6ZSApO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzY3JlZW5TaXplOiBzaXplfSk7XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKVxuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOmHjeimge+8mnJvb3QgdmlldyDlu7rnq4vlvoznrKzkuIDku7bkuovvvIzlsLHmmK/lgbXogb0gc3RvcmUg55qEIGNoYW5nZSDkuovku7ZcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vXG4gICAgfSwgIFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIHVubW91bnRcblxuICAgIC8qKlxuICAgICAqIOWFg+S7tuWwh+W+nueVq+mdouS4iuenu+mZpOaZgu+8jOimgeWBmuWWhOW+jOW3peS9nFxuICAgICAqL1xuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgVG9kb1N0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKCB0aGlzLl9vbkNoYW5nZSApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9cbiAgICB9LFxuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvL1xuICAgIC8vIHVwZGF0ZVxuXG4gICAgLyoqXG4gICAgICog5ZyoIHJlbmRlcigpIOWJjeWft+ihjO+8jOacieapn+acg+WPr+WFiOiZleeQhiBwcm9wcyDlvoznlKggc2V0U3RhdGUoKSDlrZjotbfkvoZcbiAgICAgKi9cbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcbiAgICAgICAgLy9cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8g6YCZ5pmC5bey5LiN5Y+v55SoIHNldFN0YXRlKClcbiAgICBjb21wb25lbnRXaWxsVXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgfSxcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy9cbiAgICAvLyByZW5kZXJcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLnN0YXRlLnNjcmVlblNpemU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCAnc2l6ZTogJywgc2l6ZSApO1xuXG4gICAgICAgIGlmKCBzaXplID09ICdwaG9uZScgKXtcblxuICAgICAgICAgICAgLy8gcGhvbmVcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImJhY2tncm91bmRcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwid3JhcGVyXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFRvcEJveCh7dHJ1dGg6IHRoaXMuc3RhdGV9KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBCb3R0b21Cb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgRm9vdGVyKG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcblxuICAgICAgICB9ZWxzZSBpZiggc2l6ZSA9PSAndGFibGV0Jyl7XG5cbiAgICAgICAgICAgIC8vIHRhYmxldFxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFja2dyb3VuZFwifSwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ3cmFwZXJcIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgVG9wQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEJvdHRvbUJveCh7dHJ1dGg6IHRoaXMuc3RhdGV9KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBGb290ZXIobnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICBcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvLyBkZXNrdG9wXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJiYWNrZ3JvdW5kXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIndyYXBlclwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BCb3goe3RydXRoOiB0aGlzLnN0YXRlfSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgQm90dG9tQm94KHt0cnV0aDogdGhpcy5zdGF0ZX0pLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZvb3RlcihudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICB9LFxuXG5cblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy9cbiAgICAvLyBwcml2YXRlIG1ldGhvZHMgLSDomZXnkIblhYPku7blhafpg6jnmoTkuovku7ZcblxuICAgIC8qKlxuICAgICAqIGNvbnRyb2xsZXItdmlldyDlgbXogb3liLAgbW9kZWwgY2hhbmdlIOW+jFxuICAgICAqIOWft+ihjOmAmeaUr++8jOWug+aTjeS9nOWPpuS4gOaUryBwcml2YXRlIG1ldGhvZCDljrvot58gbW9kZWwg5Y+W5pyA5paw5YC8XG4gICAgICog54S25b6M5pON5L2cIGNvbXBvbmVudCBsaWZlIGN5Y2xlIOeahCBzZXRTdGF0ZSgpIOWwh+aWsOWAvOeBjOWFpeWFg+S7tumrlOezu1xuICAgICAqIOWwseacg+inuOeZvOS4gOmAo+S4siBjaGlsZCBjb21wb25lbnRzIOi3n+iRl+mHjee5qlxuICAgICAqL1xuICAgIF9vbkNoYW5nZTogZnVuY3Rpb24oKXtcbiAgICAgICAgLy8g6YeN6KaB77ya5b6eIHJvb3QgdmlldyDop7jnmbzmiYDmnIkgc3ViLXZpZXcg6YeN57mqXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoIHRoaXMuZ2V0VHJ1dGgoKSApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDngrrkvZXopoHnjajnq4vlr6vkuIDmlK/vvJ/lm6DngrrmnIPmnInlhanlgIvlnLDmlrnmnIPnlKjliLDvvIzlm6DmraTmir3lh7rkvoZcbiAgICAgKiDnm67lnLDvvJrlkJHlkITlgIsgc3RvcmUg5Y+W5Zue6LOH5paZ77yM54S25b6M57Wx5LiAIHNldFN0YXRlKCkg5YaN5LiA5bGk5bGk5b6A5LiL5YKz6YGeXG4gICAgICovXG4gICAgZ2V0VHJ1dGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmmK/lvp4gVG9kb1N0b3JlIOWPluizh+aWmShhcyB0aGUgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aClcbiAgICAgICAgcmV0dXJuIFRvZG9TdG9yZS5nZXRBbGwoKTtcbiAgICB9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWRXYWxsO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG4vKipcbiAqIFxuICovXG52YXIgQmFubmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQmFubmVyJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgICB2YXIgZGl2U3R5bGUgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UuYmFubmVyLmltYWdlX3VybFxuICAgIH1cbiAgICBcbiAgXHRyZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwidG9wLWJveC1yaWdodFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFubmVyXCIsIHN0eWxlOiBkaXZTdHlsZX0pXG4gICAgICAgIClcbiAgICApO1xuICB9LFxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbm5lcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIE1vcmUgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL01vcmUuanN4JykgKTtcbnZhciBQcmV2ID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9QcmV2LmpzeCcpICk7XG52YXIgTmV4dCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoIHJlcXVpcmUoJy4vTmV4dC5qc3gnKSApO1xudmFyIEl0ZW1MaXN0ID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9JdGVtTGlzdC5qc3gnKSApO1xuLyoqXG4gKiBcbiAqL1xudmFyIEJvdHRvbUJveCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0JvdHRvbUJveCcsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYm90dG9tLWJveFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtpZDogXCJyb3dfMVwiLCBjbGFzc05hbWU6IFwiZXZlblwifSwgXG4gICAgICAgICAgICAgICAgTW9yZSh7bGluazogdGhpcy5wcm9wcy50cnV0aC5yZXNwb25zZS5pdGVtTGlzdC5yb3dfMS5hZFswXS5leHRyYS5saW5rMX0pLCBcbiAgICAgICAgICAgICAgICBQcmV2KHtvbkNsaWNrOiB0aGlzLmhhbmRsZUxlZnRBcnJvd0NsaWNrLmJpbmQodGhpcywgXCJyb3dfMVwiLCB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLml0ZW1MaXN0LnJvd18xLmFkKX0pLCBcbiAgICAgICAgICAgICAgICBJdGVtTGlzdCh7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UuaXRlbUxpc3Qucm93XzF9KSwgXG4gICAgICAgICAgICAgICAgTmV4dCh7b25DbGljazogdGhpcy5oYW5kbGVSaWdodEFycm93Q2xpY2suYmluZCh0aGlzLCBcInJvd18xXCIsIHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UuaXRlbUxpc3Qucm93XzEuYWQpfSlcbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7aWQ6IFwicm93XzJcIiwgY2xhc3NOYW1lOiBcImV2ZW5cIn0sIFxuICAgICAgICAgICAgICAgIE1vcmUoe2xpbms6IHRoaXMucHJvcHMudHJ1dGgucmVzcG9uc2UuaXRlbUxpc3Qucm93XzIuYWRbMF0uZXh0cmEubGluazF9KSwgXG4gICAgICAgICAgICAgICAgUHJldih7b25DbGljazogdGhpcy5oYW5kbGVMZWZ0QXJyb3dDbGljay5iaW5kKHRoaXMsIFwicm93XzJcIiwgdGhpcy5wcm9wcy50cnV0aC5yZXNwb25zZS5pdGVtTGlzdC5yb3dfMi5hZCl9KSwgXG4gICAgICAgICAgICAgICAgSXRlbUxpc3Qoe3RydXRoOiB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLml0ZW1MaXN0LnJvd18yfSksIFxuICAgICAgICAgICAgICAgIE5leHQoe29uQ2xpY2s6IHRoaXMuaGFuZGxlUmlnaHRBcnJvd0NsaWNrLmJpbmQodGhpcywgXCJyb3dfMlwiLCB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLml0ZW1MaXN0LnJvd18yLmFkKX0pXG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2lkOiBcInJvd18zXCIsIGNsYXNzTmFtZTogXCJldmVuXCJ9LCBcbiAgICAgICAgICAgICAgICBNb3JlKHtsaW5rOiB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLml0ZW1MaXN0LnJvd18zLmFkWzBdLmV4dHJhLmxpbmsxfSksIFxuICAgICAgICAgICAgICAgIEl0ZW1MaXN0KHt0cnV0aDogdGhpcy5wcm9wcy50cnV0aC5yZXNwb25zZS5pdGVtTGlzdC5yb3dfM30pXG4gICAgICAgICAgICApXG4gICAgICAgIClcbiAgXHQpO1xuICB9LFxuICBoYW5kbGVMZWZ0QXJyb3dDbGljazogZnVuY3Rpb24oa2V5LCBpdGVtTGlzdCkgey8v5YW25a+m5LiN55So5YKzaXRlbUxpc3Qs5Zug54K65pyJa2V55LqGXG4gICAgYWN0aW9ucy5TaGlmdExlZnQoa2V5LCBpdGVtTGlzdCk7XG4gIH0sXG4gIGhhbmRsZVJpZ2h0QXJyb3dDbGljazogZnVuY3Rpb24oa2V5LCBpdGVtTGlzdCkgey8v5YW25a+m5LiN55So5YKzaXRlbUxpc3Qs5Zug54K65pyJa2V55LqGXG4gICAgYWN0aW9ucy5TaGlmdFJpZ2h0KGtleSwgaXRlbUxpc3QpO1xuICB9XG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQm90dG9tQm94O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG4vKipcbiAqIFxuICovXG52YXIgRm9vdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRm9vdGVyJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICBcdHJldHVybiAgUmVhY3QuRE9NLmZvb3Rlcih7Y2xhc3NOYW1lOiBcImZvb3RlclwifSlcblxuICB9LFxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3RlcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJdGVtJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkZXRhaWwgPSB0aGlzLnByb3BzLmRldGFpbDtcbiAgICBcbiAgXHRyZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW1cIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtLXNsb2dhblwifSksIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtLWltZ1wifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uaW1nKHtzcmM6IGRldGFpbC5pbWFnZV91cmx9KVxuICAgICAgICAgICksIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtLXRpdGxlXCJ9LCBkZXRhaWwudGl0bGUpLCBcbiAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInJlZ2lvblwifSwgZGV0YWlsLmV4dHJhLnJlZ2lvbiksIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJhcmVhXCJ9LCBkZXRhaWwuZXh0cmEuYXJlYSwgXCLlnapcIiksIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtLW9mZmVyX3ByaWNlX3BsdXNcIn0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7Y2xhc3NOYW1lOiBcIm9mZmVyX3ByaWNlXCJ9LCBkZXRhaWwucHJpY2UpXG4gICAgICAgICAgKSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tbW9yZVwifSlcbiAgICAgICAgKVxuXG4gICAgKTtcbiAgfVxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG52YXIgY3ggPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQ7XG52YXIgSXRlbSA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9JdGVtLmpzeCcpKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIEl0ZW1MaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSXRlbUxpc3QnLFxuICAvKipcbiAgICogXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIC8vIOmAmeijj+S9v+eUqCByZWFjdCBjbGFzcyBhZGQtb24g5L6G5YiH5o+b5qij5byP6aGv56S6XG4gICAgLy8g6YCZ5qij5YGa5q+U6LyD5pyJ5qKd55CG77yM5q+U55u05o6l57WE5ZCI5aSa5YCL5a2X5Liy5L6G55qE5aW95o6n5Yi2ICBcbiAgICB2YXIgY2xhc3NlcyA9IGN4KHtcbiAgICAgICAgJ2xpc3QtaXRlbSc6IHRydWUsXG4gICAgfSk7XG4gICAgdmFyIEFkcyA9IHRoaXMucHJvcHMudHJ1dGguYWQ7XG5cbiAgICB2YXIgYXJyID0gQWRzLm1hcChmdW5jdGlvbihpdGVtLCBpbmRleCl7XG4gICAgICAgIHJldHVybiBJdGVtKHtrZXk6IGluZGV4LCBkZXRhaWw6IGl0ZW19KVxuICAgIH0sIHRoaXMpXG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbV9saXN0X3dyYXBlclwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00udWwoe2NsYXNzTmFtZTogXCJpdGVtX2xpc3RcIn0sIFxuICAgICAgICAgICAgICAgIGFyclxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgKVxuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1MaXN0OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIExvZ28gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMb2dvJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkaXZTdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZEltYWdlOiB0aGlzLnByb3BzLnRydXRoLnJlc3BvbnNlLmxvZ28uaW1hZ2VfdXJsXG4gICAgfVxuICAgIFxuICBcdHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ0b3AtYm94LWxlZnRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImxvZ29cIiwgc3R5bGU6IGRpdlN0eWxlfSlcbiAgICAgICAgKVxuICAgICk7XG4gIH0sXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTG9nbztcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIE1vcmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb3JlJyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgXHRyZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoe2NsYXNzTmFtZTogXCJtb3JlXCIsIGhyZWY6IHRoaXMucHJvcHMubGluaywgdGFyZ2V0OiBcIl9ibGFua1wifSlcbiAgICApO1xuICB9XG5cblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb3JlO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovLyoqXG4gKlxuICovXG52YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXBwQWN0aW9uQ3JlYXRvcicpO1xuXG4vKipcbiAqIFxuICovXG52YXIgTmV4dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05leHQnLFxuXG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFxuICBcdHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwibmV4dFwiLCBcbiAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30pXG4gICAgKTtcbiAgfVxuXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmV4dDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxuLyoqXG4gKiBcbiAqL1xudmFyIFByZXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcmV2JyxcblxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcbiAgXHRyZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInByZXZcIiwgXG4gICAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xpY2t9KVxuICAgICk7XG4gIH1cblxuXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByZXY7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi8vKipcbiAqXG4gKi9cbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9BcHBBY3Rpb25DcmVhdG9yJyk7XG5cbi8qKlxuICogXG4gKi9cbnZhciBTcGVjaWFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU3BlY2lhbCcsXG5cblxuICAvKipcbiAgICpcbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZpcnN0ID0gdGhpcy5wcm9wcy50cnV0aC5yZXNwb25zZS5maXJzdDtcbiAgXHRyZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwic3BlY2lhbFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwic3BlY2lhbC1pbWdcIn0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW1nKHtzcmM6IGZpcnN0LmltYWdlX3VybH0pXG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJzcGVjaWFsLXRleHRcIn0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInNwZWNpYWwtZGVzY3JpYmVcIn0sIGZpcnN0LnRpdGxlKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1yZWdpb25cIn0sIGZpcnN0LmV4dHJhLnJlZ2lvbiksIFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcInNwZWNpYWwtc3RvcmVfcHJpY2VcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLnuL3lg7nvvJpcIiksIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIGZpcnN0LnByaWNlKVxuICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAoe2NsYXNzTmFtZTogXCJzcGVjaWFsLWFyZWFcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtpZDogXCJsYWJlbFwifSwgXCLlnarmlbjvvJpcIiksIFxuICAgICAgICAgICAgICAgIGZpcnN0LmV4dHJhLmFyZWEsIFwi5Z2qXCJcbiAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1hcmVhXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7aWQ6IFwibGFiZWxcIn0sIFwi5bGL6b2h77yaXCIpLCBcbiAgICAgICAgICAgICAgICBmaXJzdC5leHRyYS5hZ2VcbiAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1hcmVhXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7aWQ6IFwibGFiZWxcIn0sIFwi5qiT5bGk77yaXCIpLCBcbiAgICAgICAgICAgICAgICBmaXJzdC5leHRyYS5zdG9yZXlcbiAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwic3BlY2lhbC1hcmVhXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7aWQ6IFwibGFiZWxcIn0sIFwi5qC85bGA77yaXCIpLCBcbiAgICAgICAgICAgICAgICBmaXJzdC5leHRyYS5wYXR0ZXJuXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInNwZWNpYWwtbW9yZVwifSlcbiAgICAgICAgKVxuICAgICk7XG4gIH0sXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3BlY2lhbDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqLy8qKlxuICpcbiAqL1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL0FwcEFjdGlvbkNyZWF0b3InKTtcblxudmFyIExvZ28gPSBSZWFjdC5jcmVhdGVGYWN0b3J5KCByZXF1aXJlKCcuL0xvZ28uanN4JykgKTtcbnZhciBTcGVjaWFsID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9TcGVjaWFsLmpzeCcpICk7XG52YXIgQmFubmVyID0gUmVhY3QuY3JlYXRlRmFjdG9yeSggcmVxdWlyZSgnLi9CYW5uZXIuanN4JykgKTtcbi8qKlxuICogXG4gKi9cbnZhciBUb3BCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUb3BCb3gnLFxuXG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInRvcC1ib3hcIn0sIFxuICAgICAgICAgICAgTG9nbyh7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGh9KSwgXG4gICAgICAgICAgICBTcGVjaWFsKHt0cnV0aDogdGhpcy5wcm9wcy50cnV0aH0pLCBcbiAgICAgICAgICAgIEJhbm5lcih7dHJ1dGg6IHRoaXMucHJvcHMudHJ1dGh9KVxuICAgICAgICApXG5cdCk7XG4gIH1cblxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3BCb3g7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFByb21pc2UgPSByZXF1aXJlKFwiLi9wcm9taXNlL3Byb21pc2VcIikuUHJvbWlzZTtcbnZhciBwb2x5ZmlsbCA9IHJlcXVpcmUoXCIuL3Byb21pc2UvcG9seWZpbGxcIikucG9seWZpbGw7XG5leHBvcnRzLlByb21pc2UgPSBQcm9taXNlO1xuZXhwb3J0cy5wb2x5ZmlsbCA9IHBvbHlmaWxsOyIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHRvU3RyaW5nICovXG5cbnZhciBpc0FycmF5ID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNBcnJheTtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcblxuLyoqXG4gIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIHRoZSBnaXZlbiBwcm9taXNlcyBoYXZlIGJlZW5cbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuIFRoZSByZXR1cm4gcHJvbWlzZVxuICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSB0aGF0IGdpdmVzIGFsbCB0aGUgdmFsdWVzIGluIHRoZSBvcmRlciB0aGV5IHdlcmVcbiAgcGFzc2VkIGluIHRoZSBgcHJvbWlzZXNgIGFycmF5IGFyZ3VtZW50LlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBSU1ZQLnJlc29sdmUoMSk7XG4gIHZhciBwcm9taXNlMiA9IFJTVlAucmVzb2x2ZSgyKTtcbiAgdmFyIHByb21pc2UzID0gUlNWUC5yZXNvbHZlKDMpO1xuICB2YXIgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBSU1ZQLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gVGhlIGFycmF5IGhlcmUgd291bGQgYmUgWyAxLCAyLCAzIF07XG4gIH0pO1xuICBgYGBcblxuICBJZiBhbnkgb2YgdGhlIGBwcm9taXNlc2AgZ2l2ZW4gdG8gYFJTVlAuYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gIHRoYXQgaXMgcmVqZWN0ZWQgd2lsbCBiZSBnaXZlbiBhcyBhbiBhcmd1bWVudCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZXMnc1xuICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIHZhciBwcm9taXNlMSA9IFJTVlAucmVzb2x2ZSgxKTtcbiAgdmFyIHByb21pc2UyID0gUlNWUC5yZWplY3QobmV3IEVycm9yKFwiMlwiKSk7XG4gIHZhciBwcm9taXNlMyA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcihcIjNcIikpO1xuICB2YXIgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBSU1ZQLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgYWxsXG4gIEBmb3IgUlNWUFxuICBAcGFyYW0ge0FycmF5fSBwcm9taXNlc1xuICBAcGFyYW0ge1N0cmluZ30gbGFiZWxcbiAgQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCBgcHJvbWlzZXNgIGhhdmUgYmVlblxuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC5cbiovXG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIGlmICghaXNBcnJheShwcm9taXNlcykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIGFsbC4nKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdLCByZW1haW5pbmcgPSBwcm9taXNlcy5sZW5ndGgsXG4gICAgcHJvbWlzZTtcblxuICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgIHJlc29sdmUoW10pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmVyKGluZGV4KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlQWxsKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmVzdWx0c1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvbWlzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlc1tpXTtcblxuICAgICAgaWYgKHByb21pc2UgJiYgaXNGdW5jdGlvbihwcm9taXNlLnRoZW4pKSB7XG4gICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlcihpKSwgcmVqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmVBbGwoaSwgcHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0cy5hbGwgPSBhbGw7IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBicm93c2VyR2xvYmFsID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHt9O1xudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbnZhciBsb2NhbCA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodGhpcyA9PT0gdW5kZWZpbmVkPyB3aW5kb3c6dGhpcyk7XG5cbi8vIG5vZGVcbmZ1bmN0aW9uIHVzZU5leHRUaWNrKCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gIHZhciBpdGVyYXRpb25zID0gMDtcbiAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWwuc2V0VGltZW91dChmbHVzaCwgMSk7XG4gIH07XG59XG5cbnZhciBxdWV1ZSA9IFtdO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdHVwbGUgPSBxdWV1ZVtpXTtcbiAgICB2YXIgY2FsbGJhY2sgPSB0dXBsZVswXSwgYXJnID0gdHVwbGVbMV07XG4gICAgY2FsbGJhY2soYXJnKTtcbiAgfVxuICBxdWV1ZSA9IFtdO1xufVxuXG52YXIgc2NoZWR1bGVGbHVzaDtcblxuLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbmlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VOZXh0VGljaygpO1xufSBlbHNlIGlmIChCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xufSBlbHNlIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gIHZhciBsZW5ndGggPSBxdWV1ZS5wdXNoKFtjYWxsYmFjaywgYXJnXSk7XG4gIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAvLyBJZiBsZW5ndGggaXMgMSwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgc2NoZWR1bGVGbHVzaCgpO1xuICB9XG59XG5cbmV4cG9ydHMuYXNhcCA9IGFzYXA7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIkZXYUFTSFwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAgYFJTVlAuUHJvbWlzZS5jYXN0YCByZXR1cm5zIHRoZSBzYW1lIHByb21pc2UgaWYgdGhhdCBwcm9taXNlIHNoYXJlcyBhIGNvbnN0cnVjdG9yXG4gIHdpdGggdGhlIHByb21pc2UgYmVpbmcgY2FzdGVkLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZSA9IFJTVlAucmVzb2x2ZSgxKTtcbiAgdmFyIGNhc3RlZCA9IFJTVlAuUHJvbWlzZS5jYXN0KHByb21pc2UpO1xuXG4gIGNvbnNvbGUubG9nKHByb21pc2UgPT09IGNhc3RlZCk7IC8vIHRydWVcbiAgYGBgXG5cbiAgSW4gdGhlIGNhc2Ugb2YgYSBwcm9taXNlIHdob3NlIGNvbnN0cnVjdG9yIGRvZXMgbm90IG1hdGNoLCBpdCBpcyBhc3NpbWlsYXRlZC5cbiAgVGhlIHJlc3VsdGluZyBwcm9taXNlIHdpbGwgZnVsZmlsbCBvciByZWplY3QgYmFzZWQgb24gdGhlIG91dGNvbWUgb2YgdGhlXG4gIHByb21pc2UgYmVpbmcgY2FzdGVkLlxuXG4gIEluIHRoZSBjYXNlIG9mIGEgbm9uLXByb21pc2UsIGEgcHJvbWlzZSB3aGljaCB3aWxsIGZ1bGZpbGwgd2l0aCB0aGF0IHZhbHVlIGlzXG4gIHJldHVybmVkLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgdmFsdWUgPSAxOyAvLyBjb3VsZCBiZSBhIG51bWJlciwgYm9vbGVhbiwgc3RyaW5nLCB1bmRlZmluZWQuLi5cbiAgdmFyIGNhc3RlZCA9IFJTVlAuUHJvbWlzZS5jYXN0KHZhbHVlKTtcblxuICBjb25zb2xlLmxvZyh2YWx1ZSA9PT0gY2FzdGVkKTsgLy8gZmFsc2VcbiAgY29uc29sZS5sb2coY2FzdGVkIGluc3RhbmNlb2YgUlNWUC5Qcm9taXNlKSAvLyB0cnVlXG5cbiAgY2FzdGVkLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgdmFsID09PSB2YWx1ZSAvLyA9PiB0cnVlXG4gIH0pO1xuICBgYGBcblxuICBgUlNWUC5Qcm9taXNlLmNhc3RgIGlzIHNpbWlsYXIgdG8gYFJTVlAucmVzb2x2ZWAsIGJ1dCBgUlNWUC5Qcm9taXNlLmNhc3RgIGRpZmZlcnMgaW4gdGhlXG4gIGZvbGxvd2luZyB3YXlzOlxuICAqIGBSU1ZQLlByb21pc2UuY2FzdGAgc2VydmVzIGFzIGEgbWVtb3J5LWVmZmljaWVudCB3YXkgb2YgZ2V0dGluZyBhIHByb21pc2UsIHdoZW4geW91XG4gIGhhdmUgc29tZXRoaW5nIHRoYXQgY291bGQgZWl0aGVyIGJlIGEgcHJvbWlzZSBvciBhIHZhbHVlLiBSU1ZQLnJlc29sdmVcbiAgd2lsbCBoYXZlIHRoZSBzYW1lIGVmZmVjdCBidXQgd2lsbCBjcmVhdGUgYSBuZXcgcHJvbWlzZSB3cmFwcGVyIGlmIHRoZVxuICBhcmd1bWVudCBpcyBhIHByb21pc2UuXG4gICogYFJTVlAuUHJvbWlzZS5jYXN0YCBpcyBhIHdheSBvZiBjYXN0aW5nIGluY29taW5nIHRoZW5hYmxlcyBvciBwcm9taXNlIHN1YmNsYXNzZXMgdG9cbiAgcHJvbWlzZXMgb2YgdGhlIGV4YWN0IGNsYXNzIHNwZWNpZmllZCwgc28gdGhhdCB0aGUgcmVzdWx0aW5nIG9iamVjdCdzIGB0aGVuYCBpc1xuICBlbnN1cmVkIHRvIGhhdmUgdGhlIGJlaGF2aW9yIG9mIHRoZSBjb25zdHJ1Y3RvciB5b3UgYXJlIGNhbGxpbmcgY2FzdCBvbiAoaS5lLiwgUlNWUC5Qcm9taXNlKS5cblxuICBAbWV0aG9kIGNhc3RcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgdG8gYmUgY2FzdGVkXG4gIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgcHJvcGVydGllcyBvZiBgcHJvbWlzZXNgXG4gIGhhdmUgYmVlbiBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC5cbiovXG5cblxuZnVuY3Rpb24gY2FzdChvYmplY3QpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IHRoaXMpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgcmVzb2x2ZShvYmplY3QpO1xuICB9KTtcbn1cblxuZXhwb3J0cy5jYXN0ID0gY2FzdDsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWcgPSB7XG4gIGluc3RydW1lbnQ6IGZhbHNlXG59O1xuXG5mdW5jdGlvbiBjb25maWd1cmUobmFtZSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25maWdbbmFtZV0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29uZmlnW25hbWVdO1xuICB9XG59XG5cbmV4cG9ydHMuY29uZmlnID0gY29uZmlnO1xuZXhwb3J0cy5jb25maWd1cmUgPSBjb25maWd1cmU7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG4vKmdsb2JhbCBzZWxmKi9cbnZhciBSU1ZQUHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2VcIikuUHJvbWlzZTtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gcG9seWZpbGwoKSB7XG4gIHZhciBsb2NhbDtcblxuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsb2NhbCA9IGdsb2JhbDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICBsb2NhbCA9IHdpbmRvdztcbiAgfSBlbHNlIHtcbiAgICBsb2NhbCA9IHNlbGY7XG4gIH1cblxuICB2YXIgZXM2UHJvbWlzZVN1cHBvcnQgPSBcbiAgICBcIlByb21pc2VcIiBpbiBsb2NhbCAmJlxuICAgIC8vIFNvbWUgb2YgdGhlc2UgbWV0aG9kcyBhcmUgbWlzc2luZyBmcm9tXG4gICAgLy8gRmlyZWZveC9DaHJvbWUgZXhwZXJpbWVudGFsIGltcGxlbWVudGF0aW9uc1xuICAgIFwiY2FzdFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJlc29sdmVcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgXCJyZWplY3RcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgXCJhbGxcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgXCJyYWNlXCIgaW4gbG9jYWwuUHJvbWlzZSAmJlxuICAgIC8vIE9sZGVyIHZlcnNpb24gb2YgdGhlIHNwZWMgaGFkIGEgcmVzb2x2ZXIgb2JqZWN0XG4gICAgLy8gYXMgdGhlIGFyZyByYXRoZXIgdGhhbiBhIGZ1bmN0aW9uXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlc29sdmU7XG4gICAgICBuZXcgbG9jYWwuUHJvbWlzZShmdW5jdGlvbihyKSB7IHJlc29sdmUgPSByOyB9KTtcbiAgICAgIHJldHVybiBpc0Z1bmN0aW9uKHJlc29sdmUpO1xuICAgIH0oKSk7XG5cbiAgaWYgKCFlczZQcm9taXNlU3VwcG9ydCkge1xuICAgIGxvY2FsLlByb21pc2UgPSBSU1ZQUHJvbWlzZTtcbiAgfVxufVxuXG5leHBvcnRzLnBvbHlmaWxsID0gcG9seWZpbGw7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKS5jb25maWc7XG52YXIgY29uZmlndXJlID0gcmVxdWlyZShcIi4vY29uZmlnXCIpLmNvbmZpZ3VyZTtcbnZhciBvYmplY3RPckZ1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikub2JqZWN0T3JGdW5jdGlvbjtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcbnZhciBub3cgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ub3c7XG52YXIgY2FzdCA9IHJlcXVpcmUoXCIuL2Nhc3RcIikuY2FzdDtcbnZhciBhbGwgPSByZXF1aXJlKFwiLi9hbGxcIikuYWxsO1xudmFyIHJhY2UgPSByZXF1aXJlKFwiLi9yYWNlXCIpLnJhY2U7XG52YXIgc3RhdGljUmVzb2x2ZSA9IHJlcXVpcmUoXCIuL3Jlc29sdmVcIikucmVzb2x2ZTtcbnZhciBzdGF0aWNSZWplY3QgPSByZXF1aXJlKFwiLi9yZWplY3RcIikucmVqZWN0O1xudmFyIGFzYXAgPSByZXF1aXJlKFwiLi9hc2FwXCIpLmFzYXA7XG5cbnZhciBjb3VudGVyID0gMDtcblxuY29uZmlnLmFzeW5jID0gYXNhcDsgLy8gZGVmYXVsdCBhc3luYyBpcyBhc2FwO1xuXG5mdW5jdGlvbiBQcm9taXNlKHJlc29sdmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihyZXNvbHZlcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gIH1cblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICB9XG5cbiAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICBpbnZva2VSZXNvbHZlcihyZXNvbHZlciwgdGhpcyk7XG59XG5cbmZ1bmN0aW9uIGludm9rZVJlc29sdmVyKHJlc29sdmVyLCBwcm9taXNlKSB7XG4gIGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKSB7XG4gICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgIHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXNvbHZlcihyZXNvbHZlUHJvbWlzZSwgcmVqZWN0UHJvbWlzZSk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJlamVjdFByb21pc2UoZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICB2YXIgaGFzQ2FsbGJhY2sgPSBpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhbHVlID0gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgZXJyb3IgPSBlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICByZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IEZVTEZJTExFRCkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IFJFSkVDVEVEKSB7XG4gICAgcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgfVxufVxuXG52YXIgUEVORElORyAgID0gdm9pZCAwO1xudmFyIFNFQUxFRCAgICA9IDA7XG52YXIgRlVMRklMTEVEID0gMTtcbnZhciBSRUpFQ1RFRCAgPSAyO1xuXG5mdW5jdGlvbiBzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgdmFyIGxlbmd0aCA9IHN1YnNjcmliZXJzLmxlbmd0aDtcblxuICBzdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gIHN1YnNjcmliZXJzW2xlbmd0aCArIEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICBzdWJzY3JpYmVyc1tsZW5ndGggKyBSRUpFQ1RFRF0gID0gb25SZWplY3Rpb247XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2gocHJvbWlzZSwgc2V0dGxlZCkge1xuICB2YXIgY2hpbGQsIGNhbGxiYWNrLCBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzLCBkZXRhaWwgPSBwcm9taXNlLl9kZXRhaWw7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICBpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gIH1cblxuICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IG51bGw7XG59XG5cblByb21pc2UucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogUHJvbWlzZSxcblxuICBfc3RhdGU6IHVuZGVmaW5lZCxcbiAgX2RldGFpbDogdW5kZWZpbmVkLFxuICBfc3Vic2NyaWJlcnM6IHVuZGVmaW5lZCxcblxuICB0aGVuOiBmdW5jdGlvbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcblxuICAgIHZhciB0aGVuUHJvbWlzZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGZ1bmN0aW9uKCkge30pO1xuXG4gICAgaWYgKHRoaXMuX3N0YXRlKSB7XG4gICAgICB2YXIgY2FsbGJhY2tzID0gYXJndW1lbnRzO1xuICAgICAgY29uZmlnLmFzeW5jKGZ1bmN0aW9uIGludm9rZVByb21pc2VDYWxsYmFjaygpIHtcbiAgICAgICAgaW52b2tlQ2FsbGJhY2socHJvbWlzZS5fc3RhdGUsIHRoZW5Qcm9taXNlLCBjYWxsYmFja3NbcHJvbWlzZS5fc3RhdGUgLSAxXSwgcHJvbWlzZS5fZGV0YWlsKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWJzY3JpYmUodGhpcywgdGhlblByb21pc2UsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlblByb21pc2U7XG4gIH0sXG5cbiAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgfVxufTtcblxuUHJvbWlzZS5hbGwgPSBhbGw7XG5Qcm9taXNlLmNhc3QgPSBjYXN0O1xuUHJvbWlzZS5yYWNlID0gcmFjZTtcblByb21pc2UucmVzb2x2ZSA9IHN0YXRpY1Jlc29sdmU7XG5Qcm9taXNlLnJlamVjdCA9IHN0YXRpY1JlamVjdDtcblxuZnVuY3Rpb24gaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpIHtcbiAgdmFyIHRoZW4gPSBudWxsLFxuICByZXNvbHZlZDtcblxuICB0cnkge1xuICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkEgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS5cIik7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB0aGVuID0gdmFsdWUudGhlbjtcblxuICAgICAgaWYgKGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAodmFsdWUgIT09IHZhbCkge1xuICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICByZWplY3QocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoIWhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gdmFsdWU7XG5cbiAgY29uZmlnLmFzeW5jKHB1Ymxpc2hGdWxmaWxsbWVudCwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gcmVhc29uO1xuXG4gIGNvbmZpZy5hc3luYyhwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gcHVibGlzaEZ1bGZpbGxtZW50KHByb21pc2UpIHtcbiAgcHVibGlzaChwcm9taXNlLCBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRCk7XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQpO1xufVxuXG5leHBvcnRzLlByb21pc2UgPSBQcm9taXNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHRvU3RyaW5nICovXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG5cbi8qKlxuICBgUlNWUC5yYWNlYCBhbGxvd3MgeW91IHRvIHdhdGNoIGEgc2VyaWVzIG9mIHByb21pc2VzIGFuZCBhY3QgYXMgc29vbiBhcyB0aGVcbiAgZmlyc3QgcHJvbWlzZSBnaXZlbiB0byB0aGUgYHByb21pc2VzYCBhcmd1bWVudCBmdWxmaWxscyBvciByZWplY3RzLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMVwiKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICB2YXIgcHJvbWlzZTIgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMlwiKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyByZXN1bHQgPT09IFwicHJvbWlzZSAyXCIgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFJTVlAucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdCBjb21wbGV0ZWRcbiAgcHJvbWlzZSBtYXR0ZXJzLiBGb3IgZXhhbXBsZSwgZXZlbiBpZiBvdGhlciBwcm9taXNlcyBnaXZlbiB0byB0aGUgYHByb21pc2VzYFxuICBhcnJheSBhcmd1bWVudCBhcmUgcmVzb2x2ZWQsIGJ1dCB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2UgaGFzIGJlY29tZVxuICByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoXCJwcm9taXNlIDFcIik7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgdmFyIHByb21pc2UyID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJwcm9taXNlIDJcIikpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFJTVlAucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSBcInByb21pc2UyXCIgYmVjYXVzZSBwcm9taXNlIDIgYmVjYW1lIHJlamVjdGVkIGJlZm9yZVxuICAgIC8vIHByb21pc2UgMSBiZWNhbWUgZnVsZmlsbGVkXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJhY2VcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgZGVzY3JpYmluZyB0aGUgcHJvbWlzZSByZXR1cm5lZC5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCBiZWNvbWVzIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSB0aGUgZmlyc3RcbiAgY29tcGxldGVkIHByb21pc2VzIGlzIHJlc29sdmVkIHdpdGggaWYgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlIHdhc1xuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiB0aGF0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZVxuICB3YXMgcmVqZWN0ZWQgd2l0aC5cbiovXG5mdW5jdGlvbiByYWNlKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdLCBwcm9taXNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICBpZiAocHJvbWlzZSAmJiB0eXBlb2YgcHJvbWlzZS50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnRzLnJhY2UgPSByYWNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gIGBSU1ZQLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBwYXNzZWRcbiAgYHJlYXNvbmAuIGBSU1ZQLnJlamVjdGAgaXMgZXNzZW50aWFsbHkgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QW55fSByZWFzb24gdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkIHdpdGguXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGlkZW50aWZ5aW5nIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlamVjdGVkIHdpdGggdGhlIGdpdmVuXG4gIGByZWFzb25gLlxuKi9cbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xufVxuXG5leHBvcnRzLnJlamVjdCA9IHJlamVjdDsiLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICBgUlNWUC5yZXNvbHZlYCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIGZ1bGZpbGxlZCB3aXRoIHRoZSBwYXNzZWRcbiAgYHZhbHVlYC4gYFJTVlAucmVzb2x2ZWAgaXMgZXNzZW50aWFsbHkgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVzb2x2ZSgxKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBSU1ZQLnJlc29sdmUoMSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZXNvbHZlXG4gIEBmb3IgUlNWUFxuICBAcGFyYW0ge0FueX0gdmFsdWUgdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlc29sdmVkIHdpdGhcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgaWRlbnRpZnlpbmcgdGhlIHJldHVybmVkIHByb21pc2UuXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgZnVsZmlsbGVkIHdpdGggdGhlIGdpdmVuXG4gIGB2YWx1ZWBcbiovXG5mdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHJlc29sdmUodmFsdWUpO1xuICB9KTtcbn1cblxuZXhwb3J0cy5yZXNvbHZlID0gcmVzb2x2ZTsiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICByZXR1cm4gaXNGdW5jdGlvbih4KSB8fCAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZnVuY3Rpb24gaXNBcnJheSh4KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbn1cblxuLy8gRGF0ZS5ub3cgaXMgbm90IGF2YWlsYWJsZSBpbiBicm93c2VycyA8IElFOVxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZS9ub3cjQ29tcGF0aWJpbGl0eVxudmFyIG5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cblxuZXhwb3J0cy5vYmplY3RPckZ1bmN0aW9uID0gb2JqZWN0T3JGdW5jdGlvbjtcbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5ub3cgPSBub3c7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cy5EaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9saWIvRGlzcGF0Y2hlcicpXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIERpc3BhdGNoZXJcbiAqIEB0eXBlY2hlY2tzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCcuL2ludmFyaWFudCcpO1xuXG52YXIgX2xhc3RJRCA9IDE7XG52YXIgX3ByZWZpeCA9ICdJRF8nO1xuXG4vKipcbiAqIERpc3BhdGNoZXIgaXMgdXNlZCB0byBicm9hZGNhc3QgcGF5bG9hZHMgdG8gcmVnaXN0ZXJlZCBjYWxsYmFja3MuIFRoaXMgaXNcbiAqIGRpZmZlcmVudCBmcm9tIGdlbmVyaWMgcHViLXN1YiBzeXN0ZW1zIGluIHR3byB3YXlzOlxuICpcbiAqICAgMSkgQ2FsbGJhY2tzIGFyZSBub3Qgc3Vic2NyaWJlZCB0byBwYXJ0aWN1bGFyIGV2ZW50cy4gRXZlcnkgcGF5bG9hZCBpc1xuICogICAgICBkaXNwYXRjaGVkIHRvIGV2ZXJ5IHJlZ2lzdGVyZWQgY2FsbGJhY2suXG4gKiAgIDIpIENhbGxiYWNrcyBjYW4gYmUgZGVmZXJyZWQgaW4gd2hvbGUgb3IgcGFydCB1bnRpbCBvdGhlciBjYWxsYmFja3MgaGF2ZVxuICogICAgICBiZWVuIGV4ZWN1dGVkLlxuICpcbiAqIEZvciBleGFtcGxlLCBjb25zaWRlciB0aGlzIGh5cG90aGV0aWNhbCBmbGlnaHQgZGVzdGluYXRpb24gZm9ybSwgd2hpY2hcbiAqIHNlbGVjdHMgYSBkZWZhdWx0IGNpdHkgd2hlbiBhIGNvdW50cnkgaXMgc2VsZWN0ZWQ6XG4gKlxuICogICB2YXIgZmxpZ2h0RGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB3aGljaCBjb3VudHJ5IGlzIHNlbGVjdGVkXG4gKiAgIHZhciBDb3VudHJ5U3RvcmUgPSB7Y291bnRyeTogbnVsbH07XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB3aGljaCBjaXR5IGlzIHNlbGVjdGVkXG4gKiAgIHZhciBDaXR5U3RvcmUgPSB7Y2l0eTogbnVsbH07XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgYmFzZSBmbGlnaHQgcHJpY2Ugb2YgdGhlIHNlbGVjdGVkIGNpdHlcbiAqICAgdmFyIEZsaWdodFByaWNlU3RvcmUgPSB7cHJpY2U6IG51bGx9XG4gKlxuICogV2hlbiBhIHVzZXIgY2hhbmdlcyB0aGUgc2VsZWN0ZWQgY2l0eSwgd2UgZGlzcGF0Y2ggdGhlIHBheWxvYWQ6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAqICAgICBhY3Rpb25UeXBlOiAnY2l0eS11cGRhdGUnLFxuICogICAgIHNlbGVjdGVkQ2l0eTogJ3BhcmlzJ1xuICogICB9KTtcbiAqXG4gKiBUaGlzIHBheWxvYWQgaXMgZGlnZXN0ZWQgYnkgYENpdHlTdG9yZWA6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY2l0eS11cGRhdGUnKSB7XG4gKiAgICAgICBDaXR5U3RvcmUuY2l0eSA9IHBheWxvYWQuc2VsZWN0ZWRDaXR5O1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogV2hlbiB0aGUgdXNlciBzZWxlY3RzIGEgY291bnRyeSwgd2UgZGlzcGF0Y2ggdGhlIHBheWxvYWQ6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAqICAgICBhY3Rpb25UeXBlOiAnY291bnRyeS11cGRhdGUnLFxuICogICAgIHNlbGVjdGVkQ291bnRyeTogJ2F1c3RyYWxpYSdcbiAqICAgfSk7XG4gKlxuICogVGhpcyBwYXlsb2FkIGlzIGRpZ2VzdGVkIGJ5IGJvdGggc3RvcmVzOlxuICpcbiAqICAgIENvdW50cnlTdG9yZS5kaXNwYXRjaFRva2VuID0gZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NvdW50cnktdXBkYXRlJykge1xuICogICAgICAgQ291bnRyeVN0b3JlLmNvdW50cnkgPSBwYXlsb2FkLnNlbGVjdGVkQ291bnRyeTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFdoZW4gdGhlIGNhbGxiYWNrIHRvIHVwZGF0ZSBgQ291bnRyeVN0b3JlYCBpcyByZWdpc3RlcmVkLCB3ZSBzYXZlIGEgcmVmZXJlbmNlXG4gKiB0byB0aGUgcmV0dXJuZWQgdG9rZW4uIFVzaW5nIHRoaXMgdG9rZW4gd2l0aCBgd2FpdEZvcigpYCwgd2UgY2FuIGd1YXJhbnRlZVxuICogdGhhdCBgQ291bnRyeVN0b3JlYCBpcyB1cGRhdGVkIGJlZm9yZSB0aGUgY2FsbGJhY2sgdGhhdCB1cGRhdGVzIGBDaXR5U3RvcmVgXG4gKiBuZWVkcyB0byBxdWVyeSBpdHMgZGF0YS5cbiAqXG4gKiAgIENpdHlTdG9yZS5kaXNwYXRjaFRva2VuID0gZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NvdW50cnktdXBkYXRlJykge1xuICogICAgICAgLy8gYENvdW50cnlTdG9yZS5jb3VudHJ5YCBtYXkgbm90IGJlIHVwZGF0ZWQuXG4gKiAgICAgICBmbGlnaHREaXNwYXRjaGVyLndhaXRGb3IoW0NvdW50cnlTdG9yZS5kaXNwYXRjaFRva2VuXSk7XG4gKiAgICAgICAvLyBgQ291bnRyeVN0b3JlLmNvdW50cnlgIGlzIG5vdyBndWFyYW50ZWVkIHRvIGJlIHVwZGF0ZWQuXG4gKlxuICogICAgICAgLy8gU2VsZWN0IHRoZSBkZWZhdWx0IGNpdHkgZm9yIHRoZSBuZXcgY291bnRyeVxuICogICAgICAgQ2l0eVN0b3JlLmNpdHkgPSBnZXREZWZhdWx0Q2l0eUZvckNvdW50cnkoQ291bnRyeVN0b3JlLmNvdW50cnkpO1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogVGhlIHVzYWdlIG9mIGB3YWl0Rm9yKClgIGNhbiBiZSBjaGFpbmVkLCBmb3IgZXhhbXBsZTpcbiAqXG4gKiAgIEZsaWdodFByaWNlU3RvcmUuZGlzcGF0Y2hUb2tlbiA9XG4gKiAgICAgZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uVHlwZSkge1xuICogICAgICAgICBjYXNlICdjb3VudHJ5LXVwZGF0ZSc6XG4gKiAgICAgICAgICAgZmxpZ2h0RGlzcGF0Y2hlci53YWl0Rm9yKFtDaXR5U3RvcmUuZGlzcGF0Y2hUb2tlbl0pO1xuICogICAgICAgICAgIEZsaWdodFByaWNlU3RvcmUucHJpY2UgPVxuICogICAgICAgICAgICAgZ2V0RmxpZ2h0UHJpY2VTdG9yZShDb3VudHJ5U3RvcmUuY291bnRyeSwgQ2l0eVN0b3JlLmNpdHkpO1xuICogICAgICAgICAgIGJyZWFrO1xuICpcbiAqICAgICAgICAgY2FzZSAnY2l0eS11cGRhdGUnOlxuICogICAgICAgICAgIEZsaWdodFByaWNlU3RvcmUucHJpY2UgPVxuICogICAgICAgICAgICAgRmxpZ2h0UHJpY2VTdG9yZShDb3VudHJ5U3RvcmUuY291bnRyeSwgQ2l0eVN0b3JlLmNpdHkpO1xuICogICAgICAgICAgIGJyZWFrO1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogVGhlIGBjb3VudHJ5LXVwZGF0ZWAgcGF5bG9hZCB3aWxsIGJlIGd1YXJhbnRlZWQgdG8gaW52b2tlIHRoZSBzdG9yZXMnXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcyBpbiBvcmRlcjogYENvdW50cnlTdG9yZWAsIGBDaXR5U3RvcmVgLCB0aGVuXG4gKiBgRmxpZ2h0UHJpY2VTdG9yZWAuXG4gKi9cblxuICBmdW5jdGlvbiBEaXNwYXRjaGVyKCkge1xuICAgIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzID0ge307XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmcgPSB7fTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzSGFuZGxlZCA9IHt9O1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyA9IGZhbHNlO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2l0aCBldmVyeSBkaXNwYXRjaGVkIHBheWxvYWQuIFJldHVybnNcbiAgICogYSB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHdpdGggYHdhaXRGb3IoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLnJlZ2lzdGVyPWZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdmFyIGlkID0gX3ByZWZpeCArIF9sYXN0SUQrKztcbiAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF0gPSBjYWxsYmFjaztcbiAgICByZXR1cm4gaWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBjYWxsYmFjayBiYXNlZCBvbiBpdHMgdG9rZW4uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUudW5yZWdpc3Rlcj1mdW5jdGlvbihpZCkge1xuICAgIGludmFyaWFudChcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzW2lkXSxcbiAgICAgICdEaXNwYXRjaGVyLnVucmVnaXN0ZXIoLi4uKTogYCVzYCBkb2VzIG5vdCBtYXAgdG8gYSByZWdpc3RlcmVkIGNhbGxiYWNrLicsXG4gICAgICBpZFxuICAgICk7XG4gICAgZGVsZXRlIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzW2lkXTtcbiAgfTtcblxuICAvKipcbiAgICogV2FpdHMgZm9yIHRoZSBjYWxsYmFja3Mgc3BlY2lmaWVkIHRvIGJlIGludm9rZWQgYmVmb3JlIGNvbnRpbnVpbmcgZXhlY3V0aW9uXG4gICAqIG9mIHRoZSBjdXJyZW50IGNhbGxiYWNrLiBUaGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSB1c2VkIGJ5IGEgY2FsbGJhY2sgaW5cbiAgICogcmVzcG9uc2UgdG8gYSBkaXNwYXRjaGVkIHBheWxvYWQuXG4gICAqXG4gICAqIEBwYXJhbSB7YXJyYXk8c3RyaW5nPn0gaWRzXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS53YWl0Rm9yPWZ1bmN0aW9uKGlkcykge1xuICAgIGludmFyaWFudChcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyxcbiAgICAgICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogTXVzdCBiZSBpbnZva2VkIHdoaWxlIGRpc3BhdGNoaW5nLidcbiAgICApO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBpZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICB2YXIgaWQgPSBpZHNbaWldO1xuICAgICAgaWYgKHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nW2lkXSkge1xuICAgICAgICBpbnZhcmlhbnQoXG4gICAgICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0hhbmRsZWRbaWRdLFxuICAgICAgICAgICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogQ2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCB3aGlsZSAnICtcbiAgICAgICAgICAnd2FpdGluZyBmb3IgYCVzYC4nLFxuICAgICAgICAgIGlkXG4gICAgICAgICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaW52YXJpYW50KFxuICAgICAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF0sXG4gICAgICAgICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogYCVzYCBkb2VzIG5vdCBtYXAgdG8gYSByZWdpc3RlcmVkIGNhbGxiYWNrLicsXG4gICAgICAgIGlkXG4gICAgICApO1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pbnZva2VDYWxsYmFjayhpZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGEgcGF5bG9hZCB0byBhbGwgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXlsb2FkXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaD1mdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgaW52YXJpYW50KFxuICAgICAgIXRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyxcbiAgICAgICdEaXNwYXRjaC5kaXNwYXRjaCguLi4pOiBDYW5ub3QgZGlzcGF0Y2ggaW4gdGhlIG1pZGRsZSBvZiBhIGRpc3BhdGNoLidcbiAgICApO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfc3RhcnREaXNwYXRjaGluZyhwYXlsb2FkKTtcbiAgICB0cnkge1xuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3MpIHtcbiAgICAgICAgaWYgKHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nW2lkXSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuJERpc3BhdGNoZXJfaW52b2tlQ2FsbGJhY2soaWQpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiREaXNwYXRjaGVyX3N0b3BEaXNwYXRjaGluZygpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSXMgdGhpcyBEaXNwYXRjaGVyIGN1cnJlbnRseSBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLmlzRGlzcGF0Y2hpbmc9ZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZztcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbCB0aGUgY2FsbGJhY2sgc3RvcmVkIHdpdGggdGhlIGdpdmVuIGlkLiBBbHNvIGRvIHNvbWUgaW50ZXJuYWxcbiAgICogYm9va2tlZXBpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLiREaXNwYXRjaGVyX2ludm9rZUNhbGxiYWNrPWZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmdbaWRdID0gdHJ1ZTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF0odGhpcy4kRGlzcGF0Y2hlcl9wZW5kaW5nUGF5bG9hZCk7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0hhbmRsZWRbaWRdID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHVwIGJvb2trZWVwaW5nIG5lZWRlZCB3aGVuIGRpc3BhdGNoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGF5bG9hZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLiREaXNwYXRjaGVyX3N0YXJ0RGlzcGF0Y2hpbmc9ZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0gPSBmYWxzZTtcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkW2lkXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLiREaXNwYXRjaGVyX3BlbmRpbmdQYXlsb2FkID0gcGF5bG9hZDtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcgPSB0cnVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbGVhciBib29ra2VlcGluZyB1c2VkIGZvciBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS4kRGlzcGF0Y2hlcl9zdG9wRGlzcGF0Y2hpbmc9ZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9wZW5kaW5nUGF5bG9hZCA9IG51bGw7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gIH07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEaXNwYXRjaGVyO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgaW52YXJpYW50XG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbnZhciBpbnZhcmlhbnQgPSBmdW5jdGlvbihjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAoZmFsc2UpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArXG4gICAgICAgICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnSW52YXJpYW50IFZpb2xhdGlvbjogJyArXG4gICAgICAgIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107IH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnZhcmlhbnQ7XG4iXX0=
