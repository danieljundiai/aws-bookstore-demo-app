import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { API } from "aws-amplify";
import SnacksView from "./SnacksView";
import SnackCart from "./SnackCart";

jest.mock("aws-amplify", () => ({
  API: { get: jest.fn(), post: jest.fn(), put: jest.fn(), del: jest.fn() }
}));

const snacks = [
  { id: "s1", name: "Salted Chips", category: "savory", description: "Crunchy", price: 2.5 },
  { id: "s2", name: "Dark Chocolate", category: "sweet", description: "Rich", price: 3 }
];
const cart = [
  { snackId: "s1", quantity: 2, price: 2.5 },
  { snackId: "s2", quantity: 1, price: 3 }
];

const render = async (element: React.ReactElement) => {
  const container = document.createElement("div");
  await act(async () => {
    ReactDOM.render(<MemoryRouter>{element}</MemoryRouter>, container);
  });
  return container;
};

beforeEach(() => {
  (API.get as jest.Mock).mockImplementation((_api: string, path: string) =>
    Promise.resolve(path === "/snacks/cart" ? cart : snacks));
});

it("renders the list of snacks", async () => {
  const container = await render(<SnacksView />);
  expect(container.textContent).toContain("Salted Chips");
  expect(container.textContent).toContain("Dark Chocolate");
  expect(container.textContent).toContain("$2.5");
  expect(container.querySelectorAll(".snack-card").length).toBe(2);
});

it("renders the cart items and the total", async () => {
  const container = await render(<SnackCart />);
  expect(container.textContent).toContain("Salted Chips");
  expect(container.textContent).toContain("Dark Chocolate");
  expect(container.querySelector(".snack-total")!.textContent).toBe("Total: $8.00");
});
