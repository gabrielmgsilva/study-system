# Stripe Subscriptions — Guia de Referência para Implementação

---

## 1. Autenticação

A API do Stripe utiliza **API Keys** para autenticar requisições. Existem dois tipos de chave:

- **Secret Key** (`sk_live_...` / `sk_test_...`): usada no backend. Nunca deve ser exposta no frontend ou em repositórios públicos.
- **Publishable Key** (`pk_live_...` / `pk_test_...`): usada no frontend (Stripe.js, Checkout, Elements).

Todas as requisições devem ser feitas via **HTTPS**. Requisições sem autenticação ou via HTTP simples falharão.

```bash
# Exemplo de autenticação via cURL
curl https://api.stripe.com/v1/subscriptions \
  -u "sk_test_SuaChaveSecreta:"
```

> **Dica**: use a flag `-u` com a chave seguida de `:` (dois pontos) — o Stripe usa HTTP Basic Auth onde a chave é o username e a senha fica vazia.

---

## 2. Objetos Principais

### 2.1 Subscription

O objeto central. Representa uma cobrança recorrente vinculada a um `Customer`.

**Campos mais importantes:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único (ex: `sub_1Mo...`) |
| `status` | `enum` | Status atual da assinatura |
| `customer` | `string` | ID do customer associado |
| `items.data[]` | `array` | Lista de itens (cada um com um `Price`) |
| `current_period_start` | `timestamp` | Início do período de faturamento atual |
| `current_period_end` | `timestamp` | Fim do período de faturamento atual |
| `default_payment_method` | `string` | ID do método de pagamento padrão |
| `latest_invoice` | `string` | ID da invoice mais recente |
| `cancel_at_period_end` | `boolean` | Se será cancelada ao final do período |
| `trial_start` | `timestamp` | Início do trial (se houver) |
| `trial_end` | `timestamp` | Fim do trial (se houver) |
| `metadata` | `object` | Pares chave-valor customizados |
| `description` | `string` | Descrição visível ao cliente (max 500 chars) |
| `pending_setup_intent` | `string` | SetupIntent para coletar autenticação |

### 2.2 Subscription Item

Permite que uma assinatura tenha **múltiplos planos/preços**. Cada item conecta um `Price` à assinatura.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único |
| `price` | `object` | O Price vinculado |
| `quantity` | `integer` | Quantidade do item |
| `metadata` | `object` | Pares chave-valor customizados |

### 2.3 Objetos Relacionados

| Objeto | Papel no fluxo de assinatura |
|---|---|
| **Customer** | O assinante. Possui payment methods, subscriptions e invoices |
| **Product** | O que você vende (ex: "Plano Premium") |
| **Price** | Quanto e com qual frequência cobrar (ex: R$49,90/mês) |
| **Invoice** | Gerada automaticamente a cada ciclo de cobrança |
| **PaymentIntent** | Rastreia o ciclo de vida de cada pagamento individual |
| **PaymentMethod** | Cartão, boleto, PIX, etc. vinculado ao Customer |
| **SetupIntent** | Para salvar método de pagamento sem cobrar imediatamente |

---

## 3. Status da Subscription (Ciclo de Vida)

Os possíveis status de uma assinatura são:

### Ativos (acesso deve ser concedido)

| Status | Descrição |
|---|---|
| `trialing` | Em período de teste gratuito. Move para `active` ao fim do trial |
| `active` | Pagamento confirmado. Assinatura funcionando normalmente |

### Suspensos (ação necessária, pode ser recuperado)

| Status | Descrição |
|---|---|
| `incomplete` | Pagamento inicial falhou. O cliente tem ~23h para pagar |
| `past_due` | Renovação falhou. Stripe tenta novamente conforme regras de retry |
| `unpaid` | Todas as tentativas de retry falharam (alternativa a `canceled`) |
| `paused` | Trial terminou sem payment method. Não gera invoices |

### Terminais (não pode ser reativado)

| Status | Descrição |
|---|---|
| `incomplete_expired` | As 23h se esgotaram sem pagamento no primeiro invoice |
| `canceled` | Cancelada definitivamente. Não pode ser atualizada |

### Fluxo resumido

```
[Criação] → incomplete → (pagou?) → active
                                   → (não pagou em 23h?) → incomplete_expired

[Com trial] → trialing → (fim do trial + pagamento) → active
                        → (sem payment method) → paused

[Renovação falha] → active → past_due → (retries esgotados) → canceled | unpaid

[Cancelamento] → qualquer status ativo → canceled
```

---

## 4. Endpoints da API

**Base URL**: `https://api.stripe.com/v1`

### 4.1 Subscriptions

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/subscriptions` | Criar assinatura |
| `GET` | `/v1/subscriptions/:id` | Buscar uma assinatura |
| `POST` | `/v1/subscriptions/:id` | Atualizar assinatura |
| `DELETE` | `/v1/subscriptions/:id` | Cancelar assinatura |
| `GET` | `/v1/subscriptions` | Listar assinaturas |
| `POST` | `/v1/subscriptions/:id/resume` | Retomar assinatura pausada |
| `GET` | `/v1/subscriptions/search` | Buscar com query language |

### 4.2 Subscription Items

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/subscription_items` | Adicionar item a uma assinatura |
| `GET` | `/v1/subscription_items/:id` | Buscar item |
| `POST` | `/v1/subscription_items/:id` | Atualizar item (preço, quantidade) |
| `DELETE` | `/v1/subscription_items/:id` | Remover item |
| `GET` | `/v1/subscription_items` | Listar itens de uma assinatura |

### 4.3 Endpoints Complementares

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/customers` | Criar customer |
| `POST` | `/v1/products` | Criar product |
| `POST` | `/v1/prices` | Criar price |
| `POST` | `/v1/checkout/sessions` | Criar sessão de Checkout (recomendado) |
| `POST` | `/v1/billing_portal/sessions` | Criar sessão do Customer Portal |
| `POST` | `/v1/webhook_endpoints` | Registrar webhook endpoint |

---

## 5. Exemplos de Requisições

### Criar uma assinatura

```bash
curl https://api.stripe.com/v1/subscriptions \
  -u "sk_test_SuaChave:" \
  -d customer="cus_ABC123" \
  -d "items[0][price]"="price_XYZ789" \
  -d payment_behavior="default_incomplete" \
  -d "expand[]"="latest_invoice.payment_intent"
```

### Cancelar ao final do período

```bash
curl https://api.stripe.com/v1/subscriptions/sub_123 \
  -u "sk_test_SuaChave:" \
  -d cancel_at_period_end=true
```

### Upgrade/Downgrade (trocar preço)

```bash
curl https://api.stripe.com/v1/subscriptions/sub_123 \
  -u "sk_test_SuaChave:" \
  -d "items[0][id]"="si_item123" \
  -d "items[0][price]"="price_NovoPlano" \
  -d proration_behavior="create_prorations"
```

### Retomar assinatura pausada

```bash
curl https://api.stripe.com/v1/subscriptions/sub_123/resume \
  -u "sk_test_SuaChave:" \
  -d billing_cycle_anchor=now
```

---

## 6. Webhooks

### 6.1 O que são

Webhooks são requisições HTTP POST que o Stripe envia ao seu servidor quando eventos acontecem (pagamento aprovado, assinatura cancelada, etc.). São essenciais porque a maioria das atividades de subscription acontece de forma **assíncrona**.

### 6.2 Eventos Essenciais para Subscriptions

| Evento | Quando é disparado |
|---|---|
| `customer.subscription.created` | Nova assinatura criada |
| `customer.subscription.updated` | Qualquer alteração na assinatura |
| `customer.subscription.deleted` | Assinatura cancelada |
| `customer.subscription.paused` | Assinatura pausada |
| `customer.subscription.resumed` | Assinatura retomada |
| `customer.subscription.trial_will_end` | Trial termina em ~3 dias |
| `customer.subscription.pending_update_applied` | Update pendente aplicado |
| `customer.subscription.pending_update_expired` | Update pendente expirou |
| `invoice.created` | Nova invoice gerada |
| `invoice.finalized` | Invoice finalizada (pronta para pagamento) |
| `invoice.paid` | Invoice paga com sucesso |
| `invoice.payment_failed` | Pagamento da invoice falhou |
| `invoice.payment_action_required` | Ação do cliente necessária (ex: 3DS) |
| `invoice.upcoming` | Invoice será gerada em breve (dias antes da renovação) |

### 6.3 Estrutura de um Webhook Handler

```javascript
// Node.js / Express
const express = require('express');
const stripe = require('stripe')('sk_test_SuaChave');

const app = express();

// IMPORTANTE: usar raw body para verificação de assinatura
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_SeuSegredo';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
      // Provisionar acesso
      break;
    case 'customer.subscription.updated':
      // Verificar mudança de status
      break;
    case 'customer.subscription.deleted':
      // Revogar acesso
      break;
    case 'invoice.paid':
      // Confirmar pagamento, estender acesso
      break;
    case 'invoice.payment_failed':
      // Notificar cliente
      break;
    case 'customer.subscription.trial_will_end':
      // Avisar que trial está acabando
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  res.json({ received: true });
});
```

### 6.4 Boas Práticas para Webhooks

- **Sempre verifique a assinatura** usando o `endpoint secret` para garantir que o evento veio do Stripe.
- **Responda com 2xx em até 5 segundos**. Use filas assíncronas para processamento pesado.
- **Seja idempotente**: o Stripe pode reenviar eventos. Use o `event.id` para evitar processamento duplicado.
- **Não dependa da ordem**: eventos podem chegar fora de sequência.
- **Em produção**, o Stripe retenta por até 3 dias com backoff exponencial caso seu endpoint não responda.
- **Use o Stripe CLI** para testar localmente: `stripe listen --forward-to localhost:3000/webhook`

---

## 7. Fluxo Recomendado com Checkout

A forma mais simples e recomendada pelo Stripe para implementar assinaturas:

```
1. Criar Products e Prices (Dashboard ou API)
      ↓
2. Frontend: botão "Assinar" chama seu backend
      ↓
3. Backend: cria Checkout Session (mode: 'subscription')
      ↓
4. Redirecionar cliente para a URL do Checkout
      ↓
5. Cliente paga → Stripe cria Customer + Subscription automaticamente
      ↓
6. Stripe redireciona para sua success_url
      ↓
7. Webhook confirma: invoice.paid + customer.subscription.created
      ↓
8. Seu sistema provisiona acesso
      ↓
9. Customer Portal para gerenciar (cancelar, trocar plano, atualizar cartão)
```

### Criar Checkout Session (backend)

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: 'price_XYZ789',
    quantity: 1,
  }],
  success_url: 'https://seusite.com/sucesso?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://seusite.com/cancelado',
});

// Redirecionar o cliente para session.url
```

### Criar sessão do Customer Portal

```javascript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: 'cus_ABC123',
  return_url: 'https://seusite.com/conta',
});

// Redirecionar para portalSession.url
```

---

## 8. Proration (Rateio)

Ao fazer upgrade ou downgrade, o Stripe calcula automaticamente o rateio proporcional. Comportamentos possíveis via `proration_behavior`:

| Valor | Comportamento |
|---|---|
| `create_prorations` | Cria itens de rateio no próximo invoice (padrão) |
| `always_invoice` | Cria e cobra o rateio imediatamente |
| `none` | Sem rateio — cobra o novo preço apenas no próximo ciclo |

---

## 9. Trials (Período de Teste)

Ao criar ou atualizar uma assinatura, você pode definir um trial:

```bash
# Via API
curl https://api.stripe.com/v1/subscriptions \
  -u "sk_test_SuaChave:" \
  -d customer="cus_ABC123" \
  -d "items[0][price]"="price_XYZ789" \
  -d trial_period_days=14
```

Durante o trial, o status é `trialing`. O evento `customer.subscription.trial_will_end` é enviado ~3 dias antes do fim. Ao terminar, o Stripe tenta cobrar automaticamente.

Se o trial terminar sem payment method, a assinatura pode ser configurada para **pausar** ou **cancelar**.

---

## 10. Códigos de Resposta HTTP

| Código | Significado |
|---|---|
| `200` | Sucesso |
| `400` | Requisição inválida (parâmetro faltando ou errado) |
| `401` | Não autenticado (API key inválida) |
| `402` | Pagamento falhou (quando `payment_behavior=error_if_incomplete`) |
| `404` | Recurso não encontrado |
| `429` | Rate limit atingido |
| `5xx` | Erro nos servidores do Stripe (raro) |

---

## 11. Links Úteis da Documentação

| Recurso | URL |
|---|---|
| API Reference — Subscriptions | https://docs.stripe.com/api/subscriptions |
| Build a Subscriptions Integration | https://docs.stripe.com/billing/subscriptions/build-subscriptions |
| How Subscriptions Work | https://docs.stripe.com/billing/subscriptions/overview |
| Webhooks com Subscriptions | https://docs.stripe.com/billing/subscriptions/webhooks |
| Subscription Invoices | https://docs.stripe.com/billing/invoices/subscription |
| Trials | https://docs.stripe.com/billing/subscriptions/trials |
| Customer Portal | https://docs.stripe.com/customer-management/portal-deep-dive |
| Checkout para Subscriptions | https://docs.stripe.com/billing/subscriptions/build-subscriptions |
| Tipos de Eventos (Webhooks) | https://docs.stripe.com/api/events/types |

---

*Documento gerado com base na documentação oficial do Stripe (março 2026).*
