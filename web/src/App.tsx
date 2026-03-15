import { Outlet, useLocation } from "react-router-dom";
import { PhoneFrame } from "./components/ui/PhoneFrame";
import { Nav5 } from "./components/ui/Nav5";
import { useCart } from "./hooks/useCart";
import { StorageService } from "./services/StorageService";
import "./styles/globals.css";

const TAB_PATHS = ["/home", "/agenda", "/cart", "/vote", "/profile"];

export default function App() {
  const location = useLocation();
  const { cart } = useCart();
  const showNav = TAB_PATHS.includes(location.pathname);

  // Check if onboarding is completed
  const topics = StorageService.loadTopics();
  const hasOnboarded = topics.size > 0 || localStorage.getItem("ethcc-onboarded") === "1";

  // Redirect to onboarding if not completed (handled in router, but as fallback)
  if (!hasOnboarded && location.pathname !== "/") {
    // We let the router handle this via the index route
  }

  return (
    <PhoneFrame>
      <Outlet />
      {showNav && <Nav5 cartCount={cart.size} />}
    </PhoneFrame>
  );
}
