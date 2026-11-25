import React, { Component } from "react";
import { API } from "aws-amplify";
import { SnacksNavBar } from "./SnacksNavBar";
import SnackAddToCart from "./SnackAddToCart";
import { Snack } from "./types";
import "../../common/hero/hero.css";
import "../../common/styles/common.css";
import "./snacks.css";

interface SnackDetailProps {
  match: any;
}

interface SnackDetailState {
  isLoading: boolean;
  snack: Snack | undefined;
}

export default class SnackDetail extends Component<SnackDetailProps, SnackDetailState> {
  constructor(props: SnackDetailProps) {
    super(props);

    this.state = {
      isLoading: true,
      snack: undefined
    };
  }

  async componentDidMount() {
    try {
      const snack = await API.get("snacks", `/snacks/${this.props.match.params.id}`, null);
      this.setState({ snack });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  render() {
    if (this.state.isLoading) return <div className="loader"></div>;

    const snack = this.state.snack;

    return (
      <div className="Category">
        <SnacksNavBar />
        <div className="well-bs">
          {!snack ?
            <div className="white-box no-margin-top"><h3>Snack not found</h3></div> :
            <div className="white-box no-margin-top">
              <h3>{snack.name}
                <div className="pull-right margin-1"><small>${snack.price}</small></div>
              </h3>
              <p><small className="snack-category">{snack.category}</small></p>
              <p>{snack.description}</p>
              <SnackAddToCart snackId={snack.id} price={snack.price} />
              <div className="clearfix"></div>
            </div>}
        </div>
      </div>
    );
  }
}
