// src/components/LocationInfo.jsx
import React from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Sparkles, Package, Loader } from "lucide-react";

// Informações que serão exibidas ao lado do mapa
const features = [
  {
    icon: <Heart className="w-8 h-8 text-emerald-500" />,
    title: "Cuidado Personalizado",
    description:
      "Cada tratamento é pensado para suas necessidades, garantindo uma experiência única e resultados que você ama.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
    title: "Qualidade e Segurança",
    description:
      "Utilizamos produtos de alta performance e equipamentos modernos, seguindo rigorosos padrões de segurança e higiene.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-emerald-500" />,
    title: "Ambiente Aconchegante",
    description:
      "Nossa clínica foi projetada para ser um refúgio de paz e bem-estar, onde você pode relaxar e se cuidar.",
  },
  {
    icon: <Package className="w-8 h-8 text-emerald-500" />,
    title: "Produtos Exclusivos",
    description:
      "Oferecemos uma seleção de produtos testados e aprovados por nossos especialistas para você continuar o cuidado em casa.",
  },
];

const LocationInfo = () => {
  // Hook da biblioteca para carregar o script do Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
  });

  // Estilos e configurações do mapa
  const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem", // a mesma borda do container
  };

  const center = {
    lat: -22.876093617537958, // Latitude aproximada de Araruama
    lng: -42.339579482464075, // Longitude aproximada de Araruama
  };

  const mapOptions = {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoomControl: false,
  };

  const renderMap = () => {
    if (loadError) {
      return <div>Erro ao carregar o mapa. Verifique a chave de API.</div>;
    }

    return isLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        options={mapOptions}
      >
        <MarkerF position={center} title="Clínica Estética Gisele Carvalho" />
      </GoogleMap>
    ) : (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
        <Loader className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-emerald-700 mb-4">
            Um Espaço Feito para Você
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Visite nosso espaço e sinta a dedicação e a arte que infundimos em
            cada tratamento e produto.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Coluna do Mapa */}
          <motion.div
            className="w-full h-80 md:h-96 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {renderMap()}
          </motion.div>

          {/* Coluna dos Benefícios */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.2, delayChildren: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start"
                variants={{
                  hidden: { opacity: 0, x: 30 },
                  visible: { opacity: 1, x: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex-shrink-0 bg-emerald-100 p-3 rounded-full">
                  {feature.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-emerald-800">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LocationInfo;
