// src/cloudinaryConfig.js
// Não vamos mais configurar e exportar a instância do SDK Node.js aqui
// para evitar expor api_key e api_secret no frontend.
// A funcionalidade de upload no Admin.jsx já busca cloud_name e upload_preset
// do Firestore e usa a API Fetch diretamente, o que é mais seguro para o cliente.

// Se você precisar do cloud_name em outras partes do frontend APENAS para
// construir URLs de imagem (o que é seguro), você pode exportar uma função
// para buscá-lo, como o exemplo que dei anteriormente, ou garantir que
// os componentes que precisam dele o busquem diretamente.

// Por enquanto, este arquivo pode ficar vazio ou você pode remover as
// importações e configurações do 'cloudinary' se ele não for usado
// em nenhum outro lugar do frontend para inicializar o SDK.

// Exemplo de como poderia ficar se você não precisar mais
// da instância do SDK Node.js no frontend:
// console.log("cloudinaryConfig.js - Agora configurado via Firestore para uploads no Admin.jsx");

// Se você tiver outros usos do SDK 'cloudinary' no frontend que não sejam
// o upload no Admin.jsx, eles precisam ser reavaliados.
// Operações que necessitam de api_secret DEVEM ser movidas para Firebase Cloud Functions.

// Remova ou comente a exportação padrão se não for mais necessária:
// export default cloudinary;
