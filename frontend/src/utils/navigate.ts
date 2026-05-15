let navigateFn: ((path: string) => void) | null = null;

export const setNavigateFn = (fn: (path: string) => void) => {
  navigateFn = fn;
};

export const navigate = (path: string) => {
  if (navigateFn) {
    navigateFn(path);
  } else {
    window.location.href = path;
  }
};
