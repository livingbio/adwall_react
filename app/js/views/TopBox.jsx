/**
 *
 */
var actions = require('../actions/AppActionCreator');

var Logo = React.createFactory( require('./Logo.jsx') );
var Special = React.createFactory( require('./Special.jsx') );
var Banner = React.createFactory( require('./Banner.jsx') );
/**
 * 
 */
var TopBox = React.createClass({


  /**
   *
   */
  render: function() {

    return (
        <div className="top-box">
            <Logo truth={this.props.truth} />
            <Special truth={this.props.truth} />
            <Banner truth={this.props.truth} />
        </div>
	);
  }


});

module.exports = TopBox;
