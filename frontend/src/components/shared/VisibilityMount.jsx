import React, { useEffect, useRef, useState } from "react";

const VisibilityMount = ({ children, rootMargin = "200px", threshold = 0.1, once = true, placeholder = null }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin, threshold, once]);
  return (
    <div ref={ref}>
      {visible ? children : (placeholder ?? <div style={{ height: 1 }} />)}
    </div>
  );
};

export default VisibilityMount;
