# Redesign da Tela de Login - ScanRadar

Refatoração completa da tela de autenticação para um layout dividido moderno, profissional e focado em prospecção de leads.

## Mudanças Visuais e de Layout

- **Layout Dividido (Split Layout):** No desktop, a tela será dividida em duas áreas:
  - **Esquerda (Apresentação):** Fundo escuro (`#07111F`) com um radar animado de alta fidelidade, título de impacto e descrição do valor do produto.
  - **Direita (Autenticação):** Painel de login integrado com superfície `#101D30`, campos `#142238` e bordas `#263750`.
- **Radar Animado Premium:**
  - Círculos concêntricos e linhas de grade fixas.
  - Feixe translúcido com rotação suave (4-6s).
  - Pontos de empresas detectadas com pulsos discretos.
  - Elementos abstratos de mapa ao fundo.
  - Respeito a `prefers-reduced-motion`.
- **Formulário de Login Aprimorado:**
  - Inputs com estados claros de foco, erro e preenchimento.
  - Opção de mostrar/ocultar senha.
  - Botão principal destacado (`#38BDF8`).
  - Fluxo de alternância entre Login e Cadastro preservado.
- **Responsividade:** Layout em coluna única no mobile, com radar compacto no topo.

## Detalhes Técnicos

- **Cores e Tokens:** Implementação das cores específicas solicitadas via Tailwind e variáveis CSS.
- **Componentes Shadcn:** Atualização do uso de `Card`, `Input` e `Button` para o novo tema escuro personalizado.
- **Acessibilidade:** 
  - Contraste WCAG AA.
  - Navegação completa por teclado e foco visível.
  - Áreas de toque de no mínimo 44px.
  - Labels acessíveis e ARIA-labels em ícones.
- **Preservação de Lógica:** Nenhuma mudança nas funções de `supabase.auth`, redirecionamentos ou variáveis de ambiente.

## Arquivos a serem modificados

- `src/styles.css`: Adição de novos tokens de cores e utilitários de animação para o radar.
- `src/components/AnimatedRadarLogo.tsx`: Evolução para o "Radar Grande" com mais detalhes e elementos de mapa.
- `src/components/AuthPage.tsx`: Reestruturação completa do JSX para o layout split e novos estilos.
