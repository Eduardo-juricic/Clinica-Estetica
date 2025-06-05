// src/pages/ServicesPage.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const services = [
  {
    id: "1",
    name: "Dermatologia", // Nome do serviço/especialidade
    professional:
      "Dr. André Luiz Goulart Galvão, Médico Dermatologista (CRM: 52511265)",
    description:
      "Atendimento especializado em dermatologia, incluindo consulta clínica e procedimentos estéticos.",
    details: ["Consulta clínica dermatológica", "Procedimentos estéticos"],
  },
  {
    id: "2",
    name: "Angiologia - Escleroterapia", // Nome do serviço/especialidade
    professional:
      "Dr. Frederico Antônio Piontkovsky, Médico Angiologista (CRM: 52775436)",
    description:
      "Tratamento de escleroterapia focado na aplicação de vasos e microvasos.",
    details: ["Escleroterapia (aplicação de vasos e micro vasos)"],
  },
];

function ServicesPageOption3() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonHoverVariants = {
    hover: {
      backgroundColor: "#047857", // emerald-800
      color: "#ffffff",
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    initial: {
      backgroundColor: "#10B981", // emerald-500
      color: "#ffffff",
    },
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center mb-8">
        <Link
          to="/"
          className="text-emerald-600 hover:text-emerald-800 transition duration-300 flex items-center"
        >
          <ArrowLeftIcon className="h-6 w-6 inline-block mr-2" />
          <span className="align-middle">Voltar para o Início</span>
        </Link>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-800 mb-10 text-center">
        Nossos Serviços Médicos
      </h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10" // Ajustado para lg:grid-cols-2 para melhor visualização com 2 cards
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {services.map((service) => (
          <motion.div
            key={service.id}
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col p-6"
            variants={itemVariants}
            whileHover={{
              y: -5,
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 className="text-2xl font-bold text-emerald-800 mb-2 text-center">
              {service.name}
            </h2>
            <p className="text-gray-500 text-md mb-4 text-center italic">
              {service.professional}
            </p>
            <p className="text-gray-700 mb-4 text-center flex-grow">
              {service.description}
            </p>
            <div className="mt-auto">
              <h3 className="text-lg font-semibold text-emerald-700 mb-2">
                Serviços Oferecidos:
              </h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1 text-sm">
                {service.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>
              <motion.button
                className="bg-emerald-500 text-white font-semibold py-3 px-6 rounded-full w-full
                          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
                variants={buttonHoverVariants}
                initial="initial"
                whileHover="hover"
              >
                Agendar Serviço
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default ServicesPageOption3;
