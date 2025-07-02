// src/components/Products.jsx

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { useCart } from "../context/CartContext";
import Notification from "./Notification";
import { motion } from "framer-motion";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [notificationMessage, setNotificationMessage] = useState(null);

  // MODIFICAÇÃO: containerVariants não é mais necessário.
  // A variante do item agora aceita um índice (i) para o delay.
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    // A variante "visible" agora é uma função que recebe o índice personalizado.
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        // O atraso é calculado com base no índice do item para criar o efeito escalonado.
        delay: i * 0.07,
      },
    }),
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setNotificationMessage(`${product.nome} adicionado ao carrinho!`);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "produtos");
        const snapshot = await getDocs(productsRef);
        const productsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const produtosNormais = productsList.filter(
          (product) => !product.destaque
        );
        setProducts(produtosNormais);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Carregando produtos...</div>;
  }

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-6 text-emerald-700 text-center">
          Nossos Produtos
        </h2>
        {/* MODIFICAÇÃO: A animação foi removida do container e ele voltou a ser uma div normal. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Adicionamos 'index' ao map para usá-lo na animação. */}
          {products.map((product, index) => (
            // MODIFICAÇÃO: A animação agora é controlada individualmente por cada card.
            <motion.div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              // A animação dispara quando 20% do card está visível, o que é mais confiável.
              viewport={{ once: true, amount: 0.2 }}
              // Passa o 'index' como uma propriedade personalizada para as variantes.
              custom={index}
              whileHover={{
                y: -8,
                boxShadow:
                  "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* O conteúdo do card permanece o mesmo */}
              <img
                src={product.imagem}
                alt={product.nome}
                className="w-full h-96 object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="font-semibold text-emerald-800 text-center mb-3 text-lg">
                    {product.nome}
                  </h3>
                  <p className="text-emerald-800 text-sm text-center mb-4">
                    {product.descricao}
                  </p>
                </div>
                <div className="text-center mt-auto">
                  <p className="text-emerald-600 font-bold text-xl mb-5">
                    R$ {product.preco.toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-emerald-600 text-white hover:bg-emerald-300 font-bold py-3 px-8 rounded-full focus:outline-none focus:shadow-outline text-sm"
                  >
                    Comprar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {notificationMessage && <Notification message={notificationMessage} />}
    </section>
  );
}

export default Products;
