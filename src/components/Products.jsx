// src/components/Products.jsx

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { useCart } from "../context/CartContext";
import Notification from "./Notification";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [notificationMessage, setNotificationMessage] = useState(null);

  const handleAddToCart = (product) => {
    addToCart(product);
    setNotificationMessage(`${product.nome} adicionado ao carrinho!`);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              // MODIFICAÇÃO: Adicionadas classes para transição e efeito hover
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2"
            >
              <img
                src={product.imagem}
                alt={product.nome}
                // MODIFICAÇÃO: Altura da imagem aumentada de h-80 para h-96
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
            </div>
          ))}
        </div>
      </div>
      {notificationMessage && <Notification message={notificationMessage} />}
    </section>
  );
}

export default Products;
