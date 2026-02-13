import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AdminPlatformFeePanel from "../AdminPlatformFeePanel.jsx";

vi.mock("axios", () => ({
  default: {
    put: vi.fn(async () => ({ data: { config: { platformFeePercent: 12.5 } } }))
  }
}));

import axios from "axios";

test("updates fee percent and calls API on blur", async () => {
  const setPlatformConfig = vi.fn();
  const { getByRole, rerender } = render(
    <AdminPlatformFeePanel platformConfig={{ platformFeePercent: 10 }} setPlatformConfig={setPlatformConfig} authHeaders={{ Authorization: "Bearer token" }} />
  );

  const input = getByRole("spinbutton");
  await userEvent.clear(input);
  await userEvent.type(input, "12.5");
  rerender(<AdminPlatformFeePanel platformConfig={{ platformFeePercent: 12.5 }} setPlatformConfig={setPlatformConfig} authHeaders={{ Authorization: "Bearer token" }} />);
  fireEvent.blur(input);

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith("/api/admin/platform-config", { platformFeePercent: 12.5 }, { headers: { Authorization: "Bearer token" } });
    expect(setPlatformConfig).toHaveBeenCalledWith({ platformFeePercent: 12.5 });
  });
});
