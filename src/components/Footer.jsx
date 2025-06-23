import { FaInstagram, FaWhatsapp } from "react-icons/fa"; // Ícones populares do Font Awesome

function Footer() {
  return (
    <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm">
      <div className="container mx-auto flex flex-col items-center">
        {/* Copyright */}
        <p className="mb-3">© {new Date().getFullYear()} Gisele Carvalho</p>

        {/* Redes Sociais */}
        <div className="flex space-x-4">
          <a href="#" className="hover:text-pink-500">
            <FaInstagram className="h-5 w-5" />
          </a>
          <a
            href="https://wa.me/message/BMZ37JTK3G6UJ1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-green-500 transition duration-300"
          >
            <FaWhatsapp className="h-6 w-6" />
          </a>
        </div>
        {/* Outras informações (opcional) */}
        <p className="mt-3 text-xs">
          Avenida Nilo Peçanha nº167 sala 212 - Araruama, RJ
        </p>
      </div>
    </footer>
  );
}

export default Footer;
