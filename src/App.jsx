// src/App.jsx
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Products from "./components/Products";
import FeaturedProduct from "./components/FeaturedProduct";
import ServicesCallToAction from "./components/ServicesCallToAction";
import Footer from "./components/Footer";
import { getProdutoDestaque } from "./utils/firebaseUtils";
import LocationInfo from "./components/LocationInfo";

function App() {
  const [produtoDestaque, setProdutoDestaque] = useState(null);
  const [loadingDestaque, setLoadingDestaque] = useState(true);
  const [errorDestaque, setErrorDestaque] = useState(null);

  useEffect(() => {
    const buscarDestaque = async () => {
      setLoadingDestaque(true);
      setErrorDestaque(null);
      try {
        const destaque = await getProdutoDestaque();
        // Se 'destaque' for encontrado (não for nulo), ele é salvo no estado
        if (destaque) {
          setProdutoDestaque(destaque);
        } else {
          // Se for nulo, o estado 'produtoDestaque' continua como nulo
          console.log("Nenhum produto em destaque encontrado para exibir.");
        }
      } catch (error) {
        console.error("Erro ao buscar produto em destaque:", error);
        setErrorDestaque(error);
      } finally {
        setLoadingDestaque(false);
      }
    };

    buscarDestaque();
  }, []);

  if (loadingDestaque) {
    // Você pode criar um componente de "loading" mais elaborado se preferir
    return (
      <div className="min-h-screen flex items-center justify-center"></div>
    );
  }

  if (errorDestaque) {
    return <div>Erro ao carregar: {errorDestaque.message}</div>;
  }

  return (
    <>
      <Header />
      {/* O Hero continua recebendo o produto para o botão principal,
          ele já sabe lidar com o caso de não haver destaque. */}
      <Hero produtoDestaque={produtoDestaque} />
      <Products />
      <LocationInfo />
      <ServicesCallToAction />

      {/* ---- ESTA É A MUDANÇA PRINCIPAL ---- */}
      {/* O componente FeaturedProduct só será renderizado se 'produtoDestaque' não for nulo */}
      {produtoDestaque && <FeaturedProduct produtoDestaque={produtoDestaque} />}

      <Footer />
    </>
  );
}

export default App;
