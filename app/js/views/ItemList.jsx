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

        // 這裏使用 react class add-on 來切換樣式顯示
        // 這樣做比較有條理，比直接組合多個字串來的好控制  
        var classes = cx({
            'list-item': true,
        });

        var Ads = this.props.truth.ad;
        var arr = Ads.map(function(item, index){
            return <Item key={item.index} detail={item} click={this.click.bind(this, item)}/>
        }, this)

        return (
            <div className="item_list_wraper">
                <ul className="item_list">
                    {arr}
                </ul>
            </div>
        )
    },
    click: function(item){

        //open link
        window.open(item.click_link, '_blank');

        //add tracking pixel
        var itemList = this.props.truth;
        var key = this.props.truth.key;

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
            pc: TagtooAdWall.pc
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