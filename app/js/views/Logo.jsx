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
            <div className="top-box-left" onClick={this._onClick}>
                <div className="logo" style={divStyle}></div> 
            </div>
        );
    },
    _onClick: function(){
        //連結都會是link這個屬性嗎？special也有一個
        var click_link = this.props.truth.response.logo.link;
        window.open(click_link, '_blank');
    }
});

module.exports = Logo;
