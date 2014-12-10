/**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Prev = React.createClass({


  /**
   *
   */
  render: function() {
    
  	return (
      <div  className="prev" 
            onClick={this.props.onClick}></div>
    );
  }



});

module.exports = Prev;
