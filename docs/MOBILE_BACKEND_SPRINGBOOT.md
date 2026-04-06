# AME ONE — Backend Spring Boot (Guia Evolutivo)

> **Objetivo**: Recriar o backend do AME ONE em Spring Boot (Java 21+) para servir o app mobile Flutter. O sistema web Next.js existente permanece inalterado — este backend é um serviço independente que compartilha o mesmo banco PostgreSQL e integração Stripe.

---

## Fase 0 — Setup do Projeto

### 0.1 Inicializar Spring Boot

```
Spring Boot 3.3+
Java 21
Gradle (Kotlin DSL)
```

**Dependências iniciais:**

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.postgresql:postgresql")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    implementation("com.stripe:stripe-java:26.+")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}
```

### 0.2 Estrutura de pacotes

```
com.cerberus.ameone
├── config/           # SecurityConfig, RedisConfig, StripeConfig, CorsConfig
├── controller/       # REST controllers
├── dto/              # Request/Response DTOs
│   ├── request/
│   └── response/
├── entity/           # JPA entities
│   └── enums/
├── exception/        # Custom exceptions + GlobalExceptionHandler
├── filter/           # JwtAuthFilter
├── repository/       # Spring Data JPA repos
├── security/         # JwtProvider, UserDetailsServiceImpl
├── service/          # Business logic
│   ├── auth/
│   ├── study/
│   ├── stripe/
│   └── entitlement/
└── util/             # Helpers
```

### 0.3 Configuração (`application.yml`)

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate # Flyway gerencia schema
    show-sql: false
    properties:
      hibernate:
        default_schema: public
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
  data:
    redis:
      url: ${REDIS_URL:} # vazio = sem cache

stripe:
  secret-key: ${STRIPE_SECRET_KEY}
  webhook-secret: ${STRIPE_WEBHOOK_SECRET}

jwt:
  secret: ${JWT_SECRET} # mesma chave do Next.js (HS256)
  expiration-ms: 43200000 # 12h

app:
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:3000}
```

### 0.4 Nota sobre Flyway

O schema já existe (gerenciado pelo Prisma no web app). O Flyway deve fazer **baseline** na primeira execução e não criar tabelas — apenas validar. Futuras migrations exclusivas do mobile backend (se houver) ficam em `db/migration`.

```java
// FlywayConfig.java — garante compatibilidade com schema existente
@Configuration
public class FlywayConfig {
    @Bean
    public FlywayMigrationStrategy strategy() {
        return flyway -> {
            flyway.baseline();
            flyway.migrate();
        };
    }
}
```

---

## Fase 1 — Entidades JPA

> **Regra global**: Todo model usa soft delete (`deletedAt`). Filtrar em todas as queries com `@Where`/`@SQLRestriction`.

### 1.1 Base Entity

```java
@MappedSuperclass
@Getter @Setter
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
```

### 1.2 Entidades necessárias (mapeiam tabelas existentes)

| Entidade              | Tabela                  | Campos-chave                                                                                                                                                                                                              |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                | `users`                 | email, name, passwordHash, role(ENUM), planId→Plan, primaryLicenseId, studyLevel, studyGoal, onboardingCompletedAt, stripeCustomerId, subscriptionStatus, subscriptionExpiresAt, lastPasswordChangeAt                     |
| `Plan`                | `plans`                 | slug, name, price(BigDecimal), maxLicenses, flashcardsLimit/Unit, practiceLimit/Unit, testsLimit/Unit, maxQuestionsPerSession, logbookAccess, stripeProductId, stripePriceMonthly, stripePriceAnnual, trialDays, isActive |
| `LicenseEntitlement`  | `license_entitlements`  | userId, licenseId(String), enrolledAt, isActive                                                                                                                                                                           |
| `StudySession`        | `study_sessions`        | userId, licenseId, moduleKey, mode(ENUM), startedAt, finishedAt, questionsAnswered, questionsCorrect, score(Double), timeSpentMs, details(TEXT/JSON)                                                                      |
| `StudyProgress`       | `study_progress`        | userId, licenseId, moduleKey, mode(ENUM), questionsTotal, questionsCorrect, questionsIncorrect, totalTimeSpentMs, lastStudiedAt                                                                                           |
| `QuestionScore`       | `question_scores`       | userId, moduleKey, questionExternalId, score(0-5), timesCorrect, timesIncorrect, lastAnsweredAt                                                                                                                           |
| `SessionAnswer`       | `session_answers`       | sessionId→StudySession, questionExternalId, selectedAnswer, isCorrect, tcSectionCode, tcTopicCode                                                                                                                         |
| `TopicPerformance`    | `topic_performance`     | userId, moduleKey, topicCode, topicTitle, questionsTotal, questionsCorrect, lastStudiedAt                                                                                                                                 |
| `UserStreak`          | `user_streaks`          | userId(unique), currentStreak, longestStreak, lastActiveDate(String), totalXp                                                                                                                                             |
| `PasswordResetToken`  | `password_reset_tokens` | userId, token(SHA-256 hash), expiresAt, usedAt                                                                                                                                                                            |
| `SubscriptionEvent`   | `subscription_events`   | stripeEventId(unique), eventType, payload(JSON), processedAt                                                                                                                                                              |
| `License`             | `licenses`              | id(String PK), name, description, displayOrder, isActive                                                                                                                                                                  |
| `Module`              | `modules`               | licenseId→License, slug, moduleKey(unique), name, description, displayOrder, isActive                                                                                                                                     |
| `Subject`             | `subjects`              | moduleId→Module, code, name, shortTitle, weight, displayOrder, isActive                                                                                                                                                   |
| `Topic`               | `topics`                | subjectId→Subject, code, name, displayOrder, isActive                                                                                                                                                                     |
| `Question`            | `questions`             | topicId→Topic, externalId, locale(ENUM), type(ENUM), stem, difficulty, status(ENUM), tags(TEXT[])                                                                                                                         |
| `QuestionOption`      | `question_options`      | questionId→Question, optionKey, text, isCorrect, displayOrder                                                                                                                                                             |
| `QuestionExplanation` | `question_explanations` | questionId(unique), correctExplanation                                                                                                                                                                                    |
| `QuestionReference`   | `question_references`   | questionId, document, area, topicRef, locator, note                                                                                                                                                                       |
| `Coupon`              | `coupons`               | code(unique), stripeId(unique), percentOff, annualOnly, maxRedemptions, timesRedeemed, expiresAt, isActive                                                                                                                |
| `PracticeState`       | `practice_states`       | userId, moduleKey, currentIndex, questionIds(JSON), answers(JSON), correctCount, incorrectCount, expiresAt                                                                                                                |
| `TestAttempt`         | `test_attempts`         | userId, moduleKey, status(ENUM), questionIds(JSON), answers(JSON), currentIndex, score, questionsCorrect, questionsTotal, timeSpentMs                                                                                     |

### 1.3 Enums Java

```java
public enum UserRole { user, admin }
public enum LimitUnit { day, week, month }
public enum StudyMode { flashcard, practice, test }
public enum TestStatus { in_progress, completed, canceled, expired }
public enum QuestionType { single_choice }
public enum QuestionStatus { draft, review, published, archived }
public enum ContentLocale { en, pt }
```

---

## Fase 2 — Autenticação e Segurança

### 2.1 SecurityConfig

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        return http
            .csrf(c -> c.ignoringRequestMatchers("/api/webhooks/**"))
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/plans",
                    "/api/webhooks/**"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("admin")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### 2.2 JWT Provider

```java
@Component
public class JwtProvider {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration-ms}") private long expirationMs;

    public String generateToken(User user) {
        return Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), Jwts.SIG.HS256)
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

> **IMPORTANTE**: Usar a mesma `JWT_SECRET` do Next.js para que tokens Web e Mobile sejam compatíveis.

### 2.3 JwtAuthFilter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtProvider.parseToken(header.substring(7));
                Integer userId = Integer.parseInt(claims.getSubject());
                // Set auth context...
            } catch (Exception ignored) {}
        }
        chain.doFilter(req, res);
    }
}
```

### 2.4 Endpoints Auth

| Método | Rota                        | Descrição                                                            | Auth    |
| ------ | --------------------------- | -------------------------------------------------------------------- | ------- |
| POST   | `/api/auth/register`        | Cria user + Stripe customer + auto-enroll `regs` + retorna JWT       | Público |
| POST   | `/api/auth/login`           | Email/password → bcrypt verify → retorna JWT                         | Público |
| POST   | `/api/auth/forgot-password` | Gera token 32-byte, hash SHA-256, salva com 30min TTL, envia email   | Público |
| POST   | `/api/auth/reset-password`  | Valida token hash → atualiza `passwordHash` + `lastPasswordChangeAt` | Público |
| GET    | `/api/auth/me`              | Retorna dados do usuário logado                                      | JWT     |
| POST   | `/api/auth/logout`          | (No-op no mobile — basta descartar o token localmente)               | JWT     |

**Regras do registro:**

1. Email obrigatório, único, normalizado (trim + lowercase)
2. Password mínimo 8 caracteres
3. Após criar user: cria Stripe customer (async/best-effort)
4. Auto-enroll na licença `regs` (REGS não conta para `maxLicenses`)
5. Retorna JWT no body (não em cookie — mobile usa header)

**Regras do login:**

1. Busca user por email (deletedAt IS NULL)
2. Verifica bcrypt. Se falhar, tenta legado PBKDF2-SHA256 e migra hash se bem-sucedido
3. Retorna `{ token, user: { id, email, name, role } }`

**Regras do forgot-password:**

1. Sempre retorna 200 (anti-enumeração)
2. Gera `SecureRandom` 32 bytes → hex
3. Armazena SHA-256 do token em `password_reset_tokens`
4. Envia email com link contendo o token raw

**Regras do reset-password:**

1. Recebe `{ token, newPassword }`
2. Busca por SHA-256 hash com `usedAt IS NULL` e `expiresAt > now`
3. Atualiza `passwordHash` do user
4. Marca token como `usedAt = now`

---

## Fase 3 — Planos, Assinatura & Stripe

### 3.1 Endpoints Planos

| Método | Rota         | Descrição                                           | Auth    |
| ------ | ------------ | --------------------------------------------------- | ------- |
| GET    | `/api/plans` | Lista planos ativos (isActive=true, deletedAt=null) | Público |

**Response:**

```json
[
  {
    "id": 1,
    "slug": "basic",
    "name": "Basic",
    "price": 9.99,
    "flashcardsLimit": 20,
    "flashcardsUnit": "day",
    "practiceLimit": 2,
    "practiceUnit": "day",
    "testsLimit": 1,
    "testsUnit": "week",
    "maxLicenses": 1,
    "maxQuestionsPerSession": 50,
    "logbookAccess": false,
    "trialDays": 7,
    "stripePriceMonthly": "price_xxx",
    "stripePriceAnnual": "price_yyy"
  }
]
```

### 3.2 Checkout & Billing

| Método | Rota                     | Descrição                                       | Auth |
| ------ | ------------------------ | ----------------------------------------------- | ---- |
| POST   | `/api/checkout`          | Cria Stripe Checkout Session, retorna URL       | JWT  |
| POST   | `/api/me/billing-portal` | Cria Stripe Billing Portal Session, retorna URL | JWT  |

**Checkout Request:**

```json
{
  "planId": 2,
  "interval": "month", // "month" | "year"
  "couponCode": "SAVE20" // opcional, só para annual
}
```

**Lógica do checkout:**

1. Validar plan ativo + Stripe price ID existente
2. Se `interval=year` e `couponCode`: buscar Coupon no DB → `promotion_code` do Stripe
3. Criar Stripe Checkout Session:
   - `mode: subscription`
   - `customer`: stripeCustomerId do user
   - `line_items`: [{ price: stripePriceMonthly|stripePriceAnnual, quantity: 1 }]
   - `subscription_data.trial_period_days`: plan.trialDays (se user nunca assinou)
   - `metadata`: { userId, planId }
   - `success_url`: deep link do app mobile
   - `cancel_url`: deep link do app mobile
4. Retorna `{ url: session.url }`

### 3.3 Stripe Webhooks

| Método | Rota                   | Descrição               |
| ------ | ---------------------- | ----------------------- |
| POST   | `/api/webhooks/stripe` | Processa eventos Stripe |

**Regras:**

1. Verificar assinatura do webhook (`Stripe.Webhook.constructEvent`)
2. Check idempotência: `SELECT 1 FROM subscription_events WHERE stripe_event_id = ?`
3. Processar por tipo:

| Evento                          | Ação                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Extrair metadata → `User.planId = planId`, `subscriptionStatus = 'active'/'trialing'`, `subscriptionExpiresAt` |
| `customer.subscription.updated` | Atualizar `subscriptionStatus`, `subscriptionExpiresAt`                                                        |
| `customer.subscription.deleted` | Set `subscriptionStatus = 'canceled'`                                                                          |
| `invoice.paid`                  | Atualizar `subscriptionExpiresAt` para fim do novo período                                                     |
| `invoice.payment_failed`        | Set `subscriptionStatus = 'past_due'`                                                                          |

4. Inserir em `subscription_events` com `processedAt`

### 3.4 Subscription Guard

```java
@Component
public class SubscriptionGuard {
    private static final Set<String> ACTIVE_STATUSES = Set.of("active", "trialing");

    public boolean hasActiveSubscription(User user) {
        if (user.getSubscriptionStatus() == null) return false;
        if (!ACTIVE_STATUSES.contains(user.getSubscriptionStatus())) return false;
        if (user.getSubscriptionExpiresAt() == null) return false;
        return user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now());
    }
}
```

---

## Fase 4 — Acesso Trial & Entitlements

### 4.1 Trial com funcionalidades limitadas

**Regras de trial:**

- Ao registrar, user recebe o plano selecionado com `trialDays` do plano (default 7)
- `subscriptionStatus = 'trialing'`
- `subscriptionExpiresAt = now + trialDays`
- Trial tem TODAS as limitações do plano (flashcards/day, practice/day, tests/week)
- Trial para Basic: apenas 1 licença (`maxLicenses = 1`)
- Quando trial expira: `subscriptionStatus` muda para `expired` (via webhook ou check)

### 4.2 License Entitlements

| Método | Rota                               | Descrição                                    | Auth |
| ------ | ---------------------------------- | -------------------------------------------- | ---- |
| GET    | `/api/me/entitlements`             | Retorna licenças do user com usage snapshots | JWT  |
| POST   | `/api/entitlements/enroll-license` | Matricula user em licença                    | JWT  |
| DELETE | `/api/entitlements/enroll-license` | Remove matrícula                             | JWT  |

**Regras de enrollment:**

1. `regs` (REGS) é auto-enrolled e não conta para `maxLicenses`
2. Validar `count(license_entitlements WHERE userId AND licenseId != 'regs') < plan.maxLicenses`
3. Criar `LicenseEntitlement(userId, licenseId, isActive=true)`

### 4.3 Student State (endpoint consolidado)

| Método | Rota              | Descrição                    | Auth |
| ------ | ----------------- | ---------------------------- | ---- |
| GET    | `/api/me/student` | Estado completo do estudante | JWT  |

**Response:**

```json
{
  "plan": {
    "id": 1,
    "slug": "basic",
    "name": "Basic",
    "maxLicenses": 1,
    "isActive": true
  },
  "subscription": { "status": "trialing", "expiresAt": "2026-04-06T..." },
  "enrollments": [
    { "licenseId": "m", "enrolledAt": "...", "isActive": true },
    { "licenseId": "regs", "enrolledAt": "...", "isActive": true }
  ],
  "licenseEntitlements": {
    "m": {
      "caps": {
        "flashcards": { "limit": 20, "unit": "day" },
        "practice": { "limit": 2, "unit": "day" },
        "test": { "limit": 1, "unit": "week" },
        "maxQuestionsPerSession": 50
      },
      "usage": {
        "flashcardsUsed": 5,
        "flashcardsRemaining": 15,
        "practiceUsed": 1,
        "practiceRemaining": 1,
        "testsUsed": 0,
        "testsRemaining": 1
      }
    }
  }
}
```

**Lógica de usage counting:**

```java
// Para cada modo: contar studySessions no período atual
int flashcardsUsed = studySessionRepo.countByUserIdAndLicenseIdAndModeAndStartedAtAfter(
    userId, licenseId, StudyMode.flashcard, rangeStart(plan.getFlashcardsUnit())
);
```

`rangeStart(unit)`:

- `day` → início do dia (00:00)
- `week` → segunda-feira desta semana
- `month` → dia 1 do mês

**Redis cache (opcional):**

- Key: `study:user:{userId}:usage:{licenseId}`
- TTL: até fim do período (meia-noite / segunda / dia 1)
- Invalidar em session start e session finish

---

## Fase 5 — Modos de Estudo (Flashcard, Practice, Test)

### 5.1 Content Endpoints

| Método | Rota                                                         | Descrição                                            | Auth |
| ------ | ------------------------------------------------------------ | ---------------------------------------------------- | ---- |
| GET    | `/api/content/licenses`                                      | Lista licenças ativas com módulos                    | JWT  |
| GET    | `/api/content/modules?licenseId=m`                           | Lista módulos de uma licença                         | JWT  |
| GET    | `/api/content/questions?moduleKey=m.airframe&sectionIds=1,2` | Busca questões com opções/explicações                | JWT  |
| GET    | `/api/content/metadata?moduleKey=m.airframe`                 | Subjects + Topics do módulo (para seleção de seções) | JWT  |

**Nota:** No web app, questões vêm de JSON estático. No Spring Boot, servir diretamente do banco:

```sql
SELECT q.*, GROUP_CONCAT(qo.*) AS options
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
JOIN topics t ON t.id = q.topic_id
JOIN subjects s ON s.id = t.subject_id
JOIN modules m ON m.id = s.module_id
WHERE m.module_key = :moduleKey
  AND q.status = 'published'
  AND q.deleted_at IS NULL
```

### 5.2 Session Lifecycle

| Método | Rota                        | Descrição                      | Auth |
| ------ | --------------------------- | ------------------------------ | ---- |
| POST   | `/api/study/session/start`  | Inicia sessão de estudo        | JWT  |
| POST   | `/api/study/session/finish` | Finaliza sessão com resultados | JWT  |

#### Start Session

**Request:**

```json
{
  "licenseId": "m",
  "moduleKey": "m.airframe",
  "mode": "flashcard",
  "requestedQuestionsTotal": 50
}
```

**Lógica:**

1. Verificar subscription ativa
2. Verificar enrollment na licença
3. Contar usage do modo no período → comparar com limite do plan
4. Se modo esgotado → 403 com mensagem específica
5. Aplicar `maxQuestionsPerSession` se set: `allowedQuestionsTotal = min(requested, cap)`
6. Criar `StudySession` com status ativo
7. Retornar `{ sessionId, allowedQuestionsTotal, licenseEntitlement: snapshot }`

#### Finish Session

**Request:**

```json
{
  "sessionId": 42,
  "questionsTotal": 50,
  "questionsAnswered": 48,
  "questionsCorrect": 35,
  "score": 0.729,
  "timeSpentMs": 2340000,
  "details": { "selectedSections": ["1", "3"] },
  "answers": [
    {
      "questionExternalId": "q001",
      "selectedAnswer": "B",
      "isCorrect": true,
      "tcSectionCode": "S1",
      "tcTopicCode": "T1.2"
    }
  ],
  "questionScores": {
    "q001": 4,
    "q002": 2
  }
}
```

**Lógica (transação única):**

1. Buscar StudySession por id + userId (ownership check)
2. ~~Se mode=flashcard, rejeitar~~ → **Agora aceita todos os modos**
3. Atualizar StudySession (finishedAt, score, questionsAnswered/Correct, timeSpentMs, details)
4. `saveAll` SessionAnswer[] (bulk insert, max 200)
5. Para cada questionScore: upsert QuestionScore
6. Upsert StudyProgress (incrementar contadores)
7. Agregar answers por topicCode → upsert TopicPerformance
8. Invalidar Redis cache (usage + scores)

### 5.3 Question Scores & History

| Método | Rota                                                         | Descrição                         | Auth |
| ------ | ------------------------------------------------------------ | --------------------------------- | ---- |
| GET    | `/api/study/scores?moduleKey=m.airframe`                     | Scores do user para o módulo      | JWT  |
| POST   | `/api/study/scores/migrate`                                  | Migração one-time do localStorage | JWT  |
| GET    | `/api/study/history?moduleKey=m.airframe&mode=test&limit=30` | Histórico de sessões              | JWT  |
| GET    | `/api/study/analytics?moduleKey=m.airframe`                  | Performance por tópico            | JWT  |

**GET /scores Response:**

```json
{ "scores": { "q001": 4, "q002": 2, "q003": 3 } }
```

**GET /analytics Response:**

```json
{
  "topics": [
    {
      "topicCode": "T1",
      "topicTitle": "Aerodynamics",
      "total": 20,
      "correct": 16,
      "percentage": 80,
      "classification": "Strong"
    },
    {
      "topicCode": "T2",
      "topicTitle": "Weight & Balance",
      "total": 15,
      "correct": 8,
      "percentage": 53,
      "classification": "Needs Study"
    }
  ]
}
```

**Classificação de tópicos:**

- ≥80%: `Strong`
- ≥60%: `Borderline`
- <60%: `Needs Study`

---

## Fase 6 — Perfil do Usuário

### 6.1 Endpoints

| Método | Rota                 | Descrição           | Auth |
| ------ | -------------------- | ------------------- | ---- |
| GET    | `/api/me/profile`    | Dados do perfil     | JWT  |
| PATCH  | `/api/me/profile`    | Atualizar nome      | JWT  |
| POST   | `/api/me/password`   | Trocar senha        | JWT  |
| PATCH  | `/api/me/onboarding` | Concluir onboarding | JWT  |

### 6.2 Troca de Senha

**Request:**

```json
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

**Lógica:**

1. Verificar `currentPassword` contra `passwordHash`
2. Validar `newPassword` (min 8 chars)
3. Hash com bcrypt(12)
4. Atualizar `passwordHash` + `lastPasswordChangeAt = now`

### 6.3 Onboarding

**Request:**

```json
{
  "primaryLicenseId": "m",
  "studyLevel": "beginner",
  "studyGoal": "exam_prep",
  "selectedLicenseIds": ["m"]
}
```

**Lógica:**

1. Atualizar user: primaryLicenseId, studyLevel, studyGoal, onboardingCompletedAt
2. Para cada licença em selectedLicenseIds: enroll (respeitar maxLicenses, regs não conta)

---

## Fase 7 — Performance Tracking

### 7.1 User Streak

**Atualizar streak em cada session finish:**

```java
public void updateStreak(int userId) {
    String today = LocalDate.now().toString();
    UserStreak streak = repo.findByUserId(userId)
        .orElse(new UserStreak(userId, 0, 0, "", 0));

    if (today.equals(streak.getLastActiveDate())) return; // já contou hoje

    String yesterday = LocalDate.now().minusDays(1).toString();
    if (yesterday.equals(streak.getLastActiveDate())) {
        streak.setCurrentStreak(streak.getCurrentStreak() + 1);
    } else {
        streak.setCurrentStreak(1);
    }

    streak.setLongestStreak(Math.max(streak.getCurrentStreak(), streak.getLongestStreak()));
    streak.setLastActiveDate(today);
    streak.setTotalXp(streak.getTotalXp() + 10); // XP por dia ativo
    repo.save(streak);
}
```

### 7.2 Dashboard de Performance

| Método | Rota                  | Descrição                  | Auth |
| ------ | --------------------- | -------------------------- | ---- |
| GET    | `/api/me/performance` | Consolidado de performance | JWT  |

**Response:**

```json
{
  "streak": { "current": 5, "longest": 12, "totalXp": 340 },
  "overall": {
    "totalSessions": 42,
    "totalQuestionsAnswered": 1580,
    "totalCorrect": 1120,
    "averageScore": 0.71,
    "totalTimeSpentMs": 8400000
  },
  "byModule": [
    {
      "moduleKey": "m.airframe",
      "flashcard": { "sessions": 10, "questions": 200 },
      "practice": { "sessions": 8, "questions": 300, "averageScore": 0.75 },
      "test": {
        "sessions": 5,
        "questions": 250,
        "averageScore": 0.72,
        "passRate": 0.6
      }
    }
  ],
  "weakTopics": [
    {
      "moduleKey": "m.airframe",
      "topicCode": "T2",
      "topicTitle": "Weight & Balance",
      "percentage": 53
    }
  ]
}
```

---

## Fase 8 — Resumo dos Endpoints

### Públicos (sem auth)

| Método | Rota                        |
| ------ | --------------------------- |
| POST   | `/api/auth/register`        |
| POST   | `/api/auth/login`           |
| POST   | `/api/auth/forgot-password` |
| POST   | `/api/auth/reset-password`  |
| GET    | `/api/plans`                |
| POST   | `/api/webhooks/stripe`      |

### Autenticados (JWT)

| Método      | Rota                               |
| ----------- | ---------------------------------- |
| GET         | `/api/auth/me`                     |
| GET         | `/api/me/student`                  |
| GET/PATCH   | `/api/me/profile`                  |
| POST        | `/api/me/password`                 |
| PATCH       | `/api/me/onboarding`               |
| POST        | `/api/me/billing-portal`           |
| GET         | `/api/me/performance`              |
| GET         | `/api/me/entitlements`             |
| POST/DELETE | `/api/entitlements/enroll-license` |
| POST        | `/api/checkout`                    |
| GET         | `/api/content/licenses`            |
| GET         | `/api/content/modules`             |
| GET         | `/api/content/questions`           |
| GET         | `/api/content/metadata`            |
| POST        | `/api/study/session/start`         |
| POST        | `/api/study/session/finish`        |
| GET         | `/api/study/scores`                |
| POST        | `/api/study/scores/migrate`        |
| GET         | `/api/study/history`               |
| GET         | `/api/study/analytics`             |

---

## Fase 9 — Checklist de Verificação

- [ ] `./gradlew test` — all tests pass
- [ ] Registro cria user + Stripe customer + auto-enroll regs
- [ ] Login retorna JWT válido por 12h
- [ ] JWT é compatível com o web app (mesma secret)
- [ ] Forgot/reset password funciona com token de 30min
- [ ] GET /plans retorna planos ativos
- [ ] POST /checkout cria Stripe session com coupon
- [ ] Webhook processa eventos idempotentemente
- [ ] Trial: assinatura com status 'trialing' e expiresAt correto
- [ ] Session start valida: subscription + entitlement + usage caps
- [ ] Session finish persiste: session + answers + scores + progress + analytics
- [ ] Flashcard sessions agora são persistidas (não rejeitadas)
- [ ] GET /scores retorna map de question scores
- [ ] GET /analytics retorna performance por tópico
- [ ] POST /me/password exige senha atual
- [ ] Streak atualiza corretamente (dia seguido vs gap)
- [ ] Redis: cache hit evita queries de usage; fallback graceful se Redis down
- [ ] Soft delete: todas as queries filtram deletedAt IS NULL
