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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon as StarIconSolid,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";

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
    peso: "",
    altura: "",
    largura: "",
    comprimento: "",
    observacaoObrigatoria: false,
  });
  const [editandoId, setEditandoId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloud_name: "",
    upload_preset: "",
  });
  const [showOrders, setShowOrders] = useState(true);

  const navigate = useNavigate();
  const produtosRef = collection(db, "produtos");
  const pedidosRef = collection(db, "pedidos");

  // --- NENHUMA LÓGICA FOI ALTERADA ---
  // (Todas as funções de busca, envio, deleção, etc., permanecem as mesmas)

  const buscarProdutos = async () => {
    const snapshot = await getDocs(produtosRef);
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProdutos(lista);
  };

  const buscarPedidos = async () => {
    try {
      const snapshot = await getDocs(pedidosRef);
      let listaPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      listaPedidos.sort((a, b) => {
        const dateA = a.dataCriacao?.toDate();
        const dateB = b.dataCriacao?.toDate();
        return (dateB || 0) - (dateA || 0);
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
    getDoc(configRef).then((docSnap) => {
      if (docSnap.exists()) setCloudinaryConfig(docSnap.data());
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
        await updateDoc(doc(db, "produtos", editandoId), produtoData);
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
      if (document.querySelector('input[type="file"]'))
        document.querySelector('input[type="file"]').value = "";
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
      await deleteDoc(doc(db, "produtos", id));
      buscarProdutos();
    }
  };

  const deletarPedido = async (id) => {
    if (window.confirm(`Tem certeza que deseja excluir o pedido ID: ${id}?`)) {
      try {
        await deleteDoc(doc(db, "pedidos", id));
        buscarPedidos();
      } catch (error) {
        alert(`Erro ao excluir: ${error.message}`);
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
    document
      .getElementById("product-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
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
  };

  const definirDestaque = async (id) => {
    const produtoParaAtualizar = produtos.find((p) => p.id === id);
    const novoEstadoDestaque = !produtoParaAtualizar?.destaque;
    const updatesBatch = [];
    produtos.forEach((p) => {
      if (p.destaque && p.id !== id) {
        updatesBatch.push(
          updateDoc(doc(db, "produtos", p.id), { destaque: false })
        );
      }
    });
    updatesBatch.push(
      updateDoc(doc(db, "produtos", id), { destaque: novoEstadoDestaque })
    );
    await Promise.all(updatesBatch);
    buscarProdutos();
  };

  // --- INÍCIO DA RENDERIZAÇÃO (JSX) ---
  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* --- CABEÇALHO --- */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Painel de Administração
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Sair
          </button>
        </header>

        <main className="space-y-8">
          {/* --- SEÇÃO DE PEDIDOS --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowOrders(!showOrders)}
            >
              <h2 className="text-2xl font-semibold text-slate-700">
                Pedidos Recebidos
              </h2>
              {showOrders ? (
                <ChevronUpIcon className="h-6 w-6 text-slate-700" />
              ) : (
                <ChevronDownIcon className="h-6 w-6 text-slate-700" />
              )}
            </div>
            {showOrders && (
              <div className="mt-6 space-y-6">
                {pedidos.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">
                    Nenhum pedido recebido ainda.
                  </p>
                ) : (
                  pedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="border border-slate-200 p-6 rounded-lg bg-slate-50 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-emerald-700 mb-2 sm:mb-0">
                          Pedido ID:{" "}
                          <span className="font-mono">{pedido.id}</span>
                        </h3>
                        <span className="text-sm text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                          {pedido.dataCriacao
                            ?.toDate()
                            .toLocaleString("pt-BR") || "N/A"}
                        </span>
                      </div>

                      {/* Detalhes do Pedido */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="bg-white p-3 rounded-md border">
                          <strong>Status:</strong>{" "}
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                              pedido.statusPagamentoMP === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {pedido.statusPagamentoMP || "Pendente"}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-md border">
                          <strong>Frete:</strong>{" "}
                          <span className="font-semibold">
                            R${" "}
                            {pedido.shippingCost
                              ?.toFixed(2)
                              .replace(".", ",") || "0,00"}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-md border">
                          <strong>Método:</strong>{" "}
                          <span className="font-semibold">
                            {pedido.shippingMethod || "N/A"}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-md border">
                          <strong>Total:</strong>{" "}
                          <span className="font-semibold text-emerald-600">
                            R${" "}
                            {pedido.totalAmount?.toFixed(2).replace(".", ",") ||
                              "0,00"}
                          </span>
                        </div>
                      </div>

                      {/* Detalhes Cliente e Endereço */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-white rounded-md border border-slate-200">
                          <h4 className="font-semibold text-md text-slate-800 mb-2">
                            Cliente
                          </h4>
                          <p>
                            <strong>Nome:</strong>{" "}
                            {pedido.cliente?.nomeCompleto || "N/A"}
                          </p>
                          <p>
                            <strong>Email:</strong>{" "}
                            {pedido.cliente?.email || "N/A"}
                          </p>
                          <p>
                            <strong>Telefone:</strong>{" "}
                            {pedido.cliente?.telefone || "N/A"}
                          </p>
                          <p>
                            <strong>CPF:</strong> {pedido.cliente?.cpf || "N/A"}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-md border border-slate-200">
                          <h4 className="font-semibold text-md text-slate-800 mb-2">
                            Endereço de Entrega
                          </h4>
                          <p>
                            {pedido.cliente?.endereco?.logradouro || "N/A"},{" "}
                            {pedido.cliente?.endereco?.numero || "N/A"}
                          </p>
                          {pedido.cliente?.endereco?.complemento && (
                            <p>Comp: {pedido.cliente.endereco.complemento}</p>
                          )}
                          <p>
                            {pedido.cliente?.endereco?.bairro || "N/A"} -{" "}
                            {pedido.cliente?.endereco?.cidade || "N/A"},{" "}
                            {pedido.cliente?.endereco?.estado || "N/A"}
                          </p>
                          <p>CEP: {pedido.cliente?.endereco?.cep || "N/A"}</p>
                        </div>
                      </div>

                      {/* Itens */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-md text-slate-800 mb-2">
                          Itens do Pedido:
                        </h4>
                        <ul className="space-y-2">
                          {pedido.items?.map((item, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-center bg-white p-3 rounded-md border"
                            >
                              <div>
                                <span className="font-semibold">
                                  {item.nome || "Item"}
                                </span>{" "}
                                (x{item.quantity || 0})
                                {item.observacaoItem && (
                                  <p className="text-xs text-emerald-600 mt-1">
                                    ↳ Obs: {item.observacaoItem}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono text-sm">
                                R${" "}
                                {parseFloat(item.precoUnitario || 0)
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => deletarPedido(pedido.id)}
                          className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 text-sm font-semibold transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" /> Excluir Pedido
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* --- SEÇÃO DE PRODUTOS --- */}
          <div
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            id="product-form"
          >
            {/* --- FORMULÁRIO --- */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-2 space-y-6 bg-white p-6 rounded-xl shadow-md h-fit"
            >
              <h2 className="text-2xl font-semibold text-slate-700 flex items-center gap-2">
                {editandoId ? (
                  <PencilSquareIcon className="h-6 w-6 text-emerald-600" />
                ) : (
                  <PlusCircleIcon className="h-6 w-6 text-emerald-600" />
                )}
                {editandoId ? "Editar Produto" : "Adicionar Novo Produto"}
              </h2>
              <input
                type="text"
                placeholder="Nome do Produto"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="border p-3 w-full rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
              <textarea
                placeholder="Descrição detalhada"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                className="border p-3 w-full rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 h-24"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Preço"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  className="border p-3 w-full rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  placeholder="Preço Promocional"
                  value={form.preco_promocional}
                  onChange={(e) =>
                    setForm({ ...form, preco_promocional: e.target.value })
                  }
                  className="border p-3 w-full rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  step="0.01"
                />
              </div>
              <textarea
                placeholder="Características (separadas por ;)"
                value={form.destaque_curto}
                onChange={(e) =>
                  setForm({ ...form, destaque_curto: e.target.value })
                }
                className="border p-3 w-full rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 h-20"
              />

              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Dimensões para Frete (cm/kg)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input
                    type="number"
                    placeholder="Peso"
                    value={form.peso}
                    onChange={(e) => setForm({ ...form, peso: e.target.value })}
                    className="border p-2 w-full rounded-lg bg-slate-50 focus:bg-white"
                    step="0.01"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Altura"
                    value={form.altura}
                    onChange={(e) =>
                      setForm({ ...form, altura: e.target.value })
                    }
                    className="border p-2 w-full rounded-lg bg-slate-50 focus:bg-white"
                    step="0.1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Largura"
                    value={form.largura}
                    onChange={(e) =>
                      setForm({ ...form, largura: e.target.value })
                    }
                    className="border p-2 w-full rounded-lg bg-slate-50 focus:bg-white"
                    step="0.1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Comprimento"
                    value={form.comprimento}
                    onChange={(e) =>
                      setForm({ ...form, comprimento: e.target.value })
                    }
                    className="border p-2 w-full rounded-lg bg-slate-50 focus:bg-white"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="observacaoObrigatoria"
                  checked={form.observacaoObrigatoria || false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      observacaoObrigatoria: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label
                  htmlFor="observacaoObrigatoria"
                  className="ml-2 text-sm font-medium text-slate-700"
                >
                  Observação obrigatória no checkout?
                </label>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border p-2 w-full rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {form.currentImageUrl && (
                <img
                  src={form.currentImageUrl}
                  alt="Imagem atual"
                  className="h-20 w-20 object-cover rounded-md border"
                />
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white w-full py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-colors disabled:bg-slate-400"
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
                    onClick={resetForm}
                    className="bg-slate-600 text-white w-full py-3 rounded-lg mt-2 hover:bg-slate-700 font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" /> Cancelar Edição
                  </button>
                )}
              </div>
            </form>

            {/* --- LISTA DE PRODUTOS --- */}
            <section className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold text-slate-700 mb-6">
                Produtos Cadastrados
              </h2>
              <div className="space-y-4">
                {produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="border p-4 rounded-lg bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={produto.imagem || "https://via.placeholder.com/100"}
                      alt={produto.nome}
                      className="h-24 w-24 object-cover rounded-lg flex-shrink-0 border bg-white"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-slate-800">
                        {produto.nome}
                      </h3>
                      <p className="text-slate-600 text-sm mb-1 line-clamp-2">
                        {produto.descricao}
                      </p>
                      <p className="font-semibold text-emerald-600">
                        R$ {produto.preco.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start sm:self-center flex-shrink-0">
                      <button
                        onClick={() => definirDestaque(produto.id)}
                        className={`p-2 rounded-full transition-colors ${
                          produto.destaque
                            ? "bg-yellow-400 text-white hover:bg-yellow-500"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                        title={
                          produto.destaque
                            ? "Remover Destaque"
                            : "Definir Destaque"
                        }
                      >
                        {produto.destaque ? (
                          <StarIconSolid className="h-5 w-5" />
                        ) : (
                          <StarIconOutline className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => editar(produto)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        title="Editar Produto"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deletar(produto.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                        title="Excluir Produto"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
