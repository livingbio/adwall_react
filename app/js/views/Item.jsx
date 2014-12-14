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
    var link = this.props.detail.link;
      // if (link.match(/\?/)) {
      //   link = link + location.search.replace(/([\?&])pid=[^&]*&?/, "$1").replace(/\?/,"&");
      // }else{
      //   link = link + location.search.replace(/([\?&])pid=[^&]*&?/, "$1");
      // }
    window.open(link, '_blank');
  }


});

module.exports = Item;
