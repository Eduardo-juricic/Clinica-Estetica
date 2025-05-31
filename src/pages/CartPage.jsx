// src/pages/CartPage.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext"; //
import { Link as RouterLink } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions"; //
import { db } from "../FirebaseConfig"; //
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; //

function CartPage() {
  // REMOVIDO observation, setObservation. A observação agora é por item.
  const {
    cartItems,
    updateQuantity,
    removeItem,
    getTotal,
    updateItemObservation,
    clearCart,
  } = useCart(); // ADICIONADO updateItemObservation
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
    setCliente((prevCliente) => ({ ...prevCliente, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    // Validação dos campos do cliente (existente)
    if (!cliente.nomeCompleto.trim())
      errors.nomeCompleto = "Nome completo é obrigatório.";
    else if (cliente.nomeCompleto.trim().split(" ").length < 2)
      errors.nomeCompleto = "Por favor, insira nome e sobrenome.";
    if (!cliente.email.trim()) errors.email = "Email é obrigatório.";
    else if (!/\S+@\S+\.\S+/.test(cliente.email))
      errors.email = "Email inválido.";
    if (!cliente.telefone.trim()) errors.telefone = "Telefone é obrigatório.";
    else if (!/^\d{10,11}$/.test(cliente.telefone.replace(/\D/g, "")))
      errors.telefone = "Telefone inválido (com DDD, 10 ou 11 dígitos).";

    // CPF Validation MODIFIED
    if (!cliente.cpf.trim()) errors.cpf = "CPF é obrigatório.";
    else if (cliente.cpf.trim().length !== 11)
      errors.cpf =
        "CPF deve ter 11 caracteres (letras e números são permitidos).";

    // CEP Validation MODIFIED
    const cepTrimmed = cliente.cep.trim();
    if (!cepTrimmed) errors.cep = "CEP é obrigatório.";
    else if (cepTrimmed.length < 8 || cepTrimmed.length > 9)
      errors.cep =
        "CEP deve ter entre 8 e 9 caracteres (letras e números são permitidos, formato XXXXXXXX ou XXXXX-XXX).";

    if (!cliente.logradouro.trim())
      errors.logradouro = "Logradouro é obrigatório.";
    if (!cliente.numero.trim()) errors.numero = "Número é obrigatório.";
    if (!cliente.bairro.trim()) errors.bairro = "Bairro é obrigatório.";
    if (!cliente.cidade.trim()) errors.cidade = "Cidade é obrigatória.";
    if (!cliente.estado.trim()) errors.estado = "Estado é obrigatório.";
    else if (!/^[A-Z]{2}$/i.test(cliente.estado))
      //
      errors.estado = "Estado inválido (sigla com 2 letras).";

    // NOVA VALIDAÇÃO para observações de itens
    cartItems.forEach((item) => {
      // Verifica se item.observacaoObrigatoria existe e é true
      if (
        item.observacaoObrigatoria &&
        (!item.observacaoItem || !item.observacaoItem.trim())
      ) {
        errors[
          `observacaoItem_${item.id}`
        ] = `A observação para ${item.nome} é obrigatória.`;
      } else if (errors[`observacaoItem_${item.id}`]) {
        // Limpa o erro se a condição não for mais atendida
        delete errors[`observacaoItem_${item.id}`];
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const total = getTotal();

  const functionsInstance = getFunctions(undefined, "southamerica-east1"); //
  const createPreferenceCallable = httpsCallable(
    functionsInstance,
    "createPaymentPreference"
  ); //

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Por favor, corrija os erros no formulário antes de prosseguir.");
      const firstErrorKey = Object.keys(formErrors).find(
        (key) => formErrors[key]
      );
      if (firstErrorKey) {
        let firstErrorFieldId = firstErrorKey;
        // Se for um erro de observação de item, o ID do elemento é prefixado
        if (firstErrorKey.startsWith("observacaoItem_")) {
          firstErrorFieldId = firstErrorKey.replace(
            "observacaoItem_",
            "observacaoItem-"
          );
        }
        const fieldElement = document.getElementById(firstErrorFieldId);
        if (fieldElement) {
          fieldElement.focus();
          fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }
    if (cartItems.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    setLoadingPayment(true);
    let orderId = null;
    try {
      const newOrderRef = await addDoc(collection(db, "pedidos"), {
        //
        //
        cliente: {
          nomeCompleto: cliente.nomeCompleto,
          email: cliente.email,
          telefone: cliente.telefone.replace(/\D/g, ""), // Mantém apenas números para telefone
          cpf: cliente.cpf.trim(), // MODIFIED: Salva o CPF como foi digitado
          endereco: {
            cep: cliente.cep.trim(), // MODIFIED: Salva o CEP como foi digitado
            logradouro: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            estado: cliente.estado.toUpperCase(), //
          },
        },
        items: cartItems.map((item) => ({
          id: item.id,
          nome: item.nome,
          quantity: item.quantity,
          precoUnitario: parseFloat(
            item.preco_promocional &&
              Number(item.preco_promocional) < Number(item.preco)
              ? item.preco_promocional
              : item.preco
          ),
          observacaoItem: item.observacaoItem || "", // ADICIONADO: salvar observação do item
        })),
        totalAmount: total,
        statusPedido: "pendente_pagamento",
        statusPagamentoMP: "pendente",
        // REMOVIDO: observacao: observation, (a observação agora é por item)
        dataCriacao: serverTimestamp(), //
      });
      orderId = newOrderRef.id;
      console.log("Pedido criado no Firestore com ID:", orderId);
    } catch (error) {
      console.error("Erro ao criar pedido no Firestore:", error);
      alert("Não foi possível registrar seu pedido. Tente novamente.");
      setLoadingPayment(false);
      return;
    }
    const itemsPayload = cartItems.map((item) => ({
      id: item.id,
      title: item.nome,
      description: item.descricao || item.nome,
      quantity: item.quantity,
      unit_price: parseFloat(
        item.preco_promocional &&
          Number(item.preco_promocional) < Number(item.preco)
          ? item.preco_promocional
          : item.preco
      ),
    }));
    const nomeArray = cliente.nomeCompleto.trim().split(" "); //
    const nome = nomeArray[0]; //
    const sobrenome = nomeArray.slice(1).join(" "); //
    const payerInfoPayload = {
      name: nome,
      surname: sobrenome,
      email: cliente.email,
    };
    const baseUrl = window.location.origin; //
    const webhookUrl = import.meta.env.VITE_MERCADO_PAGO_WEBHOOK_URL; //
    if (!webhookUrl || webhookUrl.includes("COLE_A_URL_DA_SUA_FUNCAO")) {
      //
      console.error("ERRO CRÍTICO: URL de Webhook não configurada.");
      alert("Erro de configuração. Contate o suporte.");
      setLoadingPayment(false);
      return;
    }
    try {
      console.log("Enviando para createPaymentPreference:", {
        items: itemsPayload,
        payerInfo: payerInfoPayload,
        externalReference: orderId,
        backUrls: {
          success: `${baseUrl}/pagamento/sucesso?order_id=${orderId}`,
          failure: `${baseUrl}/pagamento/falha?order_id=${orderId}`,
          pending: `${baseUrl}/pagamento/pendente?order_id=${orderId}`,
        },
        notificationUrl: webhookUrl,
      });
      const result = await createPreferenceCallable({
        items: itemsPayload,
        payerInfo: payerInfoPayload,
        externalReference: orderId,
        backUrls: {
          success: `${baseUrl}/pagamento/sucesso?order_id=${orderId}`,
          failure: `${baseUrl}/pagamento/falha?order_id=${orderId}`,
          pending: `${baseUrl}/pagamento/pendente?order_id=${orderId}`,
        },
        notificationUrl: webhookUrl,
      });
      console.log("Resposta da Cloud Function:", result);
      if (result.data && result.data.init_point) {
        clearCart(); // Limpa o carrinho após iniciar o pagamento
        window.location.href = result.data.init_point;
      } else {
        console.error("Erro: init_point não encontrado.", result.data);
        alert("Não foi possível iniciar o pagamento. (PREF_INIT_FAIL)");
      }
    } catch (error) {
      console.error("Erro ao chamar Cloud Function:", error);
      let displayError =
        "Ocorreu um erro ao tentar processar seu pedido. Por favor, tente novamente mais tarde.";
      if (error.details && error.details.message) {
        //
        displayError = error.details.message;
      } else if (error.message) {
        displayError = error.message;
      }
      alert(displayError + " (Código: CF_CALL_ERROR)");
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
        <p className="text-lg text-gray-600 mb-8">
          Que tal explorar nossos produtos incríveis?
        </p>
        <RouterLink
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition duration-300 ease-in-out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {" "}
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414L7.5 8.586 5.707 6.879a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />{" "}
          </svg>
          Voltar para a loja
        </RouterLink>
      </div>
    );
  }

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
                    .filter((c) => c !== "")
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
                      {/* CAMPO DE OBSERVAÇÃO POR ITEM */}
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
                          className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            item.observacaoObrigatoria &&
                            !item.observacaoItem &&
                            formErrors[`observacaoItem_${item.id}`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder={
                            item.observacaoObrigatoria
                              ? "Ex: Cor Azul, Sabor Morango (Obrigatório)"
                              : "Observações sobre este item (Opcional)"
                          }
                        />
                        {item.observacaoObrigatoria &&
                          !item.observacaoItem &&
                          formErrors[`observacaoItem_${item.id}`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors[`observacaoItem_${item.id}`]}
                            </p>
                          )}
                      </div>
                      {/* FIM CAMPO DE OBSERVAÇÃO POR ITEM */}
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
                            onClick={() =>
                              handleDecreaseQuantity(item.id, item.quantity)
                            }
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-l-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                            className="w-12 text-center text-gray-900 focus:outline-none focus:ring-0 border-l border-r border-gray-300"
                            style={{
                              MozAppearance: "textfield",
                              WebkitAppearance: "none",
                            }}
                          />
                          <button
                            onClick={() =>
                              handleIncreaseQuantity(item.id, item.quantity)
                            }
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-r-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition duration-200 ease-in-out font-medium"
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
          {/* REMOVIDO: Textarea de Observação GERAL */}

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
                    Telefone* (com DDD, apenas números)
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
                  maxLength="14" // Ajustado para permitir formatação como XXX.XXX.XXX-XX
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
                  maxLength="9" // Ajustado para permitir formatação como XXXXX-XXX
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
                    Logradouro* (Rua, Av.)
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
                    Complemento (opcional)
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
                    Estado* (sigla, ex: RJ)
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
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Resumo do Pedido
          </h3>
          <div className="flex justify-between items-center text-gray-700 text-lg mb-2">
            <span>Subtotal:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-extrabold text-gray-900 border-t pt-4 mt-4">
            <span>Total:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loadingPayment || cartItems.length === 0}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md text-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPayment
              ? "Processando Pagamento..."
              : "Finalizar Compra e Pagar"}
          </button>
          <div className="mt-4 text-center">
            <RouterLink
              to="/"
              className="text-emerald-600 hover:text-emerald-800 hover:underline transition duration-200 ease-in-out font-medium"
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
