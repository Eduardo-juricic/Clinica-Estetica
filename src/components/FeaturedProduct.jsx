// FeaturedProduct.jsx
import React, { useState, useEffect } from "react";
import featuredProductImagePlaceholder from "/src/assets/imagem-destaque.jpg";
import { getProdutoDestaque } from "../utils/firebaseUtils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer"; // Importe o hook

// Defina o produto padrão fora do componente para melhor organização
const DEFAULT_PRODUCT = {
  id: "default-product",
  name: "Produto Exclusivo Padrão",
  description:
    "Experimente a diferença com nossa fórmula avançada e exclusiva.",
  price: "R$ 149,90",
  imagem: featuredProductImagePlaceholder,
  destaque_curto: "Uma breve chamada sobre o produto em destaque.",
};

function FeaturedProduct() {
  const [produtoDestaque, setProdutoDestaque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook para detectar quando o elemento está na viewport
  // triggerOnce: true fará a animação rodar apenas uma vez
  // threshold: 0.1 significa que a animação vai disparar quando 10% do elemento estiver visível
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1, // Ajuste conforme necessário (0 a 1)
  });

  useEffect(() => {
    const buscarDestaque = async () => {
      setLoading(true);
      setError(null);
      try {
        const destaque = await getProdutoDestaque();
        if (destaque) {
          setProdutoDestaque(destaque);
        } else {
          console.warn(
            "Nenhum produto em destaque encontrado. Usando produto padrão."
          );
          setProdutoDestaque(DEFAULT_PRODUCT);
        }
      } catch (err) {
        console.error("Erro ao buscar produto em destaque:", err);
        setError(err);
        setProdutoDestaque(DEFAULT_PRODUCT);
      } finally {
        setLoading(false);
      }
    };

    buscarDestaque();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 text-emerald-700">
        {" "}
        {/* Aumentei o h para dar espaço para rolar */}
        Carregando produto em destaque...
      </div>
    );
  }

  if (error && !produtoDestaque) {
    return (
      <div className="text-center py-10 text-red-500 h-96">
        Erro ao carregar. Tente novamente mais tarde.
      </div>
    );
  }

  if (!produtoDestaque) {
    return (
      <div className="text-center py-10 text-gray-500 h-96">
        Nenhum produto em destaque para exibir no momento.
      </div>
    );
  }

  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 }, // Pequeno delay para o título
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.4 }, // Delay um pouco maior para o card
    },
  };

  return (
    // Aplicamos o ref aqui para observar a seção inteira
    <section
      ref={sectionRef}
      className="py-16 bg-gradient-to-br from-emerald-700 to-emerald-300 md:py-24 text-white text-center overflow-hidden"
    >
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          className="text-4xl font-semibold text-white mb-8"
          variants={titleVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"} // Anima quando sectionInView é true
        >
          Promoção do Mês
        </motion.h1>

        <motion.div
          className="bg-white rounded-xl shadow-xl overflow-hidden max-w-3xl mx-auto md:flex md:items-center"
          variants={cardVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"} // Anima quando sectionInView é true
        >
          <img
            src={produtoDestaque.imagem || featuredProductImagePlaceholder}
            alt={produtoDestaque.name}
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
              {produtoDestaque.price}
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
