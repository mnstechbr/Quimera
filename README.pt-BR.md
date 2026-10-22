# Quimera

**Padrão de desenvolvimento com agentes de IA, montado com as melhores partes de projetos consagrados. Funciona com qualquer ferramenta.**

[English](README.md)

Na mitologia, a quimera é uma criatura feita de partes de animais diferentes. A Quimera faz o mesmo com o desenvolvimento assistido por IA: pega as peças mais maduras do [Superpowers](https://github.com/obra/superpowers), do [Spec Kit](https://github.com/github/spec-kit), do [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) e do [Agent OS](https://github.com/buildermethods/agent-os), adapta cada uma e acrescenta o que nenhum deles cobre.

É Markdown puro e alguns scripts pequenos em Node. Claude Code, Codex, Copilot, Cursor ou qualquer agente que leia arquivos consegue seguir.

## O que ela acrescenta

- **Modo discreto ou aberto.** No discreto, os commits saem só com a sua identidade, sem marca de agente. Uma trava do git remove as linhas de coautoria e de "gerado com" de qualquer ferramenta.
- **Identidade por projeto e por computador.** O projeto registra o nome e o e-mail do git, e toda sessão confere isso antes de commitar.
- **O seu jeito de usar o git.** Começa pela branch principal atualizada, usa uma branch nova por mudança, escreve commits no padrão `feat: …` e faz o push agrupado só quando você concorda.
- **Verificação só do que mudou.** Lint, tipos e os testes ligados às mudanças durante o trabalho; a suíte completa e o build uma vez antes do push.
- **Rodada de estudo.** Várias propostas, de modelos ou ângulos diferentes, recebem nota de um juiz separado pelos seus critérios.
- **Revisão de arquitetura contínua e explicada.** Roda no começo, a cada função nova e em tudo que toca segurança ou banco de dados, explicando o porquê em palavras simples.
- **Design para o público.** Poucas direções, com opinião, desenhadas com conteúdo real antes de qualquer tela.
- **Memória do projeto que qualquer agente retoma.** Um mapa curto, onde paramos, as decisões com o motivo e os seus padrões de código, para nenhum agente precisar reler o projeto inteiro.

## O fluxo

```
Início do projeto: kickoff → rodada de estudo → revisão da visão → revisão de arquitetura → direções de design → padrões de código
Cada tarefa:       início da tarefa → (revisão de arquitetura) → plano → agentes em paralelo → verificação → coerência → revisão → fechamento
```

As regras de cada etapa estão no [QUIMERA.md](QUIMERA.md). Cada etapa é uma skill em [skills/](skills/).

## Instalar num projeto

A Quimera foi feita para **projetos novos**. Dá para adicionar num projeto existente, mas aí o kickoff só acrescenta arquivos e nunca reorganiza o que já existe. Dentro do repositório git do projeto:

```bash
npx github:mnstechbr/Quimera init --tools=claude
```

- `--tools`: qualquer combinação de `claude,codex,copilot,cursor` (padrão `claude`).
- `--mode=discreet` instala a trava dos commits.
- `--local-only` deixa os arquivos da Quimera e a memória do projeto fora do git, só na sua máquina. Use em repositório da empresa.
- `--dry-run` mostra o que seria escrito, sem escrever.

Depois, abra o seu agente na pasta e diga: *"comece este projeto com a Quimera"*. A skill `project-kickoff` pergunta o modo, a identidade e o público antes de criar qualquer coisa.

Mais tarde: `npx github:mnstechbr/Quimera update` atualiza o kit. Arquivos que você editou são mantidos, e a versão nova fica ao lado de cada um como `*.quimera-new`. `npx github:mnstechbr/Quimera doctor` confere a instalação.

O instalador só copia Markdown e scripts pequenos. Ele nunca instala dependências, nunca mexe no seu código e nunca sobrescreve um arquivo que ele não criou.

## O que entra no seu projeto

```
AGENTS.md                 perfil do projeto, stack, regras (criado no kickoff, lido por todas as ferramentas)
.quimera/                 QUIMERA.md, scripts, adaptadores por ferramenta, modelos
.agents/skills/           as skills (espelhadas em .claude/skills, .github/skills ou .cursor/skills conforme a ferramenta)
docs/STATE.md · MAP.md · VISION.md · DECISIONS.md · standards/   memória do projeto
```

## Créditos

Veja o [NOTICE.md](NOTICE.md). Cada skill diz, na seção Provenance, de quais arquivos originais ela foi adaptada. A Quimera não tem vínculo com nenhum dos projetos de onde aprende.

## Licença

[MIT](LICENSE)
