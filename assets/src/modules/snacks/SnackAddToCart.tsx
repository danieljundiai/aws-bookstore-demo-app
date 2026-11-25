import React from "react";
import { API } from "aws-amplify";
import { Redirect } from "react-router";
import { Glyphicon } from "react-bootstrap";

interface SnackAddToCartProps {
  snackId: string;
  price: number;
}

interface SnackAddToCartState {
  loading: boolean;
  toCart: boolean;
}

export class SnackAddToCart extends React.Component<SnackAddToCartProps, SnackAddToCartState> {
  constructor(props: SnackAddToCartProps) {
    super(props);

    this.state = {
      loading: false,
      toCart: false
    };
  }

  onAddToCart = async () => {
    this.setState({ loading: true });
    try {
      // the server adds to the existing quantity and prices the snack from the catalog
      await API.post("snacks", "/snacks/cart", {
        body: { snackId: this.props.snackId, quantity: 1 }
      });
      this.setState({ toCart: true });
    } catch (e) {
      alert(e);
      this.setState({ loading: false });
    }
  }

  render() {
    if (this.state.toCart) return <Redirect to="/snacks/cart" />

    return (
      <button className="btn btn-black pull-right" disabled={this.state.loading} type="button" onClick={this.onAddToCart}>
        {this.state.loading && <Glyphicon glyph="refresh" className="spinning" />}
        Add to cart
      </button>
    );
  }
}

export default SnackAddToCart;
