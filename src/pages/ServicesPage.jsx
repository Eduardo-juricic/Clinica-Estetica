// src/pages/ServicesPage.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import ConstellationCanvas from "../components/ConstellationCanvas";

const services = [
  // ... (a lista de serviços continua a mesma, com a Dra. Gisele no topo)
  {
    id: "8",
    name: "Biomedicina Estética e Fisioterapia Dermato Funcional",
    professional:
      "Dra. Gisele Gonçalves de Carvalho, Biomédica Esteta e Fisioterapeuta Dermato Funcional (CRBM1: 36353)",
    description:
      "Tratamentos avançados em biomedicina estética e fisioterapia dermato funcional para promover a saúde e a beleza da sua pele, com foco em resultados e bem-estar.",
    details: [
      "Avaliação Dermato Funcional",
      "Tratamentos para Gordura Localizada",
      "Redução de Celulite e Estrias",
      "Rejuvenescimento Facial",
      "Peelings e Limpeza de Pele Profunda",
      "Pós-operatório de Cirurgias Plásticas",
    ],
  },
  {
    id: "1",
    name: "Dermatologia",
    professional:
      "Dr. André Luiz Goulart Galvão, Médico Dermatologista (CRM: 52511265)",
    description:
      "Atendimento especializado em dermatologia, incluindo consulta clínica e procedimentos estéticos.",
    details: ["Consulta clínica dermatológica", "Procedimentos estéticos"],
  },
  {
    id: "2",
    name: "Angiologia - Escleroterapia",
    professional:
      "Dr. Frederico Antônio Piontkovsky, Médico Angiologista (CRM: 52775436)",
    description:
      "Tratamento de escleroterapia focado na aplicação de vasos e microvasos.",
    details: ["Escleroterapia (aplicação de vasos e micro vasos)"],
  },
  {
    id: "3",
    name: "Estética Facial e Corporal",
    professional:
      "Alessandra Petronilho, Tecnóloga em Estética e Micropigmentadora",
    description:
      "Serviços especializados em micropigmentação, design de sobrancelhas, cílios, depilação e tratamentos faciais para realçar sua beleza.",
    details: [
      "Micropigmentação (olhos, lábios e sobrancelhas)",
      "Designer de sobrancelhas",
      "Extensão de cílios",
      "Limpeza de pele",
      "Depilação com cera",
      "Lash lifting",
      "Brown lamination",
      "Máscara enzimática",
      "Nutrição facial",
    ],
  },
  {
    id: "4",
    name: "Fisioterapia Pélvica e Abdominal",
    professional:
      "Dra. Nicole Cantuária, Fisioterapeuta Pélvica (Crefito nº 261151-F)",
    description:
      "Atendimento especializado para mulheres que desejam fechar a diástase, reduzir a flacidez abdominal, aliviar dores e tratar a incontinência urinária, além de um acompanhamento completo para gestantes e no pós-parto.",
    details: [
      "Reabilitação Abdominal e Pélvica (diástase, flacidez, dores, incontinência)",
      "Gestantes: Prevenção e Preparo para o Parto",
      "Pós-Parto: Recuperação focada na diástase e fortalecimento",
      "Alívio de dores na lombar, pelve e coluna",
      "Melhora da respiração e consciência corporal",
    ],
  },
  {
    id: "5",
    name: "Ozonioterapia e Saúde Integrativa",
    professional: "Mari Helena Gonçalves de Carvalho (CRBio-2 12469/02)",
    description:
      "Profissional com mestrado em Saúde Pública e múltiplas pós-graduações, incluindo Saúde e Estética e Ozonioterapia, oferecendo uma abordagem integrativa e qualificada.",
    details: [
      "Mestre em Saúde Pública/Saúde da Família",
      "Pós-graduação em Saúde e Estética",
      "Pós-graduação em Gestão e Sistemas de Serviço em Saúde",
      "Pós-graduação em Hemoterapia",
      "Ozônioterapeuta",
    ],
  },
  {
    id: "6",
    name: "Harmonização Facial e Corporal",
    professional: "Dra. Talita Figueiredo, Especialista (CRF: 19970)",
    description:
      "Especialista em harmonização facial e corporal, oferecendo uma vasta gama de procedimentos para realçar sua beleza e promover o bem-estar.",
    details: [
      "Preenchimento com Ácido Hialurônico",
      "Toxina Botulínica",
      "Bioestimuladores de Colágeno",
      "Fios de PDO",
      "Lipoenzimática",
      "Microagulhamento",
      "Peelings",
      "Lasers",
      "Ultrassom Microfocado",
      "Criolipólise",
      "Ezbody",
    ],
  },
  {
    id: "7",
    name: "Psicologia Clínica",
    professional: "Gleice Alves, Psicóloga Clínica (CRP 23996-05)",
    description:
      "Oferecendo suporte psicológico através da abordagem da Terapia Cognitivo-Comportamental (TCC) para auxiliar no bem-estar e saúde mental.",
    details: ["Terapia Cognitivo-Comportamental (TCC)"],
  },
];

function ServicesPage() {
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
    hidden: { opacity: 0, y: 50, rotate: -2 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const buttonHoverVariants = {
    initial: {
      scale: 1,
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <div className="relative overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0 opacity-50">
        <ConstellationCanvas />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="text-emerald-400 hover:text-emerald-200 transition duration-300 flex items-center"
          >
            <ArrowLeftIcon className="h-6 w-6 inline-block mr-2" />
            <span className="align-middle">Voltar para o Início</span>
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-10 text-center">
          Nossos Serviços Médicos e Estéticos
        </h1>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10"
          variants={containerVariants}
        >
          {services.map((service) => {
            const whatsappNumber = "5522988149005";
            const message = `Olá! Gostaria de agendar o serviço de ${service.name}.`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              message
            )}`;

            return (
              <motion.div
                key={service.id}
                className="bg-gray-800/60 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col p-6"
                variants={itemVariants}
                whileHover={{
                  y: -5,
                  boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
                }}
              >
                {/* Agrupa todo o conteúdo que deve ficar no topo */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    {service.name}
                  </h2>
                  <p className="text-gray-400 text-md mb-4 text-center italic">
                    {service.professional}
                  </p>
                  <p className="text-gray-300 mb-4 text-center">
                    {service.description}
                  </p>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                    Serviços Oferecidos:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 text-sm">
                    {service.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>

                {/* Este 'div' vazio com 'flex-grow' é o espaçador. Ele vai empurrar o botão para baixo. */}
                <div className="flex-grow" />

                {/* O botão fica no final, sem a necessidade de 'mt-auto' */}
                <div className="pt-4">
                  {" "}
                  {/* pt-4 para dar um espaço acima do botão */}
                  <motion.a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-emerald-500 text-white font-semibold py-3 px-6 rounded-full w-full text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
                    variants={buttonHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    Agendar Serviço
                  </motion.a>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ServicesPage;
