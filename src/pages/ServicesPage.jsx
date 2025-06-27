// src/pages/ServicesPage.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const services = [
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
        Nossos Serviços Médicos e Estéticos
      </h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {services.map((service) => {
          // --- LÓGICA DO WHATSAPP ADICIONADA AQUI ---
          // IMPORTANTE: Substitua o número abaixo pelo da sua clínica
          const whatsappNumber = "5522988149005"; // Ex: 5521999998888
          const message = `Olá! Gostaria de agendar ou saber mais sobre o serviço de "${service.name}".`;
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            message
          )}`;

          console.log("URL Gerada:", whatsappUrl);

          return (
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
                <motion.a
                  href={whatsappUrl} // Usando a URL dinâmica
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-emerald-500 text-white font-semibold py-3 px-6 rounded-full w-full text-center
                            focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
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
  );
}

export default ServicesPage;
