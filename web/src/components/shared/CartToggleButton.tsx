import { C } from "../../config/theme";
import { Ic } from "../ui/Icons";
import styles from "./CartToggleButton.module.css";

type State = "default" | "incart" | "published";

interface Props {
  state: State;
  onClick: () => void;
}

/**
 * Reusable cart toggle button with 3 states:
 * - default: round gray + icon
 * - incart: pill "In cart" with peach bg
 * - published: round green check
 */
export function CartToggleButton({ state, onClick }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  if (state === "published") {
    return (
      <button className={styles.roundPublished} onClick={handleClick}>
        <Ic.Check s={16} c={C.success} />
      </button>
    );
  }

  if (state === "incart") {
    return (
      <button className={styles.pill} onClick={handleClick}>
        In cart
      </button>
    );
  }

  return (
    <button className={styles.roundDefault} onClick={handleClick}>
      <Ic.Plus s={16} c={C.textSecondary} />
    </button>
  );
}
