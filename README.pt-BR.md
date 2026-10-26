# Quimera

**Um padrão de desenvolvimento pequeno e local para quem trabalha com várias ferramentas de IA: as decisões ficam no repositório, o histórico do git continua seu e nada conta como pronto sem prova.**

[English](README.md)

Na mitologia, a quimera é uma criatura feita de partes de animais diferentes. A Quimera faz o mesmo com o desenvolvimento assistido por IA: adapta peças maduras do [Superpowers](https://github.com/obra/superpowers), do [Spec Kit](https://github.com/github/spec-kit), do [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) e do [Agent OS](https://github.com/buildermethods/agent-os) e junta tudo para uma pessoa que constrói produtos com agentes de IA, em português primeiro.

É Markdown puro e alguns scripts pequenos em Node, sem dependências, sem telemetria e sem nada que rode sozinho. O Claude Code foi testado numa sessão real; Codex, Copilot, Cursor, Antigravity, Gemini CLI e OpenCode seguem a documentação de cada um e ficam como experimentais até um teste real ser registrado ([docs/compatibility.md](docs/compatibility.md), em inglês).

## O que ela entrega

- **O histórico do git continua seu.** O modo discreto instala uma trava que remove as linhas de coautoria e de "gerado com" de qualquer ferramenta. Toda sessão confere a identidade git do projeto nesta máquina. Cada tarefa ganha uma branch saindo da principal e volta para ela, por pull request ou, sem remoto, por merge local.
- **Prova, não promessa.** O `verify.mjs` roda as checagens que importam para o que mudou e termina cada passo como passou, falhou, não verificado ou não se aplica; "não verificado" nunca conta como aprovado. Qualquer stack pode declarar as próprias checagens em `.quimera/checks.json`.
- **Um ciclo que continua rodando.** Um ciclo de trabalho em seis passos fica no `AGENTS.md`, o arquivo que toda ferramenta lê: profundidade e branch primeiro, verificar, commitar com a memória atualizada, reler depois da compactação do contexto, revisar no fim de cada fase.
- **Memória que qualquer ferramenta retoma.** Onde paramos, um mapa curto, as decisões com o motivo e os seus padrões de código, no repositório. Projetos local-only deixam isso fora do git do projeto e podem guardar um histórico privado.
- **Se ajusta a você.** O kickoff pergunta o quanto você entende de software e quanto explicar, e registra o tipo de produto (web app, vitrine, jogo, app mobile, biblioteca, API). As revisões fazem as perguntas que servem para ele.
- **Profundidade e custo na medida.** Quatro profundidades, do typo ao arriscado. A sessão que escreve código roda no modelo padrão; planejamento e revisões rodam no mais forte, com revisores especialistas em segurança, banco de dados e interface quando a mudança toca essas áreas. Tabelas de modelos para Claude, GPT, Gemini, DeepSeek e MiMo, nos perfis completo e econômico.
- **Instalador seguro.** O update mantém as suas edições (a versão nova fica ao lado, como `*.quimera-new`), recusa qualquer coisa fora das pastas que gerencia, sobrevive a uma interrupção, e o `doctor` separa a saúde da instalação da prontidão do trabalho.

## O fluxo

```
Início do projeto: kickoff → rodada de estudo → revisão da visão → revisão de arquitetura → direções de design → padrões de código
Cada tarefa:       início da tarefa → (revisão de arquitetura) → plano → agentes em paralelo → verificação → coerência → revisão → fechamento
```

As regras de cada etapa estão no [QUIMERA.md](QUIMERA.md). Cada etapa é uma skill em [skills/](skills/).

## Começar um projeto novo

Coloque a sua ideia num arquivo (Markdown, Word ou PDF), abra o seu agente numa pasta vazia, anexe o arquivo e diga:

> Comece este projeto com a Quimera (github.com/mnstechbr/Quimera). A ideia está no arquivo anexo.

O agente instala o kit, lê o seu arquivo, pergunta em palavras simples só o que o arquivo não responde e revisa com você a visão e a arquitetura antes de qualquer código. Os passos para o agente estão no [README em inglês](README.md#for-the-agent-reading-this).

## Instalar num projeto

A Quimera foi feita para **projetos novos**. Dá para adicionar num projeto existente, mas aí o kickoff só acrescenta arquivos e nunca reorganiza o que já existe. Dentro do repositório git do projeto, com a versão que você quer:

```bash
npx github:mnstechbr/Quimera#v0.4.0 init --tools=claude
```

- `--tools`: qualquer combinação de `claude,codex,copilot,cursor,antigravity,other` (padrão `claude`).
- `--mode=discreet` instala a trava dos commits.
- `--models=economic` deixa os agentes do Claude Code no perfil econômico (padrão `full`).
- `--specialists=security,database,interface` (ou `none`) instala só os agentes revisores especialistas que o projeto usa (padrão: os três).
- `--local-only` deixa os arquivos da Quimera e a memória do projeto fora do git, só na sua máquina. Use em repositório que é de outra pessoa ou empresa.
- `--dry-run` lista cada mudança que seria feita, sem fazer nenhuma.

Sem a tag, `npx github:mnstechbr/Quimera` instala o que estiver na branch principal. A partir de uma cópia local (sem internet, ou para fixar um commit): `git clone https://github.com/mnstechbr/Quimera.git` e depois `node Quimera/bin/quimera.mjs init --tools=claude` dentro do projeto.

Depois, abra o seu agente na pasta e diga: *"comece este projeto com a Quimera"*. A skill `project-kickoff` pergunta quem você é e como quer trabalhar, depois o modo, a identidade e o produto, antes de criar qualquer coisa.

Mais tarde: `npx github:mnstechbr/Quimera#<tag> update` passa para essa versão, mostra a mudança de versão e aponta o `.quimera/CHANGELOG.md`; ele também aceita `--tools`, `--models` e `--specialists` para mudar a configuração. Arquivos que você editou são mantidos, e a versão nova fica ao lado de cada um como `*.quimera-new`. O `doctor` confere a instalação e depois o estado do git, sem mudar nada (`--json` para um relatório). O que fazer quando um update é interrompido: [docs/update-recovery.md](docs/update-recovery.md) (em inglês).

Códigos de saída: `0` concluído; `1` algo falhou ou precisa de atenção, e a saída diz o quê (um manifesto inválido ou um caminho inseguro para tudo antes de escrever qualquer coisa); `2` fora de um repositório git; `64` comando ou opção desconhecida, ou valor inválido, sem escrever nada.

O instalador só copia Markdown e scripts pequenos. Ele nunca instala dependências, nunca mexe no seu código, nunca acessa a rede e nunca sobrescreve nem apaga um arquivo que ele não criou.

## O que entra no seu projeto

```
AGENTS.md                 perfil do projeto, ciclo de trabalho, stack, regras (criado no kickoff, lido por todas as ferramentas)
.quimera/                 QUIMERA.md, scripts, adaptadores por ferramenta, modelos, NOTICE.md, LICENSE, CHANGELOG.md
                          (e, se você criar: checks.json, PROFILE.md; o histórico privado da memória fica em .git/quimera-memory.git)
.agents/skills/           as skills (espelhadas em .claude/skills, .github/skills ou .cursor/skills conforme a ferramenta)
docs/STATE.md · MAP.md · VISION.md · DECISIONS.md · standards/   memória do projeto
```

## Como ela se compara

Profundidades proporcionais, arquivos de memória, updates seguros, revisores especialistas e perfis de modelo também existem em outros kits (veja a comparação em [docs/plans/2026-10-26-release-0.4.0.md](docs/plans/2026-10-26-release-0.4.0.md#positioning), em inglês). O que a Quimera traz é a combinação para uma pessoa usando várias ferramentas, e algumas peças que não encontramos em outro lugar: uma trava de commit que vem no kit, a conferência da identidade do projeto em toda sessão, e uma verificação que não chama falta de prova de aprovação. Existem kits com mais integrações; a Quimera continua pequena e fácil de inspecionar.

## Desenvolver o kit

`npm test` roda os testes de contrato (o executor nativo do Node, repositórios git isolados, sem rede); `npm run check` confere as skills e as regras do próprio kit. Nenhum dos dois instala nada.

## Créditos

Veja o [NOTICE.md](NOTICE.md). Cada skill diz, na seção Provenance, de quais arquivos originais ela foi adaptada. A Quimera não tem vínculo com nenhum dos projetos de onde aprende.

## Licença

[MIT](LICENSE)
