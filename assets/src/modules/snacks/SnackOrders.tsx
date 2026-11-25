import React, { Component } from "react";
import { API } from "aws-amplify";
import { SnacksNavBar } from "./SnacksNavBar";
import { Snack, SnackOrder } from "./types";
import "../../common/hero/hero.css";
import "../../common/styles/common.css";
import "./snacks.css";

interface SnackOrdersProps {}

interface SnackOrdersState {
  isLoading: boolean;
  orders: SnackOrder[];
  snacks: Snack[];
}

export default class SnackOrders extends Component<SnackOrdersProps, SnackOrdersState> {
  constructor(props: SnackOrdersProps) {
    super(props);

    this.state = {
      isLoading: true,
      orders: [],
      snacks: []
    };
  }

  async componentDidMount() {
    try {
      const [orders, snacks] = await Promise.all([
        API.get("snacks", "/snacks/orders", null),
        API.get("snacks", "/snacks", null)
      ]);
      this.setState({ orders: orders || [], snacks: snacks || [] });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  getName = (snackId: string, name?: string) => {
    if (name) return name;
    const snack = this.state.snacks.find(s => s.id === snackId);
    return snack ? snack.name : snackId;
  }

  getPrettyDate = (orderDate: number) => {
    const date = new Date(orderDate);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()}`;
  }

  render() {
    if (this.state.isLoading) return <div className="loader"></div>;

    return (
      <div className="Category">
        <SnacksNavBar />
        <div className="well-bs col-md-12">
          <div className="white-box no-margin-top">
            <h3>Snack orders</h3>
          </div>
          {this.state.orders.length === 0 && <div className="white-box"><p>No snack orders yet.</p></div>}
          {[...this.state.orders]
            .sort((a, b) => b.orderDate - a.orderDate)
            .map(order =>
              <div className="order-date" key={order.orderId}>
                <h4>{`Order date: ${this.getPrettyDate(order.orderDate)}`}</h4>
                <div className="white-box">
                  {order.snacks.map(item =>
                    <p key={item.snackId}>{`${item.quantity} x ${this.getName(item.snackId, item.name)} @ $${item.price}`}</p>)}
                </div>
              </div>)}
        </div>
      </div>
    );
  }
}
