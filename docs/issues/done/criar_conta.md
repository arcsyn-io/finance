# Task – Implementar AccountService (Criação e Autenticação de Contas)

## Contexto
Estamos implementando a **camada de serviço (Service Layer)** responsável pelo gerenciamento de contas de usuário em um sistema pessoal de controle financeiro.

O sistema possui **cadastro simples**, utilizando apenas **username e password**, com foco em **segurança**, **clareza** e **simplicidade**.  
Não é um SaaS, não há multi-tenancy e não existem APIs públicas.

---

## Objetivo da Task
Implementar o **AccountService**, responsável por:

- Criação de conta
- Autenticação
- Desativação de conta
- Troca de senha

Garantindo:
- Uso correto de **Argon2id** para hash de senhas
- Validação explícita de regras de negócio
- Nenhum efeito colateral quando regras são violadas
- Código simples, previsível e fácil de testar

---

## Contexto Técnico
- Linguagem: Java
- Framework: Spring Boot
- Segurança: Spring Security (session-based, form login)
- Hash de senha: **Argon2id (obrigatório)**
- Persistência: jOOQ
- Banco de dados: SQLite
- Arquitetura: Controllers → Services → jOOQ
- Sem OAuth, JWT ou APIs REST públicas

---

## Regras Gerais (Obrigatórias)
- Nunca armazenar senha em texto puro
- Nunca criptografar senha
- Sempre usar **hash com Argon2id**
- O campo `password_hash` deve conter salt e parâmetros embutidos
- Comparações de senha devem usar exclusivamente `PasswordEncoder`
- Nenhuma precondition violada pode gerar escrita no banco
- Exceções devem ser de domínio (não técnicas)
- Não vazar informações sensíveis em mensagens de erro

---

## Escopo Funcional

### 1. Criar conta

**Responsabilidade**  
Criar uma nova conta a partir de `username` e `password`.

**Preconditions**
- `username` não pode ser nulo ou vazio
- `username` deve ser validado após `trim()`
- Tamanho do `username`: mínimo 3, máximo 50 caracteres
- `password` não pode ser nula
- `password` deve ter no mínimo 8 caracteres
- O `username` ainda não pode existir no banco

**Postconditions**
- Existe exatamente uma conta com o `username` informado
- A senha é armazenada exclusivamente como **hash Argon2id**
- `password_hash` nunca é igual à senha em texto
- `enabled = true`
- `created_at` preenchido corretamente

---

### 2. Autenticar

**Responsabilidade**  
Validar credenciais de login.

**Preconditions**
- `username` não pode ser nulo
- `password` não pode ser nula
- A conta existe
- A conta está habilitada (`enabled = true`)

**Postconditions**
- A senha informada corresponde ao hash armazenado
- Nenhuma alteração ocorre nos dados da conta
- Em caso de falha, não diferenciar erro de usuário inexistente ou senha inválida

---

### 3. Desativar conta

**Responsabilidade**  
Desativar logicamente uma conta existente.

**Preconditions**
- A conta existe
- A conta está habilitada

**Postconditions**
- A conta passa a ter `enabled = false`

---

### 4. Trocar senha

**Responsabilidade**  
Atualizar a senha de uma conta existente.

**Preconditions**
- A conta existe
- A conta está habilitada
- A senha atual corresponde ao hash armazenado
- A nova senha é diferente da anterior
- A nova senha possui no mínimo 8 caracteres

**Postconditions**
- O novo hash é gerado usando **Argon2id**
- A senha antiga não corresponde mais ao hash
- A nova senha corresponde corretamente ao hash armazenado

---

## Exceções de Domínio Esperadas
- `InvalidUsernameException`
- `InvalidPasswordException`
- `UsernameAlreadyExistsException`
- `AuthenticationFailedException`
- `AccountDisabledException`

---

## Fora de Escopo
- Papéis (roles) ou permissões
- Controle de tentativas de login
- Bloqueio por força bruta
- Recuperação de senha
- Auditoria avançada

---

## Critérios de Aceitação
- Senhas nunca são persistidas em texto
- Hash de senha utiliza Argon2id
- Preconditions inválidas não geram efeitos colaterais
- Código simples, legível e sem abstrações desnecessárias
- Service pode ser testado isoladamente
- Integração limpa com Spring Security

---

## Observações
Este serviço deve ser implementado pensando em **evolução futura**, mas sem antecipar requisitos.  
Priorizar clareza, segurança e simplicidade sobre flexibilidade excessiva.
