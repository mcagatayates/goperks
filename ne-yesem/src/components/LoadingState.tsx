import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LOADING_MESSAGES } from "../data/options";

export function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-coral-100 border-t-coral-500 text-2xl"
      >
        🍽️
      </motion.div>
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-ink-soft"
      >
        {LOADING_MESSAGES[index]}
      </motion.p>
    </div>
  );
}
