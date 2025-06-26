// src/components/Header.jsx

import logo from "/logo-gisele.jpg";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
// MELHORIA: Importando motion e AnimatePresence para as animações
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

// MELHORIA: Movendo os links de redes sociais para um array para um código mais limpo
const socialLinks = [
  {
    href: "https://www.instagram.com/gicarvalhoestetica",
    label: "Instagram",
    icon: FaInstagram,
    hoverColor: "hover:text-pink-500",
  },
  {
    href: "https://wa.me/message/BMZ37JTK3G6UJ1",
    label: "WhatsApp",
    icon: FaWhatsapp,
    hoverColor: "hover:text-green-500",
  },
];

function Header() {
  const { cartItems } = useCart();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 py-2 sm:py-3">
      <div className="container mx-auto flex items-center justify-between h-24 sm:h-30 px-4">
        {/* Ícones à Esquerda */}
        <div className="flex items-center space-x-4 w-1/3 justify-start">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              // MELHORIA: Adicionado aria-label para acessibilidade
              aria-label={`Visite nosso ${link.label}`}
              // MELHORIA: Adicionado efeito de hover sutil e transição
              className={`text-gray-500 ${link.hoverColor} transition-all duration-300 transform hover:scale-110`}
            >
              <link.icon className="h-6 w-6" />
            </a>
          ))}
        </div>

        {/* Logo Centralizado */}
        <Link to="/" className="block mx-auto" aria-label="Página Inicial">
          <motion.img
            src={logo}
            alt="Logo Gisele Carvalho"
            className="w-24 sm:w-28 md:w-36 h-auto"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </Link>

        {/* Ícone do Carrinho à Direita */}
        <div className="flex items-center w-1/3 justify-end">
          <Link
            to="/carrinho"
            // MELHORIA: Adicionado aria-label para acessibilidade
            aria-label={`Ver carrinho de compras com ${itemCount} itens`}
            className="text-gray-500 hover:text-emerald-500 transition-all duration-300 transform hover:scale-110 relative"
          >
            <ShoppingCartIcon className="h-7 w-7" />
            {/* MELHORIA: Animação no contador do carrinho */}
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount} // A chave muda para re-acionar a animação
                  className="absolute top-[-8px] right-[-10px] bg-pink-500 text-white rounded-full text-xs px-2 py-0.5 font-bold flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{
                    scale: 1,
                    transition: { type: "spring", stiffness: 400, damping: 15 },
                  }}
                  exit={{ scale: 0 }}
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
