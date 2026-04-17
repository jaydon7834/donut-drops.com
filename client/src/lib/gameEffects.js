export function triggerGameEffect(type, options = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("donutrain:game-effect", {
      detail: {
        type,
        ...options
      }
    })
  );
}
