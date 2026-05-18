import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";

describe("App", () => {
  it("renders the login page", () => {
    render(
      <MemoryRouter
        initialEntries={["/login"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("redirects protected routes to login without a session", async () => {
    render(
      <MemoryRouter
        initialEntries={["/dashboard"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders the forgot password page", () => {
    render(
      <MemoryRouter
        initialEntries={["/forgot-password"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Reset password" })).toBeInTheDocument();
  });

  it("renders the update password page", () => {
    render(
      <MemoryRouter
        initialEntries={["/update-password"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Choose a new password" })).toBeInTheDocument();
  });
});
