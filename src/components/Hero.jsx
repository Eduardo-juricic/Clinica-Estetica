// src/components/Hero.jsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { ChevronDown, Sparkle } from "lucide-react";

// Componente para uma faísca individual, adaptado para o tema esmeralda
const EmeraldSparkle = ({ initialX, initialY, delay, size }) => {
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        width: `${size}px`,
        height: `${size}px`,
        color: "#E6FFFA", // Cor de menta/esmeralda claro para as faíscas
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0.5, 1, 0], scale: [0.5, 1.2, 0.7, 1.1, 0.5] }}
      transition={{
        duration: Math.random() * 1.5 + 1.5,
        repeat: Infinity,
        repeatDelay: Math.random() * 2 + 1,
        delay: delay,
        ease: "easeInOut",
      }}
    >
      <Sparkle className="w-full h-full" fill="currentColor" />
    </motion.div>
  );
};

function Hero({ produtoDestaque }) {
  // Variantes de animação do componente de referência
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const titleWordVariants = {
    hidden: { opacity: 0, y: "100%" },
    visible: (i) => ({
      opacity: 1,
      y: "0%",
      transition: { delay: i * 0.08, duration: 0.7, ease: [0.42, 0, 0.58, 1] },
    }),
  };

  const itemVariants = (delay = 0) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay },
    },
  });

  // Geração de dados para as faíscas
  const numSparkles = 40;
  const sparklesData = useMemo(() => {
    return Array.from({ length: numSparkles }).map(() => ({
      id: Math.random().toString(36).substring(7),
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 8 + 4,
    }));
  }, []);

  const titleText = "Realce Sua Beleza Autêntica";
  const subtitleText =
    "Descubra a nossa seleção exclusiva de produtos para uma rotina de cuidados que celebra a sua individualidade.";

  // Função para renderizar o corpo do Hero (evita repetição de código)
  const renderHeroContent = (button) => (
    <section
      // MODIFICAÇÃO: Altura ajustada para 70vh e altura mínima para 500px
      className="relative h-[70vh] min-h-[500px] flex flex-col items-center
                 justify-center text-center overflow-hidden bg-gradient-to-br
                 from-emerald-400 to-emerald-800 text-white"
    >
      {/* Camada de Faíscas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {sparklesData.map(({ id, initialX, initialY, delay, size }) => (
          <EmeraldSparkle
            key={id}
            initialX={initialX}
            initialY={initialY}
            delay={delay}
            size={size}
          />
        ))}
      </div>

      {/* Conteúdo Principal */}
      <motion.div
        className="relative z-10 p-6 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
          {titleText.split(" ").map((word, index) => (
            <span
              key={index}
              className="inline-block overflow-hidden pb-2 mr-2 sm:mr-3"
            >
              <motion.span
                custom={index}
                variants={titleWordVariants}
                className="inline-block"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md"
          variants={itemVariants(0.5)}
        >
          {subtitleText}
        </motion.p>

        <motion.div variants={itemVariants(0.8)}>{button}</motion.div>
      </motion.div>

      {/* Ícone de Chevron animado */}
      <motion.div
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 2.5,
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        <ChevronDown size={38} className="text-emerald-200 drop-shadow-lg" />
      </motion.div>
    </section>
  );

  // Lógica para determinar qual botão usar
  if (!produtoDestaque || !produtoDestaque.id) {
    const fallbackButton = (
      <Link to="/">
        <motion.button
          className="bg-white text-emerald-600 hover:bg-emerald-100 font-bold py-4 px-10 rounded-full text-xl shadow-lg"
          whileHover={{
            scale: 1.05,
            transition: { type: "spring", stiffness: 300 },
          }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todos os produtos
        </motion.button>
      </Link>
    );
    return renderHeroContent(fallbackButton);
  }

  const mainButton = (
    <Link to={`/produto/${produtoDestaque.id}`}>
      <motion.button
        className="bg-white text-emerald-600 hover:bg-emerald-100 font-bold py-4 px-10 rounded-full text-xl shadow-lg"
        whileHover={{
          scale: 1.05,
          transition: { type: "spring", stiffness: 300 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        Veja a Promoção do Mês
      </motion.button>
    </Link>
  );

  return renderHeroContent(mainButton);
}

export default Hero;
