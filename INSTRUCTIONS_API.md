# Guia de Configuração de APIs - Gerador de Quiz

Este documento fornece instruções detalhadas sobre como configurar e usar as APIs gratuitas para geração de perguntas no aplicativo.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pollinations (Gratuito e Sem Registro)](#pollinations-gratuito-e-sem-registro)
3. [Hugging Face (Token Gratuito)](#hugging-face-token-gratuito)
4. [Configuração na Aplicação](#configuração-na-aplicação)
5. [Solução de Problemas](#solução-de-problemas)
6. [Melhores Práticas](#melhores-práticas)
7. [Perguntas Frequentes](#perguntas-frequentes)

## 🎯 Visão Geral

O aplicativo suporta dois provedores de IA para geração de perguntas:

| Provedor | Custo | Registro | Token | Qualidade | Limitações |
|----------|-------|-----------|-------|-----------|------------|
| **Pollinations** | 💰 Gratis | ❌ Não necessário | ❌ Não | 🟡 Boa | Rate limits públicos |
| **Hugging Face** | 💰 Gratis | ✅ Necessário | ✅ Sim | 🟢 Excelente | 30 req/min (gratuito) |

## 🌸 Pollinations (Gratuito e Sem Registro)

### Características
- **Totalmente gratuito**: Sem custos ocultos
- **Sem registro**: Comece a usar imediatamente
- **Fácil configuração**: Zero configuração necessária
- **Múltiplos idiomas**: Suporta português e outros idiomas

### Como Usar
1. Abra o aplicativo
2. Vá para **Definições**
3. Selecione **Pollinations** como provedor de texto
4. Comece a gerar perguntas imediatamente!

### Limitações
- Rate limits podem aplicar-se em horários de pico
- Menor prioridade comparado a usuários pagantes
- Modelos limitados disponíveis
- Qualidade pode variar

### Endpoint
```
https://text.pollinations.ai/openai
```

## 🤗 Hugging Face (Token Gratuito)

### Características
- **Modelos avançados**: Acesso a modelos state-of-the-art
- **Alta qualidade**: Respostas mais coerentes e detalhadas
- **Múltiplos modelos**: Escolha entre diferentes modelos
- **Comunidade ativa**: Suporte e documentação completa

### 📥 Passo a Passo para Obter Token Gratuito

#### 1. Criar Conta
1. Acesse: [huggingface.co/join](https://huggingface.co/join)
2. Preencha o formulário de registro
3. Verifique seu email
4. Faça login na sua conta

#### 2. Gerar Token
1. Após login, acesse: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Clique no botão **"New token"**
3. Dê um nome para o token (ex: `quiz-app`)
4. Selecione a permissão **"read"** (suficiente para usar as APIs)
5. Clique em **"Generate a token"**
6. **Copie o token imediatamente** (começa com `hf_`)

#### 3. Configurar na Aplicação
1. Abra o aplicativo
2. Vá para **Definições**
3. Selecione **Hugging Face** como provedor
4. Cole o token no campo correspondente
5. Clique em **"Testar Conectividade"**

### Modelos Disponíveis

#### Modelo Principal (Recomendado)
- **Nome**: `mistralai/Mistral-7B-Instruct-v0.1`
- **Qualidade**: Excelente
- **Velocidade**: Rápida
- **Ideal**: Uso geral

#### Modelo Fallback
- **Nome**: `TinyLlama/TinyLlama-1.1B-Chat-v1.0`
- **Qualidade**: Boa
- **Velocidade**: Muito rápida
- **Ideal**: Quando o principal está indisponível

### Limitações do Plano Gratuito
- **30 requisições por minuto**
- **300 requisições por hora**
- **Modelos podem ter tempo de carregamento**
- **Sem acesso a modelos premium**

### Endpoint
```
https://api-inference.huggingface.co/models/{model-name}
```

## ⚙️ Configuração na Aplicação

### Interface de Configuração
1. **Acesse as Definições**: Clique em "Definições" no menu principal
2. **Selecione o Provedor**: Escolha entre Pollinations e Hugging Face
3. **Configure o Token** (apenas Hugging Face): Cole seu token no campo apropriado
4. **Teste a Conexão**: Verifique se tudo está funcionando corretamente

### Validação de Token
O aplicativo valida automaticamente seu token Hugging Face:
- ✅ Token válido começa com `hf_`
- ✅ Token tem comprimento mínimo de 10 caracteres
- ❌ Token inválido mostrará mensagem de erro

### Teste de Conectividade
Clique em "Testar Conectividade" para verificar:
- ✅ Conexão com a API
- ✅ Validade do token
- ✅ Disponibilidade dos modelos
- ❌ Erros de configuração

## 🔧 Solução de Problemas

### Problemas Comuns

#### Pollinations
| Problema | Solução |
|----------|---------|
| "Rate limit excedido" | Aguarde alguns minutos e tente novamente |
| "Resposta vazia" | Reduza o número de perguntas por requisição |
| "Erro de conexão" | Verifique sua conexão com a internet |

#### Hugging Face
| Problema | Solução |
|----------|---------|
| "Token inválido" | Verifique se copiou o token corretamente (deve começar com `hf_`) |
| "Limite de taxa excedido" | Aguarde alguns minutos antes de fazer novas requisições |
| "Modelo indisponível" | O aplicativo tentará automaticamente o modelo fallback |
| "401 Unauthorized" | Seu token expirou. Gere um novo token |

### Erros e Soluções

#### Erro: `Token do Hugging Face inválido ou expirado`
**Causa**: Token incorreto ou expirado
**Solução**:
1. Verifique se o token começa com `hf_`
2. Gere um novo token em [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Copie e cole o novo token na aplicação

#### Erro: `Limite de taxa da API excedido`
**Causa**: Muitas requisições em pouco tempo
**Solução**:
1. **Pollinations**: Aguarde 1-2 minutos
2. **Hugging Face**: Aguarde até o próximo minuto (limite de 30 req/min)

#### Erro: `Modelo indisponível`
**Causa**: Modelo está carregando ou em manutenção
**Solução**:
1. O aplicativo tentará automaticamente o modelo fallback
2. Se ambos falharem, tente novamente em alguns minutos
3. Considere trocar de provedor temporariamente

## 📈 Melhores Práticas

### Para Pollinations
- ✅ Use para testes e prototipagem
- ✅ Limite a 5-8 perguntas por requisição
- ✅ Evite horários de pico (finais de semana, noite)
- ✅ Use seeds consistentes para resultados reproduzíveis

### Para Hugging Face
- ✅ Use o modelo principal para melhor qualidade
- ✅ Divida requisições grandes em partes menores
- ✅ Monitore seu uso para evitar limites
- ✅ Mantenha seu token seguro e não compartilhe

### Gerais
- ✅ Teste conectividade antes de usar
- ✅ Salve suas perguntas geradas
- ✅ Use prompts claros e específicos
- ✅ Verifique a qualidade das perguntas geradas

## ❓ Perguntas Frequentes

### P: As APIs são realmente gratuitas?
**R**: Sim! Ambas as APIs oferecem planos gratuitos:
- **Pollinations**: 100% gratuito sem limites conhecidos
- **Hugging Face**: Plano gratuito generoso com 30 req/min

### P: Preciso fornecer dados de cartão de crédito?
**R**: Não! Ambas as plataformas funcionam sem dados de pagamento.

### P: Minhas perguntas são armazenadas?
**R**: Não. As APIs processam suas requisições sem armazenar os dados. O aplicativo salva localmente apenas no seu navegador.

### P: Posso usar ambos os provedores?
**R**: Sim! Você pode alternar entre Pollinations e Hugging Face a qualquer momento nas definições.

### P: Qual provedor é melhor?
**R**: Depende do seu uso:
- **Pollinations**: Melhor para uso casual e testes
- **Hugging Face**: Melhor para qualidade e uso mais sério

### P: O que fazer se as APIs pararem de funcionar?
**R**: 
1. Verifique sua conexão com a internet
2. Teste a conectividade nas definições
3. Tente o outro provedor
4. Aguarde alguns minutos e tente novamente

### P: Como reportar problemas?
**R**: Se você encontrar problemas persistentes:
1. Verifique este guia para soluções
2. Anote mensagens de erro específicas
3. Teste com ambos os provedores
4. Entre em contato com o suporte

## 📚 Recursos Adicionais

### Documentação Oficial
- **Pollinations**: [pollinations.ai](https://pollinations.ai)
- **Hugging Face**: [huggingface.co/docs](https://huggingface.co/docs)

### Comunidades
- **Hugging Face Discord**: [discord.gg/huggingface](https://discord.gg/huggingface)
- **GitHub Repository**: Reporte issues e sugestões

### Tutoriais
- Como criar prompts eficazes
- Técnicas de engenharia de prompts
- Otimização de geração de perguntas

---

## 🎉 Conclusão

Com este guia, você está pronto para usar as APIs gratuitas para gerar perguntas de qualidade. Lembre-se:

1. **Pollinations** para uso rápido e simples
2. **Hugging Face** para melhor qualidade
3. Siga as melhores práticas para melhores resultados
4. Não hesite em testar ambos os provedores

Se precisar de ajuda adicional, consulte as seções de solução de problemas ou entre em contato com o suporte.

**Boa criação de quizzes! 🚀**