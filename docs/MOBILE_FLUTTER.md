# AME ONE — Mobile Flutter (Guia Evolutivo)

> **Objetivo**: App mobile Flutter que consome o backend Spring Boot documentado em `MOBILE_BACKEND_SPRINGBOOT.md`. O layout reproduz fielmente o design system do web app existente, adaptado para mobile.

---

## Design System — Referência Visual do Web App

> Todas as cores, bordas, tipografias e padrões abaixo foram extraídos diretamente dos componentes React existentes. O Flutter deve reproduzir esse visual fielmente.

### Paleta de Cores

| Token                     | Hex                                            | Uso                                                                                |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Primary Blue**          | `#2d4bb3`                                      | Botões primários, badges ativos, barra de progresso, ícones selecionados           |
| **Dark Navy**             | `#102a54`                                      | Header/brand do landing, locale switcher ativo, card premium pricing               |
| **Orange CTA**            | `#ff6d3a`                                      | Call-to-action principal (Finish onboarding, "POPULAR" ribbon), círculos numerados |
| **Cyan Accent**           | `#18c8ff`                                      | Destaque landing (features, checkmarks no plan premium)                            |
| **Background Light**      | `#f8fafc`                                      | Fundo global (landing, auth)                                                       |
| **Background Logged**     | `#f7f8fc`                                      | Fundo da área logada                                                               |
| **Card BG**               | `#ffffff`                                      | Fundo dos cards                                                                    |
| **Selected State BG**     | `#eef3ff`                                      | Fundo de items selecionados (seções, opções quiz)                                  |
| **Selected State Border** | `#c9d4f4`                                      | Borda de items selecionados                                                        |
| **Light Blue BG**         | `#f6f8ff`                                      | Fundo de sidebar item ativo                                                        |
| **Light Blue Border**     | `#d8e0fb`                                      | Borda de sidebar item ativo                                                        |
| **Amber (warning)**       | bg `#fffbeb`, border `#fde68a`, text `#92400e` | Badges de aviso (limite atingido, coming soon)                                     |
| **Emerald (success)**     | bg `#ecfdf5`, border `#a7f3d0`, text `#065f46` | Badges de sucesso (ativo, pass)                                                    |
| **Red (error)**           | bg `#fef2f2`, border `#fecaca`, text `#991b1b` | Badges de erro (fail, manutenção)                                                  |
| **Text Primary**          | `#0f172a` (slate-900)                          | Texto principal                                                                    |
| **Text Secondary**        | `#64748b` (slate-500)                          | Texto secundário/descrições                                                        |
| **Text Muted**            | `#94a3b8` (slate-400)                          | Labels menores                                                                     |

```dart
// lib/theme/colors.dart
class AppColors {
  static const primaryBlue = Color(0xFF2D4BB3);
  static const darkNavy = Color(0xFF102A54);
  static const orangeCta = Color(0xFFFF6D3A);
  static const cyanAccent = Color(0xFF18C8FF);
  static const bgLight = Color(0xFFF8FAFC);
  static const bgLogged = Color(0xFFF7F8FC);
  static const selectedBg = Color(0xFFEEF3FF);
  static const selectedBorder = Color(0xFFC9D4F4);
  static const sidebarActiveBg = Color(0xFFF6F8FF);
  static const sidebarActiveBorder = Color(0xFFD8E0FB);
  static const cardShadow = Color(0x140F172A); // rgba(15,23,42,0.08)
}
```

### Tipografia

| Elemento            | Font                    | Size    | Weight         |
| ------------------- | ----------------------- | ------- | -------------- |
| **Brand/Logotipo**  | Sora                    | 24-32sp | Bold (700)     |
| **Headings (H1)**   | Sora                    | 28-36sp | Bold           |
| **Headings (H2)**   | Inter                   | 20-24sp | SemiBold (600) |
| **Body**            | Inter                   | 14-16sp | Regular (400)  |
| **Caption/Label**   | Inter                   | 12-13sp | Medium (500)   |
| **Score principal** | Sora                    | 40-48sp | Bold           |
| **Timer (mono)**    | IBM Plex Mono / SF Mono | 14sp    | Medium         |

```dart
// lib/theme/typography.dart
// Adicionar google_fonts: ^6.x ao pubspec.yaml
final soraFont = GoogleFonts.sora();
final interFont = GoogleFonts.inter();
```

### Raios de Borda & Sombras

| Componente                     | Border Radius    | Sombra                            |
| ------------------------------ | ---------------- | --------------------------------- |
| **GlassCard** (card principal) | 26-30px          | `0 16px 40px rgba(15,23,42,0.08)` |
| **Botão primário**             | 12-16px (lg-2xl) | nenhuma                           |
| **Input**                      | 12px             | nenhuma                           |
| **Badge/Pill**                 | 9999px (full)    | nenhuma                           |
| **Seção toggle**               | 16px             | nenhuma                           |
| **Card menor** (módulo)        | 20-24px          | `0 8px 24px rgba(15,23,42,0.06)`  |

```dart
// lib/theme/decorations.dart
class AppDecorations {
  static BoxDecoration glassCard = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(26),
    border: Border.all(color: const Color(0xFFE2E8F0)), // slate-200
    boxShadow: [
      BoxShadow(
        color: const Color(0x140F172A), // rgba(15,23,42,0.08)
        blurRadius: 40,
        offset: const Offset(0, 16),
      ),
    ],
  );
}
```

### Componente GlassCard (Flutter)

```dart
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;

  const GlassCard({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(24),
      decoration: AppDecorations.glassCard,
      child: child,
    );
  }
}
```

---

## Fase 0 — Setup do Projeto

### 0.1 Criar projeto Flutter

```bash
flutter create --org com.cerberus.ameone ame_one_mobile
cd ame_one_mobile
```

### 0.2 Dependências (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  # Navigation
  go_router: ^14.0.0
  # State Management
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.4.0
  # HTTP & API
  dio: ^5.4.0
  # Secure Storage
  flutter_secure_storage: ^9.2.0
  # Stripe
  flutter_stripe: ^11.0.0
  # UI
  google_fonts: ^6.2.0
  flutter_svg: ^2.0.0
  lucide_icons: ^0.257.0
  # Charts
  fl_chart: ^0.68.0
  # Utilities
  intl: ^0.19.0
  url_launcher: ^6.2.0
  shimmer: ^3.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.4.0
  build_runner: ^2.4.0
  flutter_lints: ^4.0.0
```

### 0.3 Estrutura de pastas

```
lib/
├── main.dart
├── app.dart                    # MaterialApp + GoRouter
├── theme/
│   ├── colors.dart
│   ├── typography.dart
│   ├── decorations.dart
│   └── theme.dart              # ThemeData builder
├── core/
│   ├── api/
│   │   ├── dio_client.dart     # Dio + interceptors (JWT, error handling)
│   │   └── endpoints.dart      # Constantes de rotas da API
│   ├── auth/
│   │   ├── auth_provider.dart  # Riverpod: AuthState (token, user)
│   │   └── auth_service.dart   # Login, register, forgotPassword, resetPassword
│   ├── storage/
│   │   └── secure_storage.dart # flutter_secure_storage wrapper
│   └── models/
│       ├── user.dart
│       ├── plan.dart
│       ├── license_entitlement.dart
│       ├── study_session.dart
│       ├── question.dart
│       └── ...
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   ├── forgot_password_screen.dart
│   │   │   └── reset_password_screen.dart
│   │   └── widgets/
│   │       ├── auth_card.dart
│   │       └── license_badges.dart
│   ├── onboarding/
│   │   ├── screens/
│   │   │   └── onboarding_screen.dart
│   │   └── widgets/
│   │       ├── certification_grid.dart
│   │       └── study_level_selector.dart
│   ├── home/
│   │   ├── screens/
│   │   │   └── dashboard_screen.dart
│   │   └── widgets/
│   │       ├── quick_actions.dart
│   │       └── module_shortcut_card.dart
│   ├── study/
│   │   ├── screens/
│   │   │   ├── study_home_screen.dart
│   │   │   ├── quiz_screen.dart
│   │   │   ├── practice_results_screen.dart
│   │   │   └── test_results_screen.dart
│   │   ├── widgets/
│   │   │   ├── section_toggle.dart
│   │   │   ├── mode_card.dart
│   │   │   ├── question_card.dart
│   │   │   ├── option_tile.dart
│   │   │   ├── score_indicator.dart
│   │   │   ├── timer_pill.dart
│   │   │   ├── progress_bar.dart
│   │   │   ├── donut_chart.dart
│   │   │   └── topic_breakdown_table.dart
│   │   └── providers/
│   │       ├── study_session_provider.dart
│   │       ├── question_scores_provider.dart
│   │       └── study_gating_provider.dart
│   ├── pricing/
│   │   ├── screens/
│   │   │   └── pricing_screen.dart
│   │   └── widgets/
│   │       ├── plan_card.dart
│   │       ├── interval_toggle.dart
│   │       └── coupon_input.dart
│   ├── profile/
│   │   ├── screens/
│   │   │   ├── profile_screen.dart
│   │   │   └── change_password_screen.dart
│   │   └── widgets/
│   │       └── performance_summary.dart
│   └── performance/
│       ├── screens/
│       │   └── performance_screen.dart
│       └── widgets/
│           ├── streak_card.dart
│           ├── module_stats_card.dart
│           └── weak_topics_list.dart
└── shared/
    └── widgets/
        ├── glass_card.dart
        ├── primary_button.dart
        ├── outline_button.dart
        ├── status_badge.dart
        ├── loading_skeleton.dart
        └── app_bar.dart
```

---

## Fase 1 — Telas de Autenticação

### 1.1 Login Screen

**Referência web**: `PublicLoginPage.tsx` — Card centralizado em fundo claro.

**Layout mobile:**

```
┌──────────────────────────────┐
│         (SafeArea)           │
│                              │
│     ✈  (ícone avião)        │
│   AME Canada Study Pro       │  ← Sora 24sp Bold, primaryBlue
│                              │
│  ┌────────────────────────┐  │
│  │  📧  Email             │  │  ← Input com ícone Mail, borderRadius 12
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  🔒  Password    👁    │  │  ← Input com ícone Lock + toggle visibility
│  └────────────────────────┘  │
│                              │
│  [     Sign In            ]  │  ← primaryBtn: bg #2d4bb3, text white, rounded-lg, h-48
│                              │
│  Forgot password?            │  ← TextButton, primaryBlue
│                              │
│  ┌─┬─┬─┬─┬─┐               │
│  │M│E│S│🎈│📋│              │  ← License badges row (colored pills)
│  └─┴─┴─┴─┴─┘               │
│                              │
│  Don't have an account?      │
│  Create Account →            │  ← TextButton, primaryBlue
│                              │
│  Pricing · Terms · Privacy   │  ← Footer links, slate-400
└──────────────────────────────┘
```

**Specs web extraídos:**

- Card: `max-w-[355px] rounded-[18px]` com sombra → Mobile: `padding 24, borderRadius 18`
- Brand: Ícone avião em círculo `bg-[#2d4bb3]` (52×52) + texto Sora
- Inputs: `border-slate-200`, focus `ring-[#2d4bb3]`, ícone à esquerda (Mail, Lock)
- Show password: Checkbox inline → Mobile: ícone olho no suffixIcon
- Botão Sign In: `h-12 w-full bg-[#2d4bb3] text-white rounded-lg`
- License badges: Row de pills coloridos — M(blue), E(green), S(orange), Balloons(pink), REGS(gray)

### 1.2 Register Screen

**Referência web**: `PublicRegisterPage.tsx` — Mesmo layout do login com campos extras.

**Layout mobile:**

```
┌──────────────────────────────┐
│     ✈  AME Canada Study Pro  │
│                              │
│  ┌────────────────────────┐  │
│  │  👤  Full Name          │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  📧  Email             │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  🔒  Password          │  │
│  └────────────────────────┘  │
│                              │
│  Select your plan:           │  ← slate-700 semibold
│  ┌──────────┐ ┌──────────┐  │
│  │ ○ Basic  │ │ ● Standard│  │  ← Plan cards com radio indicator
│  │ 7d trial │ │ 7d trial │  │    Selected: selectedBg + selectedBorder
│  └──────────┘ └──────────┘  │
│  ┌──────────────────────┐   │
│  │ ○ Premium            │   │
│  │ 7d trial             │   │
│  └──────────────────────┘   │
│                              │
│  [    Create Account      ]  │  ← primaryBtn
│                              │
│  Already have an account?    │
│  Sign In →                   │
└──────────────────────────────┘
```

**Specs web extraídos:**

- Plans: Cards com borda `border-slate-200`, selected: `border-[#c9d4f4] bg-[#eef3ff]`
- Radio indicator: Círculo vazio/preenchido com `primaryBlue`
- Trial days: Badge `text-xs text-slate-500` (e.g., "7 day free trial")

### 1.3 Forgot Password Screen

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  🔑  Forgot Password         │  ← Sora 20sp
│                              │
│  Enter your email and we'll  │
│  send a reset link.          │  ← slate-500
│                              │
│  ┌────────────────────────┐  │
│  │  📧  Email             │  │
│  └────────────────────────┘  │
│                              │
│  [    Send Reset Link     ]  │
│                              │
│  ✅ Check your inbox!        │  ← Success state: emerald card
└──────────────────────────────┘
```

### 1.4 Reset Password Screen

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  🔐  Reset Password          │
│                              │
│  ┌────────────────────────┐  │
│  │  🔒  New Password      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  🔒  Confirm Password  │  │
│  └────────────────────────┘  │
│                              │
│  [    Reset Password      ]  │
└──────────────────────────────┘
```

---

## Fase 2 — Onboarding

**Referência web**: `OnboardingPage.tsx` — Wizard de 2 steps.

**Layout mobile** (em PageView ou Stepper):

### Step 1 — Seleção de Certificações

```
┌──────────────────────────────┐
│  Step 1 of 2                 │  ← Pill indicator
│                              │
│  Choose your certifications  │  ← Sora 20sp Bold
│  Select up to N licenses     │  ← slate-500, N vem do plan.maxLicenses
│                              │
│  ┌────────────────────────┐  │
│  │ ✈ M — Maintenance      │  │  ← Toggle card
│  │ Aircraft maintenance    │  │    Selected: selectedBg + selectedBorder
│  │ [FOCUS]                 │  │    Pill "FOCUS" em orange se primaryLicenseId
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ⚡ E — Avionics        │  │
│  │ Electronic systems      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔧 S — Structures      │  │
│  │ Structural repair       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🎈 Balloons            │  │
│  │ Hot air balloons        │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 📋 REGS — Regulations  │  │  ← Sempre incluída
│  │ [INCLUDED]              │  │    Badge emerald "INCLUDED"
│  └────────────────────────┘  │
│                              │
│  ⚠️ Basic plan: 1 license   │  ← Warning card (amber) se maxLicenses == 1
│                              │
│          [Continue →]        │  ← primaryBtn
└──────────────────────────────┘
```

**Specs web extraídos:**

- Certification cards: `rounded-2xl border-2`, selected: `border-[#c9d4f4] bg-[#eef3ff]`, unselected: `border-slate-200`
- "FOCUS" badge: `bg-[#ff6d3a] text-white text-xs px-2 py-0.5 rounded-full`
- "INCLUDED" badge: `bg-emerald-50 text-emerald-700 border-emerald-200`
- Plan limit warning: `bg-amber-50 border-amber-200 text-amber-800 rounded-xl p-3`

### Step 2 — Nível e Objetivo

```
┌──────────────────────────────┐
│  Step 2 of 2                 │
│                              │
│  Your study profile          │  ← Sora 20sp Bold
│                              │
│  Study Level:                │
│  ○ Just starting out         │
│  ○ Some experience           │
│  ● Preparing for exams       │  ← RadioGroup, selected: primaryBlue fill
│  ○ Licensed, staying current │
│                              │
│  Study Goal:                 │
│  ○ General knowledge         │
│  ● Pass the TC exam          │
│  ○ Career advancement        │
│                              │
│  [← Back]    [Finish ✓]     │  ← Back: outlineBtn, Finish: bg-[#ff6d3a]
└──────────────────────────────┘
```

**Specs web extraídos:**

- Radio items: `rounded-xl border-slate-200 p-3`, selected: `border-[#c9d4f4] bg-[#eef3ff]`
- Finish button: `bg-[#ff6d3a] text-white rounded-lg` (laranja, não azul)

---

## Fase 3 — Dashboard (Home Logada)

**Referência web**: `AppHomePage.tsx` + `LoggedAppShell.tsx`

### Navigation (BottomNavigationBar)

```
┌──────────────────────────────┐
│  ┌─────┬─────┬─────┬─────┐  │
│  │Home │Study│Perf.│Prof.│  │  ← 4 tabs
│  │ 🏠  │ 📚  │ 📊  │ 👤  │  │    Active: primaryBlue, Inactive: slate-400
│  └─────┴─────┴─────┴─────┘  │
└──────────────────────────────┘
```

**Web usa top nav**: Dashboard / Study / Profile → Mobile usa BottomNav com 4 tabs.

### Dashboard Screen

```
┌──────────────────────────────┐
│  AME ONE              🔔 EN │  ← AppBar: logo + notification + locale
│                              │
│  Welcome back, John! 👋      │  ← Sora 20sp
│                              │
│  ┌────────────────────────┐  │
│  │ 📚 Study               │  │  ← GlassCard, ícone em círculo primaryBlue
│  │ Continue your modules   │  │
│  │                    →   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 📊 Performance         │  │  ← GlassCard
│  │ Track your progress     │  │
│  │                    →   │  │
│  └────────────────────────┘  │
│                              │
│  Quick Actions               │  ← Section title
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │M │ │E │ │S │ │🎈│       │  ← License shortcut pills (scroll horizontal)
│  └──┘ └──┘ └──┘ └──┘       │
│                              │
│  🔥 5-day streak! 340 XP    │  ← Streak card: amber/orange gradient
│                              │
│  💡 Tip: Review flashcards  │  ← Tips ticker (rotating)
│     daily for best results   │
└──────────────────────────────┘
```

**Specs web extraídos:**

- Welcome: `text-3xl font-bold` + wave emoji
- Quick Actions: `PillButton` = `rounded-full border-slate-200 bg-white px-4 py-2` com ícone
- Study card: GlassCard com `rounded-[26px]`, ícone em círculo `bg-[#eef3ff]` (52×52)
- TipsTicker: `bg-[#f6f8ff] rounded-xl p-4`, ícone Lightbulb em amber

---

## Fase 4 — Pricing & Assinatura

**Referência web**: `LandingPricingSection.tsx` + `PricingClient.tsx`

### Pricing Screen

```
┌──────────────────────────────┐
│  ← Back         Choose Plan  │
│                              │
│  ┌─Monthly─┬─Annual──────┐  │  ← Interval toggle
│  │         │ Save 15% 🏷 │  │    Active: bg-white pill, Inactive: transparent
│  └─────────┴─────────────┘  │    Container: bg-slate-100 rounded-full
│                              │
│  ┌────────────────────────┐  │
│  │ BASIC                  │  │  ← Plan card (white bg)
│  │ $9.99/mo               │  │    Price: Sora 36sp Bold
│  │                        │  │
│  │ ✓ 1 license            │  │    Feature: Check icon + text
│  │ ✓ 20 flashcards/day    │  │    Check icon: text-emerald-500
│  │ ✓ 2 practice/day       │  │
│  │ ✓ 1 test/week          │  │
│  │                        │  │
│  │ [   Subscribe   ]      │  │    ← primaryBtn
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ★ STANDARD  [POPULAR]  │  │  ← Highlighted: bg-[#102a54] text-white
│  │ $19.99/mo              │  │    "POPULAR" ribbon: bg-[#ff6d3a]
│  │                        │  │
│  │ ✓ 3 licenses           │  │    Check icon: text-[#18c8ff] (cyan)
│  │ ✓ Unlimited flashcards │  │
│  │ ✓ Unlimited practice   │  │
│  │ ✓ 3 tests/week         │  │
│  │                        │  │
│  │ [   Subscribe   ]      │  │    ← btn bg-white text-[#102a54]
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ PREMIUM                │  │  ← Plan card (white bg)
│  │ $29.99/mo              │  │
│  │                        │  │
│  │ ✓ All licenses         │  │
│  │ ✓ Everything unlimited │  │
│  │ ✓ Logbook access       │  │
│  │                        │  │
│  │ [   Subscribe   ]      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │  ← Coupon input (só annual)
│  │ 🏷 Have a coupon code? │  │
│  │ ┌──────────┐ [Apply]   │  │
│  │ └──────────┘           │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Specs web extraídos:**

- Interval toggle: Container `bg-slate-100 rounded-full p-1`. Pills: `rounded-full px-4 py-2`. Active: `bg-white text-slate-900 shadow-sm`. Save badge: `bg-emerald-100 text-emerald-700 text-xs rounded-full px-2`
- Plan card normal: `bg-white border-slate-200 rounded-[26px]`
- Plan card popular: `bg-[#102a54] text-white rounded-[26px]`. "POPULAR" ribbon: `bg-[#ff6d3a] text-white text-xs px-3 py-1 rounded-full`
- Price: Sora font `text-4xl-5xl font-bold`. Period: `text-sm text-slate-500`
- Features: `flex items-center gap-2`, Check icon 16px (emerald normal, cyan highlighted)
- Subscribe btn: `w-full h-12 rounded-lg font-semibold`

**Fluxo Stripe no mobile:**

1. POST `/api/checkout` com planId + interval + couponCode
2. Recebe `{ url }` (Stripe Checkout URL)
3. Abrir no `url_launcher` (InAppWebView ou external browser)
4. Success/cancel URL → deep link `ameone://payment-success` / `ameone://payment-cancel`
5. App detecta deep link, refresh student state

---

## Fase 5 — Study (Motor de Estudo)

### 5.1 Study Home Screen

**Referência web**: `StudyHomeScreen.tsx`

```
┌──────────────────────────────┐
│  ← Back       M — Airframe   │  ← AppBar com título do módulo
│                              │
│  Aircraft Maintenance         │  ← Sora 24sp Bold
│  Study airframe structures    │  ← slate-500
│  and systems                  │
│                              │
│  ┌────────────────────────┐  │
│  │ Select Sections         │  │  ← GlassCard
│  │                        │  │
│  │ [All Sections]          │  │  ← outlineBtn: border-slate-200
│  │                        │  │
│  │ ┌──────┐ ┌──────┐     │  │  ← Toggle chips (Wrap layout)
│  │ │✓ S1  │ │  S2  │     │  │    Selected: bg-[#eef3ff] border-[#c9d4f4]
│  │ └──────┘ └──────┘     │  │    Unselected: bg-white border-slate-200
│  │ ┌──────┐ ┌──────┐     │  │
│  │ │  S3  │ │  S4  │     │  │    Each chip: rounded-2xl px-4 py-2
│  │ └──────┘ └──────┘     │  │
│  │                        │  │
│  │ 48 questions selected   │  │  ← slate-500
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ Study Modes             │  │  ← GlassCard
│  │                        │  │
│  │ ┌──────────────────┐   │  │
│  │ │ 🃏 Flashcards     │   │  │  ← Mode container: rounded-2xl border
│  │ │ 5/20 today        │   │  │    Usage: "used/limit unit"
│  │ │ [  Start  ]       │   │  │    Start btn: primaryBtn
│  │ └──────────────────┘   │  │
│  │                        │  │
│  │ ┌──────────────────┐   │  │
│  │ │ 📝 Practice       │   │  │
│  │ │ 1/2 today         │   │  │
│  │ │ [  Start  ]       │   │  │
│  │ └──────────────────┘   │  │
│  │                        │  │
│  │ ┌──────────────────┐   │  │  ← Se esgotado: borda amber gradient
│  │ │ 📋 Test           │   │  │    `border: 2px amber-300`
│  │ │ 1/1 this week ⚠️  │   │  │    Badge amber: "Limit reached"
│  │ │ [  Start  ] 🔒    │   │  │    Btn disabled: opacity 0.5
│  │ └──────────────────┘   │  │
│  └────────────────────────┘  │
│                              │
│  M — Airframe · All sections │  ← Deck label, slate-400
└──────────────────────────────┘
```

**Specs web extraídos:**

- Section chips: `rounded-2xl border-2 px-4 py-2.5 text-sm font-medium`
  - Selected: `border-[#c9d4f4] bg-[#eef3ff] text-[#2d4bb3]`
  - Unselected: `border-slate-200 bg-white text-slate-600`
- "Select All" btn: `outlineBtn` = `border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
- Mode container: `rounded-2xl border border-slate-200 p-4`
- Exhausted mode: `border-amber-300 bg-gradient-to-r from-amber-50/50`
- Start button: `bg-[#2d4bb3] text-white rounded-lg h-10 w-full`
- Disabled start: `opacity-50 cursor-not-allowed`

### 5.2 Quiz Screen

**Referência web**: `QuizScreen.tsx`

```
┌──────────────────────────────┐
│  [✕]  📝 Practice   ●●●○○  │  ← Close btn + mode pill + ScoreIndicator
│                              │
│  ██████████░░░  12/48        │  ← Progress bar: h-2 bg-[#2d4bb3] on slate-100
│                              │     + "question X of Y"
│  ┌────────────────────────┐  │
│  │ Question stem text      │  │  ← GlassCard
│  │ here can be multiple    │  │    fontSize 16sp, slate-900
│  │ lines long...           │  │
│  │                        │  │
│  │ ┌────────────────────┐ │  │  ── FLASHCARD MODE ──
│  │ │ ✅ Correct: B       │ │  │  (mostrado após user "virar" o card)
│  │ │ Explanation text... │ │  │  bg-emerald-50 border-emerald-200
│  │ │ 📖 Ref: CAR 625    │ │  │  Ref em card separado: bg-slate-50
│  │ └────────────────────┘ │  │
│  │                        │  │
│  │ ┌────────────────────┐ │  │  ── PRACTICE/TEST MODE ──
│  │ │ ○ A) Option text   │ │  │  Radio options
│  │ └────────────────────┘ │  │  Unselected: border-slate-200 bg-white
│  │ ┌────────────────────┐ │  │  Selected: border-[#c9d4f4] bg-[#eef3ff]
│  │ │ ● B) Option text ✓ │ │  │
│  │ └────────────────────┘ │  │  Practice correct: border-emerald-300 bg-emerald-50
│  │ ┌────────────────────┐ │  │  Practice wrong: border-red-300 bg-red-50
│  │ │ ○ C) Option text   │ │  │
│  │ └────────────────────┘ │  │  Each option: rounded-xl p-4 border-2
│  │ ┌────────────────────┐ │  │
│  │ │ ○ D) Option text   │ │  │
│  │ └────────────────────┘ │  │
│  │                        │  │
│  │ ┌────────────────────┐ │  │  ── PRACTICE FEEDBACK ──
│  │ │ ✅ Correct!         │ │  │  (mostrado após responder em practice)
│  │ │ Correct answer: B   │ │  │  bg-emerald-50 border-emerald-200
│  │ │ Explanation...      │ │  │  OU bg-red-50 border-red-300
│  │ └────────────────────┘ │  │
│  └────────────────────────┘  │
│                              │
│  [← Prev]        [Next →]   │  ← Navigation buttons
│                              │
│  ┌────────────────────────┐  │  ── TEST MODE ONLY ──
│  │  ⏱ 44:32               │  │  Timer pill: bg-[#eef3ff] text-[#2d4bb3]
│  └────────────────────────┘  │  Mono font, rounded-full
└──────────────────────────────┘
```

**Specs web extraídos:**

- Mode pill: `rounded-full border-[#c9d4f4] bg-[#eef3ff] text-[#2d4bb3] px-3 py-1 text-sm font-medium` + ícone (Layers/PenTool/FileText)
- Progress bar: Container `h-2 rounded-full bg-slate-100`. Fill `h-2 rounded-full bg-[#2d4bb3]` com transition
- Score indicator (dots): 5 dots, `w-2 h-2 rounded-full`. Filled: `bg-[#2d4bb3]`. Empty: `bg-slate-200`
- Options: `rounded-xl border-2 p-4`. Unselected: `border-slate-200`. Selected: `border-[#c9d4f4] bg-[#eef3ff]`
- Practice correct feedback: `border-emerald-300 bg-emerald-50 text-emerald-800 rounded-xl p-4`
- Practice wrong feedback: `border-red-300 bg-red-50 text-red-800 rounded-xl p-4`
- Flashcard answer card: Correct answer em `font-semibold`, explanation em `text-sm text-slate-600`
- Navigation: Prev = outlineBtn, Next = primaryBtn. `h-10 rounded-lg`
- Timer: `rounded-full bg-[#eef3ff] px-4 py-2 font-mono text-[#2d4bb3]`
- Close button (X): `rounded-xl border-slate-200 bg-white w-10 h-10`

### 5.3 Practice Results Screen

**Referência web**: `PracticeResultsScreen.tsx`

```
┌──────────────────────────────┐
│                              │
│     🧠                       │  ← Brain icon em círculo bg-[#eef3ff] (64×64)
│  Practice Summary            │  ← Sora 24sp Bold
│                              │
│  ┌────────────────────────┐  │
│  │         75%            │  │  ← Score: Sora 48sp Bold, primaryBlue
│  │      ╭──────╮          │  │  ← Donut chart (CSS conic-gradient → fl_chart)
│  │     │ 36/48 │          │  │    Preenchido: primaryBlue
│  │      ╰──────╯          │  │    Vazio: slate-100
│  │                        │  │
│  │  ✓ 36 correct          │  │  ← emerald-600
│  │  ✕ 10 incorrect        │  │  ← red-500
│  │  ○ 2 unanswered        │  │  ← slate-400
│  └────────────────────────┘  │
│                              │
│  Missed Questions             │  ← Section title se houver erros
│  ┌────────────────────────┐  │
│  │ Q12: [stem truncado]   │  │  ← ScrollView com questions erradas
│  │ Your: A  Correct: C    │  │    Cada: border-slate-200 rounded-xl p-3
│  │ 📖 CAR 625.07          │  │    Ref: text-xs slate-400
│  ├────────────────────────┤  │
│  │ Q25: [stem truncado]   │  │
│  │ Your: D  Correct: B    │  │
│  └────────────────────────┘  │
│                              │
│  [  Repeat Practice  ]       │  ← primaryBtn
│  [  Study Only Incorrect ]   │  ← outlineBtn
│  [  ← Back to Module    ]   │  ← TextButton
└──────────────────────────────┘
```

**Specs web extraídos:**

- Header icon: `bg-[#eef3ff]` circle com brain icon em `text-[#2d4bb3]`
- Score percentage: `Sora text-4xl font-bold text-[#2d4bb3]`
- Donut: width 160, ring width 12, colors: `#2d4bb3` (filled), `#e2e8f0` (empty)
- Stats list: `flex items-center gap-2`, dot antes de cada (emerald/red/slate)
- Missed questions: `max-h-[240px] overflow-y-auto` → Mobile: `SizedBox(height: 240)` + ListView
- Action buttons: full width, stacked vertically, gap 12

### 5.4 Test Results Screen

**Referência web**: `TestResultsScreen.tsx`

```
┌──────────────────────────────┐
│                              │
│     🏆                       │  ← Trophy icon em círculo (64×64)
│  Test Results                │  ← Sora 24sp Bold
│                              │
│  ┌────────────────────────┐  │
│  │         72%            │  │  ← Score: Sora 48sp Bold
│  │      ╭──────╮          │  │  ← Donut chart (maior: 160×160)
│  │     │ 36/50 │          │  │
│  │      ╰──────╯          │  │
│  │                        │  │
│  │   ✅ PASS              │  │  ← Badge: bg-emerald-100 text-emerald-700
│  │   Pass mark: 70%       │  │    OU: bg-red-100 text-red-700 "FAIL"
│  │                        │  │
│  │  ✓ 36 correct          │  │
│  │  ✕ 12 incorrect        │  │
│  │  ○ 2 unanswered        │  │
│  └────────────────────────┘  │
│                              │
│  Study Focus                  │  ← Se houver focusTopics
│  ┌────────────────────────┐  │
│  │ Topics needing work:    │  │
│  │ • T2 Weight & Balance   │  │  ← Cada topic: bullet + text
│  │ • T5 Electrical         │  │
│  │           [📋 Copy]     │  │  ← Copy button
│  └────────────────────────┘  │
│                              │
│  Topic Breakdown              │  ← Scrollable table
│  ┌────────────────────────┐  │
│  │ Topic    Score    Class │  │
│  │ T1       16/20  Strong  │  │  ← Strong: emerald pill
│  │ T2        8/15  Needs   │  │  ← Needs Study: red pill
│  │ T3       10/15  Border  │  │  ← Borderline: amber pill
│  └────────────────────────┘  │
│                              │
│  [  Take Another Test  ]     │  ← primaryBtn
│  [  Practice Incorrect ]     │  ← outlineBtn
│  [  ← Back to Module   ]    │  ← TextButton
└──────────────────────────────┘
```

**Specs web extraídos:**

- Trophy icon: `bg-[#eef3ff]` circle com Trophy em `text-[#2d4bb3]`
- PASS badge: `bg-emerald-100 text-emerald-700 rounded-full px-4 py-1 font-semibold`
- FAIL badge: `bg-red-100 text-red-700 rounded-full px-4 py-1 font-semibold`
- Pass mark: `text-sm text-slate-500` abaixo do badge
- Focus topics card: `bg-[#f6f8ff] rounded-xl border-[#d8e0fb] p-4`
- Copy button: `text-xs text-[#2d4bb3]` com ícone Copy
- Topic breakdown: Horizontal scroll `DataTable`
  - Classification pills: Strong=`bg-emerald-100 text-emerald-700`, Borderline=`bg-amber-100 text-amber-700`, Needs Study=`bg-red-100 text-red-700`
  - Each: `rounded-full text-xs px-2 py-0.5`

---

## Fase 6 — Perfil & Troca de Senha

### Profile Screen

```
┌──────────────────────────────┐
│  Profile                      │
│                              │
│  ┌────────────────────────┐  │
│  │     JD                 │  │  ← Avatar circle: bg-[#eef3ff] text-[#2d4bb3]
│  │  John Doe              │  │    Initials: Sora 24sp Bold
│  │  john@email.com        │  │    Name: Inter 20sp SemiBold
│  │  Basic Plan · Trial    │  │    Email + plan: slate-500
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 👤 Edit Name        → │  │  ← GlassCard list tiles
│  ├────────────────────────┤  │
│  │ 🔒 Change Password  → │  │
│  ├────────────────────────┤  │
│  │ 💳 Manage Billing   → │  │  ← Opens Stripe billing portal
│  ├────────────────────────┤  │
│  │ 📋 View Plans       → │  │
│  ├────────────────────────┤  │
│  │ 🌐 Language: EN     → │  │  ← Toggle EN/PT
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🚪 Sign Out            │  │  ← Red text, destructive action
│  └────────────────────────┘  │
│                              │
│  Terms · Privacy · v1.0.0    │  ← Footer links
└──────────────────────────────┘
```

**Specs web extraídos:**

- Avatar: `w-16 h-16 rounded-full bg-[#eef3ff] text-[#2d4bb3]` com initials
- User dropdown no web: mostra name, email, role
- Locale switcher: Pills `EN`/`PT`, active: `bg-[#102a54] text-white`, inactive: `bg-slate-100 text-slate-600`

### Change Password Screen

```
┌──────────────────────────────┐
│  ← Back   Change Password    │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔒 Current password    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔒 New password        │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔒 Confirm password    │  │
│  └────────────────────────┘  │
│                              │
│  [   Update Password   ]     │  ← primaryBtn
└──────────────────────────────┘
```

---

## Fase 7 — Performance Dashboard

**Referência web**: Study Hub page com progress bars e stats.

### Performance Screen

```
┌──────────────────────────────┐
│  Performance                  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔥 Streak              │  │  ← GlassCard
│  │                        │  │
│  │   5 days               │  │  ← Sora 36sp Bold, orange gradient text
│  │   Longest: 12 days     │  │  ← slate-500
│  │   Total XP: 340        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ Overall Stats           │  │  ← GlassCard
│  │                        │  │
│  │ Sessions: 42            │  │
│  │ Questions: 1,580        │  │
│  │ Accuracy: 71%           │  │  ← Progress bar: primaryBlue
│  │ Time: 2h 20m            │  │
│  └────────────────────────┘  │
│                              │
│  Module Breakdown             │
│  ┌────────────────────────┐  │
│  │ M — Airframe            │  │  ← Module card
│  │ ┌────┬────┬────┐       │  │
│  │ │🃏10│📝8 │📋5 │       │  │  ← Mode stats: sessions count
│  │ └────┴────┴────┘       │  │
│  │ Avg test: 72% (3/5 ✓)  │  │  ← Pass rate
│  │ ██████████░░░░ 72%      │  │  ← Progress bar
│  └────────────────────────┘  │
│                              │
│  Weak Topics                  │  ← Seção de tópicos fracos
│  ┌────────────────────────┐  │
│  │ ⚠️ Weight & Balance     │  │  ← amber card
│  │   M — Airframe · 53%   │  │
│  ├────────────────────────┤  │
│  │ ⚠️ Electrical Systems   │  │
│  │   M — Airframe · 48%   │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Specs web extraídos (Study Hub page):**

- Module progress bar: Container `h-3 rounded-full bg-slate-100`. Fill: `bg-[#2d4bb3]`
- Mode stats: 3-column grid. Cada: `rounded-xl bg-slate-50 p-3`, ícone colorido (flashcard=`text-[#2d4bb3]`, practice=`text-emerald-600`, test=`text-amber-600`)
- Test pass rate: `text-sm text-slate-500`, "✓" em emerald
- Weak topic card: `bg-amber-50 border-amber-200 rounded-xl p-3`, ícone AlertTriangle

---

## Fase 8 — Entitlement Guards (Gating UI)

**Referência web**: `EntitlementGuard.tsx` + `ModuleShortcutCard.tsx` + `ModuleStatusBadge.tsx`

### Module Shortcut Card (usado no dashboard de módulos)

```
┌────────────────────────────┐
│  📚  M — Airframe           │  ← Ícone + título
│  Aircraft structures         │  ← Descrição
│                              │
│  Estado varia:               │
│  ─────────────────────────── │
│  🟢 UNLOCKED:               │
│  │  [  Open  ]             │ │  ← primaryBtn
│  ─────────────────────────── │
│  🔒 LOCKED:                 │
│  │  🔒 Upgrade to access   │ │  ← amber badge: bg-amber-50 text-amber-700
│  │  [  Manage Access  ]    │ │  ← outlineBtn
│  ─────────────────────────── │
│  🟡 COMING SOON:            │
│  │  🕐 Coming Soon          │ │  ← amber badge
│  ─────────────────────────── │
│  ⏳ LOADING:                 │
│  │  ···                     │ │  ← Shimmer skeleton
│  ─────────────────────────── │
└────────────────────────────┘
```

**Specs web extraídos:**

- Card: `rounded-[26px] border-slate-200 bg-white p-5` com GlassCard shadow
- Unlocked: `Open` btn primaryBtn
- Locked: Badge `bg-amber-50 border-amber-200 text-amber-700 rounded-full px-3 py-1`, Lock icon amber-500
- Coming soon badge: `bg-amber-50 border-amber-200 text-amber-800 rounded-full px-3 py-1`
- Status badge (`ModuleStatusBadge`): `coming_soon`=amber, `maintenance`=red, `active`=emerald

### Subscription Expired Screen (fullscreen blocker)

```
┌──────────────────────────────┐
│                              │
│     🛡️                      │  ← ShieldCheck icon emerald
│                              │
│  Subscription Required       │  ← Sora 20sp Bold
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠️ Your subscription    │  │  ← amber card
│  │ has expired. Subscribe  │  │
│  │ to continue studying.   │  │
│  └────────────────────────┘  │
│                              │
│  [  View Plans  ]            │  ← primaryBtn
│  [  Manage Billing  ]        │  ← outlineBtn
└──────────────────────────────┘
```

---

## Fase 9 — Fluxo de Navegação (GoRouter)

```dart
// lib/app.dart — GoRouter configuration
final router = GoRouter(
  initialLocation: '/login',
  redirect: (context, state) {
    final isLoggedIn = /* check auth state */;
    final isOnboarded = /* check onboarding */;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');

    if (!isLoggedIn && !isAuthRoute) return '/login';
    if (isLoggedIn && isAuthRoute) return '/home';
    if (isLoggedIn && !isOnboarded) return '/onboarding';
    return null;
  },
  routes: [
    // Auth (sem bottom nav)
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
    GoRoute(path: '/reset-password', builder: (_, __) => const ResetPasswordScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),

    // Main app (com bottom nav via ShellRoute)
    ShellRoute(
      builder: (_, __, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const DashboardScreen()),
        GoRoute(
          path: '/study',
          builder: (_, __) => const StudyLicensesScreen(),
          routes: [
            GoRoute(
              path: ':licenseId',
              builder: (_, state) => StudyModulesScreen(licenseId: state.pathParameters['licenseId']!),
              routes: [
                GoRoute(
                  path: ':moduleKey',
                  builder: (_, state) => StudyHomeScreen(moduleKey: state.pathParameters['moduleKey']!),
                  routes: [
                    GoRoute(path: 'quiz', builder: (_, __) => const QuizScreen()),
                    GoRoute(path: 'results', builder: (_, __) => const TestResultsScreen()),
                    GoRoute(path: 'practice-results', builder: (_, __) => const PracticeResultsScreen()),
                  ],
                ),
              ],
            ),
          ],
        ),
        GoRoute(path: '/performance', builder: (_, __) => const PerformanceScreen()),
        GoRoute(
          path: '/profile',
          builder: (_, __) => const ProfileScreen(),
          routes: [
            GoRoute(path: 'change-password', builder: (_, __) => const ChangePasswordScreen()),
            GoRoute(path: 'edit-name', builder: (_, __) => const EditNameScreen()),
          ],
        ),
        GoRoute(path: '/pricing', builder: (_, __) => const PricingScreen()),
      ],
    ),
  ],
);
```

---

## Fase 10 — API Client (Dio)

```dart
// lib/core/api/dio_client.dart
class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8080'),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Clear token, redirect to login
        }
        handler.next(error);
      },
    ));
  }
}
```

---

## Fase 11 — Checklist de Verificação

### Auth

- [ ] Login → retorna JWT, salva em secure storage
- [ ] Register → cria conta, salva JWT, navega para onboarding
- [ ] Forgot password → mostra sucesso (sempre)
- [ ] Reset password → atualiza e navega para login
- [ ] Token expirado → redireciona para login automaticamente

### Onboarding

- [ ] Step 1: Mostra licenças, respeita maxLicenses do plan
- [ ] Step 2: Radio groups para level/goal
- [ ] Finish: PATCH onboarding, navega para dashboard

### Pricing & Stripe

- [ ] Planos carregados de GET /plans
- [ ] Toggle monthly/annual com badge "Save 15%"
- [ ] Coupon input visível apenas em annual
- [ ] Subscribe → Stripe Checkout → deep link de volta

### Study

- [ ] StudyHome: seções selecionáveis, modos com usage caps
- [ ] Flashcard: mostra stem, revela resposta
- [ ] Practice: responde, feedback imediato com explicação
- [ ] Test: timer, auto-finalize, 70% pass mark
- [ ] Results: donut chart, PASS/FAIL, topic breakdown
- [ ] Modo esgotado: badge amber, botão desabilitado

### Performance

- [ ] Streak card com dias corridos
- [ ] Overall stats: sessions, questions, accuracy
- [ ] Module breakdown com pass rate
- [ ] Weak topics listados com porcentagem

### Profile

- [ ] Mostra dados do user (avatar, name, email, plan)
- [ ] Edit name funciona
- [ ] Change password exige senha atual
- [ ] Manage billing abre Stripe portal
- [ ] Sign out limpa token + navega para login
- [ ] Locale toggle EN/PT

### UX

- [ ] Loading states: shimmer skeletons
- [ ] Error states: snackbar ou inline error cards
- [ ] Pull-to-refresh no dashboard e performance
- [ ] Deep link handling (Stripe return URLs)
- [ ] Offline: mensagem amigável quando sem conexão
