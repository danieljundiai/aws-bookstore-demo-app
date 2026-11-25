import React, { Component } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { SnacksNavBar } from "./SnacksNavBar";
import SnackAddToCart from "./SnackAddToCart";
import { Snack } from "./types";
import "../../common/hero/hero.css";
import "../../common/styles/common.css";
import "./snacks.css";

interface SnacksViewProps {}

interface SnacksViewState {
  isLoading: boolean;
  snacks: Snack[];
  category: string | undefined;
}

export default class SnacksView extends Component<SnacksViewProps, SnacksViewState> {
  constructor(props: SnacksViewProps) {
    super(props);

    this.state = {
      isLoading: true,
      snacks: [],
      category: undefined
    };
  }

  async componentDidMount() {
    try {
      const snacks = await API.get("snacks", "/snacks", null);
      this.setState({ snacks: snacks || [] });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  getCategories = () => Array.from(new Set(this.state.snacks.map(snack => snack.category))).sort();

  render() {
    if (this.state.isLoading) return <div className="loader"></div>;

    const snacks = this.state.snacks.filter(snack => !this.state.category || snack.category === this.state.category);

    return (
      <div className="Category">
        <SnacksNavBar />
        <div className="well-bs">
          <div className="white-box no-margin-top">
            <h3>Snacks</h3>
            <div className="snacks-filter">
              <button type="button" className="btn btn-default" onClick={() => this.setState({ category: undefined })}>All</button>
              {this.getCategories().map(category =>
                <button type="button" className="btn btn-default" key={category} onClick={() => this.setState({ category })}>{category}</button>)}
            </div>
          </div>
          {snacks.length === 0 && <div className="white-box"><p>No snacks available.</p></div>}
          {snacks.map(snack =>
            <div className="white-box snack-card" key={snack.id}>
              <h3 className="media-heading">
                <Link to={`/snacks/${snack.id}`}>{snack.name}</Link>
                <div className="pull-right margin-1"><small>${snack.price}</small></div>
              </h3>
              <p><small className="snack-category">{snack.category}</small></p>
              <p>{snack.description}</p>
              <SnackAddToCart snackId={snack.id} price={snack.price} />
            </div>)}
        </div>
      </div>
    );
  }
}
