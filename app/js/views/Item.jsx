/**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Item = React.createClass({


  /**
   *
   */
  render: function() {

    var detail = this.props.detail;
    
  	return (
                    
        <div className="item"
             onClick={this.openLink}>

            <div className="item-slogan"></div>
            <div className="item-img">
                <img src={detail.image_url} />
            </div>
            
            <div className="item-title">{detail.title}</div>
            <p className="region">{detail.extra.region}</p>
            <div className="area">{detail.extra.area}坪</div>
            <div className="item-offer_price_plus">
                <span className="offer_price">{detail.price}</span>
            </div>
            <div className="item-more"></div>
        </div>

    );
  },
  openLink: function(){
    //連結都會是link這個屬性嗎？special也有一個
    var click_link = this.props.detail.click_link;
    window.open(click_link, '_blank');
  }


});

module.exports = Item;
