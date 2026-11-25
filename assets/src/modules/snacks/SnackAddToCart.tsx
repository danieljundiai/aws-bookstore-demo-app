import React from "react";
import { API } from "aws-amplify";
import { Redirect } from "react-router";
import { Glyphicon } from "react-bootstrap";
import { SnackCartItem } from "./types";

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
      const cart: SnackCartItem[] = await API.get("snacks", "/snacks/cart", null);
      const inCart = (cart || []).find(item => item.snackId === this.props.snackId);

      // if the snack already exists in the cart, increase the quantity
      if (inCart) {
        await API.put("snacks", "/snacks/cart", {
          body: {
            snackId: this.props.snackId,
            quantity: inCart.quantity + 1
          }
        });
      } else {
        await API.post("snacks", "/snacks/cart", {
          body: {
            snackId: this.props.snackId,
            price: this.props.price,
            quantity: 1
          }
        });
      }
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
