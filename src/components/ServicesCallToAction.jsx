// src/components/ServicesCallToAction.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

function ServicesCallToAction() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5, // <<<<<<< AJUSTE AQUI: Tente com 0.3, 0.5, ou até 0.75
  });

  // ... (resto do seu código ServicesCallToAction.jsx permanece o mesmo)
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    initial: { scale: 1, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)" },
    hover: {
      scale: 1.03,
      boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <motion.section
      ref={ref}
      className="bg-slate-50 py-20 md:py-32 text-center overflow-hidden"
      variants={sectionVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <div className="container mx-auto px-6">
        <motion.div variants={itemVariants} className="mb-6">
          <SparklesIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        </motion.div>

        <motion.h2
          className="text-4xl md:text-5xl font-bold text-emerald-700 mb-6 leading-tight"
          variants={itemVariants}
        >
          Transforme Sua Beleza, Eleve Seu Bem-Estar
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12"
          variants={itemVariants}
        >
          Explore nossa gama de serviços estéticos e terapêuticos, criados
          especialmente para realçar sua beleza natural e promover um profundo
          sentimento de renovação.
        </motion.p>

        <motion.div variants={itemVariants}>
          <Link to="/servicos">
            <motion.button
              className="bg-emerald-600 text-white font-semibold py-4 px-10 rounded-lg text-lg shadow-md
                        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75
                        inline-flex items-center space-x-2"
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <span>Conheça Nossos Serviços</span>
              <ArrowRightIcon className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default ServicesCallToAction;
