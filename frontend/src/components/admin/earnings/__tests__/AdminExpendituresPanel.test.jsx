import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AdminExpendituresPanel from "../AdminExpendituresPanel.jsx";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(async (_url, body) => ({
      data: {
        _id: "exp1",
        amount: body.amount,
        category: body.category,
        description: body.description,
        tags: body.tags,
        attachments: body.attachments,
        date: new Date().toISOString()
      }
    }))
  }
}));

import axios from "axios";
import { ToastProvider } from "../../../shared/Toast.jsx";

test("submits expenditure and updates list", async () => {
  const setExpenditures = vi.fn();
  const { getByText, getByPlaceholderText } = render(
    <AdminExpendituresPanel expenditures={[]} setExpenditures={setExpenditures} authHeaders={{ Authorization: "Bearer token" }} />
  );

  await userEvent.type(getByPlaceholderText("0.00"), "100");
  await userEvent.type(getByPlaceholderText("Category"), "infra");
  await userEvent.type(getByPlaceholderText("education,infra"), "alpha, beta");
  await userEvent.type(getByPlaceholderText("https://..."), "http://a, http://b");
  await userEvent.type(getByPlaceholderText("Short note"), "note");

  fireEvent.click(getByText("Add"));

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalled();
    expect(setExpenditures).toHaveBeenCalled();
  });
});

test("filters expenditures by category and tag", async () => {
  const items = [
    { _id: "1", amount: 10, category: "infra", description: "", date: new Date().toISOString(), tags: ["alpha"], attachments: [] },
    { _id: "2", amount: 20, category: "ops", description: "", date: new Date().toISOString(), tags: ["beta"], attachments: [] }
  ];
  const { getByPlaceholderText, queryByText } = render(
    <AdminExpendituresPanel expenditures={items} setExpenditures={() => {}} authHeaders={{}} />
  );
  await userEvent.type(getByPlaceholderText("Filter category"), "ops");
  await userEvent.type(getByPlaceholderText("Filter tag"), "beta");
  expect(queryByText("$10 · infra · —")).not.toBeInTheDocument();
  expect(queryByText("$20 · ops · —")).toBeInTheDocument();
});

test("shows error toast when API fails", async () => {
  axios.post.mockRejectedValueOnce({ response: { data: { message: "Failed to add expenditure" } } });
  const { getByText, getByPlaceholderText, findByRole } = render(
    <ToastProvider>
      <AdminExpendituresPanel expenditures={[]} setExpenditures={() => {}} authHeaders={{}} />
    </ToastProvider>
  );
  await userEvent.type(getByPlaceholderText("0.00"), "10");
  await userEvent.type(getByPlaceholderText("Category"), "ops");
  fireEvent.click(getByText("Add"));
  const alert = await findByRole("alert");
  expect(alert).toHaveTextContent(/Failed to add expenditure/i);
});
