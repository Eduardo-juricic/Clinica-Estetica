// ProductDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { FaShoppingCart, FaStar, FaTag } from "react-icons/fa"; // Seus imports originais
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion"; // Import para animação

function ProductDetails() {
  const { id } = useParams();
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const produtoRef = doc(db, "produtos", id);
        const docSnap = await getDoc(produtoRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduto(data);
          console.log("Dados do Produto:", data); // Mantido conforme seu original
        } else {
          setError("Produto não encontrado!");
        }
      } catch (err) {
        setError("Erro ao carregar detalhes do produto.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="product-details-loading-alt">
        Carregando detalhes do produto...
      </div>
    );
  }

  if (error) {
    return <div className="product-details-error-alt">Erro: {error}</div>;
  }

  if (!produto) {
    return (
      <div className="product-details-not-found-alt">
        Produto não encontrado.
      </div>
    );
  }

  const handleAddToCart = () => {
    if (produto) {
      addToCart(produto); // Adiciona o produto inteiro, sem quantidade específica aqui
      alert(`${produto.nome} adicionado ao carrinho!`); // Feedback original
      navigate("/carrinho");
    }
  };

  return (
    // Wrapper para controlar o tamanho e centralizar o card
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "0 1rem" }}>
      {" "}
      {/* Ajuste max-width e padding conforme necessário */}
      <motion.div
        className="product-details-card-alt" // Sua classe original para o card
        initial={{ opacity: 0, y: 50 }} // Estado inicial da animação
        animate={{ opacity: 1, y: 0 }} // Estado final da animação
        transition={{ duration: 0.6 }} // Duração da animação
      >
        <div className="product-image-container-alt">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="product-image-alt"
          />
        </div>
        <div className="product-details-info-alt">
          <h2 className="product-title-alt">{produto.nome}</h2>
          <div className="product-rating-alt">
            {" "}
            {/* Seção de estrelas original */}
            <FaStar className="star-icon-alt" />
            <FaStar className="star-icon-alt" />
            <FaStar className="star-icon-alt" />
            <FaStar className="star-icon-alt" />
            <FaStar className="star-icon-alt" />
          </div>
          <div className="product-price-container-alt">
            {" "}
            {/* Lógica de preço original */}
            {produto && produto.preco && produto.preco_promocional ? (
              <>
                {Number(produto.preco) > Number(produto.preco_promocional) ? (
                  <>
                    <span className="old-price-alt">
                      R$ {Number(produto.preco).toFixed(2)}
                    </span>
                    <span className="current-price-alt">
                      R$ {Number(produto.preco_promocional).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="old-price-alt">
                      {" "}
                      {/* Nota: Esta lógica pode precisar de revisão se o promocional não for menor */}
                      R$ {Number(produto.preco_promocional).toFixed(2)}
                    </span>
                    <span className="current-price-alt">
                      R$ {Number(produto.preco).toFixed(2)}
                    </span>
                  </>
                )}
              </>
            ) : produto && produto.preco ? (
              <span className="current-price-alt">
                R$ {Number(produto.preco).toFixed(2)}
              </span>
            ) : (
              <span className="current-price-alt">Preço não disponível</span>
            )}
          </div>
          <div className="quantity-controls-alt">
            <button
              onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
              className="quantity-button-alt"
            >
              -
            </button>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1) {
                  setQuantidade(value);
                } else if (e.target.value === "") {
                  setQuantidade(1); // Ou mantenha como está, ou defina para 1 se o campo for limpo
                }
              }}
              className="quantity-input-alt"
              min="1" // Adicionado min="1" por consistência
            />
            <button
              onClick={() => setQuantidade(quantidade + 1)}
              className="quantity-button-alt"
            >
              +
            </button>
          </div>
          <button
            className="bg-emerald-600 text-white hover:bg-emerald-300 font-bold py-3 px-8 rounded-full focus:outline-none focus:shadow-outline text-lg transition duration-300 mb-4"
            onClick={handleAddToCart}
          >
            Comprar
          </button>
          <p className="text-emerald-800">{produto.descricao}</p>
          {produto.destaque_curto && (
            <div className="features-section-alt">
              <h3 className="features-title-alt">Características</h3>
              <ul className="features-list-alt">
                {produto.destaque_curto.split(";").map((feature, index) => (
                  <li key={index} className="feature-item-alt">
                    • {feature.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Adicione mais detalhes ou componentes aqui */}
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetails;
