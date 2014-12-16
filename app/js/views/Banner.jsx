/**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Banner = React.createClass({


  /**
   *
   */
  render: function() {

    var divStyle = {
        background: this.props.truth.response.banner.image_url
    }

  	return (
        <div className="top-box-right">
            <div className="banner" style={divStyle} onClick={this._onClick}></div> 
        </div>
    );
  },
  _onClick: function(){
      var click_link = this.props.truth.response.banner.link;
      window.open(click_link, '_blank');
  }


});

module.exports = Banner;
