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
