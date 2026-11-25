import React, { Component } from "react";
import { Redirect } from "react-router";
import { SnacksNavBar } from "./SnacksNavBar";
import "../../common/styles/common.css";
import "../checkout/checkout.css";

interface SnackCheckoutConfirmState {
  toOrders: boolean;
}

export default class SnackCheckoutConfirm extends Component<{}, SnackCheckoutConfirmState> {
  state = { toOrders: false };

  render() {
    if (this.state.toOrders) return <Redirect to="/snacks/orders" />

    return (
      <div>
        <SnacksNavBar />
        <div className="well-bs">
          <div className="white-box no-margin-top no-margin-bottom">
            <h3>Snack purchase confirmed</h3>
          </div>
        </div>
        <div className="well-bs full-page no-padding-bottom no-padding-top">
          <div className="white-box padding-50 no-margin-top col-md-12 no-margin-bottom">
            <h4 className="text-center">Your snack purchase is complete!</h4>
            <button className="btn btn-black btn-black-center" type="button" onClick={() => this.setState({ toOrders: true })}>View snack orders</button>
          </div>
        </div>
      </div>
    );
  }
}
