import React from "react";

export class SnacksNavBar extends React.Component {
  render() {
    return (
      <ul className="nav nav-pills justify-content-center nav-cat">
        <li role="presentation"><a className="category-link" href="/snacks">Snacks</a></li>
        <li role="presentation"><a className="category-link" href="/snacks/cart">Snack cart</a></li>
        <li role="presentation"><a className="category-link" href="/snacks/orders">Snack orders</a></li>
      </ul>
    );
  }
}

export default SnacksNavBar;
