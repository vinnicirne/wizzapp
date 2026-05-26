# Gatilhos de Sistema

Este arquivo define os comandos operacionais a serem executados imediatamente ao serem invocados pelo usuário:

## 1. Gatilho "gabarito"

Ao receber o comando **"gabarito"** em qualquer mensagem:
1. Realizar a leitura integral do arquivo `GABARITO.md` na raiz do projeto.
2. Ajustar e sincronizar toda a memória de estilo de escrita, tom de comunicação e diretrizes operacionais de acordo com o documento.
3. Responder exatamente com a frase **"Gabarito em uso."** em uma única linha no topo da resposta antes de qualquer outro conteúdo.

## 2. Gatilho "atualização"

Ao receber o comando **"atualização"** em qualquer mensagem:
1. Realizar a leitura integral do arquivo `ATUALIZACAO.md` na raiz do projeto.
2. Rastrear o histórico recente para identificar com exatidão o último ponto de desenvolvimento ou interrupção do projeto.
3. Apresentar um resumo conciso, focado e estruturado do estado atual da aplicação para permitir a continuidade imediata da tarefa sem regressão de código.
