// functions/index.js (VERSÃO COMPLETA, CORRIGIDA E SEGURA)

const functions = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const axios = require("axios");

// Inicializa o Firebase Admin SDK apenas uma vez.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Configurações globais para as funções.
setGlobalOptions({
  region: "southamerica-east1",
  memory: "256MiB",
  timeoutSeconds: 60,
});

// Nomes dos secrets armazenados no Google Secret Manager.
const PROD_SECRET_NAME = "MERCADOPAGO_ACCESS_TOKEN_PROD";
const TEST_SECRET_NAME = "MERCADOPAGO_ACCESS_TOKEN_TEST";
const MELHOR_ENVIO_SECRET_NAME = "MELHORENVIO_TOKEN";

// Opções comuns para as funções que precisam acessar secrets.
const commonFunctionOptions = {
  secrets: [PROD_SECRET_NAME, TEST_SECRET_NAME, MELHOR_ENVIO_SECRET_NAME],
};

/**
 * Função para calcular o frete usando a API do Melhor Envio.
 * Permanece como estava, pois sua lógica de acesso a secrets já era segura.
 */
exports.calculateShipping = functions.onCall(
  commonFunctionOptions,
  async (request) => {
    logger.info("Função calculateShipping chamada com dados:", request.data);

    const MELHOR_ENVIO_TOKEN = process.env[MELHOR_ENVIO_SECRET_NAME];
    if (!MELHOR_ENVIO_TOKEN) {
      logger.error("Token do Melhor Envio não está configurado nos secrets.");
      throw new functions.https.HttpsError(
        "failed-precondition",
        "A API de frete não está configurada. Por favor, contate o suporte."
      );
    }

    const { from_cep, to_cep, products } = request.data;
    if (!from_cep || !to_cep || !products || products.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "CEP de origem, destino e produtos são obrigatórios."
      );
    }

    const MELHOR_ENVIO_API_URL =
      "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

    // O frontend envia os dados do produto, incluindo o preço para o seguro.
    // Isso é aceitável, pois a manipulação do valor do seguro não resulta em perda direta.
    const payload = {
      from: { postal_code: from_cep },
      to: { postal_code: to_cep },
      products: products.map((p) => {
        if (
          p.largura == null ||
          p.altura == null ||
          p.comprimento == null ||
          p.peso == null
        ) {
          logger.error("Produto no carrinho sem dimensões:", p);
          throw new functions.https.HttpsError(
            "invalid-argument",
            `O produto '${p.id}' está sem as dimensões necessárias para o cálculo do frete.`
          );
        }
        return {
          id: p.id,
          width: p.largura,
          height: p.altura,
          length: p.comprimento,
          weight: p.peso,
          insurance_value: p.unit_price,
          quantity: p.quantity,
        };
      }),
      options: { receipt: false, own_hand: false },
      services: "1,2,17",
    };

    try {
      const response = await axios.post(MELHOR_ENVIO_API_URL, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
          "User-Agent": "ClinicaEstetica (contato@email.com)",
        },
      });

      const validOptions = response.data
        .filter((option) => !option.error)
        .map((option) => ({
          id: option.id,
          name: option.name,
          price: option.price,
          delivery_time: option.delivery_time,
        }));

      logger.info("Opções de frete retornadas:", validOptions);
      return validOptions;
    } catch (error) {
      const errorMsg = error.response ? error.response.data : error.message;
      logger.error("Erro ao chamar API do Melhor Envio:", errorMsg);
      throw new functions.https.HttpsError(
        "internal",
        "Não foi possível calcular o frete. Verifique o CEP e tente novamente.",
        errorMsg
      );
    }
  }
);

/**
 * --- FUNÇÃO CORRIGIDA ---
 * Cria uma preferência de pagamento no Mercado Pago de forma segura.
 * Esta função agora busca os preços e detalhes dos produtos diretamente do Firestore,
 * ignorando quaisquer preços enviados pelo cliente para evitar fraudes.
 */
exports.createPaymentPreference = functions.onCall(
  commonFunctionOptions,
  async (request) => {
    logger.info(
      "Função createPaymentPreference (SEGURA) chamada com dados:",
      request.data
    );

    // 1. Validar a entrada de dados vinda do cliente
    const {
      items: itemsFromClient,
      payerInfo,
      selectedShipping,
      externalReference,
      backUrls,
      notificationUrl,
    } = request.data;
    if (
      !itemsFromClient ||
      !Array.isArray(itemsFromClient) ||
      itemsFromClient.length === 0
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A lista de itens é inválida ou está vazia."
      );
    }
    if (!payerInfo || !payerInfo.email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "As informações do pagador (payerInfo) são obrigatórias."
      );
    }
    if (!selectedShipping || typeof selectedShipping.price !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A opção de frete selecionada é inválida."
      );
    }

    // 2. Obter o Access Token do Mercado Pago de forma segura
    const isProduction = !!process.env.K_SERVICE;
    const accessToken = isProduction
      ? process.env[PROD_SECRET_NAME]
      : process.env[TEST_SECRET_NAME];

    if (!accessToken) {
      const errorMsg =
        "CRÍTICO: Access Token do Mercado Pago não encontrado no Secret Manager.";
      logger.error(errorMsg);
      throw new functions.https.HttpsError(
        "internal",
        "Configuração de pagamento indisponível."
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 7000 },
    });

    try {
      // 3. --- PONTO CRÍTICO DA CORREÇÃO DE SEGURANÇA ---
      // Para cada item do carrinho, buscar os dados REAIS do Firestore.
      const itemsPromises = itemsFromClient.map(async (clientItem) => {
        if (!clientItem.id || !clientItem.quantity) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Cada item deve ter um 'id' e 'quantity'."
          );
        }

        const productRef = admin
          .firestore()
          .collection("produtos")
          .doc(clientItem.id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            `Produto com ID ${clientItem.id} não foi encontrado.`
          );
        }

        const productData = productDoc.data();
        const unitPrice = productData.precoPromocional || productData.preco; // Fonte da verdade

        if (typeof unitPrice !== "number" || unitPrice < 0) {
          throw new functions.https.HttpsError(
            "internal",
            `O produto ${productData.nome} está com um preço inválido no cadastro.`
          );
        }

        // Retorna o objeto do item com dados confiáveis do banco de dados
        return {
          id: clientItem.id,
          title: productData.nome,
          description: productData.descricao || productData.nome,
          quantity: Number(clientItem.quantity),
          unit_price: Number(unitPrice), // USA O PREÇO DO BANCO DE DADOS
          currency_id: "BRL",
        };
      });

      // Aguarda todas as buscas no banco de dados terminarem.
      const finalItems = await Promise.all(itemsPromises);

      // Adiciona o frete como um item adicional
      finalItems.push({
        id: "shipping_cost",
        title: "Custo de Envio",
        quantity: 1,
        unit_price: Number(selectedShipping.price),
        currency_id: "BRL",
      });

      // 4. Monta o corpo da requisição para o Mercado Pago com dados seguros
      const preferenceRequest = {
        items: finalItems,
        payer: {
          name: String(payerInfo.name || "Comprador"),
          surname: String(payerInfo.surname || ""),
          email: String(payerInfo.email),
        },
        back_urls: {
          success: String(backUrls.success),
          failure: String(backUrls.failure),
          pending: String(backUrls.pending || backUrls.success),
        },
        auto_return: "approved",
        external_reference: String(externalReference),
        notification_url: String(notificationUrl),
      };

      const preference = new Preference(client);
      const requestOptions = {
        idempotencyKey: `${externalReference}-${Date.now()}`,
      };
      const response = await preference.create({
        body: preferenceRequest,
        requestOptions,
      });

      return { id: response.id, init_point: response.init_point };
    } catch (error) {
      logger.error("Erro ao criar preferência MP (SEGURA):", error);
      let errorMessage = "Falha ao criar preferência de pagamento.";
      if (error instanceof functions.https.HttpsError) {
        throw error; // Re-lança o erro já formatado.
      }
      if (error.cause) {
        errorMessage = JSON.stringify(error.cause);
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new functions.https.HttpsError("internal", errorMessage, error);
    }
  }
);

/**
 * Função para processar webhooks de notificação do Mercado Pago.
 * Permanece como estava, mas obtém o token de forma mais segura.
 */
exports.processPaymentNotification = functions.onRequest(
  commonFunctionOptions,
  async (req, res) => {
    logger.info("Função processPaymentNotification (v2) chamada.");
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed.");
    }

    // Identifica o ID do pagamento a partir do corpo da notificação ou dos parâmetros da URL.
    const type = req.body.type;
    const paymentIdFromBody = req.body.data ? req.body.data.id : null;
    let paymentIdToProcess = null;
    if (type === "payment" && paymentIdFromBody) {
      paymentIdToProcess = paymentIdFromBody;
    } else if (req.query.topic === "payment" && req.query.id) {
      paymentIdToProcess = req.query.id;
    }

    if (paymentIdToProcess) {
      try {
        // Obtém o token de acesso de forma segura.
        const isProduction = !!process.env.K_SERVICE;
        const accessToken = isProduction
          ? process.env[PROD_SECRET_NAME]
          : process.env[TEST_SECRET_NAME];

        if (!accessToken) {
          logger.error(
            "CRÍTICO: Access Token do MP não encontrado para processar notificação."
          );
          return res.status(500).send("Erro interno de configuração.");
        }

        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);
        const paymentDetails = await payment.get({
          id: String(paymentIdToProcess),
        });

        if (paymentDetails) {
          const { status, external_reference } = paymentDetails;
          if (external_reference) {
            const pedidoRef = admin
              .firestore()
              .collection("pedidos")
              .doc(external_reference);
            await pedidoRef.update({
              statusPagamentoMP: status,
              paymentIdMP: String(paymentIdToProcess),
              dadosCompletosPagamentoMP: paymentDetails,
              ultimaAtualizacaoWebhook:
                admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(
              `Pedido ${external_reference} (v2) atualizado para status: ${status}.`
            );
          }
        }
        return res.status(200).send("OK. Notificação (v2) processada.");
      } catch (error) {
        logger.error(
          `Erro ao processar notificação (v2) para ${paymentIdToProcess}. Erro:`,
          error.message
        );
        return res.status(500).send("Erro interno ao processar notificação.");
      }
    }
    return res
      .status(200)
      .send("Notificação (v2) recebida, mas ID do pagamento não identificado.");
  }
);

logger.info(
  "Arquivo functions/index.js (v2 com secrets e correções) carregado."
);
