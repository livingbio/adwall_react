/**
 *
 */
var actions = require('../actions/AppActionCreator');
var cx = React.addons.classSet;
var Item = React.createFactory(require('./Item.jsx'));

/**
 * 
 */
var ItemList = React.createClass({

    render: function() {

        var Ads = this.props.row.ad;
        var arr = Ads.map(function(item, index){
            return <Item key={item.index} detail={item} click={this._onClick.bind(this, item)}/>
        }, this)

        return (
            <div className="item_list_wraper">
                <ul className="item_list">
                    {arr}
                </ul>
            </div>
        )
    },
    _onClick: function(item){

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