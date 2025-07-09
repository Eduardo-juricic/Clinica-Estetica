// src/components/FeaturedProduct.jsx

import React from "react";
import featuredProductImagePlaceholder from "/src/assets/imagem-destaque.jpg";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// O componente agora recebe 'produtoDestaque' como uma propriedade (prop)
function FeaturedProduct({ produtoDestaque }) {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Variantes de animação (sem alterações aqui)
  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.4 },
    },
  };

  return (
    // A seção inteira só será renderizada se 'produtoDestaque' existir
    <section
      ref={sectionRef}
      className="py-16 bg-gradient-to-br from-emerald-700 to-emerald-300 md:py-24 text-white text-center overflow-hidden"
    >
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          className="text-4xl font-semibold text-white mb-8"
          variants={titleVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
        >
          Promoção do Mês
        </motion.h1>

        <motion.div
          className="bg-white rounded-xl shadow-xl overflow-hidden max-w-3xl mx-auto md:flex md:items-center"
          variants={cardVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
        >
          <img
            // Usa a imagem do produto ou um placeholder se a imagem não existir no produto
            src={produtoDestaque.imagem || featuredProductImagePlaceholder}
            alt={produtoDestaque.nome}
            className="w-full h-64 object-cover md:w-1/2 md:h-auto rounded-t-xl md:rounded-l-xl md:rounded-t-none"
            style={{ maxHeight: "450px" }}
          />
          <div className="p-6 md:p-10 md:w-1/2 text-center md:text-left">
            <h3 className="text-2xl lg:text-3xl font-semibold text-emerald-800 mb-2">
              {produtoDestaque.nome}
            </h3>
            <p className="text-md lg:text-lg text-gray-700 mb-4">
              {produtoDestaque.destaque_curto || produtoDestaque.descricao}
            </p>
            <p className="text-xl lg:text-2xl font-bold text-pink-700 mb-6">
              R$ {Number(produtoDestaque.preco).toFixed(2)}
            </p>
            <Link
              to={`/produto/${produtoDestaque.id}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full focus:outline-none focus:shadow-outline text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Ver Detalhes
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturedProduct;
