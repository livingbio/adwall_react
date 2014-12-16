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
