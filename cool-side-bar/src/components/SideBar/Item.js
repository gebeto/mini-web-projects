import React, { Component } from 'react';

class Item extends Component {
    render() {
        return (
            <li className="side-bar__item">
            	{this.props.children}
            </li>
        );
    }
}

export default Item;