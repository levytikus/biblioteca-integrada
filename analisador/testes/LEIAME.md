# Testes do SIBI Analisador

Cada trabalho enviado pelo Levy junto com o relatório do Analisador vira um caso de teste.
O trabalho é conferido no PDF original, item por item, e o resultado esperado fica em
`gabaritos/<nome>.json`:

- `itens`: o que o Analisador deve responder em cada item (`erro`, `alerta` ou `ok`; `ok` inclui o item não aparecer).
- `evidencias`: trechos que devem (`contem`) ou não devem (`nao_contem`) aparecer no detalhe ou nas evidências do item.
  Servem para travar correções já feitas e para registrar erros conhecidos que ainda estão em aberto.
- `notas`: o que foi conferido e o que ainda falta.

O Manual do SiBI/UFRJ é a regra. Um gabarito só muda quando a conferência no PDF ou no Manual mostra que ele estava errado.

## Rodar

```
npm i pdfjs-dist@3.11.174 jszip @xmldom/xmldom
node analisador/testes/avaliar.js <pasta-com-os-PDFs>          # todos
node analisador/testes/avaliar.js <pasta-com-os-PDFs> A1 G7    # só alguns
ANALISADOR_HTML=<outra versão>.html node analisador/testes/avaliar.js <pasta>   # comparar versões
```

Os PDFs não ficam no repositório (são trabalhos de terceiros).

Saída: acertos, alarmes falsos e itens não apontados por trabalho, precisão e cobertura no total,
gravidade trocada (erro no lugar de alerta ou o contrário), evidências conferidas e tempo de análise.
O código só vai para o ar se não criar divergência nova.
