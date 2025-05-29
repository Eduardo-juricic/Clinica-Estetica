// src/context/CartContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localCart = localStorage.getItem("cartItems");
      return localCart ? JSON.parse(localCart) : [];
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // ADICIONADO: observacaoItem e observacaoObrigatoria
        return [
          ...prevItems,
          {
            ...product,
            quantity: 1,
            observacaoItem: "", // Inicia vazio
            observacaoObrigatoria: product.observacaoObrigatoria || false, // Pega do produto
          },
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: parseInt(quantity, 10) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // NOVA FUNÇÃO para atualizar a observação de um item específico
  const updateItemObservation = useCallback((productId, observationText) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId
          ? { ...item, observacaoItem: observationText }
          : item
      )
    );
  }, []);

  const getTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const priceToConsider =
        item.preco_promocional && item.preco_promocional < item.preco
          ? item.preco_promocional
          : item.preco;
      const validPrice =
        typeof priceToConsider === "number" ? priceToConsider : 0;
      return total + validPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeItem,
        getTotal,
        clearCart,
        updateItemObservation, // ADICIONADO AO CONTEXTO
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
