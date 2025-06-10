// src/pages/Admin.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../FirebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const Admin = () => {
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    imagem: null,
    currentImageUrl: "",
    destaque_curto: "",
    preco_promocional: "",
    observacaoObrigatoria: false,
    peso: "",
    altura: "",
    largura: "",
    comprimento: "",
  });
  const [editandoId, setEditandoId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloud_name: "",
    upload_preset: "",
  });
  const [showOrders, setShowOrders] = useState(false);

  const navigate = useNavigate();
  const produtosRef = collection(db, "produtos");
  const pedidosRef = collection(db, "pedidos");

  const buscarProdutos = async () => {
    const snapshot = await getDocs(produtosRef);
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProdutos(lista);
  };

  const buscarPedidos = async () => {
    try {
      const snapshot = await getDocs(pedidosRef);
      const listaPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      listaPedidos.sort((a, b) => {
        const dateA = a.dataCriacao?.toDate();
        const dateB = b.dataCriacao?.toDate();
        if (dateA && dateB) return dateB - dateA;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      });
      setPedidos(listaPedidos);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  useEffect(() => {
    buscarProdutos();
    buscarPedidos();
    const configRef = doc(db, "config", "cloudinary");
    getDoc(configRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setCloudinaryConfig(docSnap.data());
        } else {
          console.log("Config do Cloudinary não encontrada.");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar config do Cloudinary:", error);
      });
  }, []);

  const handleFileChange = (e) => {
    setForm({ ...form, imagem: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = form.currentImageUrl;
      if (form.imagem) {
        const formData = new FormData();
        formData.append("file", form.imagem);
        formData.append(
          "upload_preset",
          cloudinaryConfig.upload_preset || "produtos_upload"
        );
        formData.append("folder", "produtos");
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${
            cloudinaryConfig.cloud_name || "dtbvkmxy9"
          }/image/upload`,
          { method: "POST", body: formData }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Erro do Cloudinary: ${
              errorData.error?.message || response.statusText
            }`
          );
        }
        const data = await response.json();
        imageUrl = data.secure_url;
      }

      const produtoData = {
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco),
        imagem: imageUrl,
        destaque_curto: form.destaque_curto,
        preco_promocional: form.preco_promocional
          ? Number(form.preco_promocional)
          : 0,
        observacaoObrigatoria: form.observacaoObrigatoria || false,
        peso: Number(form.peso),
        altura: Number(form.altura),
        largura: Number(form.largura),
        comprimento: Number(form.comprimento),
      };

      if (editandoId) {
        const ref = doc(db, "produtos", editandoId);
        await updateDoc(ref, produtoData);
        setEditandoId(null);
      } else {
        await addDoc(produtosRef, produtoData);
      }

      setForm({
        nome: "",
        descricao: "",
        preco: "",
        imagem: null,
        currentImageUrl: "",
        destaque_curto: "",
        preco_promocional: "",
        observacaoObrigatoria: false,
        peso: "",
        altura: "",
        largura: "",
        comprimento: "",
      });
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = "";
      }
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao enviar produto:", error);
      alert(`Erro ao processar produto: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deletar = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      const ref = doc(db, "produtos", id);
      await deleteDoc(ref);
      buscarProdutos();
    }
  };

  const deletarPedido = async (id) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o pedido ID: ${id}? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        const pedidoDocRef = doc(db, "pedidos", id);
        await deleteDoc(pedidoDocRef);
        buscarPedidos();
      } catch (error) {
        console.error(`Erro ao excluir pedido ${id}:`, error);
      }
    }
  };

  const editar = (produto) => {
    setForm({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      imagem: null,
      currentImageUrl: produto.imagem || "",
      destaque_curto: produto.destaque_curto || "",
      preco_promocional: produto.preco_promocional || "",
      observacaoObrigatoria: produto.observacaoObrigatoria || false,
      peso: produto.peso || "",
      altura: produto.altura || "",
      largura: produto.largura || "",
      comprimento: produto.comprimento || "",
      id: produto.id,
    });
    setEditandoId(produto.id);
    window.scrollTo(0, 0);
  };

  const definirDestaque = async (id) => {
    const produtoParaAtualizar = produtos.find((p) => p.id === id);
    const novoEstadoDestaque = !produtoParaAtualizar?.destaque;
    const updatesBatch = [];
    produtos.forEach((p) => {
      if (p.destaque && p.id !== id) {
        const ref = doc(db, "produtos", p.id);
        updatesBatch.push(updateDoc(ref, { destaque: false }));
      }
    });
    const refProdutoClicado = doc(db, "produtos", id);
    updatesBatch.push(
      updateDoc(refProdutoClicado, { destaque: novoEstadoDestaque })
    );
    await Promise.all(updatesBatch);
    buscarProdutos();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Painel Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200 shadow"
        >
          Sair
        </button>
      </div>

      <div className="mt-10">
        <div
          className="flex justify-between items-center mb-6 cursor-pointer"
          onClick={() => setShowOrders(!showOrders)}
        >
          <h2 className="text-2xl font-semibold text-gray-700">
            Pedidos Recebidos
          </h2>
          {showOrders ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-700" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-700" />
          )}
        </div>
        {showOrders && (
          <div className="space-y-6">
            {pedidos.length === 0 ? (
              <p className="text-gray-600">Nenhum pedido recebido ainda.</p>
            ) : (
              pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="border p-6 rounded-lg shadow-lg bg-white"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-blue-700 mb-2 sm:mb-0">
                      Pedido ID: {pedido.id}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Data:{" "}
                      {pedido.dataCriacao?.toDate
                        ? pedido.dataCriacao.toDate().toLocaleString("pt-BR")
                        : "N/A"}
                    </span>
                  </div>
                  {/* Outros detalhes do pedido */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => deletarPedido(pedido.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Excluir Pedido
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 mb-10 p-6 border rounded-lg shadow-lg bg-white"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {editandoId ? "Editar Produto" : "Adicionar Novo Produto"}
        </h2>
        <textarea
          type="text"
          placeholder="Nome do Produto"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          placeholder="Descrição detalhada"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="border p-2 w-full rounded h-24"
          required
        />
        <input
          type="number"
          placeholder="Preço (ex: 99.99)"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })}
          className="border p-2 w-full rounded"
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Preço Promocional (opcional)"
          value={form.preco_promocional}
          onChange={(e) =>
            setForm({ ...form, preco_promocional: e.target.value })
          }
          className="border p-2 w-full rounded"
          step="0.01"
        />
        <textarea
          type="text"
          placeholder="Características (separadas por ;)"
          value={form.destaque_curto}
          onChange={(e) => setForm({ ...form, destaque_curto: e.target.value })}
          className="border p-2 w-full rounded h-20"
        />
        <div className="flex items-center my-4">
          <input
            type="checkbox"
            id="observacaoObrigatoria"
            name="observacaoObrigatoria"
            checked={form.observacaoObrigatoria || false}
            onChange={(e) =>
              setForm({ ...form, observacaoObrigatoria: e.target.checked })
            }
            className="mr-2 h-5 w-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label
            htmlFor="observacaoObrigatoria"
            className="text-sm font-medium text-gray-700"
          >
            Observação obrigatória?
          </label>
        </div>
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Dimensões para Frete
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Esses valores são essenciais para o cálculo preciso do frete.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="peso"
                className="block text-sm font-medium text-gray-700"
              >
                Peso (kg)
              </label>
              <input
                id="peso"
                type="number"
                placeholder="Ex: 0.3"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
                className="border p-2 w-full rounded mt-1"
                step="0.01"
                required
              />
            </div>
            <div>
              <label
                htmlFor="altura"
                className="block text-sm font-medium text-gray-700"
              >
                Altura (cm)
              </label>
              <input
                id="altura"
                type="number"
                placeholder="Ex: 5"
                value={form.altura}
                onChange={(e) => setForm({ ...form, altura: e.target.value })}
                className="border p-2 w-full rounded mt-1"
                step="0.1"
                required
              />
            </div>
            <div>
              <label
                htmlFor="largura"
                className="block text-sm font-medium text-gray-700"
              >
                Largura (cm)
              </label>
              <input
                id="largura"
                type="number"
                placeholder="Ex: 15"
                value={form.largura}
                onChange={(e) => setForm({ ...form, largura: e.target.value })}
                className="border p-2 w-full rounded mt-1"
                step="0.1"
                required
              />
            </div>
            <div>
              <label
                htmlFor="comprimento"
                className="block text-sm font-medium text-gray-700"
              >
                Comprimento (cm)
              </label>
              <input
                id="comprimento"
                type="number"
                placeholder="Ex: 15"
                value={form.comprimento}
                onChange={(e) =>
                  setForm({ ...form, comprimento: e.target.value })
                }
                className="border p-2 w-full rounded mt-1"
                step="0.1"
                required
              />
            </div>
          </div>
        </div>
        <label className="block text-sm font-medium text-gray-700 mt-2">
          Imagem do Produto:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border p-2 w-full rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {form.currentImageUrl && (
          <div className="mt-2">
            <img
              src={form.currentImageUrl}
              alt="Imagem atual"
              className="h-20 w-20 object-cover rounded-md border"
            />
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-3 rounded-lg hover:bg-blue-700"
          disabled={uploading}
        >
          {uploading
            ? "Enviando..."
            : editandoId
            ? "Atualizar Produto"
            : "Adicionar Produto"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setForm({
                nome: "",
                descricao: "",
                preco: "",
                imagem: null,
                currentImageUrl: "",
                destaque_curto: "",
                preco_promocional: "",
                observacaoObrigatoria: false,
                peso: "",
                altura: "",
                largura: "",
                comprimento: "",
              });
            }}
            className="bg-gray-400 text-white w-full py-3 rounded-lg mt-2 hover:bg-gray-500"
          >
            Cancelar Edição
          </button>
        )}
      </form>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Produtos Cadastrados
        </h2>
        <div className="space-y-4">
          {produtos.length === 0 ? (
            <p className="text-gray-600">Nenhum produto cadastrado ainda.</p>
          ) : (
            produtos.map((produto) => (
              <div
                key={produto.id}
                className="border p-4 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between bg-white hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto flex-grow">
                  {produto.imagem && (
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="h-28 w-28 object-cover mr-4 rounded-lg flex-shrink-0 border"
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="font-bold text-xl text-gray-800">
                      {produto.nome}
                    </h3>
                    <p
                      className={`text-xs mb-1 ${
                        produto.observacaoObrigatoria
                          ? "text-red-500 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      Observação:{" "}
                      {produto.observacaoObrigatoria
                        ? "Obrigatória"
                        : "Opcional"}
                    </p>
                    <p className="text-gray-700 text-sm mb-1 line-clamp-2">
                      {produto.descricao}
                    </p>
                    {/* Lógica de Preço */}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto md:ml-4 flex-shrink-0">
                  <button
                    onClick={() => editar(produto)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deletar(produto.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => definirDestaque(produto.id)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      produto.destaque
                        ? "bg-indigo-700 text-white"
                        : "bg-indigo-500 text-white"
                    }`}
                  >
                    {produto.destaque ? "Em Destaque" : "Definir Destaque"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
