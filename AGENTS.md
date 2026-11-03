# Instruções para agentes

## Recomendações técnicas

- O projeto deve utilizar Angular (`22.2.0`), Zoneless, com Componentes Standalone e Signals.

- Utilizar bibliotecas Tailwind CSS para estilização e Lucide Icons para ícones.

- Evitar layouts complexos e prezar responsividade.

- Os textos da interface voltadas ao usuário deverão estar em português.

- Nomes de métodos e variáveis deverão estar em potuguês, porém seguindo convenções da linguagem.

- O agente deve prezar a implementação em fases/changes distintas e evitar alterações muito grandes de uma vez só,cancelando a execução.

- Utilize o sistema de questões do harness para clarificar ideias com o desenvolvedor quando necessário. Não faça questões apenas no output de texto, obtenha as respostas durante o processamento e continue.
