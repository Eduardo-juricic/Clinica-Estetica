// src/pages/CartPage.jsx (VERSÃO COMPLETA E CORRIGIDA)

import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link as RouterLink } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../FirebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeItem,
    getTotal,
    updateItemObservation,
    clearCart,
  } = useCart();

  const [cep, setCep] = useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingError, setShippingError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [cliente, setCliente] = useState({
    nomeCompleto: "",
    email: "",
    telefone: "",
    cpf: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleQuantityChange = (productId, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    updateQuantity(productId, newQuantity);
  };

  const handleIncreaseQuantity = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId, currentQuantity) => {
    const newQuantity = Math.max(1, currentQuantity - 1);
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === "cep") {
      setCep(value.replace(/\D/g, ""));
    }
  };

  const handleCepChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setCep(value);
  };

  const handleCalculateShipping = async () => {
    if (!cep || cep.length < 8) {
      setShippingError("Por favor, insira um CEP válido.");
      return;
    }
    setLoadingShipping(true);
    setShippingError("");
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const functionsInstance = getFunctions(undefined, "southamerica-east1");
      const calculateShippingCallable = httpsCallable(
        functionsInstance,
        "calculateShipping"
      );

      const productsPayload = cartItems.map((item) => ({
        id: item.id,
        unit_price:
          item.preco_promocional && item.preco_promocional < item.preco
            ? item.preco_promocional
            : item.preco,
        quantity: item.quantity,
        peso: item.peso,
        altura: item.altura,
        largura: item.largura,
        comprimento: item.comprimento,
      }));

      const response = await calculateShippingCallable({
        from_cep: "28979285", // SEU CEP DE ORIGEM
        to_cep: cep,
        products: productsPayload,
      });

      if (response.data && response.data.length > 0) {
        setShippingOptions(response.data);
      } else {
        setShippingError("Nenhuma opção de frete encontrada para este CEP.");
      }
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      const defaultError =
        "Não foi possível calcular o frete. Verifique o CEP e tente novamente.";
      setShippingError(error.details?.message || defaultError);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleSelectShipping = (option) => {
    setSelectedShipping(option);
    if (formErrors.shipping) {
      setFormErrors((prev) => ({ ...prev, shipping: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!cliente.nomeCompleto.trim())
      errors.nomeCompleto = "Nome completo é obrigatório.";
    if (!cliente.email.trim() || !/\S+@\S+\.\S+/.test(cliente.email))
      errors.email = "Email inválido.";
    if (
      !cliente.telefone.trim() ||
      !/^\d{10,11}$/.test(cliente.telefone.replace(/\D/g, ""))
    )
      errors.telefone = "Telefone inválido (com DDD).";
    if (!cliente.cpf.trim() || cliente.cpf.replace(/\D/g, "").length !== 11)
      errors.cpf = "CPF inválido.";
    if (!cliente.cep.trim() || cliente.cep.replace(/\D/g, "").length !== 8)
      errors.cep = "CEP inválido.";
    if (!cliente.logradouro.trim())
      errors.logradouro = "Logradouro é obrigatório.";
    if (!cliente.numero.trim()) errors.numero = "Número é obrigatório.";
    if (!cliente.bairro.trim()) errors.bairro = "Bairro é obrigatório.";
    if (!cliente.cidade.trim()) errors.cidade = "Cidade é obrigatória.";
    if (!cliente.estado.trim() || !/^[A-Z]{2}$/i.test(cliente.estado))
      errors.estado = "Estado inválido (sigla).";

    cartItems.forEach((item) => {
      if (
        item.observacaoObrigatoria &&
        (!item.observacaoItem || !item.observacaoItem.trim())
      ) {
        errors[
          `observacaoItem_${item.id}`
        ] = `A observação para ${item.nome} é obrigatória.`;
      }
    });

    if (shippingOptions.length > 0 && !selectedShipping) {
      errors.shipping = "Por favor, selecione uma opção de frete.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const subtotal = getTotal();
  const finalTotal =
    subtotal + (selectedShipping ? Number(selectedShipping.price) : 0);

  /**
   * --- FUNÇÃO CORRIGIDA ---
   * Esta função foi reestruturada para seguir as novas regras de segurança.
   */
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Por favor, corrija os erros no formulário antes de prosseguir.");
      return;
    }
    setLoadingPayment(true);
    let orderId = null;

    // ETAPA 1: Criar o pedido no Firestore (Isto permanece igual, está correto)
    // Este é o registro interno do pedido, antes mesmo do pagamento ser processado.
    try {
      const newOrderRef = await addDoc(collection(db, "pedidos"), {
        cliente: {
          nomeCompleto: cliente.nomeCompleto,
          email: cliente.email,
          telefone: cliente.telefone,
          cpf: cliente.cpf,
          endereco: {
            cep: cliente.cep,
            logradouro: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            estado: cliente.estado.toUpperCase(),
          },
        },
        items: cartItems.map((item) => ({
          id: item.id,
          nome: item.nome,
          quantity: item.quantity,
          precoUnitario: parseFloat(
            // Este preço é apenas para seu registro interno
            item.preco_promocional &&
              Number(item.preco_promocional) < Number(item.preco)
              ? item.preco_promocional
              : item.preco
          ),
          observacaoItem: item.observacaoItem || "",
        })),
        totalAmount: finalTotal,
        shippingCost: selectedShipping ? Number(selectedShipping.price) : 0,
        shippingMethod: selectedShipping
          ? selectedShipping.name
          : "Não aplicável",
        statusPedido: "pendente_pagamento",
        statusPagamentoMP: "pendente",
        dataCriacao: serverTimestamp(),
      });
      orderId = newOrderRef.id;
    } catch (error) {
      console.error("Erro ao criar pedido no Firestore:", error);
      alert("Não foi possível registrar seu pedido. Tente novamente.");
      setLoadingPayment(false);
      return;
    }

    // ETAPA 2: Preparar o payload SEGURO para a Cloud Function
    // --- PONTO CRÍTICO DA CORREÇÃO DE SEGURANÇA ---
    // O payload de itens agora envia APENAS o ID e a quantidade. Nenhum preço é enviado.
    const itemsPayloadSeguro = cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));

    const nomeArray = cliente.nomeCompleto.trim().split(" ");
    const payerInfoPayload = {
      name: nomeArray[0],
      surname: nomeArray.slice(1).join(" "),
      email: cliente.email,
    };

    const baseUrl = window.location.origin;
    const webhookUrl = import.meta.env.VITE_MERCADO_PAGO_WEBHOOK_URL;

    // Montar o payload final para a função, passando o frete como um objeto separado.
    const payloadParaFuncao = {
      items: itemsPayloadSeguro,
      payerInfo: payerInfoPayload,
      selectedShipping: selectedShipping, // A backend agora lida com o preço do frete
      externalReference: orderId,
      backUrls: {
        success: `${baseUrl}/pagamento/sucesso?order_id=${orderId}`,
        failure: `${baseUrl}/pagamento/falha?order_id=${orderId}`,
        pending: `${baseUrl}/pagamento/pendente?order_id=${orderId}`,
      },
      notificationUrl: webhookUrl,
    };

    // ETAPA 3: Chamar a Cloud Function com os dados seguros
    try {
      const functionsInstance = getFunctions(undefined, "southamerica-east1");
      const createPreferenceCallable = httpsCallable(
        functionsInstance,
        "createPaymentPreference"
      );

      const result = await createPreferenceCallable(payloadParaFuncao); // Usa o novo payload seguro

      if (result.data && result.data.init_point) {
        clearCart();
        window.location.href = result.data.init_point;
      } else {
        alert("Não foi possível iniciar o pagamento.");
      }
    } catch (error) {
      alert(`Ocorreu um erro: ${error.message}`);
    } finally {
      setLoadingPayment(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-white shadow-lg rounded-lg mt-10 max-w-2xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
          Seu carrinho está vazio.
        </h2>
        <RouterLink
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          Voltar para a loja
        </RouterLink>
      </div>
    );
  }

  // O restante do seu JSX permanece o mesmo
  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">
        Seu Carrinho de Compras
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => {
              const caracteristicas = item.destaque_curto
                ? item.destaque_curto
                    .split(";")
                    .map((c) => c.trim())
                    .filter(Boolean)
                : [];
              return (
                <li key={item.id} className="flex flex-col sm:flex-row py-6">
                  <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 relative rounded-md overflow-hidden">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-full h-full object-cover object-center"
                    />
                    {item.preco_promocional &&
                      item.preco_promocional < item.preco && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          Promoção!
                        </span>
                      )}
                  </div>
                  <div className="ml-0 sm:ml-4 flex flex-1 flex-col justify-between mt-4 sm:mt-0">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-baseline mb-2">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 sm:mb-0">
                          {item.nome}
                        </h3>
                        {item.preco_promocional &&
                        item.preco_promocional < item.preco ? (
                          <div className="text-lg font-semibold flex items-baseline">
                            <span className="text-gray-500 line-through mr-2">
                              R$ {Number(item.preco).toFixed(2)}
                            </span>
                            <span className="text-emerald-600">
                              R$ {Number(item.preco_promocional).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-gray-800">
                            R$ {Number(item.preco).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.descricao}
                      </p>
                      {caracteristicas.length > 0 && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p className="font-semibold mb-1">Características:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                            {caracteristicas.map((caracteristica, index) => (
                              <li key={index}>{caracteristica}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-3">
                        <label
                          htmlFor={`observacaoItem-${item.id}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Observação{" "}
                          {item.observacaoObrigatoria ? (
                            <span className="text-red-500">*</span>
                          ) : (
                            "(Opcional)"
                          )}
                          :
                        </label>
                        <textarea
                          id={`observacaoItem-${item.id}`}
                          value={item.observacaoItem || ""}
                          onChange={(e) =>
                            updateItemObservation(item.id, e.target.value)
                          }
                          rows="2"
                          className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${
                            formErrors[`observacaoItem_${item.id}`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder={
                            item.observacaoObrigatoria
                              ? "Ex: Cor, Sabor, etc. (Obrigatório)"
                              : "Observações (Opcional)"
                          }
                        />
                        {formErrors[`observacaoItem_${item.id}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`observacaoItem_${item.id}`]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm mt-4">
                      <div className="flex items-center">
                        <label
                          htmlFor={`quantity-${item.id}`}
                          className="mr-2 text-gray-700"
                        >
                          Qtd:
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              handleDecreaseQuantity(item.id, item.quantity)
                            }
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-l-md"
                          >
                            -
                          </button>
                          <input
                            id={`quantity-${item.id}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, e.target.value)
                            }
                            className="w-12 text-center text-gray-900 focus:outline-none border-l border-r"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleIncreaseQuantity(item.id, item.quantity)
                            }
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-r-md"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {cartItems.length > 0 && (
            <form
              onSubmit={handleCheckout}
              id="checkout-form"
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Informações para Contato e Entrega
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="nomeCompleto"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome Completo*
                </label>
                <input
                  type="text"
                  name="nomeCompleto"
                  id="nomeCompleto"
                  value={cliente.nomeCompleto}
                  onChange={handleClienteChange}
                  required
                  className={`w-full p-2 border rounded-md shadow-sm ${
                    formErrors.nomeCompleto
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.nomeCompleto && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.nomeCompleto}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={cliente.email}
                    onChange={handleClienteChange}
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Telefone*
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    id="telefone"
                    value={cliente.telefone}
                    onChange={handleClienteChange}
                    placeholder="Ex: 22999998888"
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.telefone ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.telefone && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.telefone}
                    </p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="cpf"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CPF*
                </label>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={cliente.cpf}
                  onChange={handleClienteChange}
                  maxLength="14"
                  required
                  className={`w-full p-2 border rounded-md shadow-sm ${
                    formErrors.cpf ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.cpf && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cpf}</p>
                )}
              </div>
              <h4 className="text-lg font-medium text-gray-800 mt-6 mb-3">
                Endereço de Entrega
              </h4>
              <div className="mb-4">
                <label
                  htmlFor="cep"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CEP*
                </label>
                <input
                  type="text"
                  name="cep"
                  id="cep"
                  value={cliente.cep}
                  onChange={handleClienteChange}
                  maxLength="9"
                  required
                  className={`w-full p-2 border rounded-md shadow-sm ${
                    formErrors.cep ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.cep && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cep}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="logradouro"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Logradouro*
                  </label>
                  <input
                    type="text"
                    name="logradouro"
                    id="logradouro"
                    value={cliente.logradouro}
                    onChange={handleClienteChange}
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.logradouro
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.logradouro && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.logradouro}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="numero"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Número*
                  </label>
                  <input
                    type="text"
                    name="numero"
                    id="numero"
                    value={cliente.numero}
                    onChange={handleClienteChange}
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.numero ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.numero && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.numero}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="complemento"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complemento"
                    id="complemento"
                    value={cliente.complemento}
                    onChange={handleClienteChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bairro"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bairro*
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    id="bairro"
                    value={cliente.bairro}
                    onChange={handleClienteChange}
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.bairro ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.bairro && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.bairro}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="cidade"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cidade*
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    id="cidade"
                    value={cliente.cidade}
                    onChange={handleClienteChange}
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.cidade ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.cidade && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.cidade}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="estado"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Estado* (sigla)
                  </label>
                  <input
                    type="text"
                    name="estado"
                    id="estado"
                    value={cliente.estado}
                    onChange={handleClienteChange}
                    maxLength="2"
                    required
                    className={`w-full p-2 border rounded-md shadow-sm ${
                      formErrors.estado ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.estado && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.estado}
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-28">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Resumo do Pedido
          </h3>

          <div className="mb-4">
            <label
              htmlFor="cep-frete"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Calcular Frete
            </label>
            <div className="flex">
              <input
                type="text"
                id="cep-frete"
                value={cep}
                onChange={handleCepChange}
                placeholder="Seu CEP"
                maxLength="8"
                className="flex-grow p-2 border border-gray-300 rounded-l-md"
              />
              <button
                type="button"
                onClick={handleCalculateShipping}
                disabled={loadingShipping}
                className="bg-gray-700 text-white px-4 py-2 rounded-r-md hover:bg-gray-800 disabled:opacity-50"
              >
                {loadingShipping ? "..." : "Calcular"}
              </button>
            </div>
            {shippingError && (
              <p className="text-red-500 text-sm mt-2">{shippingError}</p>
            )}
            {formErrors.shipping && (
              <p className="text-red-500 text-xs mt-1">{formErrors.shipping}</p>
            )}
          </div>

          {shippingOptions.length > 0 && (
            <div className="mt-4 space-y-2">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="shipping-option"
                    value={option.id}
                    onChange={() => handleSelectShipping(option)}
                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <div className="ml-3 text-sm flex-grow">
                    <p className="font-medium text-gray-800">{option.name}</p>
                    <p className="text-gray-500">
                      {option.delivery_time} dias úteis
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800">
                    R$ {Number(option.price).toFixed(2)}
                  </p>
                </label>
              ))}
            </div>
          )}

          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex justify-between items-center text-gray-700 text-lg">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700 text-lg">
              <span>Frete:</span>
              <span>
                {selectedShipping
                  ? `R$ ${Number(selectedShipping.price).toFixed(2)}`
                  : "A calcular"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xl font-extrabold text-gray-900 pt-2">
              <span>Total:</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={loadingPayment || cartItems.length === 0}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md text-lg shadow-lg disabled:opacity-50"
          >
            {loadingPayment ? "Processando..." : "Finalizar Compra e Pagar"}
          </button>
          <div className="mt-4 text-center">
            <RouterLink
              to="/"
              className="text-emerald-600 hover:text-emerald-800 hover:underline"
            >
              Continuar Comprando
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
