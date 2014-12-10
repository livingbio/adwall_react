/**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Special = React.createClass({


  /**
   *
   */
  render: function() {
    var first = this.props.truth.response.first;
  	return (
        <div className="special">
            <div className="special-img">
              <img src={first.image_url}/>
            </div>
            <div className="special-text">
              <p className="special-describe">{first.title}</p>
              <p className="special-region">{first.extra.region}</p>
              <p className="special-store_price">
                <span id="label">總價：</span>
                <span>{first.price}</span>
              </p>
              <p className="special-area">
                <span id="label">坪數：</span>
                {first.extra.area}坪
              </p>
              <p className="special-area">
                <span id="label">屋齡：</span>
                {first.extra.age}
              </p>
              <p className="special-area">
                <span id="label">樓層：</span>
                {first.extra.storey}
              </p>
              <p className="special-area">
                <span id="label">格局：</span>
                {first.extra.pattern}
              </p>
            </div>
            <div className="special-more"></div>
        </div>
    );
  },


});

module.exports = Special;
