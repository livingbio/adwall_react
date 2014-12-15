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
        return <Item key={index} detail={item} click={this.click.bind(this, item)}/>
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
    //window.open(item.click_link, '_blank');

    //add tracking pixel

    if (item == "Simlar" && typeof itemId != "undefined") {
      var obj = TagtooAdWall.ad_data.itemList[item].ad[itemId];
      var url = TagtooAdWall.ad_data.itemList[item].ad[itemId]['link'];
      var qm = "SimilarQuery";
      var qp = TagtooAdWall.decodeQueryData(document.location.href).pid;
    } else if (typeof itemId == "undefined") {
      var obj = TagtooAdWall.ad_data[item];
      var url = TagtooAdWall.ad_data[item]['link'];
      var qm = TagtooAdWall.ad_data[item].qm;
      var qp = TagtooAdWall.ad_data[item].qp;
    } else if (item == "remarketing") {
      item = "Remarketing";
      var obj = TagtooAdWall.ad_data.itemList[item][itemId];
      var url = TagtooAdWall.ad_data.itemList[item][itemId]['link'];
      var qm = "remarketing";
      var qp = TagtooAdWall.ad_data.itemList[item][itemId].product_key;
    } else { // key 商品
      var obj = TagtooAdWall.ad_data.itemList[item].ad[itemId];
      var url = TagtooAdWall.ad_data.itemList[item].ad[itemId]['link'];
      var qm = TagtooAdWall.ad_data.itemList[item].ad.qm;
      var qp = TagtooAdWall.ad_data.itemList[item].ad.qp;
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
      qm: this.props.truth.qm,
      qp: this.props.truth.qp,
      pc: TagtooAdWall.pc
    }
    //console.log(vs)
    this.addTrackPixel(vs);
  },
  addTrackPixel: function(vs){
    var imgElem = document.createElement("img");
    imgElem.src = "//track.tagtoo.co/ad/tr.gif?" + this.encodeQueryData(vs);

    var node = document.getElementsByTagName("script")[0];
    node.parentNode.insertBefore(imgElem, node);
  },
  encodeQueryData: function(vs){
    var result = [];
    for(var key in vs) {
      result.push(key + "=" + encodeURIComponent(vs[key]));
    }
    return result.join("&");
  }
});

module.exports = ItemList;