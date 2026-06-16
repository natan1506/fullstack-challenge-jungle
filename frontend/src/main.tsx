import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

const oidcConfig = {
  authority: "http://localhost:8080/realms/crash-game",
  client_id: "crash-game-client",
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
