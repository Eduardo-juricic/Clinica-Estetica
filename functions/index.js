// functions/index.js

const functions = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const axios = require("axios");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

setGlobalOptions({
  region: "southamerica-east1",
  memory: "256MiB",
  timeoutSeconds: 60,
});

const PROD_SECRET_NAME = "MERCADOPAGO_ACCESS_TOKEN_PROD";
const TEST_SECRET_NAME = "MERCADOPAGO_ACCESS_TOKEN_TEST";
const MELHOR_ENVIO_SECRET_NAME = "MELHORENVIO_TOKEN";

const PROD_ACCESS_TOKEN_FROM_SECRET = process.env[PROD_SECRET_NAME];
const TEST_ACCESS_TOKEN_FROM_SECRET = process.env[TEST_SECRET_NAME];
const MELHOR_ENVIO_TOKEN = process.env[MELHOR_ENVIO_SECRET_NAME];

const YOUR_PROVIDED_TEST_ACCESS_TOKEN =
  "TEST-2041651583950402-051909-c6b895278dbff8c34731dd86d4c95c67-98506488";

let CHAVE_ACESSO_MP_A_SER_USADA;
let idempotencyKeyBase = Date.now().toString();

const isProductionEnvironment = !!process.env.K_SERVICE;
const isEmulatorEnvironment = process.env.FUNCTIONS_EMULATOR === "true";

if (isProductionEnvironment) {
  if (PROD_ACCESS_TOKEN_FROM_SECRET) {
    CHAVE_ACESSO_MP_A_SER_USADA = PROD_ACCESS_TOKEN_FROM_SECRET;
  } else {
    const errorMsg = `ERRO CRÍTICO: Rodando em AMBIENTE DE PRODUÇÃO mas o ACCESS TOKEN DE PRODUÇÃO ('${PROD_SECRET_NAME}') não foi lido.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
} else {
  CHAVE_ACESSO_MP_A_SER_USADA =
    TEST_ACCESS_TOKEN_FROM_SECRET || YOUR_PROVIDED_TEST_ACCESS_TOKEN;
}

if (!CHAVE_ACESSO_MP_A_SER_USADA) {
  const errorMsg =
    "ERRO CRÍTICO: NENHUM ACCESS TOKEN DO MERCADO PAGO FOI CONFIGURADO.";
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

const client = new MercadoPagoConfig({
  accessToken: CHAVE_ACESSO_MP_A_SER_USADA,
  options: { timeout: 7000 },
});

const commonFunctionOptions = {
  secrets: [PROD_SECRET_NAME, TEST_SECRET_NAME, MELHOR_ENVIO_SECRET_NAME],
};

exports.calculateShipping = functions.onCall(
  commonFunctionOptions,
  async (request) => {
    logger.info("Função calculateShipping chamada com dados:", request.data);

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
      // LINHA CORRIGIDA
      services: "1,2,17", // 1=PAC, 2=SEDEX, 17=Mini Envios (só Correios)
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

exports.createPaymentPreference = functions.onCall(
  commonFunctionOptions,
  async (request) => {
    const data = request.data;
    const auth = request.auth;
    logger.info(
      "Função createPaymentPreference (v2) chamada com dados:",
      data,
      { auth }
    );
    const { items, payerInfo, externalReference, backUrls, notificationUrl } =
      data;
    if (!items || !Array.isArray(items) || items.length === 0) {
      logger.error(
        "Erro em createPaymentPreference: Lista de itens vazia ou inválida."
      );
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A lista de 'items' é obrigatória e não pode estar vazia."
      );
    }
    if (!payerInfo || !payerInfo.email) {
      logger.error("Erro em createPaymentPreference: payerInfo.email ausente.");
      throw new functions.https.HttpsError(
        "invalid-argument",
        "As 'payerInfo' com 'email' são obrigatórias."
      );
    }
    const preferenceRequest = {
      items: items.map((item) => ({
        id: String(item.id || "item-default-id"),
        title: String(item.title || "Produto"),
        description: String(item.description || item.title),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
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
    try {
      const preference = new Preference(client);
      const requestOptions = {
        idempotencyKey: `${idempotencyKeyBase}-${externalReference}-${Date.now()}`,
      };
      const response = await preference.create({
        body: preferenceRequest,
        requestOptions,
      });
      return { id: response.id, init_point: response.init_point };
    } catch (error) {
      logger.error("Erro ao criar preferência MP (v2):", error.message);
      let errorMessage = "Falha ao criar preferência MP.";
      if (error.cause && Array.isArray(error.cause)) {
        errorMessage = error.cause
          .map((c) => c.description || c.message)
          .join("; ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new functions.https.HttpsError(
        "internal",
        errorMessage,
        error.cause || error.message
      );
    }
  }
);

exports.processPaymentNotification = functions.onRequest(
  commonFunctionOptions,
  async (req, res) => {
    logger.info("Função processPaymentNotification (v2) chamada.");
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed.");
    }
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
  "Arquivo functions/index.js (v2 com secrets) carregado e funções exportadas."
);
