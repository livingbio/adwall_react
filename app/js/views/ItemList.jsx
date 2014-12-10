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
        return <Item key={index} detail={item}/>
    }, this)

    return (
        <div className="item_list_wraper">
            <ul className="item_list">
                {arr}
            </ul>
        </div>
    )
  }

});

module.exports = ItemList;