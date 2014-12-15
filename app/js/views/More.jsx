/**
 *
 */
var actions = require('../actions/AppActionCreator');
/**
 * 
 */
var More = React.createClass({
  /**
   *
   */
	render: function() {

		return  <a className="more" href={this.props.link} target="_blank"></a>;
	}
});

module.exports = More;
