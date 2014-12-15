/**
 *
 */
var actions = require('../actions/AppActionCreator');
/**
 * 
 */
var Logo = React.createClass({
  /**
   *
   */
    render: function() {

        var divStyle = {
            backgroundImage: this.props.truth.response.logo.image_url
        }

    	return (
            <div className="top-box-left">
                <div className="logo" style={divStyle}></div> 
            </div>
        );
    },
});

module.exports = Logo;
