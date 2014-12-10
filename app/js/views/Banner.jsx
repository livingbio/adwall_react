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
            <div className="banner" style={divStyle}></div> 
        </div>
    );
  },


});

module.exports = Banner;
