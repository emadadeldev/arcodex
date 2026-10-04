(() => {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  document.addEventListener("selectstart", (event) => {
    event.preventDefault();
  });

  document.addEventListener("copy", (event) => {
    event.preventDefault();
  });

  document.addEventListener("cut", (event) => {
    event.preventDefault();
  });

  document.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (event.key === "F12") {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      event.shiftKey &&
      key === "i"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      event.shiftKey &&
      key === "j"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      event.shiftKey &&
      key === "c"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      key === "u"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      key === "s"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      key === "c"
    ) {
      event.preventDefault();
      return;
    }
    if (
      event.ctrlKey &&
      key === "x"
    ) {
      event.preventDefault();
      return;
    }
  });
})();