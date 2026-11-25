import React, { Component } from "react";
import { API } from "aws-amplify";
import { Redirect } from "react-router";
import { SnacksNavBar } from "./SnacksNavBar";
import { Snack, SnackCartItem, getTotal } from "./types";
import "../../common/hero/hero.css";
import "../../common/styles/common.css";
import "./snacks.css";

interface SnackCheckoutProps {}

interface SnackCheckoutState {
  isLoading: boolean;
  isPaying: boolean;
  items: SnackCartItem[];
  toConfirm: boolean;
}

export default class SnackCheckout extends Component<SnackCheckoutProps, SnackCheckoutState> {
  constructor(props: SnackCheckoutProps) {
    super(props);

    this.state = {
      isLoading: true,
      isPaying: false,
      items: [],
      toConfirm: false
    };
  }

  async componentDidMount() {
    try {
      const [cart, snacks]: [SnackCartItem[], Snack[]] = await Promise.all([
        API.get("snacks", "/snacks/cart", null),
        API.get("snacks", "/snacks", null)
      ]);
      const items = (cart || []).map(item => {
        const snack = (snacks || []).find(s => s.id === item.snackId);
        return snack ? { ...item, name: snack.name } : item;
      });
      this.setState({ items });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  onCheckout = async () => {
    this.setState({ isPaying: true });
    try {
      await API.post("snacks", "/snacks/checkout", { body: { snacks: this.state.items } });
      this.setState({ toConfirm: true });
    } catch (e) {
      alert(e);
      this.setState({ isPaying: false });
    }
  }

  render() {
    if (this.state.toConfirm) return <Redirect to="/snacks/checkout-confirm" />
    if (this.state.isLoading) return <div className="loader"></div>;

    return (
      <div className="Category">
        <SnacksNavBar />
        <div className="well-bs">
          <div className="white-box no-margin-top">
            <h3>Snack checkout</h3>
          </div>
          <div className="white-box">
            {this.state.items.map(item =>
              <p key={item.snackId}>{`${item.quantity} x ${item.name || item.snackId} @ $${item.price}`}</p>)}
            {this.state.items.length === 0 && <p>Your snack cart is empty.</p>}
          </div>
          <div className="pull-right">
            <button className="btn btn-black" type="button" disabled={this.state.items.length < 1 || this.state.isPaying}
              onClick={this.onCheckout}>{`Pay ($${getTotal(this.state.items)})`}</button>
          </div>
        </div>
      </div>
    );
  }
}
