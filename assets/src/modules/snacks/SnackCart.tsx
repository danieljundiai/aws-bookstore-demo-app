import React, { Component } from "react";
import { API } from "aws-amplify";
import { Redirect } from "react-router";
import { SnacksNavBar } from "./SnacksNavBar";
import { Snack, SnackCartItem, getTotal } from "./types";
import "../../common/hero/hero.css";
import "../../common/styles/common.css";
import "../../common/styles/productRow.css";
import "./snacks.css";

interface SnackCartProps {}

interface SnackCartState {
  isLoading: boolean;
  items: SnackCartItem[];
  snacks: Snack[];
  toCheckout: boolean;
}

export default class SnackCart extends Component<SnackCartProps, SnackCartState> {
  constructor(props: SnackCartProps) {
    super(props);

    this.state = {
      isLoading: true,
      items: [],
      snacks: [],
      toCheckout: false
    };
  }

  async componentDidMount() {
    try {
      const [items, snacks] = await Promise.all([
        API.get("snacks", "/snacks/cart", null),
        API.get("snacks", "/snacks", null)
      ]);
      this.setState({ items: items || [], snacks: snacks || [] });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  getName = (snackId: string) => {
    const snack = this.state.snacks.find(s => s.id === snackId);
    return snack ? snack.name : snackId;
  }

  onQuantityUpdated = async (snackId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 1) return;

    try {
      await API.put("snacks", "/snacks/cart", { body: { snackId, quantity } });
      this.setState({
        items: this.state.items.map(item => item.snackId === snackId ? { ...item, quantity } : item)
      });
    } catch (e) {
      alert(e);
    }
  }

  onRemove = async (snackId: string) => {
    try {
      await API.del("snacks", "/snacks/cart", { body: { snackId } });
      this.setState({ items: this.state.items.filter(item => item.snackId !== snackId) });
    } catch (e) {
      alert(e);
    }
  }

  render() {
    if (this.state.toCheckout) return <Redirect to="/snacks/checkout" />
    if (this.state.isLoading) return <div className="loader"></div>;

    return (
      <div className="Category">
        <SnacksNavBar />
        <div className="well-bs padding-bottom-120">
          <div className="white-box no-margin-top">
            <h3>Snack cart</h3>
          </div>
          {this.state.items.length === 0 && <div className="white-box"><p>Your snack cart is empty.</p></div>}
          {this.state.items.map(item =>
            <div className="white-box" key={item.snackId}>
              <h3 className="media-heading">{this.getName(item.snackId)}
                <div className="pull-right margin-1"><small>${item.price}</small></div>
              </h3>
              <div className="input-group pull-right">
                <input type="number" className="form-control snack-quantity" placeholder="Quantity" min={1}
                  defaultValue={item.quantity.toString()}
                  onChange={(event) => this.onQuantityUpdated(item.snackId, event.target.value)} />
                <span className="input-group-btn">
                  <button className="btn btn-black" type="button" onClick={() => this.onRemove(item.snackId)}>Remove</button>
                </span>
              </div>
              <div className="clearfix"></div>
            </div>)}
          <div className="pull-right checkout-padding">
            <h4 className="snack-total">{`Total: $${getTotal(this.state.items)}`}</h4>
            <button className="btn btn-black" type="button" disabled={this.state.items.length < 1}
              onClick={() => this.setState({ toCheckout: true })}>Checkout</button>
          </div>
        </div>
      </div>
    );
  }
}
