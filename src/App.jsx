// App.jsx
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Products from "./components/Products";
import FeaturedProduct from "./components/FeaturedProduct";
import ServicesCallToAction from "./components/ServicesCallToAction"; // Importe o novo componente
import Footer from "./components/Footer";
import { getProdutoDestaque } from "./utils/firebaseUtils"; // Importe a função
import LocationInfo from "./components/LocationInfo";

function App() {
  const [produtoDestaque, setProdutoDestaque] = useState(null);
  const [loadingDestaque, setLoadingDestaque] = useState(true);
  const [errorDestaque, setErrorDestaque] = useState(null);

  useEffect(() => {
    const buscarDestaque = async () => {
      setLoadingDestaque(true);
      setErrorDestaque(null);
      const destaque = await getProdutoDestaque();
      if (destaque) {
        setProdutoDestaque(destaque);
      } else {
        console.log("Nenhum produto em destaque encontrado.");
        // Você pode definir um estado padrão aqui se quiser
        // setProdutoDestaque({ id: 'default', /* outras propriedades */ });
      }
      setLoadingDestaque(false);
    };

    buscarDestaque();
  }, []);

  if (loadingDestaque) {
    return <div>Carregando...</div>;
  }

  if (errorDestaque) {
    return <div>Erro ao carregar: {errorDestaque.message}</div>;
  }

  return (
    <>
      <Header />
      <Hero produtoDestaque={produtoDestaque} />{" "}
      {/* Passe a prop para o Hero */}
      <Products />
      <LocationInfo />
      <ServicesCallToAction />
      <FeaturedProduct />{" "}
      {/* O FeaturedProduct também fará sua própria busca */}
      <Footer />
    </>
  );
}

export default App;
